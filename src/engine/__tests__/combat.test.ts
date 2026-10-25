import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame, validateSetup } from '../create-game';
import { dispatch } from '../dispatch';
import { RULES } from '../rules';
import type { ArmyState, GameState, ProvinceDef, World } from '../types';
import { armySize, artilleryShare, scaleUnits } from '../units';

const worldWith = (id: string, patch: Partial<ProvinceDef>): World => ({
  ...testWorld,
  provinces: {
    ...testWorld.provinces,
    [id]: { ...testWorld.provinces[id]!, ...patch },
  },
});

/** Test dünyasında yalnızca verilen orduların bulunduğu bir oyun. */
function gameWith(
  armies: Record<string, Omit<ArmyState, 'movesLeft' | 'morale'>>,
  seed = 1,
): GameState {
  const base = createGame(testScenario, { seed });
  return {
    ...base,
    armies: Object.fromEntries(
      Object.entries(armies).map(([id, a]) => [
        id,
        { ...a, morale: RULES.moraleMax, movesLeft: 1 },
      ]),
    ),
  };
}

/** 1000 sipahinin saldırısına (2) karşı denk gelen savunma (1,4 × 1430). */
const BALANCED = 1430;

const army = (
  id: string,
  ownerId: string,
  provinceId: string,
  units: ArmyState['units'],
) => [id, { id, ownerId, provinceId, units }] as const;

function move(
  state: GameState,
  to: string,
  world: World = testWorld,
  armyId = 'a1',
  factionId = 'osmanli',
) {
  const result = dispatch(world, state, factionId, {
    type: 'moveArmy',
    armyId,
    to,
  });
  if (!result.ok) throw new Error(result.error);
  return result;
}

const endTurn = (state: GameState, world: World = testWorld) => {
  const result = dispatch(world, state, state.playerFactionId, {
    type: 'endTurn',
  });
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe('units', () => {
  it('counts, scales and measures artillery', () => {
    const units = { sipahi: 90, topcu: 10 };
    expect(armySize(units)).toBe(100);
    expect(artilleryShare(units)).toBeCloseTo(0.1);
    expect(scaleUnits(units, 0.5)).toEqual({ sipahi: 45, topcu: 5 });
    expect(scaleUnits({ sipahi: 1 }, 0.5)).toEqual({});
  });

  it('rejects units that did not exist yet at the scenario start', () => {
    const errors = validateSetup({
      ...testScenario,
      armies: [
        { ownerId: 'osmanli', provinceId: 'sogut', units: { yeniceri: 100 } },
        { ownerId: 'osmanli', provinceId: 'sogut', units: {} },
      ],
    });
    expect(errors).toEqual([
      'Army #0: "yeniceri" is not available before 1363',
      'Army #1: has no units',
    ]);
  });
});

describe('battle', () => {
  const crushing = gameWith(
    Object.fromEntries([
      army('a1', 'osmanli', 'sogut', { sipahi: 5000 }),
      army('a2', 'germiyan', 'kutahya', { akinci: 200 }),
    ]),
  );

  it('lets an overwhelming attacker win, destroy the defender and take the land', () => {
    const { state, log } = move(crushing, 'kutahya');
    const types = log.map((e) => e.type);

    expect(types).toContain('battleFought');
    expect(state.provinces.kutahya?.ownerId).toBe('osmanli');
    expect(state.armies.a1?.provinceId).toBe('kutahya');
    expect(armySize(state.armies.a1!.units)).toBeLessThan(5000);
    expect(state.armies.a1!.morale).toBe(RULES.moraleMax);
    // Kutahya'nın tek komşusu Söğüt, orada düşman yok: savunmacı oraya çekilir
    // ya da dağılır; her durumda Kütahya'da kalmaz.
    expect(state.armies.a2?.provinceId).not.toBe('kutahya');
    expect(log).toContainEqual(
      expect.objectContaining({
        type: 'battleFought',
        attackerId: 'osmanli',
        defenderId: 'germiyan',
        winnerId: 'osmanli',
      }),
    );
  });

  it('sends a beaten attacker back where it came from without taking land', () => {
    const state = gameWith(
      Object.fromEntries([
        army('a1', 'osmanli', 'sogut', { akinci: 200 }),
        army('a2', 'germiyan', 'kutahya', { sipahi: 5000 }),
      ]),
    );
    const { state: next, log } = move(state, 'kutahya');

    expect(next.armies.a1?.provinceId).toBe('sogut');
    expect(next.provinces.kutahya?.ownerId).toBe('germiyan');
    expect(next.armies.a2?.provinceId).toBe('kutahya');
    expect(next.armies.a1!.morale).toBe(
      RULES.moraleMax - RULES.moraleLossPenalty,
    );
    expect(log).toContainEqual(
      expect.objectContaining({
        type: 'armyRetreated',
        armyId: 'a1',
        to: 'sogut',
      }),
    );
  });

  it('destroys a beaten army that has nowhere to flee', () => {
    // Kütahya'nın tek komşusu Söğüt; orada saldıranın başka ordusu var.
    const state = gameWith(
      Object.fromEntries([
        army('a1', 'osmanli', 'sogut', { sipahi: 5000 }),
        army('a3', 'osmanli', 'sogut', { akinci: 100 }),
        army('a2', 'germiyan', 'kutahya', { akinci: 200 }),
      ]),
    );
    const { state: next, log } = move(state, 'kutahya');

    expect(next.armies.a2).toBeUndefined();
    expect(log).toContainEqual({
      type: 'armyDestroyed',
      armyId: 'a2',
      factionId: 'germiyan',
      turn: 1,
    });
  });

  it('is deterministic for the same seed and varies with it', () => {
    const outcome = (seed: number) =>
      move(
        gameWith(
          Object.fromEntries([
            army('a1', 'osmanli', 'sogut', { sipahi: 1000 }),
            army('a2', 'germiyan', 'kutahya', { sipahi: BALANCED }),
          ]),
          seed,
        ),
        'kutahya',
      ).state;

    expect(outcome(7)).toEqual(outcome(7));
    const winners = new Set(
      Array.from(
        { length: 40 },
        (_, seed) => outcome(seed).provinces.kutahya?.ownerId,
      ),
    );
    expect(winners).toEqual(new Set(['osmanli', 'germiyan']));
  });

  const attackerWinsOf = (
    world: World,
    province: string,
    defender: string,
    runs = 200,
  ) => {
    let wins = 0;
    for (let seed = 0; seed < runs; seed++) {
      const state = gameWith(
        Object.fromEntries([
          army('a1', 'osmanli', 'sogut', { sipahi: 1000 }),
          army('a2', defender, province, { sipahi: BALANCED }),
        ]),
        seed,
      );
      const after = move(state, province, world).state;
      if (after.armies.a1?.provinceId === province) wins++;
    }
    return wins;
  };

  it('favours defenders in hills with fortifications they own', () => {
    const open = attackerWinsOf(testWorld, 'bilecik', 'bizans');
    const walled = attackerWinsOf(
      worldWith('bilecik', { terrain: 'hills', fortification: 2 }),
      'bilecik',
      'bizans',
    );
    expect(open).toBeGreaterThan(60);
    expect(open).toBeLessThan(140);
    expect(walled).toBeLessThan(open / 2);
  });

  it('gives no fortress bonus to a defender who does not own the land', () => {
    // İnegöl Bizans'ın; orada duran Germiyan ordusu kaleden yararlanamaz.
    const open = attackerWinsOf(testWorld, 'inegol', 'germiyan');
    const walled = attackerWinsOf(
      worldWith('inegol', { fortification: 3 }),
      'inegol',
      'germiyan',
    );
    expect(walled).toBe(open);
  });
});

describe('occupation and sieges', () => {
  it('captures an undefended enemy province at once', () => {
    const state = gameWith(
      Object.fromEntries([army('a1', 'osmanli', 'sogut', { sipahi: 500 })]),
    );
    const { state: next, log } = move(state, 'bilecik');

    expect(next.provinces.bilecik?.ownerId).toBe('osmanli');
    expect(log).toContainEqual({
      type: 'provinceCaptured',
      provinceId: 'bilecik',
      by: 'osmanli',
      from: 'bizans',
      turn: 1,
    });
  });

  const fortified = worldWith('bilecik', { fortification: 2 });
  const besieger = (units: ArmyState['units']) =>
    gameWith(Object.fromEntries([army('a1', 'osmanli', 'sogut', units)]));

  it('starts a siege instead of capturing a fortified province', () => {
    const { state, log } = move(
      besieger({ sipahi: 500 }),
      'bilecik',
      fortified,
    );

    expect(state.provinces.bilecik?.ownerId).toBe('bizans');
    expect(state.provinces.bilecik?.siege).toEqual({
      attackerId: 'osmanli',
      turns: 0,
    });
    expect(log.map((e) => e.type)).toContain('siegeStarted');
  });

  it('takes the fortress after the required number of turns', () => {
    let state = move(besieger({ sipahi: 500 }), 'bilecik', fortified).state;
    const required =
      fortified.provinces.bilecik!.fortification! *
      RULES.siegeTurnsPerFortLevel;

    for (let turn = 1; turn < required; turn++) {
      state = endTurn(state, fortified).state;
      expect(state.provinces.bilecik?.ownerId).toBe('bizans');
    }
    const final = endTurn(state, fortified);
    expect(final.state.provinces.bilecik?.ownerId).toBe('osmanli');
    expect(final.state.provinces.bilecik?.siege).toBeUndefined();
    expect(final.log.map((e) => e.type)).toContain('provinceCaptured');
  });

  it('is shortened by artillery', () => {
    const turnsToFall = (units: ArmyState['units']) => {
      let state = move(besieger(units), 'bilecik', fortified).state;
      let turns = 0;
      while (state.provinces.bilecik?.ownerId !== 'osmanli' && turns < 10) {
        state = endTurn(state, fortified).state;
        turns++;
      }
      return turns;
    };

    expect(turnsToFall({ sipahi: 500, topcu: 500 })).toBeLessThan(
      turnsToFall({ sipahi: 1000 }),
    );
  });

  it('is lifted when the besieging army leaves', () => {
    const started = move(besieger({ sipahi: 500 }), 'bilecik', fortified).state;
    const left = move(
      {
        ...started,
        armies: { a1: { ...started.armies.a1!, movesLeft: 1 } },
      },
      'sogut',
      fortified,
    ).state;
    const { state, log } = endTurn(left, fortified);

    expect(state.provinces.bilecik?.siege).toBeUndefined();
    expect(state.provinces.bilecik?.ownerId).toBe('bizans');
    expect(log.map((e) => e.type)).toContain('siegeLifted');
  });
});

describe('morale', () => {
  it('recovers at home and drains abroad each turn', () => {
    const base = gameWith(
      Object.fromEntries([
        army('a1', 'osmanli', 'sogut', { sipahi: 100 }),
        army('a2', 'germiyan', 'sogut', { sipahi: 100 }),
      ]),
    );
    // Savaşsız: iki ordu aynı bölgede ama biri mevsimi ilkbahar iken beklenir.
    const state: GameState = {
      ...base,
      armies: {
        a1: { ...base.armies.a1!, morale: 50 },
        a2: { ...base.armies.a2!, morale: 50 },
      },
    };
    const next = endTurn(state).state;

    expect(next.armies.a1?.morale).toBe(50 + RULES.moraleRecoveryHome);
    expect(next.armies.a2?.morale).toBe(50 - RULES.moraleLossAbroad);
  });
});
