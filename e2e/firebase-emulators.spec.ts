import { expect, test } from '@playwright/test';

/**
 * Firebase Auth + Firestore emulator end-to-end tests.
 *
 * Requires the Emulator Suite running (auth on 9099, firestore on 8080)
 * and the dev server started with emulator env vars:
 *
 *   VITE_USE_EMULATORS=true \
 *   VITE_FIREBASE_API_KEY=demo-api-key \
 *   VITE_FIREBASE_AUTH_DOMAIN=demo-focus-plan-m3e.firebaseapp.com \
 *   VITE_FIREBASE_PROJECT_ID=demo-focus-plan-m3e \
 *   VITE_FIREBASE_STORAGE_BUCKET=demo-focus-plan-m3e.appspot.com \
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 \
 *   VITE_FIREBASE_APP_ID=1:000000000000:web:demo \
 *   npm run dev
 *
 * Then: npx playwright test e2e/firebase-emulators.spec.ts
 * (or `npm run test:e2e:firebase` which wraps both steps)
 *
 * The suite skips itself when Firebase is not configured in the page.
 */

const STORAGE_KEY = 'focus_plan_m3e_v1';

async function seedGuest(page: import('@playwright/test').Page) {
  await page.addInitScript((key) => {
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
              id: 'guest_task_1',
              title: 'Guest task to migrate',
              category: 'Study',
              estimatedSessions: 2,
              completedSessions: 0,
              minGoal: 1,
              maxGoal: 4,
              cadence: 'daily',
              notes: '',
              isCompleted: false,
              createdAt: Date.now(),
            },
          ],
          testGoals: [],
          sessionLogs: [],
        }),
      );
    }
  }, STORAGE_KEY);
}

test.describe('firebase emulators', () => {
  test.beforeEach(async ({ page }) => {
    await seedGuest(page);
    await page.goto('/#/app/settings');
    await page.waitForTimeout(800);
  });

  test('sign in, migrate, sync task, reload persists, sign out hides data', async ({
    page,
    context,
  }) => {
    const signInBtn = page.getByRole('button', { name: 'Sign In with Google' });

    // Skip cleanly when Firebase env is absent (guest-only build).
    if ((await signInBtn.count()) === 0) {
      test.skip(true, 'Firebase not configured in this dev server');
      return;
    }

    // Google sign-in opens a popup; the Auth emulator serves a fake
    // account chooser on 127.0.0.1:9099.
    const popupPromise = context.waitForEvent('page', { timeout: 15_000 });
    await signInBtn.click();
    const popup = await popupPromise.catch(() => null);
    if (popup) {
      // Emulator handler page: first run shows "Add new account" which
      // expands a form (email + submit). Later runs may show the saved
      // account chooser instead.
      await popup.waitForLoadState('domcontentloaded');
      const addAccount = popup.getByRole('button', { name: 'Add new account' });
      if (
        await addAccount
          .waitFor({ state: 'visible', timeout: 5_000 })
          .then(() => true)
          .catch(() => false)
      ) {
        await addAccount.click();
        await popup.locator('#email-input').fill('e2e@example.com');
        await popup
          .getByRole('button', { name: /Sign in with Google/ })
          .click();
      } else {
        const accountBtn = popup
          .getByRole('button', { name: /@|Sign in|Continue|emulator/i })
          .first();
        if (await accountBtn.count()) {
          await accountBtn.click().catch(() => {});
        }
      }
      await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});
    }

    // After auth resolves the app checks Firestore for existing cloud
    // data, then either shows the migration dialog (guest data + empty
    // or non-empty cloud) or goes straight to the signed-in state. The
    // check is async, so wait for the dialog explicitly instead of
    // racing it with isVisible().
    const signedIn = page.getByText(/Signed in as|تم تسجيل الدخول/);
    const migrationImport = page.getByRole('button', { name: 'Import device data' });
    const migrationShown = await migrationImport
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (migrationShown) {
      await migrationImport.click();
      // Import writes the guest snapshot to Firestore; wait for the
      // dialog to close before driving the rest of the test.
      await migrationImport
        .waitFor({ state: 'hidden', timeout: 20_000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
    }

    await expect(signedIn).toBeVisible({ timeout: 20_000 });

    // Create a task while signed in; it should sync to Firestore.
    await page.goto('/#/app/focus');
    await page.waitForTimeout(600);
    await page.keyboard.press('n');
    await page.locator('md-dialog input[type="text"]').first().fill('Cloud synced task');
    await page.getByRole('button', { name: 'Save Task' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('[data-task-row]', { hasText: 'Cloud synced task' })).toHaveCount(1);

    // Wait for the debounced cloud push, then reload and confirm persistence.
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(
      page.locator('[data-task-row]', { hasText: 'Cloud synced task' }),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-task-row]', { hasText: 'Guest task to migrate' }),
    ).toHaveCount(1);

    // Sign out: previous user's data must not remain on screen.
    await page.goto('/#/app/settings');
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.waitForTimeout(1500);
    await page.goto('/#/app/focus');
    await page.waitForTimeout(800);
    await expect(page.locator('[data-task-row]')).toHaveCount(0);
    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('focus_plan_m3e_v1');
      // -1: storage key removed entirely; 0: present with no tasks.
      return raw ? JSON.parse(raw).tasks?.length ?? -1 : -1;
    });
    expect(persisted).toBeLessThanOrEqual(0);
  });
});
