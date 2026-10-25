import type { ProvinceId, Terrain } from '@/engine';

/**
 * Arazi bölge düzeyinde ve yaklaşıktır: bölgenin ağırlıklı yer şekli sayılır.
 *
 * TODO(kaynak): Sınıflandırma coğrafya kaynaklarıyla doğrulanmalı; B3'te
 * tarihî sınırlar gelince bölgeler değişecek.
 */

/** Ülke öneki (kimliğin ilk parçası) → varsayılan arazi. Yazılmayanlar ovadır. */
const COUNTRY_TERRAIN: Record<string, Terrain> = {
  bih: 'mountains',
  mne: 'mountains',
  alb: 'mountains',
  lbn: 'mountains',
  geo: 'mountains',
  arm: 'mountains',
  kos: 'mountains',
  mkd: 'mountains',
  irn: 'mountains',
  hrv: 'hills',
  srb: 'hills',
  bgr: 'hills',
  grc: 'hills',
  cyp: 'hills',
  dza: 'hills',
};

const TURKEY_MOUNTAINS = [
  'artvin',
  'rize',
  'giresun',
  'gumushane',
  'bayburt',
  'erzurum',
  'erzincan',
  'kars',
  'ardahan',
  'agri',
  'van',
  'hakkari',
  'sirnak',
  'bitlis',
  'mus',
  'bingol',
  'tunceli',
  'mugla',
  'antalya',
  'isparta',
  'karaman',
  'mersin',
  'kahramanmaras',
  'kastamonu',
  'karabuk',
  'bolu',
];

const TURKEY_HILLS = [
  'bilecik',
  'kutahya',
  'usak',
  'afyonkarahisar',
  'kocaeli',
  'yalova',
  'balikesir',
  'canakkale',
  'izmir',
  'manisa',
  'denizli',
  'burdur',
  'kirklareli',
  'istanbul',
  'sinop',
  'ordu',
  'trabzon',
  'amasya',
  'tokat',
  'corum',
  'yozgat',
  'sivas',
  'malatya',
  'elazig',
  'adiyaman',
  'hatay',
  'osmaniye',
];

const EXPLICIT: Record<ProvinceId, Terrain> = {
  ...Object.fromEntries(
    TURKEY_MOUNTAINS.map((n) => [`tur-${n}`, 'mountains' as const]),
  ),
  ...Object.fromEntries(
    TURKEY_HILLS.map((n) => [`tur-${n}`, 'hills' as const]),
  ),
  // Teselya ovası ve Tuna ovası gibi istisnalar.
  'grc-thessalia': 'plain',
};

/** Bölgenin arazisi: savunana çarpan verir (`RULES.terrainDefense`). */
export function terrainOf(provinceId: ProvinceId): Terrain {
  const explicit = EXPLICIT[provinceId];
  if (explicit) return explicit;
  const country = provinceId.split('-')[0] ?? '';
  return COUNTRY_TERRAIN[country] ?? 'plain';
}

/** Yazılı adı (panelde gösterilir). */
export const TERRAIN_LABELS: Record<Terrain, string> = {
  plain: 'Ova',
  hills: 'Engebeli',
  mountains: 'Dağlık',
};

/** Ad listelerindeki kimliklerin hepsi (test için). */
export const TERRAIN_PROVINCE_IDS = Object.keys(EXPLICIT);
