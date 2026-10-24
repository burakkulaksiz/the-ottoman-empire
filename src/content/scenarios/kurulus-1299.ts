import type { ScenarioDefinition } from './scenario-schema';

/**
 * 1299 · Kuruluş — Osman Bey'in Söğüt çevresindeki uç beyliği.
 *
 * Sınırlar yaklaşık: bölgeler modern illerdir (bkz. B2/B3) ve sahiplik
 * "o ilin ağırlıklı kısmı" olarak yorumlanmıştır. Para ve asker sayıları
 * tarihî veri değil, denge değeridir.
 *
 * TODO(kaynak): Aşağıdaki sahiplik atamaları (özellikle Karesi, Hamidoğulları
 * ve Candaroğulları sınırları) tarihçi kaynaklarıyla doğrulanmalı (D6).
 * Saruhan (~1300) ve Aydın (~1308) beylikleri henüz kurulmadığı için
 * senaryoya alınmadı; ilgili iller sahipsizdir.
 */
export const kurulus1299: ScenarioDefinition = {
  id: 'kurulus-1299',
  name: '1299 · Kuruluş',
  summary:
    'Anadolu Selçuklu devletinin çöküşünde Bizans sınırında küçük bir uç beyliği olan Osman Bey, Söğüt çevresinde ayakta kalmaya çalışıyor. Güçlü komşular ve rakip beylikler arasında ilk adımını at.',
  startDate: { year: 1299, season: 'spring' },
  playerFactionId: 'osmanli',
  factions: {
    osmanli: {
      name: 'Osmanlı Beyliği',
      color: '#b91c1c',
      treasury: 20,
      provinces: ['tur-bilecik', 'tur-eskisehir'],
      armies: [{ provinceId: 'tur-bilecik', troops: 1000 }],
    },
    bizans: {
      name: 'Bizans İmparatorluğu',
      color: '#7e22ce',
      treasury: 120,
      provinces: [
        'tur-bursa',
        'tur-kocaeli',
        'tur-yalova',
        'tur-sakarya',
        'tur-istanbul',
        'tur-tekirdag',
        'tur-edirne',
        'tur-kirklareli',
        'grc-east-macedonia-and-thrace',
        'grc-centre-macedonia',
      ],
      armies: [
        { provinceId: 'tur-bursa', troops: 3000 },
        { provinceId: 'tur-kocaeli', troops: 2000 },
      ],
    },
    germiyan: {
      name: 'Germiyanoğulları',
      color: '#15803d',
      treasury: 40,
      provinces: ['tur-kutahya', 'tur-afyonkarahisar', 'tur-usak'],
      armies: [{ provinceId: 'tur-kutahya', troops: 2000 }],
    },
    karesi: {
      name: 'Karesioğulları',
      color: '#0e7490',
      treasury: 15,
      provinces: ['tur-balikesir', 'tur-canakkale'],
      armies: [{ provinceId: 'tur-balikesir', troops: 1000 }],
    },
    mentese: {
      name: 'Menteşeoğulları',
      color: '#c2410c',
      treasury: 15,
      provinces: ['tur-mugla'],
    },
    hamid: {
      name: 'Hamidoğulları',
      color: '#a16207',
      treasury: 15,
      provinces: ['tur-isparta', 'tur-burdur'],
    },
    karaman: {
      name: 'Karamanoğulları',
      color: '#4d7c0f',
      treasury: 25,
      provinces: ['tur-karaman', 'tur-konya'],
      armies: [{ provinceId: 'tur-karaman', troops: 1500 }],
    },
    candar: {
      name: 'Candaroğulları',
      color: '#be185d',
      treasury: 15,
      provinces: ['tur-kastamonu'],
    },
  },
};
