import type { Citation } from '../sources';
import { PLACES } from '../world/places';

export type EntryCategory = 'person' | 'institution' | 'battle' | 'place';

export interface EncyclopediaEntry {
  id: string;
  title: string;
  category: EntryCategory;
  /** Listelerde görünen tek cümlelik özet. */
  summary: string;
  /** Madde metni, paragraf paragraf. */
  body: string[];
  /** Oyunda nasıl karşılık bulduğu (öğretici bağ). */
  inGame?: string;
  /** İlgili madde kimlikleri. */
  related: string[];
  /** Kaynaklar (D6). */
  sources: Citation[];
}

export const CATEGORY_LABELS: Record<EntryCategory, string> = {
  person: 'Kişiler',
  institution: 'Kurumlar',
  battle: 'Savaşlar',
  place: 'Yerler',
};

/** Haritadaki bir yerin madde kimliği. */
export const placeEntryId = (placeId: string) => `place-${placeId}`;

/**
 * Elle yazılmış maddeler. Tarihler ve ifadeler genel kabul gören bilgilerdir,
 * tartışmalı noktalar metinde belirtilmiştir.
 *
 * Her maddenin kaynakları `sources` alanındadır (bkz. `content/sources.ts`).
 * TODO(kaynak): Sayfa numaraları ve tarihçi denetimi eklenecek.
 */
const WRITTEN: EncyclopediaEntry[] = [
  {
    id: 'osman-gazi',
    title: 'Osman Bey (Osman Gazi)',
    category: 'person',
    summary:
      "Osmanlı Beyliği'nin kurucusu; Söğüt merkezli uç beyliğini Bizans topraklarına doğru büyüttü.",
    body: [
      "Ertuğrul Gazi'nin oğludur. Doğum ve ölüm tarihleri kesin değildir; ölümü kaynaklarda genellikle 1323–1326 arasında gösterilir.",
      'Beyliğin 1299 civarında bağımsız hâle geldiği geleneksel olarak kabul edilir; bu tarih tarihçiler arasında tartışmalıdır.',
      "1302'de Koyunhisar (Bafeus) yakınlarında bir Bizans ordusunu yendi.",
    ],
    inGame: '1299 · Kuruluş senaryosunda oyuncunun hükümdarıdır.',
    related: ['orhan-gazi', 'koyunhisar', placeEntryId('sogut')],
    sources: [
      { source: 'kafadar-two-worlds' },
      { source: 'lindner-prehistory' },
      { source: 'asikpasazade' },
      { source: 'tdv-ia', locator: '“Osman Gazi” maddesi' },
    ],
  },
  {
    id: 'orhan-gazi',
    title: 'Orhan Bey (Orhan Gazi)',
    category: 'person',
    summary:
      "Osman Bey'in oğlu ve halefi; Bursa, İznik ve İzmit onun döneminde alındı.",
    body: [
      "Bursa 1326'da uzun bir kuşatmanın sonunda Orhan'a teslim oldu ve beyliğin merkezi oldu.",
      "İznik 1331'de, İzmit 1337'de Osmanlı hâkimiyetine geçti.",
      'İlk Osmanlı gümüş sikkesi (akçe) ve ilk düzenli piyade birlikleri (yaya) onun dönemine bağlanır.',
    ],
    inGame: '1299 senaryosunda veliaht şehzadedir.',
    related: ['osman-gazi', 'bursa-fethi', 'akce', 'yaya'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'asikpasazade' },
      { source: 'tdv-ia', locator: '“Orhan Gazi” maddesi' },
    ],
  },
  {
    id: 'timar',
    title: 'Tımar sistemi',
    category: 'institution',
    summary:
      'Bir bölgenin vergi gelirinin, savaşa atlı asker getirme karşılığında bir askere bırakılması.',
    body: [
      'Tımar sahibi (tımarlı sipahi) gelirini doğrudan bölgesinden toplar, sefer zamanı kendisi ve geliriyle orantılı sayıda atlı askerle orduya katılırdı.',
      'Böylece hazineden maaş ödenmeden büyük bir süvari ordusu beslenmiş; taşra yönetimi ve vergi toplama da aynı düzenle yürütülmüştür.',
    ],
    inGame: 'Sipahiler hazineden maaş almaz.',
    related: ['sipahi', 'kapikulu', 'cizye-osur'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'imber-structure' },
      { source: 'tdv-ia', locator: '“Tımar” maddesi' },
    ],
  },
  {
    id: 'sipahi',
    title: 'Tımarlı sipahi',
    category: 'institution',
    summary: 'Tımar geliriyle geçinen, Osmanlı ordusunun ana atlı gücü.',
    body: [
      'Taşrada tımar sahibi olan atlı askerlerdir; sefere kendi donanımı ve yanında getirdiği askerlerle katılırdı.',
    ],
    inGame: 'Güçlü süvari; maaş istemez. 100 asker 10 akçe.',
    related: ['timar', 'akinci'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'tdv-ia', locator: '“Sipahi” maddesi' },
    ],
  },
  {
    id: 'akinci',
    title: 'Akıncılar',
    category: 'institution',
    summary:
      'Sınır boylarında düşman topraklarına akınlar düzenleyen hafif süvariler.',
    body: [
      'Uç bölgelerinde yaşayan akıncılar, düşman topraklarına keşif ve yıpratma akınları yapar, büyük ölçüde ganimetle geçinirdi.',
    ],
    inGame:
      'Ucuz ve maaş istemeyen ama savunmada zayıf birlik. 100 asker 4 akçe.',
    related: ['sipahi'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'tdv-ia', locator: '“Akıncı” maddesi' },
    ],
  },
  {
    id: 'yaya',
    title: 'Yaya ve müsellem',
    category: 'institution',
    summary:
      'Orhan Bey döneminde kurulduğu kabul edilen ilk düzenli birlikler.',
    body: [
      'Yaya piyade, müsellem atlı birliklerdi; seferde ücret alır, barışta vergi muafiyetiyle yaşarlardı. Yeniçeri ocağı kurulduktan sonra önemlerini yitirdiler.',
    ],
    inGame: "1330'dan itibaren devşirilebilir; maaşlıdır.",
    related: ['orhan-gazi', 'yeniceri', 'kapikulu'],
    sources: [{ source: 'inalcik-klasik-cag' }, { source: 'imber-structure' }],
  },
  {
    id: 'kapikulu',
    title: 'Kapıkulu',
    category: 'institution',
    summary:
      'Doğrudan hükümdara bağlı, hazineden maaş (ulufe) alan sürekli askerler ve görevliler.',
    body: [
      'Yeniçeriler, topçular ve kapıkulu süvarileri gibi birliklerden oluşur; tımar yerine hazineden düzenli ulufe alırlardı.',
    ],
    inGame:
      'Yaya, yeniçeri ve topçu her tur maaş alır; ödenmezse moral düşer, asker kaçar, yeniçeriler ayaklanır.',
    related: ['yeniceri', 'topcu', 'devsirme', 'timar'],
    sources: [
      { source: 'imber-structure' },
      { source: 'tdv-ia', locator: '“Kapıkulu” maddesi' },
    ],
  },
  {
    id: 'devsirme',
    title: 'Devşirme',
    category: 'institution',
    summary:
      'Hristiyan tebaanın çocuklarından seçilenlerin eğitilerek kapıkulu askeri ya da devlet görevlisi yapılması.',
    body: [
      'Seçilen çocuklar Türk ailelerin yanında dil ve din eğitimi aldıktan sonra saray ya da ocak hizmetine alınırdı. Düzenli uygulamanın 14. yüzyılın sonlarında başladığı kabul edilir.',
    ],
    related: ['yeniceri', 'kapikulu'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'imber-structure' },
      { source: 'tdv-ia', locator: '“Devşirme” maddesi' },
    ],
  },
  {
    id: 'yeniceri',
    title: 'Yeniçeri Ocağı',
    category: 'institution',
    summary: 'Kapıkulu piyade ocağı; zamanla Osmanlı ordusunun çekirdeği oldu.',
    body: [
      'I. Murad döneminde kurulduğu kabul edilir. Ocak, sonraki yüzyıllarda siyasette de etkili oldu ve maaş ya da düzen değişiklikleri yüzünden pek çok kez ayaklandı.',
    ],
    inGame: "1363'ten sonra devşirilebilir; güçlü ama pahalı ve maaşlıdır.",
    related: ['devsirme', 'kapikulu'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'imber-structure' },
      { source: 'tdv-ia', locator: '“Yeniçeri” maddesi' },
    ],
  },
  {
    id: 'topcu',
    title: 'Topçular',
    category: 'institution',
    summary: 'Kuşatmalarda belirleyici olan ateşli silah birlikleri.',
    body: [
      'Ateşli silahların Osmanlı ordusunda 14. yüzyılın sonlarından itibaren kullanıldığı kabul edilir; topçu ocağı sonraki yüzyılda kurumsallaştı.',
    ],
    inGame:
      "1400'den itibaren devşirilebilir; ordudaki oranı kuşatma süresini kısaltır.",
    related: ['kapikulu'],
    sources: [{ source: 'imber-structure' }, { source: 'finkel-osmans-dream' }],
  },
  {
    id: 'akce',
    title: 'Akçe',
    category: 'institution',
    summary:
      'Osmanlı gümüş sikkesi; ilk örneklerinin Orhan döneminde basıldığı kabul edilir.',
    body: [
      'Zamanla sikkedeki gümüş oranının düşürülmesi (tağşiş) fiyatların artmasına, yani enflasyona yol açtı.',
    ],
    inGame: 'Oyunun para birimidir.',
    related: ['orhan-gazi'],
    sources: [
      { source: 'pamuk-monetary' },
      { source: 'tdv-ia', locator: '“Akçe” maddesi' },
    ],
  },
  {
    id: 'divan',
    title: 'Divan',
    category: 'institution',
    summary: 'Devlet işlerinin görüşülüp karara bağlandığı kurul.',
    body: [
      'Vezirler, kazaskerler, defterdar ve nişancıdan oluşan Divan-ı Hümayun 15. yüzyılda kurumsallaştı; erken dönemde daha küçük bir yönetim çevresi vardı.',
    ],
    inGame: "Oyunda 1320'den sonra vezir atanabilir (basitleştirme).",
    related: ['sadrazam'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'tdv-ia', locator: '“Dîvân-ı Hümâyun” maddesi' },
    ],
  },
  {
    id: 'sadrazam',
    title: 'Vezir ve sadrazam',
    category: 'institution',
    summary: 'Hükümdarın yönetimdeki yardımcısı; vezirlerin başı sadrazamdır.',
    body: [
      'Sadrazam (vezir-i azam), padişahın mutlak vekili sayılır ve divana başkanlık ederdi.',
    ],
    inGame: 'Vezir sadakati ve geliri artırır.',
    related: ['divan'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'tdv-ia', locator: '“Sadrazam” maddesi' },
    ],
  },
  {
    id: 'taht-kavgasi',
    title: 'Taht kavgaları',
    category: 'institution',
    summary:
      'Hükümdarın ölümünden sonra şehzadeler arasında yaşanan taht mücadeleleri.',
    body: [
      'Osmanlı’da belirli bir veraset kuralı olmadığından taht şehzadeler arasında mücadeleyle el değiştirebilirdi. En bilinen örnek, 1402 Ankara Savaşı’nın ardından gelen Fetret Devri’dir (1402–1413).',
    ],
    inGame:
      'Hükümdar ölünce birden çok hak sahibi yetişkin şehzade varsa taht kavgası sadakati sarsar.',
    related: ['osman-gazi'],
    sources: [{ source: 'kastritsis-sons' }, { source: 'finkel-osmans-dream' }],
  },
  {
    id: 'celali',
    title: 'Celali isyanları',
    category: 'institution',
    summary:
      "16. yüzyılın sonundan 17. yüzyılın ortasına kadar Anadolu'da görülen yaygın isyanlar.",
    body: [
      'Ekonomik sıkıntılar, işsiz kalan askerler ve taşra düzenindeki bozulma bu isyanların başlıca nedenleri arasında sayılır.',
    ],
    inGame:
      "1590'dan sonra sadakat çok düşerse çıkan isyanlar Celali isyanı olarak görünür.",
    related: ['timar'],
    sources: [
      { source: 'barkey-bandits' },
      { source: 'tdv-ia', locator: '“Celâlî İsyanları” maddesi' },
    ],
  },
  {
    id: 'cizye-osur',
    title: 'Cizye ve öşür',
    category: 'institution',
    summary:
      'Gayrimüslimlerden alınan baş vergisi (cizye) ve tarım ürünlerinden alınan vergi (öşür).',
    body: [
      'Öşür, ürünün belli bir payı olarak alınan tarım vergisiydi; cizye ise askerlik yapmayan gayrimüslim erkeklerden alınırdı.',
    ],
    inGame:
      'Oyunda henüz ayrı ayrı yok; bölge vergisi tarım ve şehir gelirini birlikte temsil eder.',
    related: ['timar', 'harac'],
    sources: [
      { source: 'inalcik-klasik-cag' },
      { source: 'tdv-ia', locator: '“Cizye” maddesi' },
      { source: 'tdv-ia', locator: '“Öşür” maddesi' },
    ],
  },
  {
    id: 'harac',
    title: 'Haraç',
    category: 'institution',
    summary:
      'Hem gayrimüslimlerin toprak vergisi hem de bağımlı devletlerin ödediği yıllık bedel.',
    body: [
      'Osmanlı kullanımında haraç sözcüğü farklı vergiler için kullanılmıştır; bağımlı devletlerin ödediği yıllık vergi de bu adla anılırdı.',
    ],
    inGame:
      'Barış antlaşmalarında taraflardan birinin her tur ödediği bedeldir.',
    related: ['cizye-osur'],
    sources: [{ source: 'tdv-ia', locator: '“Haraç” maddesi' }],
  },
  {
    id: 'koyunhisar',
    title: 'Koyunhisar (Bafeus) Savaşı, 1302',
    category: 'battle',
    summary: "Osman Bey'in bir Bizans ordusunu yendiği, adını duyurduğu savaş.",
    body: [
      "Temmuz 1302'de Osman Bey'in kuvvetleri, İzmit (Nikomedia) yönünden gelen bir Bizans ordusunu Koyunhisar yakınlarında yendi. Zafer, Osman'ın bölgedeki itibarını artırdı.",
    ],
    inGame:
      '1299 senaryosunda 1302 yazında karşına bir karar kartı olarak çıkar.',
    related: ['osman-gazi', placeEntryId('izmit')],
    sources: [
      { source: 'pachymeres' },
      { source: 'lindner-prehistory' },
      { source: 'kafadar-two-worlds' },
    ],
  },
  {
    id: 'bursa-fethi',
    title: "Bursa'nın fethi, 1326",
    category: 'battle',
    summary:
      "Uzun bir kuşatmanın ardından Bursa'nın Orhan Bey'e teslim olması.",
    body: [
      "Bursa yıllarca kuşatma altında kaldıktan sonra 1326'da teslim oldu ve Osmanlı Beyliği'nin merkezi oldu.",
    ],
    inGame: '1299 senaryosunun hedeflerinden biridir.',
    related: ['orhan-gazi', placeEntryId('bursa')],
    sources: [
      { source: 'asikpasazade' },
      { source: 'inalcik-klasik-cag' },
      { source: 'finkel-osmans-dream' },
    ],
  },
];

/** Haritadaki her yer (şehir, kale, boğaz) için kendiliğinden oluşan madde. */
function placeEntries(): EncyclopediaEntry[] {
  return PLACES.map((place) => ({
    id: placeEntryId(place.id),
    title: place.name,
    category: 'place' as const,
    summary:
      place.note ??
      (place.kind === 'strait' ? 'Boğaz.' : `${place.name} şehri.`),
    body: [
      ...(place.note ? [place.note] : []),
      ...(place.fortification
        ? [
            `Surları oyunda ${place.fortification}. seviye kale sayılır: savunana bonus verir ve kuşatmayı uzatır.`,
          ]
        : []),
    ],
    related: mentioning(place.id).map((e) => e.id),
    sources: [
      { source: 'natural-earth', locator: 'konum (yaklaşık)' },
      ...mentioning(place.id).flatMap((e) => e.sources),
    ],
  }));
}

/** Bir yerden söz eden elle yazılmış maddeler. */
function mentioning(placeId: string): EncyclopediaEntry[] {
  return WRITTEN.filter((e) => e.related.includes(placeEntryId(placeId)));
}

export const ENTRIES: EncyclopediaEntry[] = [...WRITTEN, ...placeEntries()];

export function getEntry(id: string): EncyclopediaEntry | undefined {
  return ENTRIES.find((e) => e.id === id);
}

/** Başlık ve özette arar (Türkçe büyük/küçük harf duyarsız). */
export function searchEntries(
  query: string,
  category?: EntryCategory,
): EncyclopediaEntry[] {
  const q = query.trim().toLocaleLowerCase('tr');
  return ENTRIES.filter(
    (e) =>
      (!category || e.category === category) &&
      (!q ||
        e.title.toLocaleLowerCase('tr').includes(q) ||
        e.summary.toLocaleLowerCase('tr').includes(q)),
  ).sort((a, b) => a.title.localeCompare(b.title, 'tr'));
}
