import { compareDates } from './calendar';
import { RULES } from './rules';
import type {
  FactionId,
  GameState,
  HistoricalScore,
  Objective,
  World,
} from './types';

export interface ObjectiveProgress {
  id: string;
  done: boolean;
  current: number;
  target: number;
}

export function countProvinces(state: GameState, factionId: FactionId) {
  return Object.values(state.provinces).filter((p) => p.ownerId === factionId)
    .length;
}

function progressOf(
  objective: Objective,
  state: GameState,
  factionId: FactionId,
): ObjectiveProgress {
  const current =
    objective.type === 'holdProvinces'
      ? objective.provinces.filter(
          (id) => state.provinces[id]?.ownerId === factionId,
        ).length
      : countProvinces(state, factionId);
  const target =
    objective.type === 'holdProvinces'
      ? objective.provinces.length
      : objective.count;
  return { id: objective.id, done: current >= target, current, target };
}

/** Oyuncunun hedeflerindeki ilerleme; arayüz de bunu gösterir. */
export function objectiveProgress(
  world: World,
  state: GameState,
): ObjectiveProgress[] {
  return (world.objectives ?? []).map((objective) =>
    progressOf(objective, state, state.playerFactionId),
  );
}

export function allObjectivesMet(world: World, state: GameState) {
  const progress = objectiveProgress(world, state);
  return progress.length > 0 && progress.every((p) => p.done);
}

export function isTimeUp(world: World, state: GameState) {
  return (
    world.endDate !== undefined && compareDates(state.date, world.endDate) >= 0
  );
}

/** Oyuncunun bölge sayısını tarihî sonuçla kıyaslar; veri yoksa `undefined`. */
export function historicalScore(
  world: World,
  state: GameState,
): HistoricalScore | undefined {
  const benchmark = world.historical?.provinces.length;
  if (!benchmark) return undefined;

  const provinces = countProvinces(state, state.playerFactionId);
  const ratio = provinces / benchmark;
  const verdict =
    ratio > 1 + RULES.historicalTolerance
      ? 'better'
      : ratio < 1 - RULES.historicalTolerance
        ? 'worse'
        : 'same';
  return { provinces, benchmark, points: Math.round(ratio * 100), verdict };
}
