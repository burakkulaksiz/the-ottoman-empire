import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import type { AiController } from '../ai';
import type { Command } from '../commands/types';
import { createGame } from '../create-game';
import { dispatch, type EngineOptions } from '../dispatch';
import type { GameState } from '../types';

const newGame = () => createGame(testScenario, { seed: 1299 });

function run(
  state: GameState,
  command: Command,
  options?: EngineOptions,
  factionId = state.playerFactionId,
) {
  const result = dispatch(testWorld, state, factionId, command, options);
  if (!result.ok) throw new Error(`Unexpected error: ${result.error}`);
  return result;
}

/** Her ordusunu rastgele bir komşuya yürüten yapay zekâ. */
const wanderingAi: AiController = {
  decide: ({ world, state, factionId, random }) =>
    Object.values(state.armies)
      .filter((army) => army.ownerId === factionId)
      .map((army) => {
        const neighbors = world.provinces[army.provinceId]!.neighbors;
        const to = neighbors[Math.floor(random() * neighbors.length)]!;
        return { type: 'moveArmy', armyId: army.id, to };
      }),
};

describe('moveArmy', () => {
  it('moves an army to an adjacent province without mutating the input', () => {
    const state = newGame();
    const { state: next, log } = run(state, {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'bilecik',
    });

    expect(next.armies['army-1']).toMatchObject({
      provinceId: 'bilecik',
      movesLeft: 0,
    });
    expect(state.armies['army-1']?.provinceId).toBe('sogut');
    expect(log).toEqual([
      {
        type: 'armyMoved',
        factionId: 'osmanli',
        armyId: 'army-1',
        from: 'sogut',
        to: 'bilecik',
        turn: 1,
      },
    ]);
  });

  it.each([
    [{ armyId: 'army-9', to: 'bilecik' }, 'unknownArmy'],
    [{ armyId: 'army-2', to: 'bilecik' }, 'notOwner'],
    [{ armyId: 'army-1', to: 'iznik' }, 'unknownProvince'],
    [{ armyId: 'army-1', to: 'bursa' }, 'notAdjacent'],
  ] as const)('rejects %o with %s', (args, error) => {
    const result = dispatch(testWorld, newGame(), 'osmanli', {
      type: 'moveArmy',
      ...args,
    });
    expect(result).toEqual({ ok: false, error });
  });

  it('allows only one move per turn', () => {
    const { state } = run(newGame(), {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'bilecik',
    });
    const result = dispatch(testWorld, state, 'osmanli', {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'bursa',
    });

    expect(result).toEqual({ ok: false, error: 'noMovesLeft' });
  });
});

describe('endTurn', () => {
  it('advances the calendar, restores moves and collects income', () => {
    const moved = run(newGame(), {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'bilecik',
    }).state;
    const { state, log } = run(moved, { type: 'endTurn' });

    expect(state.turn).toBe(2);
    expect(state.date).toEqual({ year: 1300, season: 'summer' });
    expect(state.armies['army-1']?.movesLeft).toBe(1);
    expect(state.factions.osmanli?.treasury).toBe(10 + 2);
    expect(state.factions.bizans?.treasury).toBe(50 + 3 + 2 + 8);
    expect(log.map((entry) => entry.type)).toEqual([
      'turnStarted',
      'incomeCollected',
      'incomeCollected',
      'incomeCollected',
    ]);
  });

  it('only lets the player end the turn', () => {
    expect(
      dispatch(testWorld, newGame(), 'bizans', { type: 'endTurn' }),
    ).toEqual({ ok: false, error: 'notPlayer' });
  });

  it('lets AI factions act with their own armies only', () => {
    const { state } = run(newGame(), { type: 'endTurn' }, { ai: wanderingAi });

    expect(state.armies['army-1']?.provinceId).toBe('sogut');
    expect(state.armies['army-2']?.provinceId).not.toBe('bursa');
    expect(state.armies['army-3']?.provinceId).toBe('sogut');
  });

  it('is deterministic for the same seed and commands', () => {
    const play = () => {
      let state = newGame();
      for (let i = 0; i < 8; i++) {
        state = run(state, { type: 'endTurn' }, { ai: wanderingAi }).state;
      }
      return state;
    };

    expect(play()).toEqual(play());
  });

  it('ends in defeat when the player has nothing left', () => {
    const state: GameState = {
      ...newGame(),
      provinces: {
        ...newGame().provinces,
        sogut: { id: 'sogut', ownerId: 'germiyan' },
      },
      armies: { 'army-2': newGame().armies['army-2']! },
    };
    const { state: next, log } = run(state, { type: 'endTurn' });

    expect(next.status).toEqual({
      phase: 'ended',
      result: 'defeat',
      reason: 'eliminated',
    });
    expect(log.slice(-2).map((entry) => entry.type)).toEqual([
      'factionEliminated',
      'gameEnded',
    ]);
    expect(dispatch(testWorld, next, 'osmanli', { type: 'endTurn' })).toEqual({
      ok: false,
      error: 'gameOver',
    });
  });

  it('ends in victory when the player is the last one standing', () => {
    const base = newGame();
    const state: GameState = {
      ...base,
      provinces: Object.fromEntries(
        Object.keys(base.provinces).map((id) => [
          id,
          { id, ownerId: 'osmanli' },
        ]),
      ),
      armies: { 'army-1': base.armies['army-1']! },
    };
    const { state: next } = run(state, { type: 'endTurn' });

    expect(next.status).toEqual({
      phase: 'ended',
      result: 'victory',
      reason: 'lastStanding',
    });
  });
});
