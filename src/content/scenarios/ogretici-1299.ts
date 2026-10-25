import { kurulus1299 } from './kurulus-1299';
import type { ScenarioDefinition } from './scenario-schema';

const bursaEvent = kurulus1299.events?.find((e) => e.id === 'bursa-dususu');

/**
 * Öğretici (D7): Osman Bey'in küçük beyliğiyle oyunun temellerini adım adım
 * öğreten kısa senaryo. Dünya 1299 Kuruluş ile aynıdır; rakipler yalnızca
 * kendini savunur ve Bursa'nın muhafızı azdır, böylece oyuncu her mekaniği
 * baskı altında kalmadan dener. Tarihî bilgiler (saray, kronoloji, olay) Kuruluş
 * senaryosundan alınır; senaryo denge değerleri tarihî değildir.
 */
export const ogretici1299: ScenarioDefinition = {
  id: 'ogretici-1299',
  name: "Öğretici · Osman Bey'in İlk Adımları",
  summary:
    'Oyunu öğrenmek için kısa bir başlangıç: ordunu yürüt, ilk fethini yap, asker devşir, turu bitir, ansiklopedi ve kronikle tarihi keşfet, sonunda Bursa’yı al.',
  startDate: { year: 1299, season: 'spring' },
  endDate: { year: 1305, season: 'spring' },
  objectives: [
    {
      id: 'sakarya',
      title: "Sakarya'yı ele geçir",
      type: 'holdProvinces',
      provinces: ['tur-sakarya'],
    },
    {
      id: 'bursa',
      title: "Bursa'yı fethet",
      type: 'holdProvinces',
      provinces: ['tur-bursa'],
    },
  ],
  events: bursaEvent ? [bursaEvent] : [],
  chronicle: kurulus1299.chronicle,
  court: kurulus1299.court,
  relations: {
    default: 'peace',
    pairs: [{ a: 'osmanli', b: 'bizans', relation: 'war' }],
  },
  tutorial: [
    {
      id: 'army',
      title: 'Ordunu seç',
      text: "Haritada Bilecik'teki kırmızı ordu işaretine tıkla. Seçili ordunun gidebileceği komşu bölgeler altın rengiyle vurgulanır.",
      goal: { type: 'selectArmy' },
    },
    {
      id: 'sakarya',
      title: 'İlk fethin',
      text: "Vurgulanan Sakarya'ya tıklayarak ordunu yürüt. Bizans'ın orada ordusu yok; bölge hemen senin olur.",
      goal: { type: 'capture', provinceId: 'tur-sakarya' },
    },
    {
      id: 'recruit',
      title: 'Asker devşir',
      text: 'Kendi bölgelerinden birine tıkla ve bölge panelindeki Devşirme bölümünden 100 akıncı al. Akıncı ve sipahi hazineden maaş istemez (tımar).',
      goal: { type: 'recruit' },
    },
    {
      id: 'turn',
      title: 'Turu bitir',
      text: 'Üst çubuktaki "Turu Bitir"e bas. Her tur bir mevsimdir: ordular yeniden yürüyebilir, vergi toplanır, rakipler hamle yapar.',
      goal: { type: 'endTurn' },
    },
    {
      id: 'encyclopedia',
      title: 'Tarihi öğren',
      text: 'Haritadaki bir şehir işaretine (kare ya da yuvarlak) ya da bölge panelindeki şehir adına tıkla; ansiklopedi maddesi açılır.',
      goal: { type: 'openEncyclopedia' },
    },
    {
      id: 'chronicle',
      title: 'Kroniğe bak',
      text: 'Üst çubuktaki "Kronik" ile kendi yazdığın tarihi gerçek tarihle yan yana gör.',
      goal: { type: 'openChronicle' },
    },
    {
      id: 'bursa',
      title: "Bursa'yı al",
      text: "Ordunu Bursa'ya yürüt. Bursa surludur: savunanı yensen bile şehir birkaç tur kuşatma ister. Kışın yalnızca kendi toprağına çekilebileceğini unutma.",
      goal: { type: 'capture', provinceId: 'tur-bursa' },
    },
  ],
  playerFactionId: 'osmanli',
  factions: {
    osmanli: {
      name: 'Osmanlı Beyliği',
      color: '#b91c1c',
      treasury: 30,
      provinces: ['tur-bilecik', 'tur-eskisehir'],
      armies: [
        { provinceId: 'tur-bilecik', units: { sipahi: 600, akinci: 400 } },
      ],
    },
    bizans: {
      name: 'Bizans İmparatorluğu',
      color: '#7e22ce',
      // Öğreticide Bizans saldırmaz ve devşirmez.
      ai: { aggression: 99, recruitShare: 0 },
      treasury: 50,
      provinces: [
        'tur-bursa',
        'tur-kocaeli',
        'tur-yalova',
        'tur-sakarya',
        'tur-istanbul',
      ],
      armies: [
        { provinceId: 'tur-bursa', units: { sipahi: 300, akinci: 100 } },
      ],
    },
    germiyan: {
      name: 'Germiyanoğulları',
      color: '#15803d',
      ai: { warlike: 0 },
      treasury: 20,
      provinces: ['tur-kutahya', 'tur-afyonkarahisar', 'tur-usak'],
    },
  },
};
