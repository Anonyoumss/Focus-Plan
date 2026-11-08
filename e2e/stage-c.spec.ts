import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'focus_plan_m3e_v1';

const baseState = {
  locale: 'en',
  themeMode: 'light',
  onboardingCompleted: true,
  seedHex: '#2e6b52',
};

async function seed(page: import('@playwright/test').Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, state: { ...baseState, ...extra } },
  );
}

test('app shell is fixed-height: bottom nav stays put while content scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 560 });
  await seed(page, {
    sessionLogs: Array.from({ length: 30 }, (_, i) => ({
      id: `s${i}`,
      taskId: 't1',
      mode: 'focus',
      durationMinutes: 25,
      timestamp: Date.now() - i * 86400000,
      dateStr: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      category: 'Math',
    })),
    tasks: [
      {
        id: 't1',
        title: 'Long task title for scroll testing',
        category: 'Math',
        estimatedSessions: 10,
        minGoal: 1,
        maxGoal: 10,
        cadence: 'daily',
        isCompleted: false,
        createdAt: Date.now(),
      },
    ],
  });
  await page.goto('/#/app/progress');
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();

  const nav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
  await expect(nav).toBeVisible();
  const navBox = await nav.boundingBox();
  expect(navBox).not.toBeNull();
  expect(Math.round(navBox!.y + navBox!.height)).toBe(560);

  const main = page.locator('main');
  const scrollable = await main.evaluate((el) => el.scrollHeight > el.clientHeight + 50);
  expect(scrollable).toBe(true);
  await main.evaluate((el) => el.scrollTo(0, 400));
  const navBoxAfter = await nav.boundingBox();
  expect(Math.round(navBoxAfter!.y + navBoxAfter!.height)).toBe(560);
});

test('timer mode tints the shell background', async ({ page }) => {
  const bg = async () =>
    page.evaluate(() => {
      const el = document.querySelector('#root > div');
      return el ? getComputedStyle(el).backgroundColor : '';
    });
  await seed(page, { timerMode: 'focus' });
  await page.goto('/#/app/focus');
  await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible();
  const focusBg = await bg();

  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    s.timerMode = 'shortBreak';
    localStorage.setItem('focus_plan_m3e_v1', JSON.stringify(s));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Focus' })).toBeVisible();
  const breakBg = await bg();
  expect(breakBg).not.toBe(focusBg);
});

test('spotlight mode dims the app while running and Escape exits', async ({ page }) => {
  await seed(page, { spotlightMode: true });
  await page.goto('/#/app/focus');
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await expect(page.getByTestId('spotlight-scrim')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('spotlight-scrim')).toHaveCount(0);

  // Pause also exits (isRunning false)
  await page.getByRole('button', { name: 'Pause Timer' }).click();
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await expect(page.getByTestId('spotlight-scrim')).toBeVisible();
  await page.getByRole('button', { name: 'Pause Timer' }).click();
  await expect(page.getByTestId('spotlight-scrim')).toHaveCount(0);
});

test('reduce animations toggle sets the reduce-motion class', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/settings');
  const hasClass = () =>
    page.evaluate(() => document.documentElement.classList.contains('reduce-motion'));
  expect(await hasClass()).toBe(false);
  await page.getByText('Reduce animations').click();
  await expect.poll(hasClass).toBe(true);
  const persisted = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return s.reduceAnimations;
  });
  expect(persisted).toBe(true);
});

test('language defaults from navigator.languages and onboarding offers a picker', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'languages', { get: () => ['ar-SA', 'ar'] });
    } catch {
      /* readonly in some builds */
    }
  });
  await page.goto('/#/app');
  // Onboarding appears; switch to Arabic via its picker
  await page.getByRole('button', { name: 'العربية' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('button', { name: 'تخطي الإعداد' }).click();
  await expect(page.getByRole('button', { name: 'تخطي الإعداد' })).toHaveCount(0);
});

test('GAT catalog entry shows Qudurat subtitle without "Saudi GAT"', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/tests');
  await expect(page.getByText('Qudurat').first()).toBeVisible();
  await expect(page.getByText('Saudi GAT')).toHaveCount(0);
});

test('in-app shell has no footer; Settings keeps a Legal entry', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/progress');
  await expect(page.locator('footer')).toHaveCount(0);
  await page.goto('/#/app/settings');
  await expect(page.getByRole('button', { name: 'Terms' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Privacy' })).toBeVisible();
});

test('guests see a Friends preview and a configured-backend notice', async ({ page }) => {
  await seed(page, { firebaseEnabled: false });
  await page.goto('/#/app/friends');
  await expect(page.getByText(/configured backend|خلفية مُهيأة/i)).toBeVisible();
});

test('progress renders 2000 session logs without blank screen', async ({ page }) => {
  await seed(page, {
    sessionLogs: Array.from({ length: 2000 }, (_, i) => ({
      id: `s${i}`,
      taskId: 't1',
      mode: 'focus',
      durationMinutes: 25,
      timestamp: Date.now() - i * 3600000,
      dateStr: new Date(Date.now() - i * 3600000).toISOString().split('T')[0],
      category: 'Math',
    })),
  });
  await page.goto('/#/app/progress');
  // warm the chunk, then measure a client-side revisit
  await expect(page.getByText('Study Telemetry').first()).toBeVisible({ timeout: 10000 });
  const t0 = Date.now();
  await page.goto('/#/app/focus');
  await page.goto('/#/app/progress');
  await expect(page.getByText('Study Telemetry').first()).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(5000);
});
