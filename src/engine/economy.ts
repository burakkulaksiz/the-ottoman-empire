import { validateAction } from './commands';
import type { CommandError } from './commands/types';
import { RULES } from './rules';
import type { FactionId, GameState, ProvinceId, World } from './types';
import { UNIT_DEFS, UNIT_TYPES, unitEntries, type UnitType } from './units';

/**
 * Bir devletin bu tur beklenen geliri (bölgelerinin vergisi). Oyuncunun geliri
 * zorluğa göre çarpılır (C10).
 */
export function incomeOf(
  world: World,
  state: GameState,
  factionId: FactionId,
): number {
  const base = Object.values(state.provinces)
    .filter((p) => p.ownerId === factionId)
    .reduce((sum, p) => sum + (world.provinces[p.id]?.baseTax ?? 0), 0);
  if (factionId !== state.playerFactionId) return base;
  return Math.round(
    base * RULES.difficulty[state.settings.difficulty].playerIncome,
  );
}

/** Bir devletin ordularının tur başına maaş gideri (kapıkulu nakit maaşı). */
export function upkeepOf(state: GameState, factionId: FactionId): number {
  let total = 0;
  for (const army of Object.values(state.armies)) {
    if (army.ownerId !== factionId) continue;
    for (const [type, count] of unitEntries(army.units)) {
      total += Math.ceil((count / RULES.recruitBatch) * UNIT_DEFS[type].upkeep);
    }
  }
  return total;
}

export interface RecruitOption {
  unit: UnitType;
  cost: number;
  /** Devşirilemiyorsa nedeni; devşirilebiliyorsa `null`. */
  error: CommandError | null;
}

/**
 * Bir bölgede devşirilebilecek birlikler (arayüz düğmeleri için). Henüz
 * açılmamış birlikler listede yoktur; diğerleri neden yapılamadığını taşır.
 */
export function recruitOptions(
  world: World,
  state: GameState,
  factionId: FactionId,
  provinceId: ProvinceId,
): RecruitOption[] {
  return UNIT_TYPES.filter(
    (unit) => UNIT_DEFS[unit].minYear <= state.date.year,
  ).map((unit) => ({
    unit,
    cost: UNIT_DEFS[unit].cost,
    error: validateAction(world, state, factionId, {
      type: 'recruit',
      provinceId,
      unit,
    }),
  }));
}
