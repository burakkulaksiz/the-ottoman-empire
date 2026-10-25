import { isWinter } from '../calendar';
import { hostileArmiesIn, resolveBattle } from '../combat';
import type { ExecuteContext } from '../context';
import { relationBetween } from '../diplomacy';
import { occupy } from '../siege';
import type { FactionId } from '../types';
import { areAdjacent } from '../world';

import type { ActionCommand, CommandError, ValidationArgs } from './types';

type MoveArmy = Extract<ActionCommand, { type: 'moveArmy' }>;

export function validateMoveArmy({
  world,
  state,
  factionId,
  command,
}: ValidationArgs<MoveArmy>): CommandError | null {
  const army = state.armies[command.armyId];
  if (!army) return 'unknownArmy';
  if (army.ownerId !== factionId) return 'notOwner';
  if (army.movesLeft <= 0) return 'noMovesLeft';
  if (!world.provinces[command.to]) return 'unknownProvince';
  if (!areAdjacent(world, army.provinceId, command.to)) return 'notAdjacent';
  if (
    isWinter(state.date.season) &&
    state.provinces[command.to]?.ownerId !== factionId
  ) {
    return 'winterQuarters';
  }
  // Barış yaptığın devletin sınırları kapalıdır; müttefikinki açıktır.
  const owner = state.provinces[command.to]?.ownerId;
  if (
    owner &&
    owner !== factionId &&
    relationBetween(state, factionId, owner) === 'peace'
  ) {
    return 'atPeace';
  }
  return null;
}

export function executeMoveArmy(
  context: ExecuteContext,
  factionId: FactionId,
  command: MoveArmy,
) {
  const { state, emit } = context;
  const army = state.armies[command.armyId]!;
  const from = army.provinceId;
  army.provinceId = command.to;
  army.movesLeft -= 1;
  emit({
    type: 'armyMoved',
    factionId,
    armyId: army.id,
    from,
    to: command.to,
  });

  // Düşman ordusu varsa savaş; kazanan (ya da karşısı boş olan) bölgeyi alır.
  const defenders = hostileArmiesIn(state, command.to, factionId);
  if (defenders.length > 0) resolveBattle(context, army, defenders, from);

  const survivor = state.armies[army.id];
  if (survivor?.provinceId === command.to) occupy(context, survivor);
}
