# content

Senaryolar, tarihi olaylar ve ansiklopedi verileri (Zod ile doğrulanır). Yalnızca `engine` tiplerine bağlıdır.

- `world/`: bölge listesi ve komşuluk grafı (`npm run data:provinces` ile üretilir).
- `scenarios/`: senaryo tanımları. Yeni senaryo için `<ad>.ts` yaz (`ScenarioDefinition`: devlet → bölgeler, ordular, hazine), `index.ts` içindeki `SCENARIOS` listesine ekle. `buildScenario` tanımı doğrular ve motorun `ScenarioSetup`ına çevirir.
- Tarihi iddialar (sahiplik, tarih) kaynaksız eklenmez; emin olunmayanlar `TODO(kaynak)` ile işaretlenir.
