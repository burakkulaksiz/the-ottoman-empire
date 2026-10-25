import type { ExecuteContext } from '../context';
import { RULES } from '../rules';
import type { ArmyState, FactionId } from '../types';
import { UNIT_DEFS } from '../units';

import type { ActionCommand, CommandError, ValidationArgs } from './types';

type Recruit = Extract<ActionCommand, { type: 'recruit' }>;

export function validateRecruit({
  world,
  state,
  factionId,
  command,
}: ValidationArgs<Recruit>): CommandError | null {
  const province = state.provinces[command.provinceId];
  if (!province || !world.provinces[command.provinceId]) {
    return 'unknownProvince';
  }
  if (province.ownerId !== factionId) return 'notOwner';
  if (province.siege) return 'besieged';

  const def = UNIT_DEFS[command.unit];
  if (!def || def.minYear > state.date.year) return 'unitUnavailable';
  if ((province.recruited ?? 0) >= RULES.recruitOrdersPerProvince) {
    return 'recruitLimit';
  }
  if ((state.factions[factionId]?.treasury ?? 0) < def.cost) {
    return 'notEnoughGold';
  }
  return null;
}

/**
 * Devşirilen askerler bölgedeki kendi ordusuna katılır; ordu yoksa yeni bir
 * ordu kurulur (o tur hareket edemez).
 */
export function executeRecruit(
  { state, emit }: ExecuteContext,
  factionId: FactionId,
  command: Recruit,
) {
  const def = UNIT_DEFS[command.unit];
  const amount = RULES.recruitBatch;

  state.factions[factionId]!.treasury -= def.cost;
  const province = state.provinces[command.provinceId]!;
  province.recruited = (province.recruited ?? 0) + 1;

  const home = Object.values(state.armies)
    .filter(
      (a) => a.ownerId === factionId && a.provinceId === command.provinceId,
    )
    .sort((a, b) => (a.id < b.id ? -1 : 1))[0];

  if (home) {
    home.units[command.unit] = (home.units[command.unit] ?? 0) + amount;
  } else {
    const id = `army-${state.nextId++}`;
    const army: ArmyState = {
      id,
      ownerId: factionId,
      provinceId: command.provinceId,
      units: { [command.unit]: amount },
      morale: RULES.moraleStart,
      movesLeft: 0,
    };
    state.armies[id] = army;
  }

  emit({
    type: 'recruited',
    factionId,
    provinceId: command.provinceId,
    unit: command.unit,
    amount,
    cost: def.cost,
  });
}
