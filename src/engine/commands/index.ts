import type { ExecuteContext } from '../context';
import { executeAppointVizier, validateAppointVizier } from '../court';
import {
  executeDeclareWar,
  executeProposeAlliance,
  executeProposePeace,
  executeRespondOffer,
  validateDeclareWar,
  validateProposeAlliance,
  validateProposePeace,
  validateRespondOffer,
} from '../diplomacy';
import { executeAnswerQuiz, validateAnswerQuiz } from '../quiz';
import type { FactionId, GameState, ProvinceId, World } from '../types';

import { executeMoveArmy, validateMoveArmy } from './move-army';
import { executeRecruit, validateRecruit } from './recruit';
import type { ActionCommand, CommandError } from './types';

export function validateAction(
  world: World,
  state: GameState,
  factionId: FactionId,
  command: ActionCommand,
): CommandError | null {
  if (state.status.phase === 'ended') return 'gameOver';

  switch (command.type) {
    case 'moveArmy':
      return validateMoveArmy({ world, state, factionId, command });
    case 'recruit':
      return validateRecruit({ world, state, factionId, command });
    case 'declareWar':
      return validateDeclareWar({ world, state, factionId, command });
    case 'proposePeace':
      return validateProposePeace({ world, state, factionId, command });
    case 'proposeAlliance':
      return validateProposeAlliance({ world, state, factionId, command });
    case 'respondOffer':
      return validateRespondOffer({ world, state, factionId, command });
    case 'appointVizier':
      return validateAppointVizier({ world, state, factionId, command });
    case 'answerQuiz':
      return validateAnswerQuiz({ world, state, factionId, command });
  }
}

export function executeAction(
  context: ExecuteContext,
  factionId: FactionId,
  command: ActionCommand,
) {
  switch (command.type) {
    case 'moveArmy':
      return executeMoveArmy(context, factionId, command);
    case 'recruit':
      return executeRecruit(context, factionId, command);
    case 'declareWar':
      return executeDeclareWar(context, factionId, command);
    case 'proposePeace':
      return executeProposePeace(context, factionId, command);
    case 'proposeAlliance':
      return executeProposeAlliance(context, factionId, command);
    case 'respondOffer':
      return executeRespondOffer(context, factionId, command);
    case 'appointVizier':
      return executeAppointVizier(context, factionId, command);
    case 'answerQuiz':
      return executeAnswerQuiz(context, factionId, command);
  }
}

/**
 * Ordunun şu an gidebileceği komşu bölgeler (arayüz bunları vurgular).
 * Her aday `moveArmy` doğrulamasından geçirilir, kurallar tek yerde kalır.
 */
export function legalMoves(
  world: World,
  state: GameState,
  armyId: string,
): ProvinceId[] {
  const army = state.armies[armyId];
  if (!army) return [];
  return (world.provinces[army.provinceId]?.neighbors ?? []).filter(
    (to) =>
      validateAction(world, state, army.ownerId, {
        type: 'moveArmy',
        armyId,
        to,
      }) === null,
  );
}

/** Doğrular ve geçerliyse uygular. Yapay zekâ hamleleri bu yoldan geçer. */
export function applyAction(
  context: ExecuteContext,
  factionId: FactionId,
  command: ActionCommand,
): CommandError | null {
  const error = validateAction(
    context.world,
    context.state,
    factionId,
    command,
  );
  if (!error) executeAction(context, factionId, command);
  return error;
}
