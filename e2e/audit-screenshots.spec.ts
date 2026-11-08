import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

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
    more: 'More',
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
    more: 'المزيد',
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

/** Wait for lazy chunks, skeletons, fonts and reveal animations to settle. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15000 });
  await page.waitForTimeout(700);
}

/** Screenshot that fails if the image is (nearly) one solid color. */
async function shot(page: Page, file: string) {
  await settle(page);
  const buf = await page.screenshot({ fullPage: true });
  const png = PNG.sync.read(buf);
  // Sample every 97th pixel; a real UI has large luminance variance.
  let n = 0, sum = 0, sumSq = 0;
  for (let i = 0; i < png.data.length; i += 4 * 97) {
    const lum = 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
    sum += lum; sumSq += lum * lum; n++;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  expect(variance, `${file} looks like a solid-color blank (${variance.toFixed(1)})`).toBeGreaterThan(50);
  fs.writeFileSync(file, buf);
}

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

        await page.goto('/#/app');
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, `horizontal overflow at ${viewport.width}px`).toBeLessThanOrEqual(viewport.width + 1);
        if (theme === 'dark') {
          await expect(page.locator('html')).toHaveClass(/dark/);
        }
        await shot(page, path.join(dir, 'onboarding.png'));
        await page.getByRole('button', { name: labels.skip }).click();
        await expect(page.getByRole('button', { name: labels.skip })).toHaveCount(0);
        // Seed realistic demo data so charts/lists are not empty.
        await page.evaluate(() => {
          (window as unknown as { __appStore: { getState: () => { loadDemoData: () => void } } })
            .__appStore.getState().loadDemoData();
        });

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

        const overflowIds = new Set(['friends', 'store', 'settings']);
        for (const [id, label] of railScreens) {
          let button = nav.getByRole('button', { name: label });
          if (viewport.name === 'phone' && overflowIds.has(id)) {
            await nav.getByRole('button', { name: labels.more }).click();
            button = page.getByRole('dialog').getByRole('button', { name: label });
          }
          if ((await button.count()) === 0) {
            fs.writeFileSync(
              path.join(dir, `${id}.unreachable.txt`),
              `${label} is not in the ${navName} at ${viewport.width}px.\n`,
            );
            continue;
          }
          await button.click();
          await shot(page, path.join(dir, `${id}.png`));
        }

        // Legal pages live in Settings now (in-app footer was removed)
        let settingsButton = nav.getByRole('button', { name: labels.settings });
        if (viewport.name === 'phone') {
          await nav.getByRole('button', { name: labels.more }).click();
          settingsButton = page.getByRole('dialog').getByRole('button', { name: labels.settings });
        }
        await settingsButton.click();
        await page.getByRole('button', { name: labels.terms }).click();
        await shot(page, path.join(dir, 'terms.png'));
        await page.goBack(); // returns to Settings without a reload (init script would re-seed onboarding)
        await page.getByRole('button', { name: labels.privacy }).click();
        await shot(page, path.join(dir, 'privacy.png'));

        if (locale === 'en' && theme === 'light' && viewport.name === 'desktop') {
          await nav.getByRole('button', { name: labels.focus }).click();
          await page.getByRole('button', { name: labels.start }).click();
          await expect(page.getByRole('button', { name: labels.pause })).toBeVisible();
          await shot(page, path.join(dir, 'focus-running.png'));
        }

        // Landing page and invite placeholder at the same locale/theme/viewport
        await page.goto('/#/');
        await page.waitForTimeout(400);
        const landingScroll = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(landingScroll, `landing overflow at ${viewport.width}px`).toBeLessThanOrEqual(viewport.width + 1);
        await shot(page, path.join(dir, 'landing.png'));

        await page.goto('/#/invite/ZZZZZZ');
        await page.waitForTimeout(300);
        await shot(page, path.join(dir, 'invite.png'));
      });
    }
  }
}
