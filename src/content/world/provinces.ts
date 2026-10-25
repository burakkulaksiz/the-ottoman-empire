import { z } from 'zod';

import type { ProvinceDef, ProvinceId } from '@/engine';

import { fortificationOf } from './places';
import adjacencyData from './province-adjacency.json';
import { terrainOf } from './terrain';

/**
 * Bölge listesi `scripts/build-provinces.mjs` ile üretilir (`npm run
 * data:provinces`). Şimdilik modern idari bölümler tarihî sancakların yerini
 * tutar; sınırlar B3'te yıla göre değişecek.
 */
const provinceMetaSchema = z.object({
  name: z.string(),
  country: z.string(),
  /** [boylam, enlem]; bölgenin içinde kalan bir nokta (işaretler için). */
  center: z.tuple([z.number(), z.number()]),
  neighbors: z.array(z.string()),
});

const adjacencySchema = z.record(z.string(), provinceMetaSchema);

export type ProvinceMeta = z.infer<typeof provinceMetaSchema>;

/** Bölge kimliği → ad, ülke (modern) ve komşular. */
export const PROVINCE_META: Record<ProvinceId, ProvinceMeta> =
  adjacencySchema.parse(adjacencyData);

/** Henüz ekonomi (C6) olmadığından her bölge aynı gelire sahiptir. */
const DEFAULT_BASE_TAX = 1;

export function createProvinceDefs(): Record<ProvinceId, ProvinceDef> {
  return Object.fromEntries(
    Object.entries(PROVINCE_META).map(([id, meta]) => [
      id,
      {
        id,
        name: meta.name,
        neighbors: meta.neighbors,
        baseTax: DEFAULT_BASE_TAX,
        // Ova ve kalesiz bölgeler için alan hiç yazılmaz (motor varsayılanı).
        ...(terrainOf(id) !== 'plain' && { terrain: terrainOf(id) }),
        ...(fortificationOf(id) > 0 && { fortification: fortificationOf(id) }),
      },
    ]),
  );
}
