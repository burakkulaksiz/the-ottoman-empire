import { compareDates } from './calendar';
import type { CommandError } from './commands/types';
import type { ExecuteContext } from './context';
import { RULES } from './rules';
import type { EventTrigger, FactionId, GameState, World } from './types';

function isTriggered(trigger: EventTrigger, state: GameState): boolean {
  switch (trigger.type) {
    case 'date':
      return compareDates(state.date, trigger.date) >= 0;
    case 'ownsProvince':
      return (
        state.provinces[trigger.provinceId]?.ownerId === state.playerFactionId
      );
  }
}

export function validateChooseEvent(
  world: World,
  state: GameState,
  factionId: FactionId,
  eventId: string,
  choiceId: string,
): CommandError | null {
  if (state.status.phase === 'ended') return 'gameOver';
  if (factionId !== state.playerFactionId) return 'notPlayer';
  if (!state.events.pending.includes(eventId)) return 'noSuchPendingEvent';
  const event = world.events?.find((e) => e.id === eventId);
  if (!event?.choices.some((c) => c.id === choiceId)) return 'unknownChoice';
  return null;
}

export function executeChooseEvent(
  { world, state, emit }: ExecuteContext,
  eventId: string,
  choiceId: string,
) {
  const choice = world.events
    ?.find((e) => e.id === eventId)
    ?.choices.find((c) => c.id === choiceId);

  for (const effect of choice?.effects ?? []) {
    switch (effect.type) {
      case 'treasury': {
        const faction = state.factions[state.playerFactionId]!;
        faction.treasury = Math.max(0, faction.treasury + effect.amount);
        break;
      }
      case 'morale':
        for (const army of Object.values(state.armies)) {
          if (army.ownerId !== state.playerFactionId) continue;
          army.morale = Math.max(
            0,
            Math.min(RULES.moraleMax, army.morale + effect.amount),
          );
        }
        break;
    }
  }

  state.events.pending = state.events.pending.filter((id) => id !== eventId);
  state.events.choices[eventId] = choiceId;
  emit({ type: 'eventResolved', eventId, choiceId });
}

/** Tur aşaması: koşulu gerçekleşen olay kartlarını oyuncunun önüne koyar. */
export function triggerEvents({ world, state, emit }: ExecuteContext) {
  if (state.status.phase === 'ended') return;

  for (const event of world.events ?? []) {
    if (state.events.fired.includes(event.id)) continue;
    if (!isTriggered(event.trigger, state)) continue;
    state.events.fired.push(event.id);
    state.events.pending.push(event.id);
    emit({ type: 'eventTriggered', eventId: event.id });
  }
}
