import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Uçtan uca testler (F3): üretim derlemesini `vite preview` ile sunar ve gerçek
 * Chromium'da (WebGL dahil) oynar. Çalıştırma: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  // Düşük bellekli makine: testler sırayla, tek tarayıcıda.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
