import type { AiContext, AiController } from './ai';
import { battleOdds, hostileArmiesIn } from './combat';
import { legalMoves } from './commands';
import type { ActionCommand } from './commands/types';
import { incomeOf, upkeepOf } from './economy';
import { RULES } from './rules';
import type {
  ArmyState,
  FactionId,
  GameState,
  ProvinceId,
  World,
} from './types';
import { UNIT_DEFS, UNIT_TYPES, type UnitType } from './units';

export interface HeuristicAiOptions {
  /**
   * Saldırı için gereken en düşük güç oranı (saldıran / savunan). Düşük değer
   * daha atak, yüksek değer daha temkinli yapay zekâ demektir (C10).
   */
  aggression?: number;
  /**
   * Tur gelirinin ne kadarı devşirmeye harcanır (0–1). Yapay zekâ hazinesini
   * tüketmeden orduyu yavaş yavaş büyütür (C10'da zorluğa göre ayarlanır).
   */
  recruitShare?: number;
}

/** Skorlar: büyük olan seçilir; "olduğu yerde kal" 0 sayılır. */
const SCORE = {
  /** Savunmasız düşman bölgesini almanın tabanı. */
  capture: 4,
  /** Kaleli bölge kuşatma gerektirir. */
  fortDiscount: 1.5,
  /** Kazanılacak savaşın güç oranı fazlasının ağırlığı. */
  winMargin: 3,
  /** Sınıra (ele geçirilecek yere) bir adım yaklaşmak. */
  approach: 0.6,
  /** Düşman ordusunun hemen yanında kalmak bölgeyi korur. */
  guard: 2.5,
  /** Kışta yabancı toprakta kalmak yerine eve dönmek. */
  winterHome: 6,
  /** Çok daha güçlü bir ordunun yanına gitmenin cezası. */
  danger: 3,
  jitter: 0.05,
} as const;

/**
 * Bir devletin "hedef" saydığı bölgelere uzaklıklar: başka bir devletin
 * toprakları. Sahipsiz bölgeler (henüz modellenmemiş devletlerin toprağı)
 * hedef değildir; yapay zekâ oralara yayılmaz.
 */
function distancesToTargets(
  world: World,
  state: GameState,
  factionId: FactionId,
): Map<ProvinceId, number> {
  const dist = new Map<ProvinceId, number>();
  const queue: ProvinceId[] = [];
  for (const province of Object.values(state.provinces)) {
    if (province.ownerId !== null && province.ownerId !== factionId) {
      dist.set(province.id, 0);
      queue.push(province.id);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head]!;
    const d = dist.get(id)!;
    for (const next of world.provinces[id]?.neighbors ?? []) {
      if (!dist.has(next)) {
        dist.set(next, d + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}

function enemyThreat(
  world: World,
  state: GameState,
  provinceId: ProvinceId,
  factionId: FactionId,
): ArmyState[] {
  return (world.provinces[provinceId]?.neighbors ?? []).flatMap((id) =>
    hostileArmiesIn(state, id, factionId),
  );
}

function scoreMove(
  { world, state, factionId }: AiContext,
  army: ArmyState,
  to: ProvinceId,
  dist: Map<ProvinceId, number>,
  aggression: number,
): number {
  const province = state.provinces[to]!;
  const fort = world.provinces[to]?.fortification ?? 0;
  const defenders = hostileArmiesIn(state, to, factionId);
  const mine = province.ownerId === factionId;
  let score = 0;

  if (defenders.length > 0) {
    const odds = battleOdds(world, state, [army], defenders, to);
    const ratio = odds.defense === 0 ? Infinity : odds.attack / odds.defense;
    if (ratio < aggression) return -Infinity;
    score += SCORE.winMargin * Math.min(ratio - aggression, 2);
    if (!mine) score += SCORE.capture;
  } else if (province.ownerId === null) {
    return -Infinity;
  } else if (!mine) {
    score += SCORE.capture;
    if (fort > 0) score -= SCORE.fortDiscount;
  } else if (!(state.provinces[army.provinceId]?.ownerId === factionId)) {
    // Yabancı topraktaki ordu eve dönebiliyorsa bu bir kazançtır.
    score += SCORE.winterHome / 2;
  }

  // Frontta ilerlemek: hedefe bir adım yaklaş.
  const here = dist.get(army.provinceId) ?? 0;
  const there = dist.get(to) ?? 0;
  score += SCORE.approach * (here - there);

  // Çok güçlü bir ordunun yanında yalnız kalma.
  const threat = enemyThreat(world, state, to, factionId).filter(
    (a) => !defenders.includes(a),
  );
  if (threat.length > 0 && mine === false && defenders.length === 0) {
    const odds = battleOdds(world, state, threat, [army], to);
    if (odds.attack > odds.defense * 2) score -= SCORE.danger;
  }
  return score;
}

function scoreStay(
  { world, state, factionId }: AiContext,
  army: ArmyState,
): number {
  const home = state.provinces[army.provinceId]?.ownerId === factionId;
  const winter = state.date.season === 'winter';
  let score = 0;

  if (!home && winter) score -= SCORE.winterHome;
  if (
    home &&
    enemyThreat(world, state, army.provinceId, factionId).length > 0
  ) {
    score += SCORE.guard;
  }
  return score;
}

/**
 * Basit sezgisel yapay zekâ (C9): her ordu için komşu bölgeleri puanlar —
 * savunmasız toprağı alır, kazanabileceği savaşa girer, zayıf kalacağı
 * savaştan kaçınır, kışın eve döner, aksi hâlde hedefe doğru ilerler.
 */
/**
 * Devşirme planı (C6): bütçe tur gelirinin `recruitShare` oranıdır. En güçlü
 * (saldırı + savunma) uygun birlik seçilir; maaşı gelirle ödenemeyecek birlik
 * seçilmez. Önce düşman sınırındaki ve ordusu olan bölgeler güçlendirilir.
 */
function planRecruitment(
  { world, state, factionId }: AiContext,
  recruitShare: number,
): ActionCommand[] {
  const faction = state.factions[factionId];
  if (!faction) return [];

  const income = incomeOf(world, state, factionId);
  const upkeep = upkeepOf(state, factionId);
  let budget = Math.min(faction.treasury, Math.floor(income * recruitShare));
  let freeUpkeep = income - upkeep;

  const owned = Object.values(state.provinces)
    .filter((p) => p.ownerId === factionId && !p.siege)
    .map((p) => p.id);
  const isFrontier = (id: ProvinceId) =>
    (world.provinces[id]?.neighbors ?? []).some((n) => {
      const owner = state.provinces[n]?.ownerId;
      return owner !== null && owner !== factionId;
    });
  const hasArmy = (id: ProvinceId) =>
    Object.values(state.armies).some(
      (a) => a.ownerId === factionId && a.provinceId === id,
    );
  const ranked = owned
    .map((id) => ({
      id,
      priority: (isFrontier(id) ? 2 : 0) + (hasArmy(id) ? 1 : 0),
    }))
    .sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
  if (ranked.length === 0 || ranked[0]!.priority === 0) return [];

  const commands: ActionCommand[] = [];
  const orders = new Map<ProvinceId, number>();
  const target = ranked[0]!.id;

  for (;;) {
    const recruited =
      (state.provinces[target]?.recruited ?? 0) + (orders.get(target) ?? 0);
    if (recruited >= RULES.recruitOrdersPerProvince) break;

    const unit = bestAffordableUnit(state.date.year, budget, freeUpkeep);
    if (!unit) break;
    commands.push({ type: 'recruit', provinceId: target, unit });
    orders.set(target, (orders.get(target) ?? 0) + 1);
    budget -= UNIT_DEFS[unit].cost;
    freeUpkeep -= UNIT_DEFS[unit].upkeep;
  }
  return commands;
}

function bestAffordableUnit(
  year: number,
  budget: number,
  freeUpkeep: number,
): UnitType | null {
  let best: UnitType | null = null;
  for (const unit of UNIT_TYPES) {
    const def = UNIT_DEFS[unit];
    if (def.minYear > year || def.cost > budget || def.upkeep > freeUpkeep) {
      continue;
    }
    const power = def.attack + def.defense;
    if (!best || power > UNIT_DEFS[best].attack + UNIT_DEFS[best].defense) {
      best = unit;
    }
  }
  return best;
}

export function createHeuristicAi(
  options: HeuristicAiOptions = {},
): AiController {
  const defaults = {
    aggression: options.aggression ?? 1.6,
    recruitShare: options.recruitShare ?? 0.3,
  };

  return {
    decide(context) {
      const { world, state, factionId, random } = context;
      // Devletin kendi kişiliği (senaryodan) varsayılanı ezer.
      const personality = world.factions[factionId]?.ai;
      const aggression = personality?.aggression ?? defaults.aggression;
      const recruitShare = personality?.recruitShare ?? defaults.recruitShare;
      const dist = distancesToTargets(world, state, factionId);
      const commands: ActionCommand[] = [];

      const armies = Object.values(state.armies)
        .filter((a) => a.ownerId === factionId && a.movesLeft > 0)
        .sort((a, b) => (a.id < b.id ? -1 : 1));

      for (const army of armies) {
        let best: { to: ProvinceId; score: number } | null = null;
        for (const to of legalMoves(world, state, army.id)) {
          const score =
            scoreMove(context, army, to, dist, aggression) +
            random() * SCORE.jitter;
          if (score > (best?.score ?? -Infinity)) best = { to, score };
        }
        if (best && best.score > scoreStay(context, army)) {
          commands.push({ type: 'moveArmy', armyId: army.id, to: best.to });
        }
      }
      commands.push(...planRecruitment(context, recruitShare));
      return commands;
    },
  };
}

export const heuristicAi = createHeuristicAi();
