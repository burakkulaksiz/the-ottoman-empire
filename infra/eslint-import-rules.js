// Mimari sınırları ESLint `import/no-restricted-paths` bölgeleri olarak üretir.
function generateImportRules() {
  const zones = [];

  // Oyun motoru saf TypeScript'tir: arayüz katmanından hiçbir şey import edemez.
  // Böylece ileride Web Worker'da veya sunucuda aynen çalışabilir.
  zones.push({
    target: './src/engine/**',
    from: [
      './src/app/**',
      './src/components/**',
      './src/features/**',
      './src/hooks/**',
      './src/stores/**',
    ],
    message:
      'Engine must stay UI-agnostic: it cannot import from app, components, features, hooks or stores.',
  });

  // İçerik (senaryolar, olaylar, ansiklopedi) sadece motor tiplerine bağlı olabilir.
  zones.push({
    target: './src/content/**',
    from: [
      './src/app/**',
      './src/components/**',
      './src/features/**',
      './src/hooks/**',
      './src/stores/**',
    ],
    message: 'Content may only depend on engine types and lib utilities.',
  });

  // Paylaşılan katmanlar feature'lardan veya app'ten import edemez.
  zones.push({
    target: [
      './src/components/**',
      './src/config/**',
      './src/hooks/**',
      './src/lib/**',
      './src/stores/**',
      './src/types/**',
    ],
    from: ['./src/features/**', './src/app/**'],
    message:
      'Shared utilities should not import from features or app directories.',
  });

  // Feature'lar app katmanından import edemez.
  zones.push({
    target: './src/features/**',
    from: './src/app/**',
    message: 'Features should not import from app directory.',
  });

  // Feature bağımlılık tablosu: yeni feature eklendikçe buraya yazılır.
  const features = [{ name: 'map', allowedFeatures: [] }];

  features.forEach((feature) => {
    const forbiddenFeatures = features
      .filter(
        (f) =>
          f.name !== feature.name && !feature.allowedFeatures.includes(f.name),
      )
      .map((f) => f.name);

    if (forbiddenFeatures.length > 0) {
      zones.push({
        target: `./src/features/${feature.name}/**`,
        from: `./src/features/{${forbiddenFeatures.join(',')}}/**`,
        message: `${feature.name} feature should not import from ${forbiddenFeatures.join(', ')} features.`,
      });
    }
  });

  return zones;
}

export const importRules = generateImportRules();
