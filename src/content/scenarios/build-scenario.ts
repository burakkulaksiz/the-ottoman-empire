import type { FactionDef, ScenarioSetup } from '@/engine';

import { createProvinceDefs } from '../world/provinces';

import { type ScenarioDefinition, scenarioSchema } from './scenario-schema';

/**
 * İçerik tanımını motorun başlangıç verisine çevirir. Aynı bölgeyi iki
 * devlete veren tanımları reddeder; bilinmeyen bölge/devlet denetimi
 * motordaki `validateSetup` ile yapılır.
 */
export function buildScenario(definition: ScenarioDefinition): ScenarioSetup {
  const scenario = scenarioSchema.parse(definition);

  const factions: Record<string, FactionDef> = {};
  const treasuries: ScenarioSetup['factions'] = {};
  const provinceOwners: ScenarioSetup['provinceOwners'] = {};
  const armies: ScenarioSetup['armies'] = [];

  for (const [id, faction] of Object.entries(scenario.factions)) {
    factions[id] = {
      id,
      name: faction.name,
      color: faction.color,
      ...(faction.ai && { ai: faction.ai }),
    };
    treasuries[id] = { treasury: faction.treasury };

    for (const provinceId of faction.provinces) {
      const previous = provinceOwners[provinceId];
      if (previous) {
        throw new Error(
          `Scenario "${scenario.id}": "${provinceId}" is owned by both "${previous}" and "${id}"`,
        );
      }
      provinceOwners[provinceId] = id;
    }
    for (const army of faction.armies) {
      armies.push({ ownerId: id, ...army });
    }
  }

  return {
    id: scenario.id,
    world: {
      provinces: createProvinceDefs(),
      factions,
      objectives: scenario.objectives.map(
        ({ title: _title, ...objective }) => objective,
      ),
      events: scenario.events.map((event) => ({
        id: event.id,
        trigger: event.trigger,
        choices: event.choices.map((choice) => ({
          id: choice.id,
          effects: choice.effects,
        })),
      })),
      endDate: scenario.endDate,
      historical: scenario.historical && {
        provinces: scenario.historical.provinces,
      },
    },
    startDate: scenario.startDate,
    playerFactionId: scenario.playerFactionId,
    factions: treasuries,
    provinceOwners,
    armies,
    ...(scenario.relations && {
      relations: {
        default: scenario.relations.default,
        pairs: scenario.relations.pairs.map(({ a, b, relation }) => ({
          a,
          b,
          relation,
        })),
      },
    }),
  };
}
