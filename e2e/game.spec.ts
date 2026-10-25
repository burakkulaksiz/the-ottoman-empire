import { expect, hudDate, startScenario, test, waitForMap } from './fixtures';

test.describe('oyun akışı', () => {
  test('ana menüden senaryo seçip haritayı açar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /yeni oyun/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Senaryo Seç' }),
    ).toBeVisible();

    await page
      .getByRole('link', { name: '1299 · Kuruluş senaryosunu başlat' })
      .click();
    await waitForMap(page);

    await expect(
      page.getByRole('heading', { name: '1299 · Kuruluş' }),
    ).toBeVisible();
    await expect(hudDate(page, 'İlkbahar 1299')).toBeVisible();
  });

  test('ordu seçip yürütür, tur geçirir', async ({ page }) => {
    await startScenario(page, '1299 · Kuruluş');

    await page.getByRole('button', { name: /^Osmanlı Beyliği ordusu/ }).click();
    await expect(
      page.getByText('Osmanlı Beyliği ordusu').first(),
    ).toBeVisible();

    // Sakarya Bizans'ın ve ordusuz: yürüyüşle hemen ele geçirilir.
    await page.getByRole('button', { name: 'Sakarya bölgesine yürü' }).click();
    // Günlük paneli kapalı başlar.
    await page.getByText('Günlük').click();
    await expect(page.getByText(/Sakarya ele geçirildi/)).toBeVisible();

    await page.getByRole('button', { name: /turu bitir/i }).click();
    await expect(hudDate(page, 'Yaz 1299')).toBeVisible();
  });

  test('kaydedip kayıttan devam eder', async ({ page }) => {
    await startScenario(page, '1299 · Kuruluş');
    await page.getByRole('button', { name: /turu bitir/i }).click();
    await expect(hudDate(page, 'Yaz 1299')).toBeVisible();

    await page.getByRole('button', { name: /^kaydet$/i }).click();
    await page.getByRole('button', { name: 'Yuva 1: kaydet' }).click();
    await expect(page.getByText(/Son kayıt: Yuva 1/)).toBeVisible();

    // Sayfayı tamamen yenileyip kayıtlar sayfasından devam et.
    await page.goto('/saves');
    await page.getByRole('link', { name: 'Yuva 1: yükle' }).click();
    await waitForMap(page);
    await expect(hudDate(page, 'Yaz 1299')).toBeVisible();
  });

  test('öğretici rehberi adımları izler', async ({ page }) => {
    await startScenario(page, "Öğretici · Osman Bey'in İlk Adımları");
    await expect(page.getByText('Rehber (0/7)')).toBeVisible();

    await page.getByRole('button', { name: /^Osmanlı Beyliği ordusu/ }).click();
    await expect(page.getByText('Rehber (1/7)')).toBeVisible();

    await page.getByRole('button', { name: 'Sakarya bölgesine yürü' }).click();
    await expect(page.getByText('Rehber (2/7)')).toBeVisible();
  });

  test('haritadaki şehirden ansiklopedi maddesi açar', async ({ page }) => {
    await startScenario(page, '1299 · Kuruluş');

    await page
      .getByRole('button', { name: 'Bursa (Prusa) (kale seviyesi 1)' })
      .click();
    const drawer = page.getByRole('complementary', { name: 'Ansiklopedi' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Bursa (Prusa)');
  });
});

test.describe('menüler', () => {
  test('ansiklopedide arar ve madde açar', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.getByRole('searchbox', { name: 'Madde ara' }).fill('tımar');
    await page.getByRole('link', { name: /Tımar sistemi/ }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Tımar sistemi' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kaynaklar' }),
    ).toBeVisible();
  });

  test('bilinmeyen adres için hata sayfası gösterir', async ({ page }) => {
    await page.goto('/olmayan-sayfa');
    await expect(
      page.getByRole('heading', { name: 'Sayfa bulunamadı' }),
    ).toBeVisible();
  });

  test('arayüz dilini İngilizceye çevirir ve hatırlar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('link', { name: /new game/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.reload();
    await expect(page.getByRole('link', { name: /new game/i })).toBeVisible();
  });
});
