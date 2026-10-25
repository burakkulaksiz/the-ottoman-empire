import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame } from '../create-game';
import { dispatch } from '../dispatch';
import { RULES } from '../rules';
import type { World } from '../types';

const world: World = {
  ...testWorld,
  quizzes: [
    { id: 'q1', answer: 2 },
    { id: 'q2', answer: 0 },
  ],
};
const start = () => createGame(testScenario, { seed: 1 });

describe('answerQuiz', () => {
  it('rewards a correct answer with akçe and remembers it', () => {
    const result = dispatch(world, start(), 'osmanli', {
      type: 'answerQuiz',
      quizId: 'q1',
      choice: 2,
    });
    if (!result.ok) throw new Error(result.error);

    expect(result.state.factions.osmanli?.treasury).toBe(10 + RULES.quizReward);
    expect(result.state.quizzes?.answered).toEqual({ q1: true });
    expect(result.log).toEqual([
      {
        type: 'quizAnswered',
        quizId: 'q1',
        correct: true,
        reward: RULES.quizReward,
        turn: 1,
      },
    ]);
  });

  it('does not punish a wrong answer', () => {
    const result = dispatch(world, start(), 'osmanli', {
      type: 'answerQuiz',
      quizId: 'q1',
      choice: 0,
    });
    if (!result.ok) throw new Error(result.error);

    expect(result.state.factions.osmanli?.treasury).toBe(10);
    expect(result.state.quizzes?.answered).toEqual({ q1: false });
  });

  it('accepts each question once, only from the player', () => {
    const first = dispatch(world, start(), 'osmanli', {
      type: 'answerQuiz',
      quizId: 'q2',
      choice: 1,
    });
    if (!first.ok) throw new Error(first.error);

    expect(
      dispatch(world, first.state, 'osmanli', {
        type: 'answerQuiz',
        quizId: 'q2',
        choice: 0,
      }),
    ).toEqual({ ok: false, error: 'alreadyAnswered' });
    expect(
      dispatch(world, start(), 'osmanli', {
        type: 'answerQuiz',
        quizId: 'yok',
        choice: 0,
      }),
    ).toEqual({ ok: false, error: 'unknownQuiz' });
    expect(
      dispatch(world, start(), 'bizans', {
        type: 'answerQuiz',
        quizId: 'q1',
        choice: 2,
      }),
    ).toEqual({ ok: false, error: 'notPlayer' });
  });

  it('works for saves made before quizzes existed', () => {
    const { quizzes: _none, ...old } = start();
    const result = dispatch(world, old, 'osmanli', {
      type: 'answerQuiz',
      quizId: 'q1',
      choice: 2,
    });
    expect(result.ok && result.state.quizzes?.answered).toEqual({ q1: true });
  });
});
