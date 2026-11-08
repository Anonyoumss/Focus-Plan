import { test, expect } from '@playwright/test';

// The extension itself can't run in Playwright; these tests verify the app
// surfaces that exist without it (the required "works fully without it" path)
// plus the new Settings card and Progress insights prompt in EN and AR.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'focus_plan_m3e_v1';
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ onboardingCompleted: true, locale: 'en' }));
    }
  });
  await page.goto('/#/app/settings');
});

test('settings shows the browser extension card in English', async ({ page }) => {
  await expect(page.getByText('Browser extension')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect' })).toBeVisible();
});

test('settings shows the browser extension card in Arabic RTL', async ({ page }) => {
  await page.evaluate(() => {
    const raw = localStorage.getItem('focus_plan_m3e_v1');
    const s = raw ? JSON.parse(raw) : {};
    s.locale = 'ar';
    localStorage.setItem('focus_plan_m3e_v1', JSON.stringify(s));
  });
  await page.reload();
  await expect(page.getByText('إضافة المتصفح')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('progress shows the focus insights connect prompt', async ({ page }) => {
  await page.goto('/#/app/progress');
  await expect(page.getByText('Focus insights')).toBeVisible();
  await expect(page.getByText(/Connect the Focus Plan Companion/)).toBeVisible();
});
