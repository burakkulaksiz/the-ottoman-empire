import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame } from '../create-game';
import { dispatch } from '../dispatch';
import { validateSavedState } from '../saved-state';
import type { GameState } from '../types';

const start = (): GameState => createGame(testScenario, { seed: 1 });

describe('validateSavedState', () => {
  it('accepts a fresh game and a played one that went through JSON', () => {
    expect(validateSavedState(testWorld, start())).toEqual([]);

    const result = dispatch(testWorld, start(), 'osmanli', { type: 'endTurn' });
    if (!result.ok) throw new Error(result.error);
    const reloaded = JSON.parse(JSON.stringify(result.state)) as GameState;
    expect(validateSavedState(testWorld, reloaded)).toEqual([]);
  });

  it('rejects other save versions and incomplete data', () => {
    expect(
      validateSavedState(testWorld, { ...start(), version: 2 } as never),
    ).toEqual(['Unsupported save version "2"']);
    expect(validateSavedState(testWorld, {} as never)).toContain(
      'Missing "provinces"',
    );
    expect(validateSavedState(testWorld, null as never)).toEqual([
      'State is not an object',
    ]);
  });

  it('rejects saves from a world with other provinces or states', () => {
    const state = start();
    const errors = validateSavedState(testWorld, {
      ...state,
      provinces: {
        ...state.provinces,
        iznik: { id: 'iznik', ownerId: null },
      },
      armies: {
        'army-9': {
          id: 'army-9',
          ownerId: 'osmanli',
          provinceId: 'nicaea',
          units: { sipahi: 1 },
          morale: 80,
          movesLeft: 1,
        },
      },
      playerFactionId: 'karesi',
    });

    expect(errors).toEqual([
      'Unknown province "iznik"',
      'Army "army-9": unknown province "nicaea"',
      'Unknown player faction "karesi"',
    ]);
  });

  it('notices provinces that the save does not know about', () => {
    const state = start();
    const { kutahya: _removed, ...rest } = state.provinces;
    expect(
      validateSavedState(testWorld, { ...state, provinces: rest }),
    ).toEqual(['Province "kutahya" missing in save']);
  });
});
