import { test, expect } from '@playwright/test';

// Live smoke test against a deployed site. Excluded from the normal suite
// (testDir is ./e2e). Run with:
//   LIVE_URL=https://anonyoumss.github.io/Focus-Plan/ npx playwright test -c playwright.live.config.ts
const LIVE_URL = process.env.LIVE_URL;

test.describe('live smoke', () => {
  test.skip(!LIVE_URL, 'Set LIVE_URL to run the live smoke test');

  test('configured build: firebase project, sign-in CTA, no console errors', async ({ page }) => {
    const errors: string[] = [];
    const failed: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.url()} -> ${r.status()}`); });

    await page.goto(LIVE_URL!, { waitUntil: 'networkidle' });

    // The built bundle must reference the real Firebase project.
    const html = await page.content();
    const scripts = await page.$$eval('script[src]', (els) => els.map((e) => (e as HTMLScriptElement).src));
    let sawProject = html.includes('focus-plan-m3e');
    for (const src of scripts) {
      if (!src) continue;
      try {
        const body = await (await page.request.get(src)).text();
        if (body.includes('focus-plan-m3e')) sawProject = true;
      } catch { /* ignore */ }
    }
    expect(sawProject, 'built JS should reference focus-plan-m3e').toBe(true);

    // Dismiss onboarding if shown, then open the app.
    const skip = page.getByRole('button', { name: /skip|تخطي/i });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.goto(`${LIVE_URL}#/app`);
    await page.waitForTimeout(1500);

    // Sign-in CTA must be present (configured backend), not the guest notice.
    await expect(page.getByText(/configured backend|خلفية مُهيأة/i)).toHaveCount(0);

    // Friends tab: create/join controls for a signed-out but configured user.
    await page.goto(`${LIVE_URL}#/app/friends`);
    await page.waitForTimeout(1500);
    await expect(page.getByText(/create.*group|إنشاء.*مجموعة/i).first()).toBeVisible();

    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
    expect(failed, `failed requests: ${failed.join(' | ')}`).toEqual([]);
  });
});
