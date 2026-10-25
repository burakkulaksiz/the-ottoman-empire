import { produce } from 'immer';

import { passiveAi, type AiController } from './ai';
import { executeAction, validateAction } from './commands';
import type { Command, CommandError } from './commands/types';
import type { ExecuteContext } from './context';
import { executeChooseEvent, validateChooseEvent } from './events';
import { executeEndTurn, validateEndTurn } from './turn/end-turn';
import type { FactionId, GameState, LogEntry, World } from './types';

export interface EngineOptions {
  ai?: AiController;
}

export type DispatchResult =
  | { ok: true; state: GameState; log: LogEntry[] }
  | { ok: false; error: CommandError };

function validate(
  world: World,
  state: GameState,
  factionId: FactionId,
  command: Command,
): CommandError | null {
  switch (command.type) {
    case 'endTurn':
      return validateEndTurn(state, factionId);
    case 'chooseEvent':
      return validateChooseEvent(
        world,
        state,
        factionId,
        command.eventId,
        command.choiceId,
      );
    default:
      return validateAction(world, state, factionId, command);
  }
}

/**
 * Motorun tek giriş noktası: bir komutu doğrular, uygular ve yeni durumu
 * döndürür. Verilen `state` hiçbir zaman değiştirilmez.
 */
export function dispatch(
  world: World,
  state: GameState,
  factionId: FactionId,
  command: Command,
  options: EngineOptions = {},
): DispatchResult {
  const error = validate(world, state, factionId, command);
  if (error) return { ok: false, error };

  const log: LogEntry[] = [];
  const next = produce(state, (draft) => {
    const context: ExecuteContext = {
      world,
      state: draft,
      ai: options.ai ?? passiveAi,
      emit(payload) {
        const entry = { ...payload, turn: draft.turn };
        draft.log.push(entry);
        log.push(entry);
      },
    };

    switch (command.type) {
      case 'endTurn':
        return executeEndTurn(context);
      case 'chooseEvent':
        return executeChooseEvent(context, command.eventId, command.choiceId);
      default:
        return executeAction(context, factionId, command);
    }
  });

  return { ok: true, state: next, log };
}
