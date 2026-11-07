import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('docs/screenshots');

const copy = {
  en: {
    skip: 'Skip Setup',
    focus: 'Focus',
    plan: 'Plan',
    tests: 'Tests',
    progress: 'Progress',
    friends: 'Friends',
    store: 'Store',
    settings: 'Settings',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    start: 'Start Focus',
    pause: 'Pause Timer',
  },
  ar: {
    skip: 'تخطي الإعداد',
    focus: 'التركيز',
    plan: 'الخطة',
    tests: 'الاختبارات',
    progress: 'التقدم',
    friends: 'الأصدقاء',
    store: 'المتجر',
    settings: 'الإعدادات',
    terms: 'شروط الخدمة',
    privacy: 'سياسة الخصوصية',
    start: 'بدء التركيز',
    pause: 'إيقاف مؤقت',
  },
} as const;

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 360, height: 740 },
] as const;

test.beforeAll(() => {
  fs.mkdirSync(root, { recursive: true });
});

for (const locale of ['en', 'ar'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const viewport of viewports) {
      test(`${locale} ${theme} ${viewport.name}`, async ({ page }) => {
        const labels = copy[locale];
        const dir = path.join(root, locale, theme, viewport.name);
        fs.mkdirSync(dir, { recursive: true });

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme: theme });
        await page.addInitScript(
          ({ storedLocale, storedTheme }) => {
            localStorage.setItem(
              'focus_plan_m3e_v1',
              JSON.stringify({
                locale: storedLocale,
                themeMode: storedTheme,
                onboardingCompleted: false,
                seedHex: '#2e6b52',
              }),
            );
          },
          { storedLocale: locale, storedTheme: theme },
        );

        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        if (theme === 'dark') {
          await expect(page.locator('html')).toHaveClass(/dark/);
        }
        await page.screenshot({ path: path.join(dir, 'onboarding.png'), fullPage: true });
        await page.getByRole('button', { name: labels.skip }).click();
        await expect(page.getByRole('button', { name: labels.skip })).toHaveCount(0);

        const navName = viewport.name === 'desktop' ? 'Main Navigation Rail' : 'Mobile Bottom Navigation';
        const nav = page.getByRole('navigation', { name: navName });
        const railScreens = [
          ['focus', labels.focus],
          ['plan', labels.plan],
          ['tests', labels.tests],
          ['progress', labels.progress],
          ['friends', labels.friends],
          ['store', labels.store],
          ['settings', labels.settings],
        ] as const;

        for (const [id, label] of railScreens) {
          const button = nav.getByRole('button', { name: label });
          if ((await button.count()) === 0) {
            fs.writeFileSync(
              path.join(dir, `${id}.unreachable.txt`),
              `${label} is not in the ${navName} at ${viewport.width}px.\n`,
            );
            continue;
          }
          await button.click();
          await page.screenshot({ path: path.join(dir, `${id}.png`), fullPage: true });
        }

        await page.getByRole('button', { name: labels.terms }).click();
        await page.screenshot({ path: path.join(dir, 'terms.png'), fullPage: true });
        await page.getByRole('button', { name: labels.privacy }).click();
        await page.screenshot({ path: path.join(dir, 'privacy.png'), fullPage: true });

        if (locale === 'en' && theme === 'light' && viewport.name === 'desktop') {
          await nav.getByRole('button', { name: labels.focus }).click();
          await page.getByRole('button', { name: labels.start }).click();
          await expect(page.getByRole('button', { name: labels.pause })).toBeVisible();
          await page.screenshot({ path: path.join(dir, 'focus-running.png'), fullPage: true });
        }
      });
    }
  }
}
