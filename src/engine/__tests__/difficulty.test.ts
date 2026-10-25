import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import type { ActionCommand } from '../commands/types';
import { createGame } from '../create-game';
import { dispatch } from '../dispatch';
import { incomeOf } from '../economy';
import { createHeuristicAi, heuristicAi } from '../heuristic-ai';
import type { ArmyState, GameSettings, GameState } from '../types';

const start = (settings?: Partial<GameSettings>) =>
  createGame(testScenario, { seed: 1, settings });

function withArmies(
  state: GameState,
  armies: [string, string, string, ArmyState['units']][],
): GameState {
  return {
    ...state,
    armies: Object.fromEntries(
      armies.map(([id, ownerId, provinceId, units]) => [
        id,
        { id, ownerId, provinceId, units, morale: 100, movesLeft: 1 },
      ]),
    ),
  };
}

const decide = (state: GameState, factionId: string, ai = heuristicAi) =>
  ai.decide({ world: testWorld, state, factionId, random: () => 0 });

const attacks = (commands: ActionCommand[], to: string) =>
  commands.some((c) => c.type === 'moveArmy' && c.to === to);

describe('game settings', () => {
  it('default to normal difficulty without historical mode', () => {
    expect(start().settings).toEqual({
      difficulty: 'normal',
      historicalMode: false,
    });
    expect(start({ difficulty: 'hard' }).settings.difficulty).toBe('hard');
  });

  it('are part of the saved state', () => {
    const state = start({ difficulty: 'easy', historicalMode: true });
    expect(JSON.parse(JSON.stringify(state)).settings).toEqual({
      difficulty: 'easy',
      historicalMode: true,
    });
  });
});

describe('difficulty', () => {
  it('scales only the income of the player', () => {
    // Söğüt 2 akçe getirir.
    expect(incomeOf(testWorld, start(), 'osmanli')).toBe(2);
    expect(incomeOf(testWorld, start({ difficulty: 'easy' }), 'osmanli')).toBe(
      3,
    );
    expect(incomeOf(testWorld, start({ difficulty: 'hard' }), 'osmanli')).toBe(
      2,
    );
    expect(incomeOf(testWorld, start({ difficulty: 'easy' }), 'bizans')).toBe(
      incomeOf(testWorld, start(), 'bizans'),
    );
  });

  it('collects the scaled income at the end of the turn', () => {
    const result = dispatch(
      testWorld,
      start({ difficulty: 'easy' }),
      'osmanli',
      {
        type: 'endTurn',
      },
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.state.factions.osmanli?.treasury).toBe(10 + 3);
  });

  it('makes rivals bolder on hard and more careful on easy', () => {
    // Bizans'ın 1000 sipahisi (saldırı 2000) Söğüt'teki 985 sipahiye (savunma
    // 1379) karşı ≈1,45 güç oranında: normalde (1,6) saldırmaz.
    const fight = (difficulty: GameSettings['difficulty']) =>
      attacks(
        decide(
          withArmies(start({ difficulty }), [
            ['a1', 'osmanli', 'sogut', { sipahi: 985 }],
            ['a2', 'bizans', 'bilecik', { sipahi: 1000 }],
          ]),
          'bizans',
        ),
        'sogut',
      );

    expect(fight('easy')).toBe(false);
    expect(fight('normal')).toBe(false);
    expect(fight('hard')).toBe(true);
  });

  it('lets rivals spend more on soldiers on hard', () => {
    const recruits = (difficulty: GameSettings['difficulty']) =>
      decide(
        withArmies(start({ difficulty }), [
          ['a2', 'bizans', 'bursa', { sipahi: 500 }],
        ]),
        'bizans',
        createHeuristicAi({ recruitShare: 0.4 }),
      ).filter((c) => c.type === 'recruit').length;

    // Bizans geliri 13: normalde bütçe 5 (bir akıncı), zorda 8.
    expect(recruits('hard')).toBeGreaterThan(recruits('easy'));
  });
});

describe('historical mode', () => {
  const quiet = (base: GameState): GameState => ({
    ...base,
    settings: { ...base.settings, historicalMode: true },
  });

  it('keeps rivals from attacking, even a much weaker enemy', () => {
    const state = withArmies(start(), [
      ['a1', 'osmanli', 'sogut', { akinci: 50 }],
      ['a2', 'bizans', 'bilecik', { sipahi: 5000 }],
    ]);
    expect(attacks(decide(state, 'bizans'), 'sogut')).toBe(true);
    expect(attacks(decide(quiet(state), 'bizans'), 'sogut')).toBe(false);
  });

  it('keeps rivals from taking undefended land or starting wars', () => {
    const base = withArmies(start(), [
      ['a2', 'bizans', 'bilecik', { sipahi: 5000 }],
      ['a1', 'osmanli', 'kutahya', { akinci: 10 }],
    ]);
    const atPeace: GameState = quiet({
      ...base,
      diplomacy: {
        ...base.diplomacy,
        relations: { ...base.diplomacy.relations, 'bizans|osmanli': 'peace' },
      },
    });
    const commands = decide(
      atPeace,
      'bizans',
      createHeuristicAi({ warlike: 1 }),
    );
    expect(commands.some((c) => c.type === 'declareWar')).toBe(false);
    expect(
      commands.some(
        (c) =>
          c.type === 'moveArmy' &&
          atPeace.provinces[c.to]?.ownerId !== 'bizans',
      ),
    ).toBe(false);
  });

  it('still lets a losing rival ask for peace', () => {
    const state = quiet(
      withArmies(start(), [
        ['a1', 'osmanli', 'sogut', { sipahi: 5000 }],
        ['a2', 'bizans', 'bilecik', { sipahi: 100 }],
      ]),
    );
    expect(decide(state, 'bizans')).toContainEqual({
      type: 'proposePeace',
      target: 'osmanli',
    });
  });
});
