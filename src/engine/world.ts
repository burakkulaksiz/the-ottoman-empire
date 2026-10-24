import type { ProvinceId, World } from './types';

export function areAdjacent(world: World, a: ProvinceId, b: ProvinceId) {
  return world.provinces[a]?.neighbors.includes(b) ?? false;
}

/**
 * Dünya verisindeki tutarsızlıkları bulur. Harita verisi elle veya
 * GeoJSON'dan üretildiğinde (B2) hataları erken yakalamak için kullanılır.
 */
export function validateWorld(world: World): string[] {
  const errors: string[] = [];

  for (const [key, province] of Object.entries(world.provinces)) {
    if (province.id !== key) {
      errors.push(`Province key "${key}" does not match id "${province.id}"`);
    }
    for (const neighborId of province.neighbors) {
      const neighbor = world.provinces[neighborId];
      if (!neighbor) {
        errors.push(`${key}: unknown neighbor "${neighborId}"`);
      } else if (!neighbor.neighbors.includes(key)) {
        errors.push(`${key} -> ${neighborId}: adjacency is not symmetric`);
      }
    }
  }

  for (const [key, faction] of Object.entries(world.factions)) {
    if (faction.id !== key) {
      errors.push(`Faction key "${key}" does not match id "${faction.id}"`);
    }
  }

  return errors;
}
