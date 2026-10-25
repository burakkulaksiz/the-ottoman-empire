import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame, validateSetup } from '../create-game';
import { dispatch } from '../dispatch';
import type { GameState, World } from '../types';
import { historicalScore, objectiveProgress } from '../victory';

const owning = (state: GameState, ids: string[]): GameState => ({
  ...state,
  provinces: Object.fromEntries(
    Object.entries(state.provinces).map(([id, p]) => [
      id,
      { ...p, ownerId: ids.includes(id) ? 'osmanli' : p.ownerId },
    ]),
  ),
});

const start = () => createGame(testScenario, { seed: 1 });

function endTurn(world: World, state: GameState) {
  const result = dispatch(world, state, 'osmanli', { type: 'endTurn' });
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

describe('objectives', () => {
  const world: World = {
    ...testWorld,
    objectives: [
      { id: 'hold', type: 'holdProvinces', provinces: ['sogut', 'bilecik'] },
      { id: 'count', type: 'provinceCount', count: 3 },
    ],
  };

  it('reports progress for each objective', () => {
    const state = owning(start(), ['bilecik']);
    expect(objectiveProgress(world, state)).toEqual([
      { id: 'hold', done: true, current: 2, target: 2 },
      { id: 'count', done: false, current: 2, target: 3 },
    ]);
  });

  it('wins once every objective is complete', () => {
    const state = endTurn(world, owning(start(), ['bilecik', 'inegol']));
    expect(state.status).toMatchObject({
      phase: 'ended',
      result: 'victory',
      reason: 'objectives',
    });
  });

  it('keeps playing while an objective is open', () => {
    const state = endTurn(world, owning(start(), ['bilecik']));
    expect(state.status).toEqual({ phase: 'playing' });
  });

  it('logs the end of the game with the final status', () => {
    const result = dispatch(
      world,
      owning(start(), ['bilecik', 'inegol']),
      'osmanli',
      { type: 'endTurn' },
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.log.at(-1)).toMatchObject({
      type: 'gameEnded',
      status: { result: 'victory', reason: 'objectives' },
    });
  });
});

describe('time limit', () => {
  // Başlangıç 1300 ilkbahar; bir tur sonra yaz.
  const endDate = { year: 1300, season: 'summer' } as const;

  it('is a defeat when objectives are still open', () => {
    const world: World = {
      ...testWorld,
      endDate,
      objectives: [{ id: 'count', type: 'provinceCount', count: 5 }],
    };
    expect(endTurn(world, start()).status).toMatchObject({
      result: 'defeat',
      reason: 'timeLimit',
    });
  });

  it('is a victory for pure survival scenarios', () => {
    const world: World = { ...testWorld, endDate };
    expect(endTurn(world, start()).status).toMatchObject({
      result: 'victory',
      reason: 'timeLimit',
    });
  });

  it('does not end the game early', () => {
    const world: World = {
      ...testWorld,
      endDate: { year: 1301, season: 'spring' },
    };
    expect(endTurn(world, start()).status).toEqual({ phase: 'playing' });
  });

  it('rejects an end date that is not after the start', () => {
    const errors = validateSetup({
      ...testScenario,
      world: { ...testWorld, endDate: { year: 1300, season: 'spring' } },
    });
    expect(errors).toEqual(['endDate must be after startDate']);
  });
});

describe('historical score', () => {
  const world: World = {
    ...testWorld,
    historical: { provinces: ['sogut', 'bilecik', 'bursa', 'inegol'] },
  };

  it.each([
    [['bilecik'], 50, 'worse'],
    [['bilecik', 'bursa'], 75, 'worse'],
    [['bilecik', 'bursa', 'inegol'], 100, 'same'],
    [['bilecik', 'bursa', 'inegol', 'kutahya'], 125, 'better'],
  ] as const)(
    '%j owned besides Söğüt → %i points (%s)',
    (ids, points, verdict) => {
      const score = historicalScore(world, owning(start(), [...ids]));
      expect(score).toMatchObject({ points, verdict, benchmark: 4 });
    },
  );

  it('is stored on the final status and skipped without a benchmark', () => {
    const final = endTurn(
      { ...world, endDate: { year: 1300, season: 'summer' } },
      owning(start(), ['bilecik', 'bursa']),
    );
    expect(final.status).toMatchObject({
      phase: 'ended',
      score: { provinces: 3, benchmark: 4, verdict: 'worse' },
    });
    expect(historicalScore(testWorld, start())).toBeUndefined();
  });

  it('gives no score to an eliminated player', () => {
    const base = start();
    const dead: GameState = {
      ...base,
      provinces: {
        ...base.provinces,
        sogut: { id: 'sogut', ownerId: 'germiyan' },
      },
      armies: { 'army-2': base.armies['army-2']! },
    };
    const state = endTurn(world, dead);
    expect(state.status).toMatchObject({
      result: 'defeat',
      reason: 'eliminated',
    });
    expect('score' in state.status && state.status.score).toBeFalsy();
  });
});

describe('objective validation', () => {
  it('rejects unknown provinces in objectives and benchmark', () => {
    const errors = validateSetup({
      ...testScenario,
      world: {
        ...testWorld,
        objectives: [{ id: 'x', type: 'holdProvinces', provinces: ['iznik'] }],
        historical: { provinces: ['nicaea'] },
      },
    });
    expect(errors).toEqual([
      'Objective "x": unknown province "iznik"',
      'Historical benchmark: unknown province "nicaea"',
    ]);
  });
});
