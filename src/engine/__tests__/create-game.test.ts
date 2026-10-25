import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame } from '../create-game';
import { validateWorld } from '../world';

describe('createGame', () => {
  it('builds the initial state from a scenario', () => {
    const state = createGame(testScenario, { seed: 1 });

    expect(state.turn).toBe(1);
    expect(state.date).toEqual({ year: 1300, season: 'spring' });
    expect(state.status).toEqual({ phase: 'playing' });
    expect(state.provinces.sogut?.ownerId).toBe('osmanli');
    expect(state.factions.bizans?.treasury).toBe(50);
    expect(Object.values(state.armies)).toHaveLength(3);
    expect(state.armies['army-1']).toMatchObject({
      ownerId: 'osmanli',
      provinceId: 'sogut',
      movesLeft: 1,
    });
  });

  it('produces plain JSON-serializable state', () => {
    const state = createGame(testScenario, { seed: 1 });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('rejects scenarios with unknown references', () => {
    expect(() =>
      createGame(
        {
          ...testScenario,
          provinceOwners: { sogut: 'karesi' },
          armies: [
            { ownerId: 'osmanli', provinceId: 'iznik', units: { akinci: 1 } },
          ],
        },
        { seed: 1 },
      ),
    ).toThrow(/unknown owner "karesi"[\s\S]*unknown province "iznik"/);
  });
});

describe('validateWorld', () => {
  it('accepts the test world', () => {
    expect(validateWorld(testWorld)).toEqual([]);
  });

  it('reports one-way and dangling adjacency', () => {
    const errors = validateWorld({
      ...testWorld,
      provinces: {
        ...testWorld.provinces,
        kutahya: {
          ...testWorld.provinces.kutahya!,
          neighbors: ['sogut', 'bursa', 'iznik'],
        },
      },
    });

    expect(errors).toEqual([
      'kutahya -> bursa: adjacency is not symmetric',
      'kutahya: unknown neighbor "iznik"',
    ]);
  });
});
