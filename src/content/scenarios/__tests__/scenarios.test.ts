import {
  createGame,
  dispatch,
  objectiveProgress,
  relationBetween,
  validateSetup,
} from '@/engine';

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

describe('kurulus-1299 goals', () => {
  const setup = loadScenario('kurulus-1299');

  it('asks the player to take Bursa before the time limit', () => {
    expect(setup.world.objectives).toContainEqual({
      id: 'bursa',
      type: 'holdProvinces',
      provinces: ['tur-bursa'],
    });
    expect(setup.world.endDate).toEqual({ year: 1330, season: 'spring' });
  });

  it('does not leak objective titles into the engine world', () => {
    for (const objective of setup.world.objectives ?? []) {
      expect(objective).not.toHaveProperty('title');
    }
  });

  it('starts with the defence goal met and the conquest goal open', () => {
    const progress = objectiveProgress(
      setup.world,
      createGame(setup, { seed: 1 }),
    );
    expect(progress.map((p) => [p.id, p.done])).toEqual([
      ['koru', true],
      ['bursa', false],
    ]);
  });
});

describe.each(SCENARIOS.map((s) => [s.id, s.events ?? []] as const))(
  '%s event cards',
  (_id, events) => {
    it('name a historical choice that exists', () => {
      for (const event of events) {
        expect(event.choices.map((c) => c.id)).toContain(
          event.historical.choiceId,
        );
      }
    });
  },
);

describe('kurulus-1299 events', () => {
  const setup = loadScenario('kurulus-1299');

  it('hands only ids, triggers and effects to the engine', () => {
    expect(setup.world.events?.map((e) => e.id)).toEqual([
      'koyunhisar',
      'bursa-dususu',
    ]);
    expect(JSON.stringify(setup.world.events)).not.toContain('Bizans');
  });

  it('stops the player at the Koyunhisar card in summer 1302', () => {
    let state = createGame(setup, { seed: 1 });
    while (state.events.pending.length === 0) {
      const result = dispatch(setup.world, state, 'osmanli', {
        type: 'endTurn',
      });
      if (!result.ok) throw new Error(result.error);
      state = result.state;
    }

    expect(state.events.pending).toEqual(['koyunhisar']);
    expect(state.date).toEqual({ year: 1302, season: 'summer' });
    expect(
      dispatch(setup.world, state, 'osmanli', { type: 'endTurn' }),
    ).toEqual({ ok: false, error: 'eventPending' });
  });
});

describe('kurulus-1299 map features', () => {
  const { provinces } = loadScenario('kurulus-1299').world;

  it('gives the walled cities of the region a fortification', () => {
    expect(provinces['tur-bursa']?.fortification).toBe(1);
    expect(provinces['tur-bilecik']?.fortification).toBe(1);
    expect(provinces['tur-istanbul']?.fortification).toBe(3);
  });

  it('makes the siege of Bursa last longer than taking open land', () => {
    expect(provinces['tur-balikesir']?.fortification).toBeUndefined();
    expect(provinces['tur-bursa']?.fortification).toBeGreaterThan(0);
  });
});

describe('kurulus-1299 diplomacy', () => {
  const state = createGame(loadScenario('kurulus-1299'), { seed: 1 });

  it('starts at war with Byzantium and at peace with the beyliks', () => {
    expect(relationBetween(state, 'osmanli', 'bizans')).toBe('war');
    expect(relationBetween(state, 'osmanli', 'germiyan')).toBe('peace');
    expect(relationBetween(state, 'karesi', 'bizans')).toBe('peace');
  });
});

describe('kurulus-1299 court', () => {
  const state = createGame(loadScenario('kurulus-1299'), { seed: 1 });

  it('starts with Osman Bey on the throne and Orhan as heir', () => {
    expect(state.court?.ruler.name).toBe('Osman Bey');
    expect(state.court?.heirs.map((h) => h.name)).toEqual([
      'Orhan',
      'Alâeddin',
    ]);
    expect(state.court?.vizier).toBeNull();
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
