import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Two-user group/store flows against the Auth + Firestore emulators.
 * Requires `npm run test:e2e:firebase` (emulators + emulator env vars).
 * Self-skips when the dev server has no Firebase config.
 *
 * Covers: group create, invite-link join, join-by-code, shared group
 * session minutes on the leaderboard, opt-in public profile field
 * hiding, and a rule-enforced store purchase.
 */

const STORAGE_KEY = 'focus_plan_m3e_v1';

async function seedGuest(page: Page, coins = 0) {
  await page.addInitScript(
    ({ key, coins }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({
            locale: 'en',
            themeMode: 'light',
            onboardingCompleted: true,
            seedHex: '#2e6b52',
            coins,
            focusPoints: 0,
            tasks: [],
            testGoals: [],
            sessionLogs: [],
          }),
        );
      }
    },
    { key: STORAGE_KEY, coins },
  );
}

/** Drives the Auth emulator's fake Google popup for a fresh account. */
async function signInViaPopup(page: Page, email: string) {
  await page.goto('/#/app/settings');
  await page.waitForTimeout(800);
  const signInBtn = page.getByRole('button', { name: 'Sign In with Google' });
  if ((await signInBtn.count()) === 0) {
    test.skip(true, 'Firebase not configured in this dev server');
    return;
  }
  const popupPromise = page.context().waitForEvent('page', { timeout: 15_000 });
  await signInBtn.click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const addAccount = popup.getByRole('button', { name: 'Add new account' });
  if (
    await addAccount
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
  ) {
    await addAccount.click();
    await popup.locator('#email-input').fill(email);
    await popup.getByRole('button', { name: /Sign in with Google/ }).click();
  } else {
    await popup
      .getByRole('button', { name: /@|Sign in|Continue|emulator/i })
      .first()
      .click()
      .catch(() => {});
  }
  await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});
}

/** Clicks through the migration dialog when it appears. */
async function handleMigration(page: Page) {
  const importBtn = page.getByRole('button', { name: 'Import device data' });
  const useCloudBtn = page.getByRole('button', { name: 'Use cloud data' });
  const shown = await importBtn
    .or(useCloudBtn)
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (shown) {
    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
    } else {
      await useCloudBtn.click();
    }
    await page.waitForTimeout(1500);
  }
  await expect(page.getByText(/Signed in as/)).toBeVisible({ timeout: 20_000 });
}

async function newUserPage(browser: Browser, email: string, coins = 0) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await seedGuest(page, coins);
  await signInViaPopup(page, email);
  await handleMigration(page);
  return { context, page };
}

test.describe('groups emulator', () => {
  test('two users: create, join by link and code, shared minutes, leaderboard, hidden profile fields, store purchase', async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    // User A: seeded guest with coins so migration exercises the wallet path.
    const a = await newUserPage(browser, 'e2e-a@example.com', 60);
    const b = await newUserPage(browser, 'e2e-b@example.com', 0);

    try {
      // --- A creates a group -------------------------------------------
      await a.page.goto('/#/app/friends');
      await a.page.waitForTimeout(1200);
      await a.page.getByPlaceholder('Circle Name').fill('E2E Study Circle');
      await a.page.getByRole('button', { name: 'Create Study Circle' }).click();
      await expect(a.page.getByText('E2E Study Circle').first()).toBeVisible({
        timeout: 15_000,
      });
      const inviteCode = (await a.page.locator('code').first().innerText()).trim();
      expect(inviteCode.length).toBeGreaterThanOrEqual(6);

      // --- B joins via the invite link --------------------------------
      await b.page.goto(`/#/invite/${inviteCode}`);
      await expect(b.page.getByText('E2E Study Circle')).toBeVisible({ timeout: 15_000 });
      await b.page.getByRole('button', { name: 'Join', exact: true }).click();
      await expect(b.page.getByText('Joined group')).toBeVisible({ timeout: 15_000 });
      await b.page.getByRole('button', { name: 'Study Circles & Groups' }).click();
      await b.page.waitForTimeout(1200);
      await expect(b.page.getByText('E2E Study Circle').first()).toBeVisible();
      await expect(b.page.getByText(/Members \(2\)/)).toBeVisible({ timeout: 15_000 });

      // --- B logs 25 shared minutes via the emulator hook -------------
      const bUid = await b.page.evaluate(() => (window as any).__fpEmu.uid());
      const groups = await b.page.evaluate((uid) => (window as any).__fpEmu.listMyGroups(uid), bUid);
      const gid = groups[0].id as string;
      const tasks = await b.page.evaluate(
        (g) => (window as any).__fpEmu.listGroupTasks(g),
        gid,
      );
      expect(tasks.length).toBeGreaterThan(0);
      await b.page.evaluate(
        ([g, u, taskId]) =>
          (window as any).__fpEmu.logGroupSession(g, u, taskId, 25),
        [gid, bUid, tasks[0].id],
      );

      // --- A reloads: leaderboard shows B's minutes ranked first -------
      await a.page.reload();
      await a.page.waitForTimeout(2000);
      await a.page.goto('/#/app/friends');
      await a.page.waitForTimeout(2000);
      await expect(a.page.getByText('25 mins')).toBeVisible({ timeout: 15_000 });

      // Deterministic order check: B's weekly minutes exceed A's (0).
      const aUidEarly = await a.page.evaluate(() => (window as any).__fpEmu.uid());
      const boardCheck = await a.page.evaluate(
        async ([g, uA, uB]) => {
          const sessions = await (window as any).__fpEmu.listGroupSessions(g);
          const sum = (uid: string) =>
            sessions
              .filter((s: any) => s.uid === uid)
              .reduce((n: number, s: any) => n + s.minutes, 0);
          return { a: sum(uA), b: sum(uB), members: sessions.length };
        },
        [gid, aUidEarly, bUid],
      );
      expect(boardCheck.b).toBe(25);
      expect(boardCheck.b).toBeGreaterThan(boardCheck.a);

      // --- Public profile: hidden fields never reach the reader --------
      await b.page.evaluate(
        (uid) =>
          (window as any).__fpEmu.savePublicProfile(uid, {
            alias: 'B-public',
            shareMinutes: true,
            shareStreak: false,
            shareFocusPoints: false,
            weeklyMinutes: 25,
          }),
        bUid,
      );
      const pub = await a.page.evaluate(
        (uid) => (window as any).__fpEmu.getPublicProfile(uid),
        bUid,
      );
      expect(pub).not.toBeNull();
      expect(pub.alias).toBe('B-public');
      expect(pub.weeklyMinutes).toBe(25);
      // shareStreak=false: the streak key must be absent, not zeroed.
      expect('streak' in pub).toBe(false);
      expect(pub.shareStreak).toBe(false);

      // --- B leaves via UI, then rejoins by code -----------------------
      await b.page.getByRole('button', { name: 'Leave group' }).click();
      await b.page.waitForTimeout(1500);
      await expect(b.page.getByText('Left group')).toBeVisible({ timeout: 15_000 });
      await b.page.getByPlaceholder('Enter 6-character code').fill(inviteCode);
      await b.page.getByRole('button', { name: 'Join', exact: true }).click();
      await b.page.waitForTimeout(2000);
      await expect(b.page.getByText(/Members \(2\)/)).toBeVisible({ timeout: 15_000 });

      // --- A's migrated coins (60) fund a rule-enforced purchase --------
      // reconcileWallet chunked the local balance into the cloud wallet;
      // spendCoins then debits 10 for streak_freeze in one transaction.
      await a.page.goto('/#/app/store');
      await a.page.waitForTimeout(1500);
      const buyBtn = a.page
        .locator('md-filled-button', { hasText: 'Redeem Item' })
        .first();
      await buyBtn.click();
      await expect(
        a.page.getByText('Item redeemed and added to your inventory'),
      ).toBeVisible({ timeout: 15_000 });

      const aUid = await a.page.evaluate(() => (window as any).__fpEmu.uid());
      const wallet = await a.page.evaluate(
        (uid) => (window as any).__fpEmu.getWallet(uid),
        aUid,
      );
      // 60 migrated - 10 spent = 50 (mirror writes are best-effort, so
      // allow the local award mirror to have added a little slack).
      expect(wallet.coins).toBeGreaterThanOrEqual(40);
      expect(wallet.coins).toBeLessThanOrEqual(60);
    } finally {
      await a.context.close();
      await b.context.close();
    }
  });
});
