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
        sources: [{ source: 'pachymeres' }, { source: 'lindner-prehistory' }],
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
        sources: [{ source: 'asikpasazade' }, { source: 'inalcik-klasik-cag' }],
        note: "Bursa, uzun bir kuşatmadan sonra 1326'da Orhan Bey'e teslim oldu ve şehir halkına dokunulmadı. Bursa ilk Osmanlı başkenti oldu; ilk Osmanlı gümüş sikkesi akçenin de Orhan döneminde basıldığı kabul edilir.",
      },
    },
  ],
  // TODO(kaynak): Kronolojideki tarihler genel kabul gören tarihlerdir;
  // tartışmalı olanlar metinde belirtilmiştir (D6).
  chronicle: [
    {
      year: 1299,
      text: "Geleneksel olarak Osmanlı Beyliği'nin kuruluş yılı kabul edilir; bu tarih tarihçiler arasında tartışmalıdır.",
      sources: [{ source: 'kafadar-two-worlds' }],
    },
    {
      year: 1302,
      dateLabel: 'Temmuz 1302',
      text: "Koyunhisar (Bafeus) Savaşı: Osman Bey'in kuvvetleri İzmit yönünden gelen bir Bizans ordusunu yendi.",
      sources: [{ source: 'pachymeres' }],
    },
    {
      year: 1324,
      dateLabel: "1320'lerin ortası",
      text: 'Osman Bey öldü, yerine oğlu Orhan geçti. Kesin yıl kaynaklarda 1323–1326 arasında değişir.',
      sources: [{ source: 'inalcik-klasik-cag' }],
    },
    {
      year: 1326,
      text: "Bursa uzun bir kuşatmanın ardından Orhan Bey'e teslim oldu ve beyliğin merkezi oldu.",
      sources: [{ source: 'asikpasazade' }],
    },
    {
      year: 1329,
      text: "Pelekanon (Maltepe) Savaşı: Orhan Bey, İmparator III. Andronikos'un ordusunu yendi.",
      sources: [{ source: 'finkel-osmans-dream' }],
    },
  ],
  // TODO(kaynak): 1330'da Osmanlı elindeki yerler ve fetih tarihleri doğrulanmalı (D6).
  historical: {
    provinces: ['tur-bilecik', 'tur-eskisehir', 'tur-bursa'],
    note: "Osman Bey'in ölümünün ardından oğlu Orhan, uzun kuşatmanın sonunda 1326'da Bursa'yı aldı; Bursa ilk Osmanlı başkenti oldu.",
  },
  // TODO(kaynak): 1299'daki ilişkiler sadeleştirilmiştir; Osmanlı'nın Bizans
  // tekfurlarıyla mücadelesi esas alınmış, beylikler arası ilişkiler barış
  // varsayılmıştır (D6).
  relations: {
    default: 'peace',
    pairs: [
      {
        a: 'osmanli',
        b: 'bizans',
        relation: 'war',
        note: 'Uç beyliği ile Bizans tekfurları arasında süregelen akın ve sınır savaşları.',
      },
    ],
  },
  // TODO(kaynak): Doğum yılları geleneksel tarihlerdir ve tartışmalıdır
  // (Osman ~1258, Orhan ~1281). Beceri puanları tarihî veri değil, oyun
  // değeridir. Alâeddin'in tahtta hak iddia etmediği rivayeti esas alındı.
  court: {
    ruler: {
      id: 'osman',
      name: 'Osman Bey',
      born: 1258,
      military: 4,
      administration: 3,
    },
    heirs: [
      {
        id: 'orhan',
        name: 'Orhan',
        born: 1281,
        military: 4,
        administration: 4,
      },
      {
        id: 'alaeddin',
        name: 'Alâeddin',
        born: 1285,
        military: 2,
        administration: 4,
        claimsThrone: false,
      },
    ],
    stability: 60,
    names: [
      'Süleyman',
      'Murad',
      'Halil',
      'İbrahim',
      'Kasım',
      'Yusuf',
      'Ahmed',
      'Mahmud',
      'Hasan',
      'Hüseyin',
    ],
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
      // Gerileme dönemindeki Bizans: temkinli, az devşirir (tarihî seyir).
      ai: { aggression: 2, recruitShare: 0.1 },
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
        { provinceId: 'tur-bursa', units: { sipahi: 700, akinci: 500 } },
        { provinceId: 'tur-kocaeli', units: { sipahi: 500, akinci: 300 } },
      ],
    },
    germiyan: {
      name: 'Germiyanoğulları',
      color: '#15803d',
      ai: { warlike: 0.03 },
      treasury: 40,
      provinces: ['tur-kutahya', 'tur-afyonkarahisar', 'tur-usak'],
      armies: [
        { provinceId: 'tur-kutahya', units: { sipahi: 600, akinci: 400 } },
      ],
    },
    karesi: {
      name: 'Karesioğulları',
      color: '#0e7490',
      ai: { warlike: 0.03 },
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
      ai: { warlike: 0.03 },
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
