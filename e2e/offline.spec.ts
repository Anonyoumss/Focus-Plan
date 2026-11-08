import { expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';

/**
 * Offline PWA check: load the prod build once (populating the service
 * worker cache), go offline, reload, and verify the app shell, tasks and
 * the timer still work. Mirrors GitHub Pages under /Focus-Plan/.
 */

let server: ChildProcess;
const BASE = 'http://127.0.0.1:4173/Focus-Plan/';
const STORAGE_KEY = 'focus_plan_m3e_v1';

test.beforeAll(async () => {
  server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const res = await fetch(BASE);
      if (res.ok) break;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error('vite preview did not start');
    await new Promise((r) => setTimeout(r, 500));
  }
});

test.afterAll(() => {
  server?.kill('SIGTERM');
});

test('offline: app shell, tasks and timer survive reload without network', async ({ page, context }) => {
  await page.addInitScript(
    ([key]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({
            locale: 'en',
            themeMode: 'light',
            onboardingCompleted: true,
            seedHex: '#2e6b52',
            tasks: [
              {
                id: 'offline_task',
                title: 'Offline task',
                category: 'Study',
                estimatedSessions: 4,
                completedSessions: 0,
                minGoal: 1,
                maxGoal: 4,
                cadence: 'daily',
                notes: '',
                isCompleted: false,
                createdAt: Date.now(),
              },
            ],
          }),
        );
      }
    },
    [STORAGE_KEY],
  );

  await page.goto(`${BASE}#/app/focus`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Offline task')).toBeVisible();

  // Wait for the service worker to take control of this page.
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 15_000 });
  // Let the runtime cache fill for the current assets.
  await page.waitForTimeout(1000);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Offline task')).toBeVisible({ timeout: 20_000 });
  // Timer controls still work offline.
  const startBtn = page.getByRole('button', { name: /start|ابدأ/i }).first();
  await expect(startBtn).toBeVisible();
});
