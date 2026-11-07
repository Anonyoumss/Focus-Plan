import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'focus_plan_m3e_v1';

async function seed(page: import('@playwright/test').Page, locale: string) {
  await page.addInitScript(
    ({ key, loc }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ locale: loc, onboardingCompleted: true }));
      }
    },
    { key: STORAGE_KEY, loc: locale },
  );
}

test('terms and privacy render English body sections', async ({ page }) => {
  await seed(page, 'en');
  await page.goto('/#/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  await expect(page.getByText('Optional AI Features')).toBeVisible();
  await expect(page.getByText(/Google Gemini/)).toBeVisible();
  await page.goto('/#/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByText(/rate-limited per account/)).toBeVisible();
});

test('terms and privacy render Arabic RTL body sections', async ({ page }) => {
  await seed(page, 'ar');
  await page.goto('/#/terms');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'شروط الخدمة' })).toBeVisible();
  await expect(page.getByText('ميزات الذكاء الاصطناعي الاختيارية')).toBeVisible();
  await expect(page.getByText(/Google Gemini/)).toBeVisible();
  await page.goto('/#/privacy');
  await expect(page.getByRole('heading', { name: 'سياسة الخصوصية' })).toBeVisible();
  await expect(page.getByText('ميزات الذكاء الاصطناعي الاختيارية')).toBeVisible();
});
