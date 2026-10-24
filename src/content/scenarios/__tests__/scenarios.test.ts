import { createGame, dispatch, validateSetup } from '@/engine';

import { buildScenario } from '../build-scenario';
import { getScenarioDefinition, loadScenario, SCENARIOS } from '../index';
import { kurulus1299 } from '../kurulus-1299';

describe.each(SCENARIOS.map((s) => [s.id] as const))('%s', (id) => {
  const setup = loadScenario(id);

  it('passes engine validation', () => {
    expect(validateSetup(setup)).toEqual([]);
  });

  it('creates a game and survives a full year of turns', () => {
    let state = createGame(setup, { seed: 1 });
    for (let i = 0; i < 4; i++) {
      const result = dispatch(setup.world, state, state.playerFactionId, {
        type: 'endTurn',
      });
      if (!result.ok) throw new Error(result.error);
      state = result.state;
    }
    expect(state.date.year).toBe(setup.startDate.year + 1);
  });
});

describe('kurulus-1299', () => {
  const setup = loadScenario('kurulus-1299');

  it('starts the player as Osman Bey around Söğüt', () => {
    expect(setup.playerFactionId).toBe('osmanli');
    expect(setup.provinceOwners['tur-bilecik']).toBe('osmanli');
    expect(setup.startDate).toEqual({ year: 1299, season: 'spring' });
  });

  it('has a border between the player and Byzantium', () => {
    const { provinces } = setup.world;
    const touches = Object.entries(setup.provinceOwners)
      .filter(([, owner]) => owner === 'osmanli')
      .some(([id]) =>
        provinces[id]!.neighbors.some(
          (n) => setup.provinceOwners[n] === 'bizans',
        ),
      );
    expect(touches).toBe(true);
  });
});

describe('buildScenario', () => {
  it('rejects a province given to two factions', () => {
    const broken = structuredClone(kurulus1299);
    broken.factions.bizans!.provinces.push('tur-bilecik');
    expect(() => buildScenario(broken)).toThrow(/owned by both/);
  });

  it('rejects malformed definitions', () => {
    const broken = structuredClone(kurulus1299);
    broken.factions.osmanli!.color = 'kırmızı';
    expect(() => buildScenario(broken)).toThrow();
  });

  it('knows which scenarios exist', () => {
    expect(getScenarioDefinition('yok')).toBeUndefined();
    expect(() => loadScenario('yok')).toThrow(/Unknown scenario/);
  });
});
