import { buildScenario } from './build-scenario';
import { kurulus1299 } from './kurulus-1299';
import type { ScenarioDefinition } from './scenario-schema';

export { buildScenario } from './build-scenario';
export type { ScenarioDefinition } from './scenario-schema';

/** Oynanabilir senaryolar; yenisi eklenince buraya yazılır. */
export const SCENARIOS: readonly ScenarioDefinition[] = [kurulus1299];

export const DEFAULT_SCENARIO_ID = kurulus1299.id;

export function getScenarioDefinition(id: string) {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

export function loadScenario(id: string) {
  const definition = getScenarioDefinition(id);
  if (!definition) throw new Error(`Unknown scenario "${id}"`);
  return buildScenario(definition);
}
