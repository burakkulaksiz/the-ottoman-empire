import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame } from '../create-game';
import { dispatch } from '../dispatch';
import { incomeOf, recruitOptions, upkeepOf } from '../economy';
import { RULES } from '../rules';
import type { GameState } from '../types';
import { armySize } from '../units';

const start = (): GameState => createGame(testScenario, { seed: 1 });
const inYear = (state: GameState, year: number): GameState => ({
  ...state,
  date: { year, season: 'spring' },
});
const withTreasury = (state: GameState, treasury: number): GameState => ({
  ...state,
  factions: {
    ...state.factions,
    osmanli: { ...state.factions.osmanli!, treasury },
  },
});

function recruit(
  state: GameState,
  unit: 'akinci' | 'sipahi' | 'yaya' | 'yeniceri',
  provinceId = 'sogut',
) {
  return dispatch(testWorld, state, 'osmanli', {
    type: 'recruit',
    provinceId,
    unit,
  });
}

function ok(result: ReturnType<typeof recruit>) {
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe('recruit', () => {
  it('adds a batch to the army in the province and charges the treasury', () => {
    const before = start();
    const { state, log } = ok(recruit(before, 'akinci'));

    expect(state.armies['army-1']?.units).toEqual({
      sipahi: 600,
      akinci: 400 + RULES.recruitBatch,
    });
    expect(state.factions.osmanli?.treasury).toBe(10 - 4);
    expect(before.factions.osmanli?.treasury).toBe(10);
    expect(log).toContainEqual({
      type: 'recruited',
      factionId: 'osmanli',
      provinceId: 'sogut',
      unit: 'akinci',
      amount: RULES.recruitBatch,
      cost: 4,
      turn: 1,
    });
  });

  it('raises a new army, that cannot move yet, where none stands', () => {
    const base = start();
    const empty: GameState = {
      ...base,
      armies: { 'army-2': base.armies['army-2']! },
    };
    const { state } = ok(recruit(empty, 'sipahi'));

    const created = Object.values(state.armies).find(
      (a) => a.ownerId === 'osmanli',
    );
    expect(created).toMatchObject({
      provinceId: 'sogut',
      units: { sipahi: RULES.recruitBatch },
      movesLeft: 0,
      morale: RULES.moraleStart,
    });
    expect(state.nextId).toBe(empty.nextId + 1);
  });

  it.each([
    ['bilecik', 'akinci', 'notOwner'],
    ['iznik', 'akinci', 'unknownProvince'],
    ['sogut', 'yaya', 'unitUnavailable'],
  ] as const)('rejects %s %s with %s', (provinceId, unit, error) => {
    expect(recruit(start(), unit, provinceId)).toEqual({ ok: false, error });
  });

  it('needs the money', () => {
    expect(recruit(withTreasury(start(), 9), 'sipahi')).toEqual({
      ok: false,
      error: 'notEnoughGold',
    });
    expect(recruit(withTreasury(start(), 10), 'sipahi').ok).toBe(true);
  });

  it('limits the orders per province and turn, then lifts the limit', () => {
    let state = withTreasury(start(), 100);
    for (let i = 0; i < RULES.recruitOrdersPerProvince; i++) {
      state = ok(recruit(state, 'akinci')).state;
    }
    expect(recruit(state, 'akinci')).toEqual({
      ok: false,
      error: 'recruitLimit',
    });

    const next = dispatch(testWorld, state, 'osmanli', { type: 'endTurn' });
    if (!next.ok) throw new Error(next.error);
    expect(next.state.provinces.sogut?.recruited).toBeUndefined();
    expect(recruit(next.state, 'akinci').ok).toBe(true);
  });

  it('is impossible in a besieged province', () => {
    const base = start();
    const besieged: GameState = {
      ...base,
      provinces: {
        ...base.provinces,
        sogut: {
          ...base.provinces.sogut!,
          siege: { attackerId: 'bizans', turns: 1 },
        },
      },
    };
    expect(recruit(besieged, 'akinci')).toEqual({
      ok: false,
      error: 'besieged',
    });
  });

  it('opens later units with the years', () => {
    expect(recruit(inYear(start(), 1330), 'yaya').ok).toBe(true);
    expect(
      recruit(inYear(withTreasury(start(), 99), 1362), 'yeniceri'),
    ).toEqual({ ok: false, error: 'unitUnavailable' });
    expect(
      recruit(inYear(withTreasury(start(), 99), 1363), 'yeniceri').ok,
    ).toBe(true);
  });
});

describe('recruitOptions', () => {
  it('lists the units of the year with the reason when one is not possible', () => {
    const state = withTreasury(start(), 5);
    const options = recruitOptions(testWorld, state, 'osmanli', 'sogut');

    expect(options.map((o) => o.unit)).toEqual(['akinci', 'sipahi']);
    expect(options).toEqual([
      { unit: 'akinci', cost: 4, error: null },
      { unit: 'sipahi', cost: 10, error: 'notEnoughGold' },
    ]);
  });

  it('shows foreign provinces as not owned', () => {
    expect(
      recruitOptions(testWorld, start(), 'osmanli', 'bilecik').every(
        (o) => o.error === 'notOwner',
      ),
    ).toBe(true);
  });
});

describe('income and upkeep', () => {
  it('income is the tax of the provinces a state owns', () => {
    expect(incomeOf(testWorld, start(), 'osmanli')).toBe(2);
    expect(incomeOf(testWorld, start(), 'bizans')).toBe(3 + 2 + 8);
  });

  it('timar cavalry is free while salaried troops cost akçe', () => {
    expect(upkeepOf(start(), 'osmanli')).toBe(0);

    const base = inYear(start(), 1400);
    const paid: GameState = {
      ...base,
      armies: {
        'army-1': {
          ...base.armies['army-1']!,
          units: { sipahi: 600, yaya: 250, yeniceri: 100 },
        },
      },
    };
    // yaya: ceil(2,5 × 1) = 3, yeniçeri: 1 × 3 = 3.
    expect(upkeepOf(paid, 'osmanli')).toBe(6);
  });

  it('pays the salaries out of the treasury at the end of the turn', () => {
    const base = withTreasury(inYear(start(), 1400), 20);
    const state: GameState = {
      ...base,
      armies: {
        'army-1': {
          ...base.armies['army-1']!,
          units: { sipahi: 600, yaya: 200 },
        },
      },
    };
    const result = dispatch(testWorld, state, 'osmanli', { type: 'endTurn' });
    if (!result.ok) throw new Error(result.error);

    expect(result.state.factions.osmanli?.treasury).toBe(20 + 2 - 2);
    expect(result.log).toContainEqual({
      type: 'upkeepPaid',
      factionId: 'osmanli',
      amount: 2,
      turn: 2,
    });
  });

  it('lets salaried troops desert and morale fall when the pay is missing', () => {
    const base = withTreasury(inYear(start(), 1400), 0);
    const state: GameState = {
      ...base,
      armies: {
        'army-1': {
          ...base.armies['army-1']!,
          units: { sipahi: 600, yeniceri: 2000 },
          morale: 100,
        },
      },
    };
    const result = dispatch(testWorld, state, 'osmanli', { type: 'endTurn' });
    if (!result.ok) throw new Error(result.error);

    const army = result.state.armies['army-1']!;
    expect(army.units).toEqual({
      sipahi: 600,
      yeniceri: 2000 - Math.floor(2000 * RULES.unpaidDesertionRate),
    });
    // Tam moral evde zaten tavandadır; maaşsızlık 15 puan götürür.
    expect(army.morale).toBe(RULES.moraleMax - RULES.unpaidMoraleLoss);
    expect(result.log.some((e) => e.type === 'troopsUnpaid')).toBe(true);
    expect(armySize(army.units)).toBeLessThan(2600);
  });
});
