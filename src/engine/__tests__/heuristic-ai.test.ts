import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import type { AiContext } from '../ai';
import type { Season } from '../calendar';
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
    expect(decide(state, 'osmanli')).toEqual([
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
    for (const command of decide(base, 'bizans')) {
      expect(command).toMatchObject({ armyId: 'a2' });
    }
  });

  it('produces only commands the engine accepts', () => {
    let state = createGame(testScenario, { seed: 5 });
    for (let turn = 0; turn < 12; turn++) {
      for (const faction of ['osmanli', 'bizans', 'germiyan']) {
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
