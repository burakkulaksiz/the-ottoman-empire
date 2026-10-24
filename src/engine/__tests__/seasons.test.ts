import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { isWinter } from '../calendar';
import { createGame } from '../create-game';
import { dispatch } from '../dispatch';
import { RULES } from '../rules';
import type { GameState } from '../types';

const inSeason = (season: GameState['date']['season']): GameState => ({
  ...createGame(testScenario, { seed: 1299 }),
  date: { year: 1300, season },
});

const withArmyIn = (state: GameState, provinceId: string): GameState => ({
  ...state,
  armies: {
    ...state.armies,
    'army-1': { ...state.armies['army-1']!, provinceId },
  },
});

describe('winter quarters (C1)', () => {
  it('only winter is the quarters season', () => {
    expect(isWinter('winter')).toBe(true);
    expect(isWinter('spring')).toBe(false);
    expect(isWinter('summer')).toBe(false);
    expect(isWinter('autumn')).toBe(false);
  });

  it('lets armies march into enemy land during the campaign seasons', () => {
    for (const season of ['spring', 'summer', 'autumn'] as const) {
      const result = dispatch(testWorld, inSeason(season), 'osmanli', {
        type: 'moveArmy',
        armyId: 'army-1',
        to: 'bilecik',
      });
      expect(result.ok).toBe(true);
    }
  });

  it('forbids marching into foreign land in winter', () => {
    const result = dispatch(testWorld, inSeason('winter'), 'osmanli', {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'bilecik',
    });
    expect(result).toEqual({ ok: false, error: 'winterQuarters' });
  });

  it('lets armies withdraw to their own land in winter', () => {
    const state = withArmyIn(inSeason('winter'), 'bilecik');
    const result = dispatch(testWorld, state, 'osmanli', {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'sogut',
    });
    expect(result.ok).toBe(true);
  });

  it('costs troops for armies caught on foreign land when winter begins', () => {
    const state = withArmyIn(inSeason('autumn'), 'bilecik');
    const result = dispatch(testWorld, state, 'osmanli', { type: 'endTurn' });
    if (!result.ok) throw new Error(result.error);

    const lost = Math.floor(1000 * RULES.winterAttritionRate);
    expect(result.state.date.season).toBe('winter');
    expect(result.state.armies['army-1']?.troops).toBe(1000 - lost);
    expect(result.log).toContainEqual({
      type: 'winterAttrition',
      armyId: 'army-1',
      provinceId: 'bilecik',
      lost,
      turn: 2,
    });
  });

  it('spares armies in their own land and ignores other seasons', () => {
    const atHome = dispatch(testWorld, inSeason('autumn'), 'osmanli', {
      type: 'endTurn',
    });
    if (!atHome.ok) throw new Error(atHome.error);
    expect(atHome.state.armies['army-1']?.troops).toBe(1000);

    const abroad = dispatch(
      testWorld,
      withArmyIn(inSeason('spring'), 'bilecik'),
      'osmanli',
      { type: 'endTurn' },
    );
    if (!abroad.ok) throw new Error(abroad.error);
    expect(abroad.state.armies['army-1']?.troops).toBe(1000);
  });
});
