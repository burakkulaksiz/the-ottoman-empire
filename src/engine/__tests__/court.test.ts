import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import {
  ageOf,
  courtIncomeFactor,
  stabilityLevel,
  stabilityTarget,
} from '../court';
import { createGame, type ScenarioSetup } from '../create-game';
import { dispatch } from '../dispatch';
import { incomeOf } from '../economy';
import { RULES } from '../rules';
import type { CourtState, GameState, LogEntry, Person } from '../types';

const person = (
  id: string,
  born: number,
  extra: Partial<Person> = {},
): Person => ({
  id,
  name: id,
  born,
  military: 3,
  administration: 3,
  ...extra,
});

type CourtSetup = NonNullable<ScenarioSetup['court']>;

function withCourt(court: Partial<CourtSetup> = {}, seed = 1): GameState {
  return createGame(
    {
      ...testScenario,
      court: {
        ruler: person('osman', 1260),
        heirs: [],
        stability: 60,
        names: ['Süleyman', 'Halil'],
        ...court,
      },
    },
    { seed },
  );
}

function endTurns(state: GameState, turns: number) {
  const log: LogEntry[] = [];
  for (let i = 0; i < turns && state.status.phase === 'playing'; i++) {
    const result = dispatch(testWorld, state, 'osmanli', { type: 'endTurn' });
    if (!result.ok) throw new Error(result.error);
    state = result.state;
    log.push(...result.log);
  }
  return { state, log };
}

const setCourt = (state: GameState, patch: Partial<CourtState>): GameState => ({
  ...state,
  court: { ...state.court!, ...patch },
});

describe('court', () => {
  it('exists only when the scenario defines a ruler', () => {
    expect(createGame(testScenario, { seed: 1 }).court).toBeUndefined();
    expect(withCourt().court).toMatchObject({
      ruler: { name: 'osman' },
      vizier: null,
      candidates: [],
      stability: 60,
    });
  });

  it('moves stability toward what the ruler can hold', () => {
    const state = withCourt({ stability: 20 });
    const target = stabilityTarget(state.court!);
    const { state: next } = endTurns(state, 1);
    expect(next.court!.stability).toBe(20 + RULES.court.stabilityDrift);
    expect(target).toBe(
      RULES.court.baseStability + 3 * RULES.court.rulerAdminWeight,
    );
  });

  it('labels stability levels', () => {
    expect(stabilityLevel(80)).toBe('stable');
    expect(stabilityLevel(40)).toBe('uneasy');
    expect(stabilityLevel(10)).toBe('unrest');
  });
});

describe('succession', () => {
  // 1300'de 140 yaşında bir hükümdar: ölüm olasılığı tavanda (%50).
  const old = person('osman', 1160);

  function untilDeath(state: GameState) {
    for (let year = 0; year < 30; year++) {
      const result = endTurns(state, 4);
      if (result.log.some((e) => e.type === 'rulerDied')) return result;
      state = result.state;
    }
    throw new Error('ruler did not die');
  }

  it('crowns the eldest adult heir', () => {
    const { state, log } = untilDeath(
      withCourt({ ruler: old, heirs: [person('orhan', 1270)] }),
    );
    expect(state.court!.ruler.name).toBe('orhan');
    expect(state.court!.heirs).toEqual([]);
    expect(log).toContainEqual(
      expect.objectContaining({ type: 'newRuler', name: 'orhan' }),
    );
  });

  it('turns rival adult claimants into a throne struggle', () => {
    const { state, log } = untilDeath(
      withCourt({
        ruler: old,
        heirs: [
          person('orhan', 1270),
          person('alaeddin', 1272),
          person('kardes', 1274, { claimsThrone: false }),
        ],
      }),
    );
    expect(state.court!.ruler.name).toBe('orhan');
    expect(state.court!.heirs.map((h) => h.name)).toEqual(['kardes']);
    expect(log).toContainEqual(
      expect.objectContaining({
        type: 'successionStruggle',
        winner: 'orhan',
        rivals: ['alaeddin'],
      }),
    );
  });

  it('falls back to a kinsman when there is no heir', () => {
    const { state } = untilDeath(withCourt({ ruler: old, heirs: [] }));
    expect(['Süleyman', 'Halil']).toContain(state.court!.ruler.name);
  });
});

describe('births and the vizier', () => {
  it('gives a young ruler sons over the years', () => {
    const { log, state } = endTurns(
      withCourt({ ruler: person('osman', 1275) }),
      40,
    );
    const births = log.filter((e) => e.type === 'heirBorn');
    expect(births.length).toBeGreaterThan(0);
    expect(state.court!.heirs.length).toBe(births.length);
  });

  it('offers vizier candidates once the divan exists', () => {
    const before = withCourt();
    expect(
      dispatch(testWorld, before, 'osmanli', {
        type: 'appointVizier',
        personId: 'x',
      }),
    ).toEqual({ ok: false, error: 'notYet' });

    const later: GameState = {
      ...before,
      date: { year: RULES.court.divanFrom, season: 'winter' },
    };
    const { state } = endTurns(later, 1);
    expect(state.court!.candidates).toHaveLength(2);
  });

  it('appoints a vizier for a price, which raises income', () => {
    const base = withCourt();
    const candidate = person('candarli', 1270, { administration: 5 });
    const state: GameState = {
      ...setCourt(base, { candidates: [candidate] }),
      date: { year: RULES.court.divanFrom, season: 'summer' },
      factions: {
        ...base.factions,
        osmanli: { ...base.factions.osmanli!, treasury: 50 },
      },
    };
    const result = dispatch(testWorld, state, 'osmanli', {
      type: 'appointVizier',
      personId: 'candarli',
    });
    if (!result.ok) throw new Error(result.error);

    expect(result.state.court!.vizier?.name).toBe('candarli');
    expect(result.state.court!.candidates).toEqual([]);
    expect(result.state.factions.osmanli!.treasury).toBe(
      50 - RULES.court.vizierCost,
    );
    expect(courtIncomeFactor(result.state.court)).toBeGreaterThan(
      courtIncomeFactor(state.court),
    );
  });

  it('rejects unknown candidates and other states', () => {
    const state: GameState = {
      ...withCourt(),
      date: { year: RULES.court.divanFrom, season: 'summer' },
    };
    expect(
      dispatch(testWorld, state, 'osmanli', {
        type: 'appointVizier',
        personId: 'yok',
      }),
    ).toEqual({ ok: false, error: 'noSuchCandidate' });
    expect(
      dispatch(testWorld, state, 'bizans', {
        type: 'appointVizier',
        personId: 'yok',
      }),
    ).toEqual({ ok: false, error: 'notPlayer' });
  });
});

describe('stability effects', () => {
  it('scales income: loyal lands pay more, restless ones less', () => {
    expect(courtIncomeFactor(undefined)).toBe(1);
    expect(courtIncomeFactor(withCourt({ stability: 60 }).court)).toBe(1);
    expect(courtIncomeFactor(withCourt({ stability: 100 }).court)).toBeCloseTo(
      1.2,
    );
    expect(courtIncomeFactor(withCourt({ stability: 0 }).court)).toBeCloseTo(
      0.7,
    );

    // Söğüt 2 akçe: sadakat 0 iken 2 × 0,7 = 1,4 → 1.
    expect(incomeOf(testWorld, withCourt({ stability: 0 }), 'osmanli')).toBe(1);
  });

  it('rises with conquest and falls with lost battles', () => {
    const state = withCourt();
    const won = dispatch(testWorld, state, 'osmanli', {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'bilecik',
    });
    if (!won.ok) throw new Error(won.error);
    expect(won.state.court!.stability).toBe(60 + RULES.court.provinceWonGain);

    const weak: GameState = {
      ...state,
      armies: {
        ...state.armies,
        'army-1': { ...state.armies['army-1']!, units: { akinci: 10 } },
      },
    };
    const lost = dispatch(testWorld, weak, 'osmanli', {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'kutahya',
    });
    if (!lost.ok) throw new Error(lost.error);
    expect(lost.state.court!.stability).toBe(60 - RULES.court.battleLostLoss);
  });

  it('lets ungarrisoned provinces revolt when loyalty collapses', () => {
    const base = withCourt({
      stability: 0,
      ruler: person('osman', 1290, { administration: 1 }),
    });
    // Söğüt'te ordu var; Bilecik ve İnegöl Osmanlı'nın ama ordusuz.
    const state: GameState = {
      ...base,
      provinces: {
        ...base.provinces,
        bilecik: { id: 'bilecik', ownerId: 'osmanli' },
        inegol: { id: 'inegol', ownerId: 'osmanli' },
      },
    };
    const { state: next, log } = endTurns(state, 12);
    const revolts = log.filter((e) => e.type === 'revolt');

    expect(revolts.length).toBeGreaterThan(0);
    for (const revolt of revolts) {
      expect(revolt).toMatchObject({ kind: 'rebellion' });
      expect(['bilecik', 'inegol']).toContain(
        (revolt as { provinceId: string }).provinceId,
      );
    }
    expect(next.provinces.sogut?.ownerId).toBe('osmanli');
  });

  it('makes unpaid janissaries revolt', () => {
    const base = withCourt();
    const state: GameState = {
      ...base,
      date: { year: 1400, season: 'spring' },
      factions: {
        ...base.factions,
        osmanli: { ...base.factions.osmanli!, treasury: 0 },
      },
      armies: {
        'army-1': {
          ...base.armies['army-1']!,
          units: { yeniceri: 3000 },
        },
      },
    };
    const { log, state: next } = endTurns(state, 1);
    expect(log.map((e) => e.type)).toContain('janissaryRevolt');
    expect(next.court!.stability).toBeLessThan(60);
  });

  it('computes ages from birth years', () => {
    expect(ageOf(person('a', 1258), 1299)).toBe(41);
  });
});
