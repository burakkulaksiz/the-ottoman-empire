# Devlet-i Âliyye — Geliştirme Adımları

- **Oyun:** Gerçek haritalı, tarih öğrenimine katkı sağlayan strateji oyunu.
- **Mimari referansı:** [React Application Architecture for Production (2. Baskı)](https://github.com/PacktPublishing/React-Application-Architecture-for-Production-Second-Edition)
- **Gelecek:** Backend sonradan bağlanacak (bkz. G1).

## Nasıl kullanılır

- Bir madde bitince `[ ]` işaretini `[x]` yapın; kısmen bitenlerin altına alt görev ekleyin.
- Madde kodları (A1, B2, C4 …) sabittir; commit mesajlarında ve konuşmalarda bu kodlarla anılır.
- Bir maddeye başlarken önce o maddenin bağımlılıklarına (varsa "Önerilen sıra"ya) bakın.

## İlerleme özeti

| Bölüm            | Biten | Toplam |
| ---------------- | ----- | ------ |
| A. Altyapı       | 2     | 5      |
| B. Harita        | 2     | 5      |
| C. Mekanikler    | 2     | 10     |
| D. Tarih öğrenme | 0     | 7      |
| E. Arayüz        | 0     | 5      |
| F. Kalite        | 0     | 5      |
| G. İleride       | 0     | 4      |
| **Toplam**       | **6** | **41** |

> Tabloyu madde işaretlerken güncelleyin.

## Önerilen sıra (MVP)

Oynanabilir ilk sürüm için:

**A1 → A2 → B1 → B2 → C1 → C2 (tek senaryo) → C4 + C5 → C3 → D1 → E1**

Böylece en kısa yoldan haritada birlik yürütüp savaş kazanılan ya da kaybedilen ve bir tarihi olay kartı çıkan bir oyun elde ederiz. Diğer maddeler bunun üzerine eklenir.

**Sıradaki madde:** C4 + C5 (askeri sistem ve savaş çözümü)

---

## A. Altyapı

- [x] **A1. Projeyi kurmak:** Vite, React Router 7 (SPA), TypeScript, Tailwind ve shadcn. ESLint, Prettier ve Husky ayarları ile referans repodaki klasör yapısı.
- [x] **A2. Oyun motorunun iskeleti:** oyun durumu modeli, komutlar (hamle ve emirler), tur döngüsü ve tohumlu rastgele sayı üreteci (RNG).
- [ ] **A3. Durum yönetimi:** Zustand ve Immer ile motor ve arayüz arasındaki köprü, Web Worker entegrasyonu.
- [ ] **A4. Kayıt ve yükleme:** IndexedDB üzerinde, otomatik kayıt ve birden fazla kayıt yuvasıyla.
- [ ] **A5. Çoklu dil (i18n):** Türkçe ana dil, İngilizce opsiyonel.

## B. Gerçek dünya haritası

- [x] **B1. MapLibre ile temel harita:** Balkanlar, Anadolu, Orta Doğu ve Kuzey Afrika. Yakınlaştırma ve kaydırma, oyuna uygun tarihi bir stil.
- [x] **B2. Bölge (sancak/eyalet) katmanı:** tıklanabilir, sahibine göre renklenen, komşuluk ilişkileri tanımlı GeoJSON. Komşuluk bilgisi hareket ve ikmal için gerekli.
  - _Not: Tarihî sancak verisi açık kaynakta yok; şimdilik Natural Earth modern idari bölümleri (623 bölge) yer tutucu olarak kullanılıyor, komşuluk ortak kenarlardan otomatik üretiliyor (`npm run data:provinces`). Boğaz/ada bağlantıları B4'te, tarihî sınırlar B3'te gelecek._
- [ ] **B3. Yıla göre tarihi sınırlar:** açık veri kullanılabilir, örneğin historical-basemaps GeoJSON setleri.
- [ ] **B4. Şehirler, kaleler, boğazlar, nehirler ve ticaret yolları:** hem görsel hem de oyun kurallarına etki edecek.
- [ ] **B5. Birlik ikonları, hareket okları, savaş animasyonları ve sis perdesi (fog of war).**

## C. Oyun mekanikleri (kazanma ve kaybetme)

- [x] **C1. Oyun döngüsü kararı:** tur bazlı, her tur bir mevsim (önerilen). Sefer mevsimi ve kışlak (Kasım'da orduyu çekmek) gibi tarihi gerçekler doğrudan kurala dönüşür.
  - _Karar: her tur bir mevsim (ilkbahar–sonbahar sefer, kış kışlak). Kışın ordu yalnızca kendi toprağına çekilebilir; kış başında yabancı toprakta kalan ordu %10 asker kaybeder (`RULES.winterAttritionRate`)._
- [x] **C2. Senaryo sistemi:** 1299 Kuruluş, 1326 Bursa, 1402 Ankara ve Fetret, 1453 İstanbul, 1514 Çaldıran, 1526 Mohaç, 1683 Viyana, 1768–1774 Rus Savaşı gibi.
  - _Sistem hazır (`src/content/scenarios`: Zod şeması, `buildScenario`, kayıt defteri). MVP için tek senaryo yazıldı: **1299 Kuruluş**. Diğer senaryolar (1326, 1402, 1453 …) aynı biçimde eklenecek; sahiplik verileri `TODO(kaynak)` ile doğrulanmayı bekliyor._
- [ ] **C3. Zafer ve yenilgi koşulları:** senaryo hedefleri, zaman sınırı ve devletin yıkılması. Ayrıca "tarihî sonuca göre" bir puan: tarihten daha iyi mi, daha kötü mü yaptın?
- [ ] **C4. Askeri sistem:** yeniçeri, tımarlı sipahi, akıncı, topçu ve donanma. İkmal, moral, arazi ve kuşatma.
- [ ] **C5. Savaş çözümü:** önce otomatik ve olasılık tabanlı, ileride taktik savaş ekranı.
- [ ] **C6. Ekonomi:** akçe, tımar sistemi, vergi (cizye, öşür), ticaret yolları ve enflasyon. Enflasyon geç dönem için önemli.
- [ ] **C7. Diplomasi:** Venedik, Ceneviz, Bizans, Memlük, Safevi, Habsburg, Macar Krallığı, Lehistan ve Rusya. Savaş, barış, haraç ve evlilik ittifakları.
- [ ] **C8. İç siyaset:** padişah, şehzadeler, taht kavgası, sadrazam ve divan, yeniçeri isyanları, Celali isyanları ve sadakat.
- [ ] **C9. Rakip devletler için yapay zekâ.**
- [ ] **C10. Zorluk seviyeleri ve "tarihe sadık mod" seçeneği.**

## D. Oynarken tarih öğrenme

- [ ] **D1. Tarihi olay kartları:** tetikleyicisi olan olaylar, oyuncunun seçimleri ve "Tarihte gerçekte ne oldu?" açıklaması.
- [ ] **D2. Karar anları:** oyuncu kritik bir kararı (ör. Ankara Savaşı öncesi) verdikten sonra seçimi gerçek tarihle karşılaştırılır.
- [ ] **D3. Ansiklopedi:** kişiler, kurumlar (devşirme, tımar, kapıkulu), savaşlar ve yerler. Haritadaki bir öğeye tıklayınca ilgili maddesi açılır.
- [ ] **D4. Kronik/zaman çizelgesi:** oyuncunun oynadığı tarih ile gerçek tarih yan yana.
- [ ] **D5. Mini quizler:** doğru cevap oyun içinde küçük bir bonus kazandırır (ör. prestij), yanlış cevabın cezası olmaz.
- [ ] **D6. Başarımlar (achievements) ve kaynakça:** her bilginin kaynağı gösterilir, güvenilirlik için önemli.
- [ ] **D7. Öğretici (tutorial) senaryo:** Osman Bey ile küçük bir beylikten başlamak.

## E. Arayüz ve deneyim

- [ ] **E1. Ana menü, senaryo seçimi ve oyun ekranının yerleşimi** (HUD, yan paneller).
- [ ] **E2. Bölge, ordu ve şehir panelleri.**
- [ ] **E3. Tarihi görsel kimlik:** tezhip, hat tipografisi ve minyatür esintili bir tema.
- [ ] **E4. Ses ve müzik** (mehter gibi), ayarlar ekranı.
- [ ] **E5. Mobil ve tablet uyumu.**

## F. Kalite

- [ ] **F1. Motor kuralları için birim testleri (Vitest).** _Not: A2 ile temel testler yazıldı (takvim, RNG, oyun oluşturma, dispatch); her yeni kural kendi testiyle gelmeli, madde sürekli açık kalır._
- [ ] **F2. Arayüz bileşenleri için Storybook.**
- [ ] **F3. Uçtan uca (E2E) testler (Playwright):** "bir senaryoyu başlat, tur geç, kaydet" gibi akışlar.
- [ ] **F4. Performans:** harita katmanlarının optimizasyonu ve paket (bundle) analizi.
- [ ] **F5. PWA desteği:** oyunu kurup çevrimdışı oynayabilmek.

## G. İleride

- [ ] **G1. Backend:** hesaplar, bulutta kayıt ve liderlik tablosu.
- [ ] **G2. Çok oyunculu mod** (motor tohumlu olduğu için bu yapıya uygun).
- [ ] **G3. Senaryo editörü ve mod desteği.**
- [ ] **G4. İçerik yönetimi:** tarihçilerin içeriği kod yazmadan düzenleyebilmesi.
