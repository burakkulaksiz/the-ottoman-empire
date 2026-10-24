import type { ExecuteContext } from '../context';
import type { FactionId, GameState, World } from '../types';

import { executeMoveArmy, validateMoveArmy } from './move-army';
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
  }
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
