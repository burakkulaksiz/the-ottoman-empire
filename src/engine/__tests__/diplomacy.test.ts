import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame } from '../create-game';
import {
  isHostile,
  militaryPower,
  pairKey,
  relationBetween,
} from '../diplomacy';
import { dispatch } from '../dispatch';
import { RULES } from '../rules';
import type { ArmyState, GameState, Relation } from '../types';

/** Osmanlı–Bizans savaşta, geri kalanı barışta başlayan oyun. */
function newGame(
  pairs: { a: string; b: string; relation: Relation }[] = [
    { a: 'osmanli', b: 'bizans', relation: 'war' },
  ],
  fallback: Relation = 'peace',
): GameState {
  return createGame(
    { ...testScenario, relations: { default: fallback, pairs } },
    { seed: 1 },
  );
}

type Act = Parameters<typeof dispatch>[3];

function run(state: GameState, factionId: string, command: Act) {
  const result = dispatch(testWorld, state, factionId, command);
  if (!result.ok) throw new Error(result.error);
  return result;
}

const withArmies = (
  state: GameState,
  armies: Record<
    string,
    Partial<ArmyState> & Pick<ArmyState, 'ownerId' | 'provinceId'>
  >,
): GameState => ({
  ...state,
  armies: Object.fromEntries(
    Object.entries(armies).map(([id, a]) => [
      id,
      { id, units: { sipahi: 500 }, morale: 100, movesLeft: 1, ...a },
    ]),
  ),
});

describe('relations', () => {
  it('are war between everybody when the scenario says nothing', () => {
    const state = createGame(testScenario, { seed: 1 });
    expect(relationBetween(state, 'osmanli', 'bizans')).toBe('war');
    expect(relationBetween(state, 'bizans', 'germiyan')).toBe('war');
    expect(isHostile(state, 'osmanli', 'germiyan')).toBe(true);
  });

  it('follow the scenario: a default and exceptions, in either order', () => {
    const state = newGame();
    expect(relationBetween(state, 'osmanli', 'bizans')).toBe('war');
    expect(relationBetween(state, 'bizans', 'osmanli')).toBe('war');
    expect(relationBetween(state, 'osmanli', 'germiyan')).toBe('peace');
    expect(relationBetween(state, 'osmanli', 'osmanli')).toBe('alliance');
    expect(pairKey('b', 'a')).toBe(pairKey('a', 'b'));
  });

  it('are checked with the scenario', () => {
    expect(() =>
      createGame(
        {
          ...testScenario,
          relations: {
            pairs: [{ a: 'osmanli', b: 'karesi', relation: 'war' }],
          },
        },
        { seed: 1 },
      ),
    ).toThrow(/unknown or identical factions/);
  });
});

describe('borders and fighting', () => {
  it('stay closed to a state you are at peace with', () => {
    const state = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'sogut' },
    });
    expect(
      dispatch(testWorld, state, 'osmanli', {
        type: 'moveArmy',
        armyId: 'a1',
        to: 'kutahya',
      }),
    ).toEqual({ ok: false, error: 'atPeace' });
  });

  it('open for war targets, which you can still attack', () => {
    const state = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'sogut' },
    });
    const { state: next } = run(state, 'osmanli', {
      type: 'moveArmy',
      armyId: 'a1',
      to: 'bilecik',
    });
    expect(next.provinces.bilecik?.ownerId).toBe('osmanli');
  });

  it('let allies pass without taking their land', () => {
    const state = withArmies(
      newGame([
        { a: 'osmanli', b: 'bizans', relation: 'war' },
        { a: 'osmanli', b: 'germiyan', relation: 'alliance' },
      ]),
      { a1: { ownerId: 'osmanli', provinceId: 'sogut' } },
    );
    const { state: next } = run(state, 'osmanli', {
      type: 'moveArmy',
      armyId: 'a1',
      to: 'kutahya',
    });
    expect(next.armies.a1?.provinceId).toBe('kutahya');
    expect(next.provinces.kutahya?.ownerId).toBe('germiyan');
  });

  it('do not put armies of states at peace in a battle', () => {
    // Bizans (savaşta) ve Germiyan (barışta) aynı bölgede; Osmanlı Germiyan'ın
    // bulunduğu kendi bölgesine yürür: savaş yalnızca Bizans'la olur.
    const state = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'bilecik' },
      a2: { ownerId: 'germiyan', provinceId: 'sogut' },
    });
    const { state: next, log } = run(state, 'osmanli', {
      type: 'moveArmy',
      armyId: 'a1',
      to: 'sogut',
    });
    expect(log.some((e) => e.type === 'battleFought')).toBe(false);
    expect(next.armies.a2?.provinceId).toBe('sogut');
  });

  it('end the siege when peace is made', () => {
    const base = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'bilecik' },
    });
    const besieged: GameState = {
      ...base,
      provinces: {
        ...base.provinces,
        bilecik: {
          ...base.provinces.bilecik!,
          siege: { attackerId: 'osmanli', turns: 1 },
        },
      },
    };
    const { state, log } = run(besieged, 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
      // Bizans'ın ordusu yok: kabul eder.
    });
    expect(state.provinces.bilecik?.siege).toBeUndefined();
    expect(log.map((e) => e.type)).toEqual(['siegeLifted', 'peaceMade']);
  });
});

describe('declaring war', () => {
  it('turns peace into war', () => {
    const { state, log } = run(newGame(), 'osmanli', {
      type: 'declareWar',
      target: 'germiyan',
    });
    expect(relationBetween(state, 'osmanli', 'germiyan')).toBe('war');
    expect(log).toContainEqual({
      type: 'warDeclared',
      by: 'osmanli',
      target: 'germiyan',
      turn: 1,
    });
  });

  it.each([
    [{ target: 'bizans' }, 'alreadyAtWar'],
    [{ target: 'osmanli' }, 'unknownFaction'],
    [{ target: 'karesi' }, 'unknownFaction'],
  ] as const)('rejects %o with %s', (args, error) => {
    expect(
      dispatch(testWorld, newGame(), 'osmanli', {
        type: 'declareWar',
        ...args,
      }),
    ).toEqual({ ok: false, error });
  });

  it('is not possible against an ally, and ends tributes with that state', () => {
    const allied = newGame([
      { a: 'osmanli', b: 'germiyan', relation: 'alliance' },
    ]);
    expect(
      dispatch(testWorld, allied, 'osmanli', {
        type: 'declareWar',
        target: 'germiyan',
      }),
    ).toEqual({ ok: false, error: 'allied' });

    const paying: GameState = {
      ...newGame(),
      diplomacy: {
        ...newGame().diplomacy,
        tributes: [{ payer: 'germiyan', receiver: 'osmanli', amount: 3 }],
      },
    };
    const { state } = run(paying, 'osmanli', {
      type: 'declareWar',
      target: 'germiyan',
    });
    expect(state.diplomacy.tributes).toEqual([]);
  });
});

describe('proposing peace', () => {
  const strong = (): GameState =>
    withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'sogut', units: { sipahi: 500 } },
      a2: { ownerId: 'bizans', provinceId: 'bursa', units: { sipahi: 3000 } },
    });

  it('is accepted by a state that is not clearly stronger', () => {
    const state = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'sogut', units: { sipahi: 1000 } },
      a2: { ownerId: 'bizans', provinceId: 'bursa', units: { sipahi: 1000 } },
    });
    const { state: next, log } = run(state, 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
    });
    expect(relationBetween(next, 'osmanli', 'bizans')).toBe('peace');
    expect(log).toContainEqual({
      type: 'peaceMade',
      a: 'osmanli',
      b: 'bizans',
      tribute: 0,
      turn: 1,
    });
  });

  it('is refused by a state that is winning clearly', () => {
    const { state, log } = run(strong(), 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
    });
    expect(relationBetween(state, 'osmanli', 'bizans')).toBe('war');
    expect(log).toContainEqual({
      type: 'proposalRefused',
      from: 'osmanli',
      to: 'bizans',
      kind: 'peace',
      turn: 1,
    });
  });

  it('can be bought with tribute, which is then paid every turn', () => {
    const before = strong();
    // 500 sipahi (1700 puan) + 20 × 100 = 3700; Bizans 3000 × 3,4 = 10200 ≤ 3700 × 1,3? Hayır.
    // Daha küçük bir fark için Bizans ordusunu küçült.
    const state = withArmies(before, {
      a1: { ownerId: 'osmanli', provinceId: 'sogut', units: { sipahi: 500 } },
      a2: { ownerId: 'bizans', provinceId: 'bursa', units: { sipahi: 1000 } },
    });
    const refused = run(state, 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
    });
    expect(relationBetween(refused.state, 'osmanli', 'bizans')).toBe('war');

    const { state: bought } = run(state, 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
      tribute: RULES.maxTribute,
    });
    expect(relationBetween(bought, 'osmanli', 'bizans')).toBe('peace');
    expect(bought.diplomacy.tributes).toEqual([
      { payer: 'osmanli', receiver: 'bizans', amount: RULES.maxTribute },
    ]);

    const richer: GameState = {
      ...bought,
      factions: {
        ...bought.factions,
        osmanli: { ...bought.factions.osmanli!, treasury: 100 },
      },
    };
    const { state: next, log } = run(richer, 'osmanli', { type: 'endTurn' });
    expect(next.factions.bizans!.treasury).toBe(
      richer.factions.bizans!.treasury + 13 + RULES.maxTribute,
    );
    expect(log).toContainEqual({
      type: 'tributePaid',
      payer: 'osmanli',
      receiver: 'bizans',
      amount: RULES.maxTribute,
      turn: 2,
    });
  });

  it('lets the stronger side demand tribute with a negative amount', () => {
    const state = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'sogut', units: { sipahi: 1000 } },
      a2: { ownerId: 'bizans', provinceId: 'bursa', units: { sipahi: 600 } },
    });
    const { state: next } = run(state, 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
      tribute: -5,
    });
    expect(next.diplomacy.tributes).toEqual([
      { payer: 'bizans', receiver: 'osmanli', amount: 5 },
    ]);
  });

  it('allows one proposal per state and turn, then again next turn', () => {
    const first = run(strong(), 'osmanli', {
      type: 'proposePeace',
      target: 'bizans',
    });
    expect(
      dispatch(testWorld, first.state, 'osmanli', {
        type: 'proposePeace',
        target: 'bizans',
      }),
    ).toEqual({ ok: false, error: 'proposalCooldown' });

    const next = run(first.state, 'osmanli', { type: 'endTurn' }).state;
    expect(
      dispatch(testWorld, next, 'osmanli', {
        type: 'proposePeace',
        target: 'bizans',
      }).ok,
    ).toBe(true);
  });

  it.each([
    [{ target: 'germiyan' }, 'notAtWar'],
    [{ target: 'bizans', tribute: 99 }, 'invalidTribute'],
    [{ target: 'bizans', tribute: 1.5 }, 'invalidTribute'],
  ] as const)('rejects %o with %s', (args, error) => {
    expect(
      dispatch(testWorld, newGame(), 'osmanli', {
        type: 'proposePeace',
        ...args,
      }),
    ).toEqual({ ok: false, error });
  });
});

/** Çeyizi ödeyebilecek kadar hazinesi olan Osmanlı. */
const funded = (state: GameState): GameState => ({
  ...state,
  factions: {
    ...state.factions,
    osmanli: { ...state.factions.osmanli!, treasury: 50 },
  },
});

describe('alliances', () => {
  // Osmanlı ve Germiyan barışta, ikisi de Bizans'la savaşta.
  const common = () =>
    funded(
      newGame([
        { a: 'osmanli', b: 'bizans', relation: 'war' },
        { a: 'germiyan', b: 'bizans', relation: 'war' },
      ]),
    );

  it('are made with a state that shares an enemy, for a dowry', () => {
    const before = common();
    const { state, log } = run(before, 'osmanli', {
      type: 'proposeAlliance',
      target: 'germiyan',
    });

    expect(relationBetween(state, 'osmanli', 'germiyan')).toBe('alliance');
    expect(state.factions.osmanli!.treasury).toBe(
      before.factions.osmanli!.treasury - RULES.dowry + 0,
    );
    expect(state.factions.germiyan!.treasury).toBe(
      before.factions.germiyan!.treasury + RULES.dowry,
    );
    expect(log).toContainEqual({
      type: 'allianceFormed',
      a: 'osmanli',
      b: 'germiyan',
      turn: 1,
    });
  });

  it('are refused without a common enemy, and cost nothing then', () => {
    const before = funded(newGame());
    const { state, log } = run(before, 'osmanli', {
      type: 'proposeAlliance',
      target: 'germiyan',
    });
    expect(relationBetween(state, 'osmanli', 'germiyan')).toBe('peace');
    expect(state.factions.osmanli!.treasury).toBe(
      before.factions.osmanli!.treasury,
    );
    expect(log.map((e) => e.type)).toEqual(['proposalRefused']);
  });

  it('need peace first and the money for the dowry', () => {
    expect(
      dispatch(testWorld, newGame(), 'osmanli', {
        type: 'proposeAlliance',
        target: 'bizans',
      }),
    ).toEqual({ ok: false, error: 'notAtPeace' });

    const poor: GameState = {
      ...common(),
      factions: {
        ...common().factions,
        osmanli: { ...common().factions.osmanli!, treasury: RULES.dowry - 1 },
      },
    };
    expect(
      dispatch(testWorld, poor, 'osmanli', {
        type: 'proposeAlliance',
        target: 'germiyan',
      }),
    ).toEqual({ ok: false, error: 'notEnoughGold' });
  });
});

describe('offers to the player', () => {
  const offered = () =>
    run(newGame(), 'bizans', {
      type: 'proposePeace',
      target: 'osmanli',
      tribute: 4,
    }).state;

  it('wait for the player instead of being decided by the engine', () => {
    const state = offered();
    expect(relationBetween(state, 'osmanli', 'bizans')).toBe('war');
    expect(state.diplomacy.offers).toHaveLength(1);
    expect(state.diplomacy.offers[0]).toMatchObject({
      from: 'bizans',
      to: 'osmanli',
      tribute: 4,
    });
  });

  it('become peace with the tribute when accepted', () => {
    const state = offered();
    const { state: next } = run(state, 'osmanli', {
      type: 'respondOffer',
      offerId: state.diplomacy.offers[0]!.id,
      accept: true,
    });
    expect(relationBetween(next, 'osmanli', 'bizans')).toBe('peace');
    expect(next.diplomacy.tributes).toEqual([
      { payer: 'bizans', receiver: 'osmanli', amount: 4 },
    ]);
    expect(next.diplomacy.offers).toEqual([]);
  });

  it('leave the war as it is when rejected', () => {
    const state = offered();
    const { state: next, log } = run(state, 'osmanli', {
      type: 'respondOffer',
      offerId: state.diplomacy.offers[0]!.id,
      accept: false,
    });
    expect(relationBetween(next, 'osmanli', 'bizans')).toBe('war');
    expect(log.map((e) => e.type)).toEqual(['offerRejected']);
  });

  it('expire when the turn ends, and only the player can answer', () => {
    const state = offered();
    const id = state.diplomacy.offers[0]!.id;
    expect(
      dispatch(testWorld, state, 'bizans', {
        type: 'respondOffer',
        offerId: id,
        accept: true,
      }),
    ).toEqual({ ok: false, error: 'notPlayer' });
    expect(
      dispatch(testWorld, state, 'osmanli', {
        type: 'respondOffer',
        offerId: 'offer-99',
        accept: true,
      }),
    ).toEqual({ ok: false, error: 'noSuchOffer' });

    const next = run(state, 'osmanli', { type: 'endTurn' }).state;
    expect(next.diplomacy.offers).toEqual([]);
  });
});

describe('military power', () => {
  it('adds attack and defence of every soldier of a state', () => {
    const state = withArmies(newGame(), {
      a1: { ownerId: 'osmanli', provinceId: 'sogut', units: { sipahi: 100 } },
      a2: { ownerId: 'osmanli', provinceId: 'bilecik', units: { akinci: 100 } },
      a3: { ownerId: 'bizans', provinceId: 'bursa', units: { sipahi: 1 } },
    });
    // sipahi 2 + 1,4 = 3,4; akıncı 1,2 + 0,6 = 1,8.
    expect(militaryPower(state, 'osmanli')).toBeCloseTo(340 + 180);
    expect(militaryPower(state, 'germiyan')).toBe(0);
  });
});
