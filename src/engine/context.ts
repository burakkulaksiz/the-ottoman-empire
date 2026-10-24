import type { Draft } from 'immer';

import type { AiController } from './ai';
import type { GameState, LogPayload, World } from './types';

/** Komutların ve tur aşamalarının durumu değiştirirken kullandığı bağlam. */
export interface ExecuteContext {
  world: World;
  state: Draft<GameState>;
  ai: AiController;
  emit(payload: LogPayload): void;
}
