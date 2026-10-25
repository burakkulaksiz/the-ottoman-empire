// Nehir katmanını üretir: Natural Earth 10m nehir hatlarından
//   public/data/rivers.geojson
// dosyasını yazar. Çalıştırma: `npm run data:rivers`
//
// Yalnızca büyük nehirler (scalerank ≤ MAX_SCALERANK) alınır; harita bölgesine
// kırpılır ve sadeleştirilir.
import fs from 'node:fs';
import path from 'node:path';

import mapshaper from 'mapshaper';

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson';
const SOURCE_FILE = path.resolve(
  'data-src/ne_10m_rivers_lake_centerlines.geojson',
);
const OUT = path.resolve('public/data/rivers.geojson');

/** Haritanın görünür sınırından biraz geniş. [batı, güney, doğu, kuzey] */
const CLIP_BBOX = [-13, 14, 63, 56];
const MAX_SCALERANK = 5;
/** Oyun bölgesi için önemli ama Natural Earth'te küçük sayılan nehirler. */
const ALWAYS_INCLUDE = ['Evros', 'Sakarya', 'Byk Menderes'];

if (!fs.existsSync(SOURCE_FILE)) {
  console.log(`İndiriliyor: ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`İndirme başarısız: ${res.status}`);
  fs.mkdirSync(path.dirname(SOURCE_FILE), { recursive: true });
  fs.writeFileSync(SOURCE_FILE, Buffer.from(await res.arrayBuffer()));
}

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
const major = {
  type: 'FeatureCollection',
  features: source.features
    .filter(
      (f) =>
        f.geometry &&
        (f.properties.scalerank <= MAX_SCALERANK ||
          ALWAYS_INCLUDE.includes(f.properties.name)),
    )
    .map((f) => ({
      type: 'Feature',
      properties: { name: f.properties.name ?? null },
      geometry: f.geometry,
    })),
};

const out = await mapshaper.applyCommands(
  [
    '-i rivers.json',
    `-clip bbox=${CLIP_BBOX.join(',')}`,
    '-simplify visvalingam interval=1500',
    '-o output.json format=geojson precision=0.001',
  ].join(' '),
  { 'rivers.json': JSON.stringify(major) },
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out['output.json']);
const count = JSON.parse(out['output.json']).features.length;
console.log(
  `${count} nehir parçası, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB.`,
);
