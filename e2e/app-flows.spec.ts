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
      // Only seed once; later navigations (e.g. reload) must keep persisted state
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, state: { ...baseState, ...extra } },
  );
}

test('onboarding shows for new users and skip dismisses it', async ({ page }) => {
  await page.goto('/#/app');
  await expect(page.getByRole('button', { name: 'Skip Setup' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/en/light/desktop/onboarding-check.png' });
  await page.getByRole('button', { name: 'Skip Setup' }).click();
  await expect(page.getByRole('button', { name: 'Skip Setup' })).toHaveCount(0);
});

test('timer starts, pauses, and survives reload', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/focus');
  await page.waitForTimeout(400);

  const startBtn = page.getByRole('button', { name: 'Start Focus' });
  const pauseBtn = page.getByRole('button', { name: 'Pause Timer' });
  await expect(startBtn).toBeVisible();
  await startBtn.click();
  await expect(pauseBtn).toBeVisible();

  // Wavy ring path is populated while running
  await expect
    .poll(async () =>
      page.evaluate(() => (document.querySelector('main svg path')?.getAttribute('d') || '').length),
    )
    .toBeGreaterThan(50);

  await pauseBtn.click();
  await expect(startBtn).toBeVisible();

  // Restart and reload: timer must resume from persisted targetEndTime
  await startBtn.click();
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(800);
  await expect(pauseBtn).toBeVisible();
  const persisted = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return { isRunning: s.isRunning, hasEnd: !!s.targetEndTime };
  });
  expect(persisted.isRunning).toBe(true);
  expect(persisted.hasEnd).toBe(true);
});

test('store purchase deducts coins and marks item owned', async ({ page }) => {
  await seed(page, { coins: 50, focusPoints: 0 });
  await page.goto('/#/app/store');
  await page.waitForTimeout(500);

  const coinText = page.locator('text=50').first();
  await expect(coinText).toBeVisible();

  // Buy the 10-coin streak freeze (first md-filled-button in the grid)
  const buyButtons = page.locator('md-filled-button');
  await expect(buyButtons.first()).toBeVisible();
  await buyButtons.first().click();
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return { coins: s.coins, inventory: s.inventory };
  });
  expect(state.coins).toBe(40);
  expect(state.inventory.streak_freeze).toBe(1);
});

test('score entry updates goal baseline and history', async ({ page }) => {
  await seed(page, {
    testGoals: [
      {
        id: 'goal_sat',
        testId: 'sat_collegeboard',
        testName: 'SAT Digital',
        testDate: '2027-01-01',
        targetScore: 1480,
        currentBaselineScore: 1360,
        sectionTargets: { sat_reading_writing: 720, sat_math: 760 },
        weeklyHours: 10,
        weeklyPomodoros: 20,
        completedPomodoros: 0,
        scoresHistory: [],
      },
    ],
  });
  await page.goto('/#/app/tests');
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: /Score Loop|حلقة مراجعة/ }).click();
  await page.getByRole('button', { name: /Log New Mock|تسجيل اختبار/ }).click();
  const scoreInput = page.locator('input[type="number"]').first();
  await scoreInput.fill('1400');
  await page.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return s.testGoals[0];
  });
  expect(state.currentBaselineScore).toBe(1400);
  expect(state.scoresHistory.length).toBe(1);
  expect(state.scoresHistory[0].score).toBe(1400);
});

test('task create, edit, and keyboard reorder work', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/focus');
  await page.waitForTimeout(500);

  // N shortcut opens the new-task dialog
  await page.keyboard.press('n');
  const titleField = page.locator('md-dialog input[type="text"]').first();
  await expect(titleField).toBeVisible();
  await titleField.fill('Alpha task');
  await page.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-task-row]', { hasText: 'Alpha task' })).toHaveCount(1);

  // Create a second task
  await page.keyboard.press('n');
  await page.locator('md-dialog input[type="text"]').first().fill('Beta task');
  await page.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-task-row]', { hasText: 'Beta task' })).toHaveCount(1);

  // Edit the first task via its edit button
  const alphaRow = page.locator('[data-task-row]', { hasText: 'Alpha task' });
  await alphaRow.getByRole('button', { name: 'Edit task' }).click();
  const editTitle = page.locator('md-dialog input[type="text"]').first();
  await editTitle.fill('Alpha task edited');
  await page.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-task-row]', { hasText: 'Alpha task edited' })).toHaveCount(1);

  // Keyboard/button reorder: newest task is first, so move "Alpha task edited" up
  const alphaEditedRow = page.locator('[data-task-row]', { hasText: 'Alpha task edited' });
  await alphaEditedRow.getByRole('button', { name: 'Move task up' }).click();
  await page.waitForTimeout(300);
  const order = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return s.tasks.map((t: { title: string }) => t.title);
  });
  expect(order[0]).toBe('Alpha task edited');
});
