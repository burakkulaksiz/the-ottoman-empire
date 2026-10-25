import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import type { AiContext } from '../ai';
import type { Season } from '../calendar';
import type { ActionCommand } from '../commands/types';
import { createGame } from '../create-game';
import { dispatch } from '../dispatch';
import { createHeuristicAi, heuristicAi } from '../heuristic-ai';
import type { ArmyState, GameState } from '../types';

type Placement = [
  id: string,
  owner: string,
  province: string,
  units: ArmyState['units'],
];

/** Test dünyasında yalnızca verilen orduların bulunduğu bir oyun. */
function gameWith(
  placements: Placement[],
  options: { season?: Season; owners?: Record<string, string | null> } = {},
): GameState {
  const base = createGame(testScenario, { seed: 1 });
  return {
    ...base,
    date: { year: 1300, season: options.season ?? 'spring' },
    provinces: Object.fromEntries(
      Object.entries(base.provinces).map(([id, p]) => [
        id,
        {
          ...p,
          ownerId:
            options.owners && id in options.owners
              ? options.owners[id]!
              : p.ownerId,
        },
      ]),
    ),
    armies: Object.fromEntries(
      placements.map(([id, ownerId, provinceId, units]) => [
        id,
        { id, ownerId, provinceId, units, morale: 100, movesLeft: 1 },
      ]),
    ),
  };
}

const decide = (state: GameState, factionId: string, ai = heuristicAi) =>
  ai.decide({
    world: testWorld,
    state,
    factionId,
    random: () => 0.5,
  } satisfies AiContext);

const moves = (commands: ActionCommand[]) =>
  commands.filter((c) => c.type === 'moveArmy');
const recruits = (commands: ActionCommand[]) =>
  commands.filter((c) => c.type === 'recruit');

describe('heuristic AI', () => {
  it('captures an undefended enemy province next to its army', () => {
    const state = gameWith([['a1', 'osmanli', 'sogut', { sipahi: 500 }]]);
    const commands = decide(state, 'osmanli');

    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({ type: 'moveArmy', armyId: 'a1' });
    const to = (commands[0] as { to: string }).to;
    expect(['bilecik', 'inegol', 'kutahya']).toContain(to);
  });

  it('does not spread into unowned land', () => {
    const state = gameWith([['a1', 'osmanli', 'sogut', { sipahi: 500 }]], {
      owners: { bilecik: null, inegol: null, kutahya: null },
    });
    expect(decide(state, 'osmanli')).toEqual([]);
  });

  it('attacks a clearly weaker army', () => {
    // Bilecik'te zayıf bir Bizans ordusu; İnegöl ve Kütahya da kendi toprakları.
    const state = gameWith(
      [
        ['a1', 'osmanli', 'sogut', { sipahi: 2000 }],
        ['a2', 'bizans', 'bilecik', { akinci: 100 }],
      ],
      { owners: { inegol: 'osmanli', kutahya: 'osmanli' } },
    );
    expect(moves(decide(state, 'osmanli'))).toEqual([
      { type: 'moveArmy', armyId: 'a1', to: 'bilecik' },
    ]);
  });

  it('does not attack a stronger army when no better option exists', () => {
    const state = gameWith(
      [
        ['a1', 'osmanli', 'sogut', { akinci: 100 }],
        ['a2', 'bizans', 'bilecik', { sipahi: 5000 }],
      ],
      { owners: { inegol: 'osmanli', kutahya: 'osmanli' } },
    );
    const moves = decide(state, 'osmanli');
    expect(
      moves.find((m) => m.type === 'moveArmy' && m.to === 'bilecik'),
    ).toBeUndefined();
  });

  it('becomes bolder with a lower aggression threshold', () => {
    const state = gameWith(
      [
        ['a1', 'osmanli', 'sogut', { sipahi: 1000 }],
        // 1000 sipahi saldırısı (2000) ≈ 1,0× oran: temkinli ordu girmez.
        ['a2', 'bizans', 'bilecik', { sipahi: 1430 }],
      ],
      { owners: { inegol: 'osmanli', kutahya: 'osmanli' } },
    );
    const goesToBilecik = (aggression: number) =>
      decide(state, 'osmanli', createHeuristicAi({ aggression })).some(
        (m) => m.type === 'moveArmy' && m.to === 'bilecik',
      );

    expect(goesToBilecik(2)).toBe(false);
    expect(goesToBilecik(0.5)).toBe(true);
  });

  it('heads home in winter instead of freezing abroad', () => {
    const state = gameWith([['a1', 'osmanli', 'bilecik', { sipahi: 500 }]], {
      season: 'winter',
      owners: { sogut: 'osmanli' },
    });
    expect(decide(state, 'osmanli')).toEqual([
      { type: 'moveArmy', armyId: 'a1', to: 'sogut' },
    ]);
  });

  it('advances toward the frontier from deep inside its own land', () => {
    // Osmanlı: Söğüt, Bilecik, Bursa; düşman Kütahya'da. Bursa'dan Söğüt'e doğru.
    const state = gameWith([['a1', 'osmanli', 'bursa', { sipahi: 500 }]], {
      owners: {
        sogut: 'osmanli',
        bilecik: 'osmanli',
        bursa: 'osmanli',
        inegol: 'osmanli',
      },
    });
    const [command] = decide(state, 'osmanli');
    expect(command).toMatchObject({ type: 'moveArmy', armyId: 'a1' });
    expect(['bilecik', 'inegol']).toContain((command as { to: string }).to);
  });

  it('leaves armies without moves alone and only commands its own armies', () => {
    const base = gameWith([
      ['a1', 'osmanli', 'sogut', { sipahi: 500 }],
      ['a2', 'bizans', 'bursa', { sipahi: 500 }],
    ]);
    const spent: GameState = {
      ...base,
      armies: { ...base.armies, a1: { ...base.armies.a1!, movesLeft: 0 } },
    };

    expect(decide(spent, 'osmanli')).toEqual([]);
    for (const command of moves(decide(base, 'bizans'))) {
      expect(command).toMatchObject({ armyId: 'a2' });
    }
  });

  it('produces only commands the engine accepts', () => {
    let state = createGame(testScenario, { seed: 5 });
    for (let turn = 0; turn < 12; turn++) {
      for (const faction of ['osmanli', 'bizans', 'germiyan']) {
        if (state.status.phase === 'ended') return;
        for (const command of decide(state, faction)) {
          const result = dispatch(testWorld, state, faction, command);
          expect(result.ok).toBe(true);
          if (result.ok) state = result.state;
        }
      }
      const next = dispatch(testWorld, state, 'osmanli', { type: 'endTurn' });
      if (!next.ok) break;
      state = next.state;
    }
  });
});

describe('heuristic AI recruitment', () => {
  /** Bizans'ın hazinesi bol; Bilecik ve İnegöl düşman sınırında, Bursa'da ordusu var. */
  const rich = (extra: Partial<GameState> = {}): GameState => ({
    ...gameWith([['a2', 'bizans', 'bursa', { sipahi: 500 }]]),
    ...extra,
  });

  it('spends a share of its income on soldiers where the frontier is', () => {
    // Gelir: Bilecik 3 + İnegöl 2 + Bursa 8 = 13 → bütçe 6 (yarısı).
    const commands = recruits(
      decide(rich(), 'bizans', createHeuristicAi({ recruitShare: 0.5 })),
    );

    expect(commands).toEqual([
      { type: 'recruit', provinceId: 'bilecik', unit: 'akinci' },
    ]);
  });

  it('prefers the strongest unit it can afford and keep paying', () => {
    const commands = recruits(
      decide(rich(), 'bizans', createHeuristicAi({ recruitShare: 1 })),
    );

    // Bütçe 13: bir sipahi (10) alınır, kalan 3 akıncıya yetmez.
    expect(commands).toEqual([
      { type: 'recruit', provinceId: 'bilecik', unit: 'sipahi' },
    ]);
  });

  it('never orders more than the province limit allows', () => {
    const state = rich();
    const wealthy: GameState = {
      ...state,
      factions: {
        ...state.factions,
        bizans: { ...state.factions.bizans!, treasury: 1000 },
      },
    };
    const commands = recruits(
      decide(wealthy, 'bizans', createHeuristicAi({ recruitShare: 10 })),
    );
    expect(commands.length).toBeLessThanOrEqual(3);
  });

  it('does not recruit when it cannot spend anything', () => {
    const state = rich();
    const broke: GameState = {
      ...state,
      factions: {
        ...state.factions,
        bizans: { ...state.factions.bizans!, treasury: 0 },
      },
    };
    expect(recruits(decide(broke, 'bizans'))).toEqual([]);
  });

  it('skips provinces under siege', () => {
    const state = rich();
    const besieged: GameState = {
      ...state,
      provinces: {
        ...state.provinces,
        bursa: {
          ...state.provinces.bursa!,
          siege: { attackerId: 'osmanli', turns: 1 },
        },
      },
    };
    for (const command of recruits(decide(besieged, 'bizans'))) {
      expect(command).not.toMatchObject({ provinceId: 'bursa' });
    }
  });

  it('only recruits units that exist in that year', () => {
    const early = recruits(
      decide(rich(), 'bizans', createHeuristicAi({ recruitShare: 1 })),
    );
    for (const command of early) {
      expect(['akinci', 'sipahi']).toContain(
        (command as { unit: string }).unit,
      );
    }
  });
});

describe('heuristic AI diplomacy', () => {
  const diplomatic = (commands: ActionCommand[]) =>
    commands.filter(
      (c) => c.type === 'proposePeace' || c.type === 'declareWar',
    );

  it('asks for peace in a war it is losing', () => {
    const state = gameWith([
      ['a1', 'osmanli', 'sogut', { sipahi: 3000 }],
      ['a2', 'bizans', 'bursa', { sipahi: 500 }],
    ]);
    expect(diplomatic(decide(state, 'bizans'))).toContainEqual({
      type: 'proposePeace',
      target: 'osmanli',
    });
  });

  it('keeps fighting a war it is not losing', () => {
    const state = gameWith([
      ['a1', 'osmanli', 'sogut', { sipahi: 500 }],
      ['a2', 'bizans', 'bursa', { sipahi: 500 }],
    ]);
    expect(diplomatic(decide(state, 'bizans'))).toEqual([]);
  });

  it('a warlike state attacks a much weaker neighbour it is at peace with', () => {
    const base = gameWith([
      ['a1', 'osmanli', 'sogut', { sipahi: 100 }],
      ['a3', 'germiyan', 'kutahya', { sipahi: 2000 }],
    ]);
    const state: GameState = {
      ...base,
      diplomacy: {
        ...base.diplomacy,
        relations: { ...base.diplomacy.relations, 'germiyan|osmanli': 'peace' },
      },
    };
    const warlike = createHeuristicAi({ warlike: 1 });
    const peaceful = createHeuristicAi({ warlike: 0 });

    expect(diplomatic(decide(state, 'germiyan', warlike))).toEqual([
      { type: 'declareWar', target: 'osmanli' },
    ]);
    expect(diplomatic(decide(state, 'germiyan', peaceful))).toEqual([]);
  });

  it('does not attack a neighbour that is about as strong', () => {
    const base = gameWith([
      ['a1', 'osmanli', 'sogut', { sipahi: 1500 }],
      ['a3', 'germiyan', 'kutahya', { sipahi: 2000 }],
    ]);
    const state: GameState = {
      ...base,
      diplomacy: {
        ...base.diplomacy,
        relations: { ...base.diplomacy.relations, 'germiyan|osmanli': 'peace' },
      },
    };
    expect(
      diplomatic(decide(state, 'germiyan', createHeuristicAi({ warlike: 1 }))),
    ).toEqual([]);
  });

  it('does not march into the land of a state it is at peace with', () => {
    const base = gameWith([['a1', 'osmanli', 'sogut', { sipahi: 5000 }]]);
    const state: GameState = {
      ...base,
      diplomacy: {
        ...base.diplomacy,
        relations: Object.fromEntries(
          Object.keys(base.diplomacy.relations).map((k) => [k, 'peace']),
        ),
      },
    };
    expect(moves(decide(state, 'osmanli'))).toEqual([]);
  });
});

describe('heuristic AI in a full game', () => {
  const play = (seed: number) => {
    let state = createGame(testScenario, { seed });
    for (let turn = 0; turn < 40 && state.status.phase === 'playing'; turn++) {
      const result = dispatch(
        testWorld,
        state,
        'osmanli',
        { type: 'endTurn' },
        { ai: heuristicAi },
      );
      if (!result.ok) throw new Error(result.error);
      state = result.state;
    }
    return state;
  };

  it('is deterministic and keeps the state serializable', () => {
    const a = play(11);
    expect(play(11)).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it('actually moves rival armies and changes who owns what', () => {
    const start = createGame(testScenario, { seed: 3 });
    const end = play(3);
    const owners = (s: GameState) =>
      Object.values(s.provinces)
        .map((p) => p.ownerId)
        .join();

    expect(owners(end)).not.toBe(owners(start));
    expect(
      end.log.some((e) => e.type === 'armyMoved' && e.factionId !== 'osmanli'),
    ).toBe(true);
  });
});
