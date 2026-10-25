import { compareDates, type GameDate } from './calendar';
import { RULES } from './rules';
import type {
  ArmyState,
  FactionId,
  FactionState,
  GameState,
  ProvinceId,
  ProvinceState,
  World,
} from './types';
import { armySize, UNIT_DEFS, unitEntries, type Units } from './units';
import { validateWorld } from './world';

/** Bir senaryonun başlangıç anı. İçerik katmanı (C2) bunu üretecek. */
export interface ScenarioSetup {
  id: string;
  world: World;
  startDate: GameDate;
  playerFactionId: FactionId;
  factions: Record<FactionId, { treasury: number }>;
  /** Listede olmayan sancaklar sahipsiz başlar. */
  provinceOwners: Record<ProvinceId, FactionId>;
  armies: { ownerId: FactionId; provinceId: ProvinceId; units: Units }[];
}

export function validateSetup(setup: ScenarioSetup): string[] {
  const { world } = setup;
  const errors = validateWorld(world);
  const hasFaction = (id: FactionId) => id in world.factions;
  const hasProvince = (id: ProvinceId) => id in world.provinces;

  if (!hasFaction(setup.playerFactionId)) {
    errors.push(`Unknown player faction "${setup.playerFactionId}"`);
  }
  for (const id of Object.keys(setup.factions)) {
    if (!hasFaction(id)) errors.push(`Unknown faction "${id}"`);
  }
  for (const [provinceId, ownerId] of Object.entries(setup.provinceOwners)) {
    if (!hasProvince(provinceId)) {
      errors.push(`Unknown province "${provinceId}"`);
    }
    if (!hasFaction(ownerId)) {
      errors.push(`${provinceId}: unknown owner "${ownerId}"`);
    }
  }
  setup.armies.forEach((army, index) => {
    if (!hasFaction(army.ownerId)) {
      errors.push(`Army #${index}: unknown owner "${army.ownerId}"`);
    }
    if (!hasProvince(army.provinceId)) {
      errors.push(`Army #${index}: unknown province "${army.provinceId}"`);
    }
    if (armySize(army.units) === 0) errors.push(`Army #${index}: has no units`);
    for (const [type] of unitEntries(army.units)) {
      if (UNIT_DEFS[type].minYear > setup.startDate.year) {
        errors.push(
          `Army #${index}: "${type}" is not available before ${UNIT_DEFS[type].minYear}`,
        );
      }
    }
  });

  const { objectives = [], endDate, historical } = world;
  for (const objective of objectives) {
    if (objective.type !== 'holdProvinces') continue;
    for (const id of objective.provinces) {
      if (!hasProvince(id)) {
        errors.push(`Objective "${objective.id}": unknown province "${id}"`);
      }
    }
  }
  for (const id of historical?.provinces ?? []) {
    if (!hasProvince(id))
      errors.push(`Historical benchmark: unknown province "${id}"`);
  }
  if (endDate && compareDates(endDate, setup.startDate) <= 0) {
    errors.push('endDate must be after startDate');
  }

  return errors;
}

export function createGame(
  setup: ScenarioSetup,
  { seed }: { seed: number },
): GameState {
  const errors = validateSetup(setup);
  if (errors.length > 0) {
    throw new Error(`Invalid scenario "${setup.id}":\n${errors.join('\n')}`);
  }

  const factions: Record<FactionId, FactionState> = {};
  for (const id of Object.keys(setup.world.factions)) {
    factions[id] = {
      id,
      treasury: setup.factions[id]?.treasury ?? 0,
      alive: true,
    };
  }

  const provinces: Record<ProvinceId, ProvinceState> = {};
  for (const id of Object.keys(setup.world.provinces)) {
    provinces[id] = { id, ownerId: setup.provinceOwners[id] ?? null };
  }

  let nextId = 1;
  const armies: Record<string, ArmyState> = {};
  for (const army of setup.armies) {
    const id = `army-${nextId++}`;
    armies[id] = {
      id,
      ...army,
      morale: RULES.moraleStart,
      movesLeft: RULES.armyMovesPerTurn,
    };
  }

  return {
    version: 1,
    scenarioId: setup.id,
    seed,
    rng: seed >>> 0,
    turn: 1,
    date: setup.startDate,
    playerFactionId: setup.playerFactionId,
    status: { phase: 'playing' },
    factions,
    provinces,
    armies,
    log: [{ type: 'turnStarted', date: setup.startDate, turn: 1 }],
    nextId,
  };
}
