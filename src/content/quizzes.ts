import type { GameState } from '@/engine';

/**
 * Mini quiz soruları (D5). Her soru bir ansiklopedi maddesine dayanır;
 * açıklama ve "devamını oku" bağlantısı o maddeye gider.
 */
export interface Quiz {
  id: string;
  question: string;
  options: string[];
  /** Doğru seçeneğin sırası (0'dan). */
  answer: number;
  /** Cevaptan sonra gösterilen kısa açıklama. */
  explanation: string;
  /** İlgili ansiklopedi maddesi. */
  entryId: string;
  /** Bu yıldan önce sorulmaz (oyunda henüz yaşanmamış olayları ele vermemek için). */
  minYear?: number;
}

export const QUIZZES: Quiz[] = [
  {
    id: 'kurucu',
    question: "Osmanlı Beyliği'nin kurucusu kimdir?",
    options: ['Orhan Bey', 'Ertuğrul Gazi', 'Osman Bey'],
    answer: 2,
    explanation:
      "Beyliğin kurucusu Ertuğrul Gazi'nin oğlu Osman Bey'dir; beylik onun adıyla anılır.",
    entryId: 'osman-gazi',
  },
  {
    id: 'timar',
    question: 'Tımarlı sipahi geçimini nasıl sağlardı?',
    options: [
      'Hazineden aldığı düzenli maaşla',
      'Kendisine bırakılan bölgenin vergi geliriyle',
      'Yalnızca savaş ganimetiyle',
    ],
    answer: 1,
    explanation:
      'Tımar sahibi bölgesinin vergi gelirini toplar, karşılığında sefere atlı asker getirirdi.',
    entryId: 'timar',
  },
  {
    id: 'akinci',
    question: 'Akıncılar ne tür bir askerî birlikti?',
    options: [
      'Kalelerde nöbet tutan piyadeler',
      'Sınır boylarında akın düzenleyen hafif süvariler',
      'Donanmada görevli denizciler',
    ],
    answer: 1,
    explanation:
      'Akıncılar uç bölgelerinde düşman topraklarına akınlar yapan hafif süvarilerdi.',
    entryId: 'akinci',
  },
  {
    id: 'kapikulu',
    question: 'Kapıkulu askerlerini tımarlı sipahiden ayıran neydi?',
    options: [
      'Hazineden düzenli maaş (ulufe) almaları',
      'Kendi topraklarının vergisini toplamaları',
      'Yalnızca barış zamanı görev yapmaları',
    ],
    answer: 0,
    explanation:
      'Kapıkulu askerleri doğrudan hükümdara bağlıydı ve hazineden ulufe alırdı.',
    entryId: 'kapikulu',
  },
  {
    id: 'yeniceri',
    question:
      "Yeniçeri Ocağı'nın hangi hükümdar döneminde kurulduğu kabul edilir?",
    options: ['Osman Bey', 'I. Murad', 'II. Mehmed'],
    answer: 1,
    explanation:
      'Yeniçeri Ocağı’nın I. Murad döneminde kurulduğu kabul edilir.',
    entryId: 'yeniceri',
  },
  {
    id: 'devsirme',
    question: 'Devşirme ile toplanan çocuklar ne olurdu?',
    options: [
      'Tımar sahibi yapılırdı',
      'Eğitilerek kapıkulu askeri ya da devlet görevlisi olurdu',
      'Akıncı birliklerine katılırdı',
    ],
    answer: 1,
    explanation:
      'Devşirilen çocuklar eğitildikten sonra ocak ya da saray hizmetine alınırdı.',
    entryId: 'devsirme',
  },
  {
    id: 'akce',
    question: 'Akçe neydi?',
    options: ['Osmanlı gümüş sikkesi', 'Bir tarım vergisi', 'Bir kale türü'],
    answer: 0,
    explanation:
      'Akçe Osmanlı gümüş sikkesiydi; ilk örneklerinin Orhan döneminde basıldığı kabul edilir.',
    entryId: 'akce',
  },
  {
    id: 'sadrazam',
    question:
      'Vezirlerin başı olan ve padişahın mutlak vekili sayılan görevli kimdir?',
    options: ['Kadı', 'Sadrazam', 'Defterdar'],
    answer: 1,
    explanation: 'Sadrazam (vezir-i azam) padişahın mutlak vekili sayılırdı.',
    entryId: 'sadrazam',
  },
  {
    id: 'fetret',
    question:
      "1402 Ankara Savaşı'nın ardından şehzadeler arasında yaşanan taht mücadelesi dönemine ne ad verilir?",
    options: ['Fetret Devri', 'Lale Devri', 'Tanzimat Dönemi'],
    answer: 0,
    explanation:
      'Ankara Savaşı’ndan sonra 1402–1413 arasındaki taht mücadelesine Fetret Devri denir.',
    entryId: 'taht-kavgasi',
  },
  {
    id: 'cizye',
    question: 'Cizye kimlerden alınan bir vergiydi?',
    options: [
      'Askerlik yapmayan gayrimüslim erkeklerden',
      'Bütün tüccarlardan',
      'Yalnızca tımar sahiplerinden',
    ],
    answer: 0,
    explanation:
      'Cizye, askerlik yapmayan gayrimüslim erkeklerden alınan baş vergisiydi.',
    entryId: 'cizye-osur',
  },
  {
    id: 'koyunhisar',
    question: 'Koyunhisar (Bafeus) Savaşı’nda Osman Bey kime karşı savaştı?',
    options: ['Bir Bizans ordusuna', 'Germiyanoğullarına', 'Karamanoğullarına'],
    answer: 0,
    explanation:
      '1302’de Osman Bey’in kuvvetleri İzmit yönünden gelen bir Bizans ordusunu yendi.',
    entryId: 'koyunhisar',
    minYear: 1302,
  },
  {
    id: 'bursa',
    question: 'Bursa hangi yıl Osmanlılara teslim oldu?',
    options: ['1299', '1326', '1453'],
    answer: 1,
    explanation:
      "Bursa uzun bir kuşatmanın ardından 1326'da Orhan Bey'e teslim oldu.",
    entryId: 'bursa-fethi',
    minYear: 1326,
  },
];

export function getQuiz(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id);
}

/** Bu oyunda henüz sorulmamış ve zamanı gelmiş ilk soru. */
export function nextQuiz(game: GameState): Quiz | undefined {
  const answered = game.quizzes?.answered ?? {};
  return QUIZZES.find(
    (q) => !(q.id in answered) && (q.minYear ?? 0) <= game.date.year,
  );
}

/** Motorun bildiği kısım: kimlik ve doğru seçenek. */
export function quizAnswers(): { id: string; answer: number }[] {
  return QUIZZES.map(({ id, answer }) => ({ id, answer }));
}
