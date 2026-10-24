import type { ExecuteContext } from '../context';
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
  return null;
}

export function executeMoveArmy(
  { state, emit }: ExecuteContext,
  factionId: FactionId,
  command: MoveArmy,
) {
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
}
