# content

Senaryolar, tarihi olaylar ve ansiklopedi verileri (Zod ile doğrulanır). Yalnızca `engine` tiplerine bağlıdır.

- `world/`: bölge listesi, işaret noktaları (`center`) ve komşuluk grafı (`npm run data:provinces` ile üretilir).
- `world/places.ts`, `terrain.ts`, `trade-routes.ts`: şehirler/kaleler/boğazlar, bölge arazisi ve ticaret yolları. `createProvinceDefs` arazi ve kale seviyesini motorun `ProvinceDef`ine yazar. Konumlar testlerle bölge poligonlarının içinde olduğu doğrulanır.
- `scenarios/`: senaryo tanımları. Yeni senaryo için `<ad>.ts` yaz (`ScenarioDefinition`: devlet → bölgeler, ordular, hazine), `index.ts` içindeki `SCENARIOS` listesine ekle. `buildScenario` tanımı doğrular ve motorun `ScenarioSetup`ına çevirir.
- Olay kartları senaryo tanımındaki `events` alanındadır: tetikleyici, seçenekler (etkileriyle) ve `historical` ("Tarihte gerçekte ne oldu?" metni + tarihte gerçekleşene en yakın seçenek).
- Tarihi iddialar (sahiplik, tarih) kaynaksız eklenmez; emin olunmayanlar `TODO(kaynak)` ile işaretlenir.
