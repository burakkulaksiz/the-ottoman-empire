# AGENTS.md

Devlet-i Âliyye: gerçek dünya haritası üzerinde oynanan, Osmanlı tarihini oynarken öğreten tarayıcı tabanlı, tur bazlı strateji oyunu. Bu dosya projede çalışan tüm AI kodlama ajanları içindir (Claude Code, Codex, Copilot, Cursor …).

## İletişim ve dil

- Kullanıcıyla **Türkçe** konuş. Kod, değişken adları ve kod yorumları: yorumlar Türkçe, tanımlayıcılar İngilizce (mevcut koddaki gibi).
- Oyun metinleri ve tarih içeriği Türkçe ana dildedir; İngilizce sonradan i18n ile eklenecek (A5).

## Yol haritası

- Tek kaynak: [development-steps.md](development-steps.md). Maddeler `A1`, `B2`, `C4` gibi kodlarla anılır.
- Bir madde bitince **aynı değişiklikte** `[ ]` → `[x]` yap, "İlerleme özeti" tablosunu ve "Sıradaki madde" satırını güncelle.
- Kullanıcı "devam" derse: "Sıradaki madde"yi (MVP sırası) öner ve başla; sırayı kendin değiştirme.
- Kapsam dışına çıkma: istenen maddenin dışında özellik ekleme.

## Komutlar

| Komut                    | Ne yapar                                           |
| ------------------------ | -------------------------------------------------- |
| `npm run dev`            | Geliştirme sunucusu                                |
| `npm run build`          | Üretim derlemesi (`build/client`)                  |
| `npm run typecheck`      | Route tiplerini üretir + `tsc`                     |
| `npm run lint`           | ESLint (mimari sınırlar dahil)                     |
| `npm run format`         | Prettier                                           |
| `npm test`               | Vitest (`vitest run`)                              |
| `npm run data:provinces` | Bölge GeoJSON'u ve komşuluk grafını yeniden üretir |

Bir işi bitmiş saymadan önce **`npm run typecheck`, `npm run lint` ve `npm test`** geçmeli. Husky pre-commit `lint-staged` + `npm test` çalıştırır; `--no-verify` kullanma.

## Teknoloji

Vite 8 · React 19 · React Router 7 (**SPA modu**, `ssr: false`) · TypeScript ~5.9 · Tailwind 4 · shadcn/ui (Base UI) · Zustand + Immer · Zod · Vitest + Testing Library.
Ayrıca: MapLibre GL (harita), Comlink (motor Worker'da). Planlanan: Dexie/IndexedDB (A4), PMTiles.

TypeScript 7, React Router 8 ve `@vitest/eslint-plugin` bilerek **kullanılmıyor**; sürüm yükseltme.

## Mimari

```
src/
  app/          Route'lar, root layout, global stil (routes.ts elle bağlanır)
  components/   Paylaşılan UI (shadcn → components/ui)
  config/       Uygulama sabitleri
  content/      Senaryolar, olaylar, ansiklopedi verisi (Zod ile doğrulanır)
  engine/       Saf TypeScript oyun motoru
  features/     Özellik modülleri: features/<ad>/{api,components,hooks,config}
  hooks/ lib/ stores/ types/   Paylaşılan katmanlar (stores/game-store.ts: motor köprüsü)
  workers/      Motoru Web Worker'da çalıştıran katman (Comlink); arayüz yalnızca store üzerinden konuşur
scripts/        Veri üretim betikleri (ör. build-provinces.mjs; ham veri data-src/, git'te yok)
infra/          ESLint import kuralları, lint-staged
testing/        Test kurulumu ve fixture'lar
```

### Değişmez kurallar (ESLint zorlar — `infra/eslint-import-rules.js`)

1. `engine` ve `content`; `app`, `components`, `features`, `hooks`, `stores`, React, React Router ve Zustand'dan **import edemez**. Motor Web Worker'da / sunucuda aynen çalışabilmeli.
2. Paylaşılan katmanlar (`components`, `config`, `hooks`, `lib`, `stores`, `types`) `features` veya `app`'ten import edemez; `features` da `app`'ten edemez.
3. Feature'lar birbirini import edemez; izin tablosu `infra/eslint-import-rules.js` içindeki `features` dizisinde tutulur. Yeni feature eklenince oraya yaz.
4. Döngüsel import yasak (`import/no-cycle`).

### Oyun motoru ilkeleri (detay: [src/engine/README.md](src/engine/README.md))

- Arayüz motoru doğrudan çağırmaz: `useGameStore` (`send`, `start`) → `src/workers` → motor. Motor Worker'da çalıştığı için durum her komuttan sonra yapısal kopya olarak gelir; `GameState` ve `World` yapısal klonlanabilir kalmalı (fonksiyon, sınıf örneği, `Map`/`Set` koyma — düz nesne/dizi kullan).
- Kayıt: `src/lib/saves` (Dexie/IndexedDB). `GameState` kayıt formatıdır; alanını değiştirirsen `version`'ı artır ve `validateSavedState`'i güncelle. Her tur sonunda `auto` yuvasına yazılır; kayıt hatası oyunu durdurmaz.
- `GameState` düz JSON'dur (kaydedilebilir, karşılaştırılabilir); statik dünya (`World`) kayda yazılmaz.
- Tek giriş noktası `dispatch(world, state, factionId, command)`; girdi durumu **asla mutasyona uğramaz**, Immer kullanılır.
- **Determinizm:** `Math.random`, `Date.now()` ve benzeri kullanma. Rastgelelik yalnızca `GameState.rng` / `context.random` üzerinden. Aynı tohum + aynı komutlar = aynı oyun.
- Sabitler ve denge değerleri `rules.ts` içinde toplanır; kuralların içine sayı gömme.
- Her yeni emir/tur aşaması kendi birim testiyle gelir (`src/engine/__tests__`).

## Kod stili

- Dosya adları **kebab-case** (ESLint zorlar). Bileşenler dahil.
- Prettier: tek tırnak, noktalı virgül, `trailingComma: all`, 80 sütun, LF.
- `import type` zorunlu (`consistent-type-imports`); import sırası `import/order` ile alfabetik, gruplar arası boş satır.
- Alias: `@/` → `src/`.
- Kullanılmayan değişkenler `_` önekiyle. `any` kullanma.
- Testler kodun yanındaki `__tests__/` klasöründe, `*.test.ts(x)`; ortak fixture'lar `testing/fixtures`.
- MapLibre kapsayıcısına yerleşim sınıfı (`absolute`, `inset-0` …) verme: `maplibre-gl.css` `.maplibregl-map { position: relative }` ile bunu ezer ve harita 0 yükseklikte kalır. `GameMap` bu yüzden sarmalayıcı + iç kutu kullanır.
- shadcn bileşeni eklerken (`npx shadcn add …`) çıktıdaki import'ları kontrol et: `import { cn } from "cn"` yazarsa `@/lib/utils` ile düzelt ve sahte `cn` paketini kaldır.

## Bağımlılık ekleme (önemli)

Makinedeki npm 10.9 vitest peer çözümlemesinde `Cannot read properties of null (reading 'edgesOut')` hatasıyla çöker. Bağımlılık eklerken/yükseltirken:

```bash
npx -y npm@11 install <paket>
```

Mevcut lockfile'dan `npm install` / `npm ci` sorunsuzdur. Makinenin belleği az (7,4 GB); vitest `maxWorkers: 2` ile çalışır. "heap out of memory" görürsen kodu değil bellek baskısını suçla ve tek dosyayı yeniden çalıştır.

## İçerik ve tarih doğruluğu

Oyunun amacı tarih öğretmektir: tarih, kişi, yer ve olay içeriği uydurulmaz. Bilgi **kaynak** ile birlikte eklenir (D6) ve "tarihte gerçekte ne oldu?" ile oyunun sonucu ayrı tutulur. Emin olmadığın tarihi bilgiyi `TODO(kaynak)` ile işaretle ve kullanıcıya söyle.

## Git

- Kullanıcı istemedikçe commit/push yapma. Ana dal: `main`.
- Commit mesajları Türkçe, kısa ve madde koduyla biter, örn. `Oyun motoru iskeletini ekle (A2)`.
- Uzak depo: github.com/burakkulaksiz/the-ottoman-empire
