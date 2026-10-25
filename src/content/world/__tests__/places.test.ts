import fs from 'node:fs';
import path from 'node:path';

import { validateWorld } from '@/engine';

import { fortificationOf, PLACES, placesIn } from '../places';
import { baseTaxOf, createProvinceDefs, PROVINCE_META } from '../provinces';
import { terrainOf, TERRAIN_PROVINCE_IDS } from '../terrain';

type Ring = number[][];
type Geometry = { type: string; coordinates: Ring[] | Ring[][] };

function inRing([x, y]: number[], ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (
      yi! > y! !== yj! > y! &&
      x! < ((xj! - xi!) * (y! - yi!)) / (yj! - yi!) + xi!
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function contains(geometry: Geometry, point: number[]) {
  const polygons = (
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  ) as Ring[][];
  return polygons.some(
    (polygon) =>
      inRing(point, polygon[0]!) &&
      !polygon.slice(1).some((h) => inRing(point, h)),
  );
}

const provinces = JSON.parse(
  fs.readFileSync(path.resolve('public/data/provinces.geojson'), 'utf8'),
) as { features: { properties: { id: string }; geometry: Geometry }[] };

describe('places', () => {
  it('have unique ids and known provinces', () => {
    const ids = PLACES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const place of PLACES) {
      if (place.provinceId)
        expect(PROVINCE_META).toHaveProperty(place.provinceId);
    }
  });

  it('lie inside the province they claim', () => {
    for (const place of PLACES.filter((p) => p.provinceId)) {
      const feature = provinces.features.find(
        (f) => f.properties.id === place.provinceId,
      );
      expect(
        feature && contains(feature.geometry, place.position),
        `${place.name} is not inside ${place.provinceId}`,
      ).toBe(true);
    }
  });

  it('keep straits at sea and cities on land', () => {
    for (const place of PLACES) {
      expect(place.kind === 'strait').toBe(place.provinceId === undefined);
    }
  });

  it('only use fortification levels from 1 to 3', () => {
    for (const place of PLACES) {
      if (place.fortification !== undefined) {
        expect([1, 2, 3]).toContain(place.fortification);
      }
    }
  });

  it('give a province the fortification of its strongest place', () => {
    // Bursa'da hem Bursa hem İznik var.
    expect(
      placesIn('tur-bursa')
        .map((p) => p.id)
        .sort(),
    ).toEqual(['bursa', 'iznik']);
    expect(fortificationOf('tur-istanbul')).toBe(3);
    expect(fortificationOf('tur-bilecik')).toBe(1);
    expect(fortificationOf('tur-balikesir')).toBe(0);
  });
});

describe('terrain', () => {
  it('only names provinces that exist', () => {
    for (const id of TERRAIN_PROVINCE_IDS) {
      expect(PROVINCE_META, id).toHaveProperty(id);
    }
  });

  it('classifies known regions and defaults to plain', () => {
    expect(terrainOf('tur-erzurum')).toBe('mountains');
    expect(terrainOf('tur-bilecik')).toBe('hills');
    expect(terrainOf('bih-sarajevo')).toBe('mountains');
    expect(terrainOf('egy-cairo')).toBe('plain');
    expect(terrainOf('tur-edirne')).toBe('plain');
  });
});

describe('tax income', () => {
  it('is farmland plus cities plus customs on trade routes', () => {
    // Tarım 1; Bilecik ve Söğüt iki şehir (+4).
    expect(baseTaxOf('tur-bilecik')).toBe(5);
    // Şehri olmayan bölge yalnızca tarım getirir.
    expect(baseTaxOf('tur-yalova')).toBe(1);
    // Edirne: tarım 1 + şehir 2 + Büyük Rumeli Yolu gümrüğü 1.
    expect(baseTaxOf('tur-edirne')).toBe(4);
  });

  it('is what the engine collects from each province', () => {
    const defs = createProvinceDefs();
    expect(defs['tur-bursa']?.baseTax).toBe(baseTaxOf('tur-bursa'));
    expect(defs['tur-bursa']?.baseTax).toBe(5);
  });
});

describe('world definitions with terrain and fortresses', () => {
  const defs = createProvinceDefs();

  it('carry the data the engine rules read', () => {
    expect(defs['tur-istanbul']).toMatchObject({
      terrain: 'hills',
      fortification: 3,
    });
    expect(defs['tur-edirne']).toMatchObject({ fortification: 2 });
    expect(defs['tur-edirne']).not.toHaveProperty('terrain');
    expect(defs['egy-cairo']).toMatchObject({ fortification: 2 });
  });

  it('leave plain, fortress-less provinces untouched', () => {
    expect(defs['tur-balikesir']).not.toHaveProperty('fortification');
  });

  it('keep the world valid', () => {
    expect(validateWorld({ provinces: defs, factions: {} })).toEqual([]);
  });
});
