# Devlet-i Âliyye

Gerçek dünya haritası üzerinde oynanan, Osmanlı tarihini oynarken öğreten tarayıcı tabanlı strateji oyunu.

## Başlarken

```bash
npm install
npm run dev
```

> Bağımlılık eklerken npm 10'da peer çözümleme hatası (`Cannot read properties of null (reading 'edgesOut')`) çıkabiliyor. Bu durumda `npx npm@11 install <paket>` kullanın.

## Komutlar

| Komut                    | Açıklama                                   |
| ------------------------ | ------------------------------------------ |
| `npm run dev`            | Geliştirme sunucusu                        |
| `npm run build`          | Üretim derlemesi (`build/client`)          |
| `npm run preview`        | Derlemeyi yerelde sunar                    |
| `npm run typecheck`      | Route tiplerini üretir ve `tsc` çalıştırır |
| `npm run lint`           | ESLint (mimari sınırlar dahil)             |
| `npm test`               | Vitest birim testleri                      |
| `npm run data:provinces` | Bölge haritası ve komşuluk verisini üretir |
| `npm run data:rivers`    | Nehir katmanını üretir                     |

## Sayfalar

| Adres               | İçerik                              |
| ------------------- | ----------------------------------- |
| `/`                 | Ana menü                            |
| `/scenarios`        | Senaryo seçimi                      |
| `/play/:scenarioId` | Oyun ekranı (harita, HUD, paneller) |

## Mimari

[React Application Architecture for Production (2nd Ed.)](https://github.com/PacktPublishing/React-Application-Architecture-for-Production-Second-Edition) yapısı temel alındı; React Router 7 **SPA modunda** (`ssr: false`) çalışır.

```
src/
  app/          # Route'lar, root layout, global stil
  components/   # Paylaşılan UI bileşenleri (shadcn/ui → components/ui)
  config/       # Uygulama sabitleri
  content/      # Senaryolar, olaylar, ansiklopedi verisi
  engine/       # Saf TypeScript oyun motoru (React'ten bağımsız)
  features/     # Özellik modülleri (harita, ordu, olaylar…)
  hooks/        # Paylaşılan hook'lar
  lib/          # Yardımcılar
  stores/       # Zustand store'ları
  types/        # Paylaşılan tipler
workers/       # Motoru Web Worker'da çalıştıran katman (Comlink)
infra/          # ESLint import kuralları, lint-staged ayarları
testing/        # Test kurulumu
```

Katmanlar arası import kuralları `infra/eslint-import-rules.js` içinde tanımlıdır: `engine` ve `content` arayüz katmanlarına ve React'e bağımlı olamaz.
