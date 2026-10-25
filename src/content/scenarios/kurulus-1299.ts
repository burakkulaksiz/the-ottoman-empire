import type { ScenarioDefinition } from './scenario-schema';

/**
 * 1299 · Kuruluş — Osman Bey'in Söğüt çevresindeki uç beyliği.
 *
 * Sınırlar yaklaşık: bölgeler modern illerdir (bkz. B2/B3) ve sahiplik
 * "o ilin ağırlıklı kısmı" olarak yorumlanmıştır. Para ve asker sayıları
 * tarihî veri ve ordu bileşimi değil, denge değeridir (Anadolu'daki
 * orduların hepsi benzer büyüklükte; kimse kendiliğinden ezici üstün değil) (hepsi hafif/ağır
 * süvari: yaya 1330'dan, yeniçeri 1363'ten önce kurulamaz).
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
  endDate: { year: 1330, season: 'spring' },
  objectives: [
    {
      id: 'koru',
      title: 'Söğüt çevresini (Bilecik ve Eskişehir) elinde tut',
      type: 'holdProvinces',
      provinces: ['tur-bilecik', 'tur-eskisehir'],
    },
    {
      id: 'bursa',
      title: "Bursa'yı fethet (tarihte 1326)",
      type: 'holdProvinces',
      provinces: ['tur-bursa'],
    },
  ],
  // TODO(kaynak): Olay metinleri (tarihler, komutan adı, Bursa'nın teslimi ve
  // ilk akçe) birincil kaynaklarla doğrulanmalı (D6).
  events: [
    {
      id: 'koyunhisar',
      title: 'Koyunhisar Savaşı',
      description:
        "Bizans, Osman Bey'in akınlarını durdurmak için İzmit (Nikomedia) yönünden bir ordu gönderiyor. Çevredeki gaziler çağrına hazır. Bizans ordusunu savaş meydanında mı karşılarsın, yoksa kalelere mi çekilirsin?",
      trigger: { type: 'date', date: { year: 1302, season: 'summer' } },
      choices: [
        {
          id: 'savas',
          label: 'Meydanda karşıla',
          outcome:
            'Gaziler cesaretle savaşıyor, Bizans ordusu dağılıyor. Ganimet ve itibar kazandın.',
          effects: [
            { type: 'morale', amount: 15 },
            { type: 'treasury', amount: 10 },
          ],
        },
        {
          id: 'cekil',
          label: 'Kalelere çekil',
          outcome:
            'Askerler isteksiz. Bizans ordusu bölgede serbestçe dolaşıyor, ordunun morali düşüyor.',
          effects: [{ type: 'morale', amount: -10 }],
        },
      ],
      historical: {
        choiceId: 'savas',
        note: "Temmuz 1302'de Osman Bey'in kuvvetleri, Bizans'ın Nikomedia (İzmit) yönünden gönderdiği orduyla Koyunhisar (Bafeus) yakınlarında karşılaştı ve onu yendi. Bu zafer, Osman'ın itibarını artırdı ve Bizans'ı bölgede savunmaya itti.",
      },
    },
    {
      id: 'bursa-dususu',
      title: "Bursa'nın Düşüşü",
      description:
        "Uzun süren kuşatmanın ardından Bursa'nın kapıları açılıyor. Şehir halkı kaderini senden bekliyor. Bursa'yı ne yapacaksın?",
      trigger: { type: 'ownsProvince', provinceId: 'tur-bursa' },
      choices: [
        {
          id: 'koru',
          label: 'Halka aman ver, şehri beyliğin merkezi yap',
          outcome:
            'Halk sana bağlanıyor, çarşılar canlanıyor ve hazine düzenli gelir sağlıyor. Ordu da düzenli maaşla memnun.',
          effects: [
            { type: 'treasury', amount: 20 },
            { type: 'morale', amount: 5 },
          ],
        },
        {
          id: 'yagma',
          label: 'Askerlere yağma izni ver',
          outcome:
            'Hazine hemen doluyor ama şehir harap oluyor; yeni tebaanın güvenini kazanmak zorlaşıyor.',
          effects: [{ type: 'treasury', amount: 35 }],
        },
      ],
      historical: {
        choiceId: 'koru',
        note: "Bursa, uzun bir kuşatmadan sonra 1326'da Orhan Bey'e teslim oldu ve şehir halkına dokunulmadı. Bursa ilk Osmanlı başkenti oldu; ilk Osmanlı gümüş sikkesi akçenin de Orhan döneminde basıldığı kabul edilir.",
      },
    },
  ],
  // TODO(kaynak): 1330'da Osmanlı elindeki yerler ve fetih tarihleri doğrulanmalı (D6).
  historical: {
    provinces: ['tur-bilecik', 'tur-eskisehir', 'tur-bursa'],
    note: "Osman Bey'in ölümünün ardından oğlu Orhan, uzun kuşatmanın sonunda 1326'da Bursa'yı aldı; Bursa ilk Osmanlı başkenti oldu.",
  },
  playerFactionId: 'osmanli',
  factions: {
    osmanli: {
      name: 'Osmanlı Beyliği',
      color: '#b91c1c',
      treasury: 20,
      provinces: ['tur-bilecik', 'tur-eskisehir'],
      armies: [
        { provinceId: 'tur-bilecik', units: { sipahi: 600, akinci: 400 } },
      ],
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
        { provinceId: 'tur-bursa', units: { sipahi: 600, akinci: 400 } },
        { provinceId: 'tur-kocaeli', units: { sipahi: 500, akinci: 300 } },
      ],
    },
    germiyan: {
      name: 'Germiyanoğulları',
      color: '#15803d',
      treasury: 40,
      provinces: ['tur-kutahya', 'tur-afyonkarahisar', 'tur-usak'],
      armies: [
        { provinceId: 'tur-kutahya', units: { sipahi: 600, akinci: 400 } },
      ],
    },
    karesi: {
      name: 'Karesioğulları',
      color: '#0e7490',
      treasury: 15,
      provinces: ['tur-balikesir', 'tur-canakkale'],
      armies: [
        { provinceId: 'tur-balikesir', units: { sipahi: 600, akinci: 400 } },
      ],
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
      armies: [
        { provinceId: 'tur-karaman', units: { sipahi: 600, akinci: 400 } },
      ],
    },
    candar: {
      name: 'Candaroğulları',
      color: '#be185d',
      treasury: 15,
      provinces: ['tur-kastamonu'],
    },
  },
};
