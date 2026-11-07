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

test('expired timer completes exactly once across reloads', async ({ page }) => {
  // Simulate a focus timer whose targetEndTime passed while the tab was closed
  await page.addInitScript(
    ({ key }) => {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(
        key,
        JSON.stringify({
          locale: 'en',
          themeMode: 'light',
          onboardingCompleted: true,
          seedHex: '#2e6b52',
          isRunning: true,
          targetEndTime: Date.now() - 10_000,
          timerMode: 'focus',
          remainingSeconds: 0,
          completedFocusSessions: 0,
          todaySessionsCount: 0,
          dailyGoalSessions: 4,
          coins: 10,
          focusPoints: 0,
          tasks: [],
          testGoals: [],
          sessionLogs: [],
          transactions: [],
          inventory: {},
          streak: { currentStreak: 0, bestStreak: 0, lastActiveDate: null, streakFreezes: 0, freezeUsedDates: [] },
        }),
      );
    },
    { key: STORAGE_KEY },
  );

  await page.goto('/#/app/focus');
  await page.waitForTimeout(1500);

  const afterFirst = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return { logs: s.sessionLogs.length, coins: s.coins, running: s.isRunning };
  });
  expect(afterFirst.logs).toBe(1);
  expect(afterFirst.coins).toBe(11); // +1 focus coin, no streak bonus at 1 session
  expect(afterFirst.running).toBe(false);

  // Reload again: the persisted state is no longer running, so nothing may re-award
  await page.reload();
  await page.waitForTimeout(1200);
  const afterSecond = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return { logs: s.sessionLogs.length, coins: s.coins, tx: s.transactions.length };
  });
  expect(afterSecond.logs).toBe(1);
  expect(afterSecond.coins).toBe(11);
  expect(afterSecond.tx).toBe(1);
});

test('N shortcut opens the task dialog only inside /app routes', async ({ page }) => {
  await seed(page);

  // Landing page: TaskList is mounted but Shell is not, so N must do nothing
  await page.goto('/#/');
  await page.waitForTimeout(500);
  await page.keyboard.press('n');
  await page.waitForTimeout(400);
  await expect(page.locator('md-dialog')).toHaveCount(0);

  // App route: N opens the new-task dialog
  await page.goto('/#/app/focus');
  await page.waitForTimeout(500);
  await page.keyboard.press('n');
  await expect(page.locator('md-dialog input[type="text"]').first()).toBeVisible();
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

test('stale yesterday session count cannot satisfy today streak rule', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'focus_plan_m3e_v1',
      JSON.stringify({
        locale: 'en',
        themeMode: 'light',
        onboardingCompleted: true,
        todaySessionsCount: 3,
        todayCountDate: '2000-01-01', // stale: belongs to a previous day
        streak: (() => {
          const d = new Date(); d.setDate(d.getDate() - 1);
          const p = (n: number) => String(n).padStart(2, '0');
          return { currentStreak: 4, bestStreak: 4,
            lastActiveDate: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
            streakFreezes: 0, freezeUsedDates: [] };
        })(),
      }),
    );
  });
  await page.goto('/#/app/focus');
  await page.waitForTimeout(800);

  const result = await page.evaluate(() => {
    const dbg: any = (window as any).__fpDebug;
    const store = dbg?.store;
    if (!store) return null;
    store.setState({
      isRunning: true,
      targetEndTime: Date.now() - 1000,
      timerMode: 'focus',
      remainingSeconds: 0,
    });
    store.getState().tickTimer();
    const s = store.getState();
    return { count: s.todaySessionsCount, streak: s.streak.currentStreak };
  });
  expect(result).not.toBeNull();
  // Stale count of 3 must be discarded: this session is today's first.
  expect(result!.count).toBe(1);
  // Without the date check the stale 3 + this session = 4 >= 3 would have
  // advanced the streak to 5. It must stay at 4 (count < 3 today).
  expect(result!.streak).toBe(4);
});
