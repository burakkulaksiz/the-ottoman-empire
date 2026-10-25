// Bölge (province) katmanını üretir: Natural Earth 10m admin-1 verisinden
//   - public/data/provinces.geojson          (harita geometrisi)
//   - src/content/world/province-adjacency.json (komşuluk grafı)
// dosyalarını yazar. Çalıştırma: `npm run data:provinces`
//
// Not: Bu, modern idari bölümleri tarihî sancakların yerine geçen bir
// yer tutucu olarak kullanır; tarihî sınırlar B3'te eklenir.
import fs from 'node:fs';
import path from 'node:path';

import mapshaper from 'mapshaper';

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
const SOURCE_FILE = path.resolve(
  'data-src/ne_10m_admin_1_states_provinces.geojson',
);
const OUT_GEOJSON = path.resolve('public/data/provinces.geojson');
const OUT_ADJACENCY = path.resolve('src/content/world/province-adjacency.json');

/** Haritanın görünür sınırından biraz geniş. [batı, güney, doğu, kuzey] */
const CLIP_BBOX = [-13, 14, 63, 56];

/**
 * Dahil edilecek ülkeler (adm0_a3). `group` verilirse ülkenin tüm idari
 * birimleri tek bölgede birleştirilir (Natural Earth bu ülkelerde belediye
 * düzeyinde olduğundan oyun için fazla ince).
 */
const COUNTRIES = {
  TUR: { name: 'Türkiye' },
  GRC: { name: 'Yunanistan' },
  BGR: { name: 'Bulgaristan' },
  SRB: { name: 'Sırbistan' },
  ROU: { name: 'Romanya' },
  HUN: { name: 'Macaristan' },
  ALB: { name: 'Arnavutluk' },
  BIH: { name: 'Bosna-Hersek' },
  HRV: { name: 'Hırvatistan' },
  MNE: { name: 'Karadağ' },
  UKR: { name: 'Ukrayna' },
  MDA: { name: 'Moldova' },
  GEO: { name: 'Gürcistan' },
  ARM: { name: 'Ermenistan' },
  SYR: { name: 'Suriye' },
  IRQ: { name: 'Irak' },
  IRN: { name: 'İran' },
  LBN: { name: 'Lübnan' },
  ISR: { name: 'İsrail' },
  PSE: { name: 'Filistin' },
  JOR: { name: 'Ürdün' },
  SAU: { name: 'Suudi Arabistan' },
  KWT: { name: 'Kuveyt' },
  EGY: { name: 'Mısır' },
  LBY: { name: 'Libya' },
  TUN: { name: 'Tunus' },
  DZA: { name: 'Cezayir' },
  CYP: { name: 'Kıbrıs', group: { id: 'cyp', name: 'Kıbrıs' } },
  CYN: { name: 'Kıbrıs', group: { id: 'cyp', name: 'Kıbrıs' } },
  MKD: {
    name: 'Kuzey Makedonya',
    group: { id: 'mkd', name: 'Makedonya' },
  },
  KOS: { name: 'Kosova', group: { id: 'kos', name: 'Kosova' } },
};

/** Türkçe karakterleri ASCII'ye çevirip kebab-case bir kimlik üretir. */
function slugify(text) {
  const map = {
    ı: 'i',
    İ: 'i',
    ş: 's',
    Ş: 's',
    ğ: 'g',
    Ğ: 'g',
    ü: 'u',
    Ü: 'u',
    ö: 'o',
    Ö: 'o',
    ç: 'c',
    Ç: 'c',
    â: 'a',
    î: 'i',
    û: 'u',
  };
  return text
    .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (c) => map[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadSource() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.log(`İndiriliyor: ${SOURCE_URL}`);
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`İndirme başarısız: ${res.status}`);
    fs.mkdirSync(path.dirname(SOURCE_FILE), { recursive: true });
    fs.writeFileSync(SOURCE_FILE, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
}

function prepare(source) {
  const used = new Set();
  const features = [];
  for (const f of source.features) {
    const p = f.properties;
    const country = COUNTRIES[p.adm0_a3];
    if (!country) continue;

    let id, name;
    if (country.group) {
      ({ id, name } = country.group);
    } else {
      name = p.name_tr || p.name_en || p.name;
      const base = `${p.adm0_a3.toLowerCase()}-${slugify(p.name_en || p.name)}`;
      id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
    }
    features.push({
      type: 'Feature',
      properties: { id, name, country: country.name },
      geometry: f.geometry,
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Ortak kenarı paylaşan bölgeleri komşu sayar. */
function buildAdjacency(collection, centers) {
  const edgeOwners = new Map();
  const info = new Map();

  const addRing = (ring, id) => {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1].join(',');
      const b = ring[i].join(',');
      if (a === b) continue;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      let owners = edgeOwners.get(key);
      if (!owners) edgeOwners.set(key, (owners = new Set()));
      owners.add(id);
    }
  };

  for (const f of collection.features) {
    const { id, name, country } = f.properties;
    info.set(id, { name, country, neighbors: new Set() });
    const polygons =
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    for (const polygon of polygons)
      for (const ring of polygon) addRing(ring, id);
  }

  for (const owners of edgeOwners.values()) {
    if (owners.size < 2) continue;
    for (const a of owners)
      for (const b of owners) if (a !== b) info.get(a).neighbors.add(b);
  }

  const result = {};
  for (const id of [...info.keys()].sort()) {
    const { name, country, neighbors } = info.get(id);
    result[id] = {
      name,
      country,
      center: centers.get(id),
      neighbors: [...neighbors].sort(),
    };
  }
  return result;
}

const source = await loadSource();
const prepared = prepare(source);

const commands = [
  '-i input.json snap-interval=0.0005',
  `-clip bbox=${CLIP_BBOX.join(',')}`,
  '-dissolve id copy-fields=name,country',
  '-simplify visvalingam interval=1500 keep-shapes',
  '-o output.json format=geojson precision=0.001',
].join(' ');

const out = await mapshaper.applyCommands(commands, {
  'input.json': JSON.stringify(prepared),
});
const collection = JSON.parse(out['output.json']);

fs.mkdirSync(path.dirname(OUT_GEOJSON), { recursive: true });
fs.writeFileSync(OUT_GEOJSON, JSON.stringify(collection));

// Ordu işaretleri için her bölgenin içinde kalan bir nokta (kutup noktası).
const centerOut = await mapshaper.applyCommands(
  '-i regions.json -points inner -o centers.json format=geojson precision=0.001',
  { 'regions.json': out['output.json'] },
);
const centers = new Map(
  JSON.parse(centerOut['centers.json']).features.map((f) => [
    f.properties.id,
    f.geometry.coordinates,
  ]),
);
const adjacency = buildAdjacency(collection, centers);
fs.mkdirSync(path.dirname(OUT_ADJACENCY), { recursive: true });
fs.writeFileSync(OUT_ADJACENCY, JSON.stringify(adjacency, null, 2) + '\n');

const isolated = Object.entries(adjacency)
  .filter(([, v]) => v.neighbors.length === 0)
  .map(([id]) => id);
console.log(
  `${collection.features.length} bölge, ${(fs.statSync(OUT_GEOJSON).size / 1024).toFixed(0)} KB geojson.`,
);
console.log(
  `Komşusuz (ada vb.) ${isolated.length} bölge: ${isolated.join(', ')}`,
);
