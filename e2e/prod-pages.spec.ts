import { expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';

/**
 * Verifies the production build served under the /Focus-Plan/ base path,
 * mimicking GitHub Pages. Spawns `vite preview` on port 4173.
 */

let server: ChildProcess;
const BASE = 'http://127.0.0.1:4173/Focus-Plan/';

test.beforeAll(async () => {
  server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  // Wait for the server
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

test('prod build: landing, app routes, legal, invite, reloads, assets', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => {
    // Code-split lazy chunks can be aborted by rapid route navigations;
    // only real load failures matter.
    if (r.failure()?.errorText?.includes('ERR_ABORTED')) return;
    errors.push(`reqfail:${r.url()}`);
  });

  // Landing
  await page.goto(BASE);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './manifest.json');

  // App route + reload
  await page.goto(`${BASE}#/app`);
  await expect(page.locator('body')).toBeVisible();
  await page.reload();
  await page.waitForTimeout(600);

  // Legal routes
  for (const route of ['#/terms', '#/privacy']) {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(500);
    await expect(page.locator('body')).not.toBeEmpty();
  }

  // Invite link route
  await page.goto(`${BASE}#/invite/ABC123`);
  await page.waitForTimeout(600);
  await expect(page.locator('body')).not.toBeEmpty();

  // Manifest + icon resolve under base
  const manifest = await page.evaluate(async () => {
    const res = await fetch('./manifest.json');
    return res.json();
  });
  expect(manifest.start_url).toBe('./#/app');
  expect(manifest.scope).toBe('./');
  const iconRes = await page.evaluate(async () => (await fetch('./icon.svg')).status);
  expect(iconRes).toBe(200);

  // JS/CSS assets all loaded (no requestfailed for same-origin assets)
  const assetFails = errors.filter((e) => e.startsWith('reqfail') && e.includes('127.0.0.1:4173'));
  expect(assetFails).toEqual([]);
  expect(errors.filter((e) => !e.startsWith('reqfail'))).toEqual([]);
});
