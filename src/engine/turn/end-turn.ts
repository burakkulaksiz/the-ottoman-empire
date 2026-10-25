import { current } from 'immer';

import { applyAction } from '../commands';
import type { CommandError } from '../commands/types';
import type { ExecuteContext } from '../context';
import { random } from '../rng';
import type { FactionId, GameState } from '../types';

import { TURN_PHASES } from './phases';

export function validateEndTurn(
  state: GameState,
  factionId: FactionId,
): CommandError | null {
  if (state.status.phase === 'ended') return 'gameOver';
  if (factionId !== state.playerFactionId) return 'notPlayer';
  if (state.events.pending.length > 0) return 'eventPending';
  return null;
}

/** Oyuncu turu bitirince: önce rakipler hamle yapar, sonra tur aşamaları çalışır. */
export function executeEndTurn(context: ExecuteContext) {
  const { world, state, ai } = context;

  // Cevaplanmamış teklifler tur sonunda geçersiz olur.
  state.diplomacy.offers = [];

  for (const faction of Object.values(state.factions)) {
    if (!faction.alive || faction.id === state.playerFactionId) continue;

    const commands = ai.decide({
      world,
      state: current(state),
      factionId: faction.id,
      random: () => random(state),
    });
    // Geçersiz yapay zekâ emirleri sessizce atlanır.
    for (const command of commands) {
      applyAction(context, faction.id, command);
    }
  }

  for (const phase of TURN_PHASES) {
    phase(context);
  }
}
