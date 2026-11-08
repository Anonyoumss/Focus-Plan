import { expect, test } from '@playwright/test';
import { spawn, execSync, type ChildProcess } from 'node:child_process';

/**
 * Verifies the production build under both deploy bases:
 *  - DEPLOY_TARGET=pages  -> served under /Focus-Plan/ (GitHub Pages)
 *  - DEPLOY_TARGET unset  -> served under / (Vercel / local preview)
 * Each config builds dist fresh, spawns `vite preview`, and checks landing,
 * app/legal/invite hash routes, reloads, manifest+icons, zero failed
 * same-origin requests, and an offline reload via the service worker.
 */

const CONFIGS = [
  { name: 'pages', env: { DEPLOY_TARGET: 'pages' }, port: 4173, base: 'http://127.0.0.1:4173/Focus-Plan/' },
  { name: 'root', env: {}, port: 4174, base: 'http://127.0.0.1:4174/' },
] as const;

const STORAGE_KEY = 'focus_plan_m3e_v1';

async function waitForServer(url: string) {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error(`vite preview did not start for ${url}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

for (const cfg of CONFIGS) {
  test.describe(`prod build base=${cfg.name}`, () => {
    let server: ChildProcess;

    test.beforeAll(async () => {
      execSync('npm run build', {
        cwd: process.cwd(),
        env: { ...process.env, ...cfg.env },
        stdio: 'ignore',
      });
      server = spawn('npx', ['vite', 'preview', '--port', String(cfg.port), '--strictPort'], {
        cwd: process.cwd(),
        stdio: 'ignore',
      });
      await waitForServer(cfg.base);
    });

    test.afterAll(() => {
      server?.kill('SIGTERM');
    });

    test('landing, routes, reloads, assets, offline', async ({ page, context }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('requestfailed', (r) => {
        if (r.failure()?.errorText?.includes('ERR_ABORTED')) return;
        errors.push(`reqfail:${r.url()}`);
      });

      // Seed guest state so the app shell renders without onboarding.
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

      // Landing
      await page.goto(cfg.base);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './manifest.json');

      // App route + reload
      await page.goto(`${cfg.base}#/app`);
      await page.waitForTimeout(600);
      await expect(page.locator('body')).not.toBeEmpty();
      await page.reload();
      await page.waitForTimeout(600);
      await expect(page.getByText('Offline task')).toBeVisible();

      // Legal + invite routes
      for (const route of ['#/terms', '#/privacy', '#/invite/ABC123']) {
        await page.goto(`${cfg.base}${route}`);
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
      }

      // Manifest + icon resolve under base
      const manifest = await page.evaluate(async () => (await (await fetch('./manifest.json')).json()));
      expect(manifest.start_url).toBe('./#/app');
      expect(manifest.scope).toBe('./');
      expect((await page.evaluate(async () => (await fetch('./icon.svg')).status))).toBe(200);

      // Offline reload: SW must serve shell + assets.
      await page.goto(`${cfg.base}#/app/focus`);
      await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 15_000 });
      await page.waitForTimeout(800);
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Offline task')).toBeVisible({ timeout: 20_000 });
      await context.setOffline(false);

      const assetFails = errors.filter((e) => e.startsWith('reqfail'));
      expect(assetFails).toEqual([]);
      expect(errors.filter((e) => !e.startsWith('reqfail'))).toEqual([]);
    });
  });
}
