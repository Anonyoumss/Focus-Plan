import { expect, test, type Browser, type Page } from '@playwright/test';

export const STORAGE_KEY = 'focus_plan_m3e_v1';

export async function seedGuest(
  page: Page,
  opts: { coins?: number; locale?: string; state?: Record<string, unknown> } = {},
) {
  const { coins = 0, locale = 'en', state = {} } = opts;
  await page.addInitScript(
    ({ key, coins, locale, state }) => {
      // Seed only on the first navigation of this context: page.goto and
      // reloads re-run init scripts, and re-seeding after sign-out would
      // resurrect the fixture task and mask real state leaks.
      const seeded = sessionStorage.getItem('fp_test_seeded');
      if (!seeded && !localStorage.getItem(key)) {
        sessionStorage.setItem('fp_test_seeded', '1');
        localStorage.setItem(
          key,
          JSON.stringify({
            locale,
            themeMode: 'light',
            onboardingCompleted: true,
            seedHex: '#2e6b52',
            coins,
            focusPoints: 0,
            tasks: [],
            testGoals: [],
            sessionLogs: [],
            ...state,
          }),
        );
      }
    },
    { key: STORAGE_KEY, coins, locale, state },
  );
}

const SIGN_IN_LABELS = ['Sign In with Google', 'تسجيل الدخول عبر Google'];
const MIGRATION_LABELS = {
  import: ['Import device data', 'استيراد بيانات الجهاز'],
  useCloud: ['Use cloud data', 'استخدام البيانات السحابية'],
};

/** Drives the Auth emulator's fake Google popup for a fresh account. */
export async function signInViaPopup(page: Page, email: string) {
  await page.goto('/#/app/settings');
  await page.waitForTimeout(800);
  const signInBtn = page
    .getByRole('button', { name: new RegExp(SIGN_IN_LABELS.join('|')) })
    .first();
  if ((await signInBtn.count()) === 0) {
    test.skip(true, 'Firebase not configured in this dev server');
    return;
  }
  const popupPromise = page.context().waitForEvent('page', { timeout: 30_000 });
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

/** Clicks through the migration dialog when it appears (EN or AR labels). */
export async function handleMigration(page: Page) {
  const importBtn = page
    .getByRole('button', { name: new RegExp(MIGRATION_LABELS.import.join('|')) })
    .first();
  const useCloudBtn = page
    .getByRole('button', { name: new RegExp(MIGRATION_LABELS.useCloud.join('|')) })
    .first();
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
  await expect(page.getByText(/Signed in as|تم تسجيل الدخول/)).toBeVisible({
    timeout: 20_000,
  });
}

export async function newUserPage(
  browser: Browser,
  email: string,
  opts: { coins?: number; locale?: string; state?: Record<string, unknown> } = {},
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await seedGuest(page, opts);
  await signInViaPopup(page, email);
  await handleMigration(page);
  return { context, page };
}
