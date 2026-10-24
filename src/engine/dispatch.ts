import { produce } from 'immer';

import { passiveAi, type AiController } from './ai';
import { executeAction, validateAction } from './commands';
import type { Command, CommandError } from './commands/types';
import type { ExecuteContext } from './context';
import { executeEndTurn, validateEndTurn } from './turn/end-turn';
import type { FactionId, GameState, LogEntry, World } from './types';

export interface EngineOptions {
  ai?: AiController;
}

export type DispatchResult =
  | { ok: true; state: GameState; log: LogEntry[] }
  | { ok: false; error: CommandError };

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
  const error =
    command.type === 'endTurn'
      ? validateEndTurn(state, factionId)
      : validateAction(world, state, factionId, command);
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

    if (command.type === 'endTurn') {
      executeEndTurn(context);
    } else {
      executeAction(context, factionId, command);
    }
  });

  return { ok: true, state: next, log };
}
