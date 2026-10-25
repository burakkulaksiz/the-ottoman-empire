import { test as base, expect, type Page } from '@playwright/test';

/**
 * Her testte tarayıcı konsolundaki hatalar toplanır ve test sonunda boş olması
 * beklenir: harita/Worker gibi yalnızca gerçek tarayıcıda görülen hatalar
 * ("Worker failed to load" gibi) böylece yakalanır.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await use(errors);
      expect(errors, 'tarayıcı konsolunda hata olmamalı').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Senaryoyu seçim sayfasından başlatır ve harita yüklenene kadar bekler. */
export async function startScenario(page: Page, name: string) {
  await page.goto('/scenarios');
  await page.getByRole('link', { name: `${name} senaryosunu başlat` }).click();
  await waitForMap(page);
}

/** Üst çubuktaki oyun tarihi (günlükte de aynı metin geçtiği için). */
export function hudDate(page: Page, text: string) {
  // Üst çubuk <main> içinde olduğundan "banner" rolü taşımaz.
  return page.locator('header').getByText(text, { exact: true });
}

/** MapLibre kanvası görünür ve gerçek bir boyuta sahip olana kadar bekler. */
export async function waitForMap(page: Page) {
  const canvas = page.locator('canvas.maplibregl-canvas');
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => (await canvas.boundingBox())?.height ?? 0)
    .toBeGreaterThan(200);
  // Ordu işaretleri harita yüklendikten (load) sonra eklenir.
  await expect(
    page.getByRole('button', { name: /^Osmanlı Beyliği ordusu/ }),
  ).toBeVisible();
}
