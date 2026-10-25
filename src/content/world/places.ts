import type { ProvinceId } from '@/engine';

export type PlaceKind = 'city' | 'strait';

/** Haritada gösterilen yer: şehir, kale/şehir surları ya da boğaz. */
export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  /** [boylam, enlem] */
  position: [number, number];
  /** Bulunduğu bölge; boğazlar denizde olduğundan yoktur. */
  provinceId?: ProvinceId;
  /**
   * Kale/sur seviyesi (1–3): savunana bonus verir, kuşatma süresini uzatır.
   * Seviyeler birbirine göre görecelidir (3 = İstanbul surları gibi).
   */
  fortification?: number;
  /** Kısa not (ansiklopedi D3'e temel olacak). */
  note?: string;
}

/**
 * Bölge düzeyindeki oyun kurallarına etki eden yerler: bir bölgenin kale
 * seviyesi, içindeki yerlerin en yükseğidir. Konumlar yaklaşıktır.
 *
 * TODO(kaynak): Kale seviyeleri dengeye göre görecelidir; tarihî surların
 * gücü ve 1299 tarihindeki durumları kaynaklarla doğrulanmalı (D6).
 */
export const PLACES: Place[] = [
  {
    id: 'istanbul',
    name: 'İstanbul (Konstantinopolis)',
    kind: 'city',
    position: [28.9784, 41.0082],
    provinceId: 'tur-istanbul',
    fortification: 3,
    note: 'Bizans başkenti; Theodosius surlarıyla çevrili.',
  },
  {
    id: 'edirne',
    name: 'Edirne (Hadrianopolis)',
    kind: 'city',
    position: [26.5557, 41.6772],
    provinceId: 'tur-edirne',
    fortification: 2,
  },
  {
    id: 'selanik',
    name: 'Selanik',
    kind: 'city',
    position: [22.9444, 40.6401],
    provinceId: 'grc-centre-macedonia',
    fortification: 2,
  },
  {
    id: 'bursa',
    name: 'Bursa (Prusa)',
    kind: 'city',
    position: [29.0665, 40.1826],
    provinceId: 'tur-bursa',
    fortification: 1,
    note: "Surlu şehir; Osmanlılar uzun bir kuşatmanın ardından 1326'da aldı.",
  },
  {
    id: 'iznik',
    name: 'İznik (Nikaia)',
    kind: 'city',
    position: [29.7208, 40.4286],
    provinceId: 'tur-bursa',
    fortification: 1,
    note: 'Güçlü surlarıyla ünlü eski Bizans şehri.',
  },
  {
    id: 'izmit',
    name: 'İzmit (Nikomedeia)',
    kind: 'city',
    position: [29.9408, 40.7654],
    provinceId: 'tur-kocaeli',
    fortification: 1,
  },
  {
    id: 'bilecik',
    name: 'Bilecik',
    kind: 'city',
    position: [29.9792, 40.1451],
    provinceId: 'tur-bilecik',
    fortification: 1,
    note: 'Kalesi bölgenin anahtarıdır.',
  },
  {
    id: 'sogut',
    name: 'Söğüt',
    kind: 'city',
    position: [30.1833, 40.0167],
    provinceId: 'tur-bilecik',
    note: "Osman Bey'in uç beyliğinin merkezi.",
  },
  {
    id: 'eskisehir',
    name: 'Eskişehir (Karacahisar)',
    kind: 'city',
    position: [30.5206, 39.7767],
    provinceId: 'tur-eskisehir',
    fortification: 1,
  },
  {
    id: 'kutahya',
    name: 'Kütahya',
    kind: 'city',
    position: [29.9833, 39.4167],
    provinceId: 'tur-kutahya',
    fortification: 1,
    note: 'Germiyanoğulları merkezi.',
  },
  {
    id: 'balikesir',
    name: 'Balıkesir',
    kind: 'city',
    position: [27.8826, 39.6484],
    provinceId: 'tur-balikesir',
  },
  {
    id: 'izmir',
    name: 'İzmir (Smyrna)',
    kind: 'city',
    position: [27.1428, 38.4237],
    provinceId: 'tur-izmir',
    fortification: 1,
  },
  {
    id: 'konya',
    name: 'Konya',
    kind: 'city',
    position: [32.4932, 37.8746],
    provinceId: 'tur-konya',
    fortification: 2,
    note: 'Anadolu Selçuklu başkenti.',
  },
  {
    id: 'karaman',
    name: 'Karaman',
    kind: 'city',
    position: [33.2287, 37.1759],
    provinceId: 'tur-karaman',
  },
  {
    id: 'ankara',
    name: 'Ankara',
    kind: 'city',
    position: [32.8597, 39.9334],
    provinceId: 'tur-ankara',
    fortification: 1,
  },
  {
    id: 'kastamonu',
    name: 'Kastamonu',
    kind: 'city',
    position: [33.7827, 41.3887],
    provinceId: 'tur-kastamonu',
    fortification: 1,
  },
  {
    id: 'antalya',
    name: 'Antalya',
    kind: 'city',
    position: [30.7133, 36.8969],
    provinceId: 'tur-antalya',
    fortification: 1,
  },
  {
    id: 'trabzon',
    name: 'Trabzon (Trapezunt)',
    kind: 'city',
    position: [39.7168, 41.0027],
    provinceId: 'tur-trabzon',
    fortification: 2,
  },
  {
    id: 'erzurum',
    name: 'Erzurum',
    kind: 'city',
    position: [41.2769, 39.9],
    provinceId: 'tur-erzurum',
    fortification: 1,
  },
  {
    id: 'tarnovo',
    name: 'Tırnova',
    kind: 'city',
    position: [25.6172, 43.0757],
    provinceId: 'bgr-veliko-tarnovo',
    fortification: 2,
  },
  {
    id: 'sofya',
    name: 'Sofya',
    kind: 'city',
    position: [23.3219, 42.6977],
    provinceId: 'bgr-sofia-2',
  },
  {
    id: 'belgrad',
    name: 'Belgrad',
    kind: 'city',
    position: [20.4489, 44.7866],
    provinceId: 'srb-belgrade',
    fortification: 2,
  },
  {
    id: 'halep',
    name: 'Halep',
    kind: 'city',
    position: [37.1343, 36.2021],
    provinceId: 'syr-aleppo',
    fortification: 2,
  },
  {
    id: 'sam',
    name: 'Şam',
    kind: 'city',
    position: [36.2765, 33.5138],
    provinceId: 'syr-damascus',
    fortification: 2,
  },
  {
    id: 'kahire',
    name: 'Kahire',
    kind: 'city',
    position: [31.2357, 30.0444],
    provinceId: 'egy-cairo',
    fortification: 2,
  },
  {
    id: 'bagdat',
    name: 'Bağdat',
    kind: 'city',
    position: [44.3661, 33.3152],
    provinceId: 'irq-baghdad',
    fortification: 1,
  },
  {
    id: 'tebriz',
    name: 'Tebriz',
    kind: 'city',
    position: [46.2919, 38.0792],
    provinceId: 'irn-east-azerbaijan',
  },
  {
    id: 'istanbul-bogazi',
    name: 'İstanbul Boğazı',
    kind: 'strait',
    position: [29.07, 41.12],
    note: "Karadeniz ile Marmara'yı bağlar. Modern il sınırları iki yakayı tek bölgede tuttuğundan şimdilik görsel öğedir; donanma (deniz bölgeleri) gelince geçiş kuralı olacak.",
  },
  {
    id: 'canakkale-bogazi',
    name: 'Çanakkale Boğazı',
    kind: 'strait',
    position: [26.4, 40.2],
    note: "Marmara ile Ege'yi bağlar.",
  },
];

/** Bir bölgenin kale seviyesi: içindeki yerlerin en yükseği (yoksa 0). */
export function fortificationOf(provinceId: ProvinceId): number {
  return PLACES.reduce(
    (max, place) =>
      place.provinceId === provinceId
        ? Math.max(max, place.fortification ?? 0)
        : max,
    0,
  );
}

export function placesIn(provinceId: ProvinceId): Place[] {
  return PLACES.filter((p) => p.provinceId === provinceId);
}
