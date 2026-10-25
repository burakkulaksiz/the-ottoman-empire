import { z } from 'zod';

import type { ProvinceDef, ProvinceId } from '@/engine';

import { fortificationOf, PLACES } from './places';
import adjacencyData from './province-adjacency.json';
import { terrainOf } from './terrain';
import { TRADE_ROUTES } from './trade-routes';

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

/** Her bölgenin tarım gelirinin (öşür) tabanı. */
const FARMLAND_TAX = 1;
/** Her şehir ticaret ve esnaf vergisiyle bu kadar ekler. */
const CITY_TAX = 2;
/** Ticaret yolu üzerindeki şehirli bölge gümrükten bu kadar ekler. */
const TRADE_ROUTE_TAX = 1;

const routeCityIds = new Set(TRADE_ROUTES.flatMap((route) => route.via));

/**
 * Bölgenin tur başına vergi geliri (akçe): tarım + şehirler + ticaret yolu
 * gümrüğü. Denge değeridir; ekonomi derinleştikçe (tımar, cizye, enflasyon)
 * değişecek.
 */
export function baseTaxOf(provinceId: ProvinceId): number {
  const cities = PLACES.filter(
    (p) => p.provinceId === provinceId && p.kind === 'city',
  );
  const onRoute = cities.some((c) => routeCityIds.has(c.id));
  return (
    FARMLAND_TAX + cities.length * CITY_TAX + (onRoute ? TRADE_ROUTE_TAX : 0)
  );
}

export function createProvinceDefs(): Record<ProvinceId, ProvinceDef> {
  return Object.fromEntries(
    Object.entries(PROVINCE_META).map(([id, meta]) => [
      id,
      {
        id,
        name: meta.name,
        neighbors: meta.neighbors,
        baseTax: baseTaxOf(id),
        // Ova ve kalesiz bölgeler için alan hiç yazılmaz (motor varsayılanı).
        ...(terrainOf(id) !== 'plain' && { terrain: terrainOf(id) }),
        ...(fortificationOf(id) > 0 && { fortification: fortificationOf(id) }),
      },
    ]),
  );
}
