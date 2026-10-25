import type {
  ActionCommand,
  CommandError,
  ValidationArgs,
} from './commands/types';
import type { ExecuteContext } from './context';
import { adjustStability } from './court';
import { RULES } from './rules';
import type { FactionId } from './types';

type AnswerQuiz = Extract<ActionCommand, { type: 'answerQuiz' }>;

/**
 * Mini quiz (D5): doğru cevap küçük bir ödül (akçe ve sadakat) getirir,
 * yanlış cevabın cezası yoktur. Her soru bir kez cevaplanır. Doğru cevabı
 * motor bilir (dünya verisi), arayüze güvenilmez.
 */
export function validateAnswerQuiz({
  world,
  state,
  factionId,
  command,
}: ValidationArgs<AnswerQuiz>): CommandError | null {
  if (factionId !== state.playerFactionId) return 'notPlayer';
  if (!world.quizzes?.some((q) => q.id === command.quizId)) {
    return 'unknownQuiz';
  }
  if (state.quizzes && command.quizId in state.quizzes.answered) {
    return 'alreadyAnswered';
  }
  return null;
}

export function executeAnswerQuiz(
  { world, state, emit }: ExecuteContext,
  factionId: FactionId,
  command: AnswerQuiz,
) {
  const quiz = world.quizzes!.find((q) => q.id === command.quizId)!;
  const correct = quiz.answer === command.choice;
  state.quizzes ??= { answered: {} };
  state.quizzes.answered[command.quizId] = correct;

  if (correct) {
    state.factions[factionId]!.treasury += RULES.quizReward;
    adjustStability(state, factionId, RULES.quizStability);
  }
  emit({
    type: 'quizAnswered',
    quizId: command.quizId,
    correct,
    reward: correct ? RULES.quizReward : 0,
  });
}
