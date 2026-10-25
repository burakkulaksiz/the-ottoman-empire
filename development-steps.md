# Devlet-i Âliyye — Geliştirme Adımları

- **Oyun:** Gerçek haritalı, tarih öğrenimine katkı sağlayan strateji oyunu.
- **Mimari referansı:** [React Application Architecture for Production (2. Baskı)](https://github.com/PacktPublishing/React-Application-Architecture-for-Production-Second-Edition)
- **Gelecek:** Backend sonradan bağlanacak (bkz. G1).

## Nasıl kullanılır

- Bir madde bitince `[ ]` işaretini `[x]` yapın; kısmen bitenlerin altına alt görev ekleyin.
- Madde kodları (A1, B2, C4 …) sabittir; commit mesajlarında ve konuşmalarda bu kodlarla anılır.
- Bir maddeye başlarken önce o maddenin bağımlılıklarına (varsa "Önerilen sıra"ya) bakın.

## İlerleme özeti

| Bölüm            | Biten  | Toplam |
| ---------------- | ------ | ------ |
| A. Altyapı       | 5      | 5      |
| B. Harita        | 2      | 5      |
| C. Mekanikler    | 9      | 10     |
| D. Tarih öğrenme | 7      | 7      |
| E. Arayüz        | 2      | 5      |
| F. Kalite        | 1      | 5      |
| G. İleride       | 0      | 4      |
| **Toplam**       | **26** | **41** |

> Tabloyu madde işaretlerken güncelleyin.

## Önerilen sıra (MVP)

Oynanabilir ilk sürüm için:

**A1 → A2 → B1 → B2 → C1 → C2 (tek senaryo) → C4 + C5 → C3 → D1 → E1**

> **MVP durumu:** Oynanabilir ilk sürümün tüm adımları tamam: haritada ordu seçip komşu bölgeye yürütülüyor, savaş/fetih/kuşatma çözülüyor, olay kartı çıkıyor, hedeflere göre zafer/yenilgi belirleniyor. Rakipler sezgisel yapay zekâyla oynuyor (C9). Kayıt/yükleme var (A4). Eksik: arazi/kale verisi (B4), ekonomi (C6), diplomasi (C7).

Böylece en kısa yoldan haritada birlik yürütüp savaş kazanılan ya da kaybedilen ve bir tarihi olay kartı çıkan bir oyun elde ederiz. Diğer maddeler bunun üzerine eklenir.

**Sıradaki madde:** E5 (mobil ve tablet uyumu) veya B5 (hareket okları, sis perdesi); kalite tarafında F4 (performans, paket analizi) ve CI (GitHub Actions ile birim + E2E)

---

## A. Altyapı

- [x] **A1. Projeyi kurmak:** Vite, React Router 7 (SPA), TypeScript, Tailwind ve shadcn. ESLint, Prettier ve Husky ayarları ile referans repodaki klasör yapısı.
- [x] **A2. Oyun motorunun iskeleti:** oyun durumu modeli, komutlar (hamle ve emirler), tur döngüsü ve tohumlu rastgele sayı üreteci (RNG).
- [x] **A3. Durum yönetimi:** Zustand ve Immer ile motor ve arayüz arasındaki köprü, Web Worker entegrasyonu.
  - _Yapıldı: motor Web Worker'da çalışır (`src/workers`, Comlink); `src/stores/game-store.ts` Zustand + Immer ile anlık görüntüyü, son günlüğü, komut hatasını ve seçili bölgeyi tutar. Komutlar sırayla işlenir. Worker olmayan ortamda (test) aynı kod yerel çalışır. Kayıttan devam için `load` hazır, kayıt yuvaları A4'te._
- [x] **A4. Kayıt ve yükleme:** IndexedDB üzerinde, otomatik kayıt ve birden fazla kayıt yuvasıyla.
  - _Yapıldı: Dexie ile IndexedDB (`src/lib/saves`), otomatik kayıt (her tur sonunda) + 3 elle yuva, oyun içi "Kaydet" menüsü, `/saves` sayfası (yükle/sil), ana menüde "Devam Et", `/play/:id?slot=` ile devam. Yüklenen kayıt `validateSavedState` ile dünyayla uyumlu mu diye denetlenir; kayıt sürümü `GameState.version`._
- [x] **A5. Çoklu dil (i18n):** Türkçe ana dil, İngilizce opsiyonel.
  - _Yapıldı: kütüphanesiz, tipli sözlükler (`src/lib/i18n`: `tr.ts` ana dil, `en.ts` aynı anahtarları tip zorunluluğuyla taşır), `{param}` doldurma, eksik çeviride Türkçeye düşme. Dil seçimi ana menüde (Türkçe/English), tarayıcıda hatırlanır, `<html lang>` güncellenir; kayıtlı dil hydration'dan sonra uygulanır. Tüm arayüz metinleri (menüler, HUD, paneller, kartlar, günlük, kronik, kayıtlar, başarım ve ansiklopedi sayfaları) çevrildi. Tarih içeriği (senaryolar, olaylar, ansiklopedi, sorular) şimdilik yalnızca Türkçe; İngilizce modda bu not gösterilir. Testler: anahtar/yer tutucu eşliği, dil değiştirme (birim + E2E)._

## B. Gerçek dünya haritası

- [x] **B1. MapLibre ile temel harita:** Balkanlar, Anadolu, Orta Doğu ve Kuzey Afrika. Yakınlaştırma ve kaydırma, oyuna uygun tarihi bir stil.
- [x] **B2. Bölge (sancak/eyalet) katmanı:** tıklanabilir, sahibine göre renklenen, komşuluk ilişkileri tanımlı GeoJSON. Komşuluk bilgisi hareket ve ikmal için gerekli.
  - _Not: Tarihî sancak verisi açık kaynakta yok; şimdilik Natural Earth modern idari bölümleri (623 bölge) yer tutucu olarak kullanılıyor, komşuluk ortak kenarlardan otomatik üretiliyor (`npm run data:provinces`). Boğaz/ada bağlantıları B4'te, tarihî sınırlar B3'te gelecek._
- [ ] **B3. Yıla göre tarihi sınırlar:** açık veri kullanılabilir, örneğin historical-basemaps GeoJSON setleri.
- [ ] **B4. Şehirler, kaleler, boğazlar, nehirler ve ticaret yolları:** hem görsel hem de oyun kurallarına etki edecek.
  - [x] Şehirler ve kaleler: 28 yer (`content/world/places.ts`), haritada işaretli; bir bölgenin kale seviyesi içindeki yerlerin en yükseğidir ve savunma bonusu + kuşatma süresi olarak çalışır
  - [x] Arazi: bölge düzeyinde ova/engebeli/dağlık (`content/world/terrain.ts`), savunana çarpan verir
  - [x] Nehirler: büyük nehirler haritada çizilir (`npm run data:rivers`); henüz oyun kuralına etkisi yok
  - [x] Ticaret yolları: 3 şematik yol haritada çizilir; kural/gelir C6'da
  - [ ] Boğazlar: İstanbul ve Çanakkale boğazları haritada işaretli, ama modern il sınırları iki yakayı tek bölgede tuttuğu için geçiş kuralı yok (donanma ve deniz bölgeleri gelince)
  - [ ] Nehir geçişi kuralı
- [ ] **B5. Birlik ikonları, hareket okları, savaş animasyonları ve sis perdesi (fog of war).**
  - [x] Ordu ikonları (devlet renginde, asker sayılı işaretler; aynı bölgedekiler yan yana)
  - [x] Hareket vurgusu: seçili ordunun gidebileceği komşu bölgeler işaretlenir
  - [ ] Hareket okları
  - [ ] Savaş animasyonları
  - [ ] Sis perdesi (fog of war)

## C. Oyun mekanikleri (kazanma ve kaybetme)

- [x] **C1. Oyun döngüsü kararı:** tur bazlı, her tur bir mevsim (önerilen). Sefer mevsimi ve kışlak (Kasım'da orduyu çekmek) gibi tarihi gerçekler doğrudan kurala dönüşür.
  - _Karar: her tur bir mevsim (ilkbahar–sonbahar sefer, kış kışlak). Kışın ordu yalnızca kendi toprağına çekilebilir; kış başında yabancı toprakta kalan ordu %10 asker kaybeder (`RULES.winterAttritionRate`)._
- [x] **C2. Senaryo sistemi:** 1299 Kuruluş, 1326 Bursa, 1402 Ankara ve Fetret, 1453 İstanbul, 1514 Çaldıran, 1526 Mohaç, 1683 Viyana, 1768–1774 Rus Savaşı gibi.
  - _Sistem hazır (`src/content/scenarios`: Zod şeması, `buildScenario`, kayıt defteri). MVP için tek senaryo yazıldı: **1299 Kuruluş**. Diğer senaryolar (1326, 1402, 1453 …) aynı biçimde eklenecek; sahiplik verileri `TODO(kaynak)` ile doğrulanmayı bekliyor._
- [x] **C3. Zafer ve yenilgi koşulları:** senaryo hedefleri, zaman sınırı ve devletin yıkılması. Ayrıca "tarihî sonuca göre" bir puan: tarihten daha iyi mi, daha kötü mü yaptın?
  - _Yapıldı: senaryo hedefleri (`holdProvinces`, `provinceCount`), zaman sınırı, yıkılma = yenilgi, tarihî sonuca göre puan (bölge sayısı / tarihî bölge sayısı; daha iyi–aynı–daha kötü). 1299 Kuruluş için hedefler: Söğüt çevresini koru + Bursa'yı fethet, süre sınırı 1330. Hedef ilerlemesi `/play`'de gösteriliyor; oyun sonu ekranı E1'de._
- [x] **C4. Askeri sistem:** yeniçeri, tımarlı sipahi, akıncı, topçu ve donanma. İkmal, moral, arazi ve kuşatma.
  - _Yapıldı: birlik sınıfları (akıncı, sipahi, yaya, yeniçeri, topçu; yıla göre açılır), moral, kışlak/ikmal kaybı, arazi ve kale bonusu, kuşatma (topçu hızlandırır). Eksik: donanma (deniz bölgeleri B4'te), arazi/kale verisi (B4), ordu devşirme/bakım maliyeti (C6), ikmal hatları._
- [x] **C5. Savaş çözümü:** önce otomatik ve olasılık tabanlı, ileride taktik savaş ekranı.
  - _Yapıldı: otomatik, tohumlu olasılık tabanlı savaş (güç = birlik × moral × arazi/kale × zar), geri çekilme/dağılma, fetih. Taktik savaş ekranı ileride._
- [ ] **C6. Ekonomi:** akçe, tımar sistemi, vergi (cizye, öşür), ticaret yolları ve enflasyon. Enflasyon geç dönem için önemli.
  - [x] Akçe ve vergi geliri: bölge geliri = tarım + şehirler + ticaret yolu gümrüğü (`baseTaxOf`); HUD'da hazine ve tur geliri/gideri
  - [x] Ordu devşirme (bölgede 100 asker, akçe karşılığı, tur başına bölge sınırı, yıla göre birlik) ve arayüzde bölge panelinden devşirme
  - [x] Tımar: tımarlı sipahi ve akıncı hazineden maaş almaz; kapıkulu (yaya, yeniçeri, topçu) nakit maaş alır, ödenmezse moral düşer ve asker kaçar
  - [x] Yapay zekâ devşirir (devlet başına `ai.recruitShare` ve `aggression` kişiliği)
  - [ ] Cizye ve öşür ayrımı (nüfus/din verisi gerekir)
  - [ ] Ticaret yolu gelirinin gerçek akışı ve ablukası
  - [ ] Enflasyon (akçenin ayarı düşer, geç dönem)
- [x] **C7. Diplomasi:** Venedik, Ceneviz, Bizans, Memlük, Safevi, Habsburg, Macar Krallığı, Lehistan ve Rusya. Savaş, barış, haraç ve evlilik ittifakları.
  - _Yapıldı: savaş/barış/ittifak ilişkileri (senaryoda başlangıç ilişkileri), savaş ilanı, barış önerisi (haraç vererek ya da isteyerek), evlilik ittifakı (çeyiz karşılığı, ortak düşman şartı), tur başına haraç ödemesi, yapay zekânın barış teklifleri (oyuncu kabul/ret eder) ve savaşçı kişilikte savaş ilanı. Barıştaki devletin sınırı kapalı, müttefikinki açık. Diplomasi paneli. Not: 1299 ilişkileri sadeleştirilmiştir (`TODO(kaynak)`)._
- [x] **C8. İç siyaset:** padişah, şehzadeler, taht kavgası, sadrazam ve divan, yeniçeri isyanları, Celali isyanları ve sadakat.
  - _Yapıldı: saray (hükümdar, şehzadeler, vezir), yaşlanma ve ölüm, veraset ve taht kavgası (hak iddia eden yetişkin şehzadeler), şehzade doğumu, divan kurulunca (1320'den, `TODO(kaynak)`) vezir atama, sadakat (gelir çarpanı; savaş, fetih, maaş ile değişir), sadakat düşünce ordusuz bölgelerde isyan (1590'dan sonra Celali isyanı), maaşı ödenmeyen yeniçerilerin ayaklanması. Saray paneli. Yalnızca oyuncu devleti için; doğum yılları geleneksel tarihlerdir._
- [x] **C9. Rakip devletler için yapay zekâ.**
  - _Yapıldı: sezgisel yapay zekâ (`heuristic-ai.ts`): savunmasız düşman toprağını alır, güç oranı yeterliyse (`aggression`) saldırır, zayıf kalacağı savaştan kaçınır, kışın eve döner, düşman sınırına doğru ilerler. Sahipsiz bölgelere yayılmaz (diplomasi/diğer devletler modellenene kadar). Ordu devşirme, ekonomi ve diplomasi içermez (C6, C7); zorluk ayarı C10'da._
- [x] **C10. Zorluk seviyeleri ve "tarihe sadık mod" seçeneği.**
  - _Yapıldı: kolay/normal/zor (oyuncu geliri çarpanı; rakip yapay zekânın saldırganlık, devşirme ve savaş ilanı eğilimi) ve tarihe sadık mod (rakipler saldırmaz, toprak almaz, savaş açmaz, yalnızca savunur; olay kartında tarihte seçilen seçenek gösterilir). Senaryo seçiminde ayarlanır, `GameState.settings` olarak kayda yazılır, üst çubukta görünür._

## D. Oynarken tarih öğrenme

- [x] **D1. Tarihi olay kartları:** tetikleyicisi olan olaylar, oyuncunun seçimleri ve "Tarihte gerçekte ne oldu?" açıklaması.
  - _Yapıldı: tetikleyiciler (tarih, bölgeye sahip olma), seçeneklerin etkisi (hazine, moral), bekleyen olay tur bitirmeyi engeller, olay kartı arayüzü ("Tarihte gerçekte ne oldu?" bölümüyle). 1299 Kuruluş için iki kart: Koyunhisar Savaşı (1302) ve Bursa'nın Düşüşü. Metinler `TODO(kaynak)` ile doğrulanmayı bekliyor. Seçimin tarihle karşılaştırılması D2'de._
- [x] **D2. Karar anları:** oyuncu kritik bir kararı (ör. Ankara Savaşı öncesi) verdikten sonra seçimi gerçek tarihle karşılaştırılır.
  - _Yapıldı: olay kartı kararın tarihle aynı olup olmadığını söyler ve tarihte seçileni gösterir; "Kararlar" paneli (karar defteri, tarihle uyum x/y); oyun sonu kartı (sonuç, nedeni, tarihe göre puan, karar uyumu, "Tarihte gerçekte ne oldu?")._
- [x] **D3. Ansiklopedi:** kişiler, kurumlar (devşirme, tımar, kapıkulu), savaşlar ve yerler. Haritadaki bir öğeye tıklayınca ilgili maddesi açılır.
  - _Yapıldı: 19 elle yazılmış madde (kişiler, kurumlar, savaşlar) + haritadaki her yer için madde; `/encyclopedia` (arama, kategori) ve `/encyclopedia/:id` sayfaları, ana menüde "Ansiklopedi"; oyunda şehir/kale/boğaz işaretine ya da bölge panelindeki şehir adına basınca madde haritadan ayrılmadan yan panelde açılır. Her maddede "Oyunda" notu var. Kaynakça D6'da._
- [x] **D4. Kronik/zaman çizelgesi:** oyuncunun oynadığı tarih ile gerçek tarih yan yana.
  - _Yapıldı: üst çubukta "Kronik": yıl yıl "Senin tarihin" (fetihler, savaşlar, diplomasi, saray, kararlar, isyanlar) ile "Gerçek tarih" (senaryo kronolojisi, kaynak kısaltmasıyla) yan yana. Gerçek tarih yalnızca oyunda gelinen yıla kadar gösterilir._
- [x] **D5. Mini quizler:** doğru cevap oyun içinde küçük bir bonus kazandırır (ör. prestij), yanlış cevabın cezası olmaz.
  - _Yapıldı: 12 soru (`content/quizzes.ts`), her biri bir ansiklopedi maddesine dayanır. Her ilkbahar bir soru sorulur ("Şimdi değil" ile geçilebilir); doğru cevap +5 akçe ve sadakat, yanlışa ceza yok. Doğru cevabı motor doğrular (`answerQuiz`). Henüz yaşanmamış olaylar sorulmaz (`minYear`). "Meraklı Öğrenci" başarımı._
- [x] **D6. Başarımlar (achievements) ve kaynakça:** her bilginin kaynağı gösterilir, güvenilirlik için önemli.
  - _Yapıldı: kaynakça (`content/sources.ts`: birincil kaynaklar, araştırmalar, başvuru eserleri, veri), her ansiklopedi maddesinde, olay kartının "Tarihte gerçekte ne oldu?" bölümünde ve kronikte kaynak; `/sources` (Kaynakça) sayfası. 10 başarım (`content/achievements.ts`), oyunlar arası IndexedDB'de kalıcı, oyunda bildirim, `/achievements` sayfası ve ana menüde "Başarımlar". Atıflar şimdilik eser düzeyinde; sayfa numaraları ve tarihçi denetimi `TODO(kaynak)`._
- [x] **D7. Öğretici (tutorial) senaryo:** Osman Bey ile küçük bir beylikten başlamak.
  - _Yapıldı: "Öğretici · Osman Bey'in İlk Adımları" senaryosu (senaryo listesinde ilk sırada, "Yeni başlayanlar için önerilir"); 7 adımlı rehber paneli: ordu seç, Sakarya'yı al, asker devşir, turu bitir, ansiklopediyi aç, kroniğe bak, Bursa'yı al. Rakipler saldırmaz, Bursa muhafızı azdır._

## E. Arayüz ve deneyim

- [x] **E1. Ana menü, senaryo seçimi ve oyun ekranının yerleşimi** (HUD, yan paneller).
  - _Yapıldı: ana menü (`/`), senaryo seçimi (`/scenarios`), oyun ekranı (`/play/:scenarioId`): üst çubuk (hazine, tarih, tur, Turu Bitir), sol panel (hedefler, günlük), sağ panel (seçilen bölge), olay kartı. Paneller başlığa basınca daralır. Bölge/ordu/şehir ayrıntıları E2'de, mobil düzen E5'te._
- [ ] **E2. Bölge, ordu ve şehir panelleri.**
  - [x] Bölge paneli (sahip, komşular, içindeki ordular)
  - [x] Ordu paneli (birlikler, moral, hareket hakkı, gidebileceği bölgeler)
  - [ ] Şehir paneli (şehir/kale verisi B4'te gelince)
- [x] **E3. Tarihi görsel kimlik:** tezhip, hat tipografisi ve minyatür esintili bir tema.
  - _Yapıldı: hat için Amiri nesih yazı tipi ve ana menüde Osmanlıca "دولت علیه" başlığı; minyatür paleti (lâciverd, sülüğen, zümrüt, altın) tema değişkeni olarak; parşömen dokulu arka plan; `tezhip-frame` (altın çift çizgi + köşelerde sekiz köşeli yıldız gülleri) ve `tezhip-rule` yardımcıları; `components/ornament.tsx` (gül, tezhip ayracı, Osmanlıca başlık). Ana menü, senaryo kartları, oyun panelleri, üst çubuk, olay/oyun sonu/soru/kronik kartları bu çerçeveyle. Minyatür tarzı çizimler (görsel varlık) ileride._
- [ ] **E4. Ses ve müzik** (mehter gibi), ayarlar ekranı.
- [ ] **E5. Mobil ve tablet uyumu.**

## F. Kalite

- [ ] **F1. Motor kuralları için birim testleri (Vitest).** _Not: A2 ile temel testler yazıldı (takvim, RNG, oyun oluşturma, dispatch); her yeni kural kendi testiyle gelmeli, madde sürekli açık kalır._
- [ ] **F2. Arayüz bileşenleri için Storybook.**
- [x] **F3. Uçtan uca (E2E) testler (Playwright):** "bir senaryoyu başlat, tur geç, kaydet" gibi akışlar.
  - _Yapıldı: Playwright + Chromium (`e2e/`, `npm run test:e2e`): üretim derlemesini sunar; senaryo başlatma ve haritanın gerçekten çizilmesi (WebGL, MapLibre Worker), ordu yürütme ve fetih, tur geçme, kaydetme ve kayıttan devam, öğretici rehberi, haritadan ansiklopedi, ansiklopedi araması, 404, arayüz dilini değiştirme. Her testte tarayıcı konsolunda hata olmaması beklenir. İlk koşu gerçek bir hatayı yakaladı: Bursa'da ordu işareti şehir işaretini örtüyordu (düzeltildi). CI kurulumu henüz yok._
- [ ] **F4. Performans:** harita katmanlarının optimizasyonu ve paket (bundle) analizi.
- [ ] **F5. PWA desteği:** oyunu kurup çevrimdışı oynayabilmek.

## G. İleride

- [ ] **G1. Backend:** hesaplar, bulutta kayıt ve liderlik tablosu.
- [ ] **G2. Çok oyunculu mod** (motor tohumlu olduğu için bu yapıya uygun).
- [ ] **G3. Senaryo editörü ve mod desteği.**
- [ ] **G4. İçerik yönetimi:** tarihçilerin içeriği kod yazmadan düzenleyebilmesi.
