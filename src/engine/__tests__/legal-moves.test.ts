import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { legalMoves } from '../commands';
import { createGame } from '../create-game';
import type { GameState } from '../types';

const start = (): GameState => createGame(testScenario, { seed: 1 });

describe('legalMoves', () => {
  it('lists every neighbour of an army that can still move', () => {
    expect(legalMoves(testWorld, start(), 'army-1').sort()).toEqual([
      'bilecik',
      'inegol',
      'kutahya',
    ]);
  });

  it('is empty once the army has used its move', () => {
    const state = start();
    const spent: GameState = {
      ...state,
      armies: {
        ...state.armies,
        'army-1': { ...state.armies['army-1']!, movesLeft: 0 },
      },
    };
    expect(legalMoves(testWorld, spent, 'army-1')).toEqual([]);
  });

  it('allows only own land in winter', () => {
    const state: GameState = {
      ...start(),
      date: { year: 1300, season: 'winter' },
    };
    expect(legalMoves(testWorld, state, 'army-1')).toEqual([]);
  });

  it('is empty for unknown armies and when the game is over', () => {
    expect(legalMoves(testWorld, start(), 'yok')).toEqual([]);
    const ended: GameState = {
      ...start(),
      status: { phase: 'ended', result: 'defeat', reason: 'eliminated' },
    };
    expect(legalMoves(testWorld, ended, 'army-1')).toEqual([]);
  });
});
