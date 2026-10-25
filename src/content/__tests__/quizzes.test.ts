import { createGame, type GameState } from '@/engine';

import { getEntry } from '../encyclopedia/entries';
import { nextQuiz, QUIZZES, quizAnswers } from '../quizzes';
import { loadScenario } from '../scenarios';

describe('quizzes', () => {
  it('have unique ids, a valid answer and an encyclopedia entry', () => {
    const ids = QUIZZES.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const quiz of QUIZZES) {
      expect(quiz.options.length, quiz.id).toBeGreaterThanOrEqual(2);
      expect(quiz.answer).toBeGreaterThanOrEqual(0);
      expect(quiz.answer).toBeLessThan(quiz.options.length);
      expect(getEntry(quiz.entryId), quiz.id).toBeDefined();
    }
  });

  it('give the engine only ids and answers', () => {
    expect(quizAnswers()[0]).toEqual({ id: 'kurucu', answer: 2 });
    expect(loadScenario('kurulus-1299').world.quizzes).toEqual(quizAnswers());
  });

  describe('nextQuiz', () => {
    const start = (): GameState =>
      createGame(loadScenario('kurulus-1299'), { seed: 1 });

    it('asks the first unanswered question', () => {
      expect(nextQuiz(start())?.id).toBe('kurucu');
      const state: GameState = {
        ...start(),
        quizzes: { answered: { kurucu: true, timar: false } },
      };
      expect(nextQuiz(state)?.id).toBe('akinci');
    });

    it('does not ask about events the game has not reached yet', () => {
      const allButLate = Object.fromEntries(
        QUIZZES.filter((q) => !q.minYear).map((q) => [q.id, true]),
      );
      const early: GameState = {
        ...start(),
        quizzes: { answered: allButLate },
      };
      expect(nextQuiz(early)).toBeUndefined();

      const later: GameState = {
        ...early,
        date: { year: 1302, season: 'spring' },
      };
      expect(nextQuiz(later)?.id).toBe('koyunhisar');
    });
  });
});
