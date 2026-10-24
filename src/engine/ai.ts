import type { ActionCommand } from './commands/types';
import type { FactionId, GameState, World } from './types';

export interface AiContext {
  world: World;
  state: GameState;
  factionId: FactionId;
  /**
   * Oyunun tohumlu RNG'sinden sayı çeker. Yapay zekâ `Math.random` yerine
   * bunu kullanmalı, yoksa oyun deterministik olmaz.
   */
  random: () => number;
}

export interface AiController {
  decide(context: AiContext): ActionCommand[];
}

/** Hiçbir şey yapmayan yapay zekâ; gerçek yapay zekâ C9'da gelecek. */
export const passiveAi: AiController = {
  decide: () => [],
};
