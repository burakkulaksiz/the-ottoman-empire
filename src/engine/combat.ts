import type { Draft } from 'immer';

import type { ExecuteContext } from './context';
import { random } from './rng';
import { moraleFactor, RULES } from './rules';
import type { ArmyState, FactionId, GameState, ProvinceId } from './types';
import { armySize, scaleUnits, UNIT_DEFS, unitEntries } from './units';

type Army = Draft<ArmyState>;

/**
 * Bir bölgedeki, verilen devlete düşman ordular (id sırasıyla, deterministik).
 * Diplomasi (C7) gelene kadar farklı her devlet düşmandır.
 */
export function hostileArmiesIn(
  state: Draft<GameState> | GameState,
  provinceId: ProvinceId,
  factionId: FactionId,
): Army[] {
  return Object.values(state.armies as Record<string, Army>)
    .filter((a) => a.provinceId === provinceId && a.ownerId !== factionId)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

function power(armies: Army[], kind: 'attack' | 'defense'): number {
  let total = 0;
  for (const army of armies) {
    const factor = moraleFactor(army.morale);
    for (const [type, count] of unitEntries(army.units)) {
      total += count * UNIT_DEFS[type][kind] * factor;
    }
  }
  return total;
}

/** 1 ± `battleLuck` aralığında tohumlu zar. */
function luck(state: Draft<GameState>): number {
  return 1 + (random(state) * 2 - 1) * RULES.battleLuck;
}

function removeArmy({ state, emit }: ExecuteContext, army: Army) {
  delete state.armies[army.id];
  emit({ type: 'armyDestroyed', armyId: army.id, factionId: army.ownerId });
}

/** Yenilen savunmacı için komşu bölge seçer; yoksa `null` (ordu dağılır). */
function retreatDestination(
  { world, state }: ExecuteContext,
  army: Army,
): ProvinceId | null {
  const options = world.provinces[army.provinceId]!.neighbors.filter(
    (id) => hostileArmiesIn(state, id, army.ownerId).length === 0,
  );
  const own = options.find(
    (id) => state.provinces[id]?.ownerId === army.ownerId,
  );
  return own ?? options[0] ?? null;
}

function applyLosses(armies: Army[], lossRate: number) {
  const before = armies.reduce((sum, a) => sum + armySize(a.units), 0);
  for (const army of armies) {
    army.units = scaleUnits(army.units, 1 - lossRate);
  }
  const after = armies.reduce((sum, a) => sum + armySize(a.units), 0);
  return before - after;
}

/**
 * Otomatik, olasılık tabanlı savaş (C5). Saldıran `attacker` bölgeye girmiş,
 * `defenders` oradaki düşman ordulardır (hepsi tek savunma hattı sayılır).
 * Kaybeden taraf geri çekilir ya da dağılır; kazanan bölgede kalır.
 *
 * @param origin Saldıranın geldiği bölge (yenilirse buraya çekilir).
 */
export function resolveBattle(
  context: ExecuteContext,
  attacker: Army,
  defenders: Army[],
  origin: ProvinceId,
) {
  const { world, state, emit } = context;
  const provinceId = attacker.provinceId;
  const province = world.provinces[provinceId]!;
  const defenderId = defenders[0]!.ownerId;

  const terrain = RULES.terrainDefense[province.terrain ?? 'plain'];
  const ownsProvince = state.provinces[provinceId]?.ownerId === defenderId;
  const fort = ownsProvince
    ? 1 + (province.fortification ?? 0) * RULES.fortificationDefense
    : 1;

  const attackPower = power([attacker], 'attack') * luck(state);
  const defensePower =
    power(defenders, 'defense') * terrain * fort * luck(state);

  const attackerWins = attackPower > defensePower;
  const strongest = Math.max(attackPower, defensePower);
  const ratio =
    strongest === 0 ? 1 : Math.min(attackPower, defensePower) / strongest;
  const loserRate = Math.min(
    0.95,
    RULES.loserLossBase + (1 - ratio) * RULES.loserLossSpread,
  );
  const winnerRate = RULES.winnerLossMax * ratio;

  const attackerLosses = applyLosses(
    [attacker],
    attackerWins ? winnerRate : loserRate,
  );
  const defenderLosses = applyLosses(
    defenders,
    attackerWins ? loserRate : winnerRate,
  );

  const winners = attackerWins ? [attacker] : defenders;
  const losers = attackerWins ? defenders : [attacker];
  for (const army of winners) {
    army.morale = Math.min(RULES.moraleMax, army.morale + RULES.moraleWinGain);
  }
  for (const army of losers) {
    army.morale = Math.max(0, army.morale - RULES.moraleLossPenalty);
  }

  emit({
    type: 'battleFought',
    provinceId,
    attackerId: attacker.ownerId,
    defenderId,
    winnerId: attackerWins ? attacker.ownerId : defenderId,
    attackerLosses,
    defenderLosses,
  });

  // Dağılan ordular, sonra geri çekilenler.
  for (const army of [attacker, ...defenders]) {
    if (armySize(army.units) === 0) removeArmy(context, army);
  }
  for (const army of losers) {
    if (!state.armies[army.id]) continue;
    const to = attackerWins ? retreatDestination(context, army) : origin;
    if (to === null) {
      removeArmy(context, army);
      continue;
    }
    emit({ type: 'armyRetreated', armyId: army.id, from: provinceId, to });
    army.provinceId = to;
  }
}
