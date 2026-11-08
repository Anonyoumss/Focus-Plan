import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'focus_plan_m3e_v1';
const baseState = { locale: 'en', themeMode: 'light', onboardingCompleted: true, seedHex: '#2e6b52' };

async function seed(page: import('@playwright/test').Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, state: { ...baseState, ...extra } },
  );
}

test('test picker: flat search filters catalog', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/tests');
  const search = page.getByRole('searchbox', { name: /search tests/i });
  await search.fill('SAT');
  await expect(page.getByText('SAT Digital').first()).toBeVisible();
  expect(await page.getByRole('button', { name: '+ Add Goal' }).count()).toBeGreaterThan(0);
  await search.fill('zzz-no-match');
  await expect(page.getByRole('button', { name: '+ Add Goal' })).toHaveCount(0);
});

test('intake flow: unknown score path saves a goal', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/tests');
  // open intake for the first catalog card's Add Goal button
  await page.getByRole('button', { name: '+ Add Goal' }).first().click();
  const dialog = page.locator('md-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByText("I don't know my score yet").click();
  await expect(dialog.getByText('Save goal')).toBeVisible();
  await dialog.getByRole('button', { name: 'Save goal' }).click();
  await expect(dialog).toHaveCount(0);
  // a goal card now exists
  await expect(page.getByText('Days Left').first()).toBeVisible();
});

test('intake flow: out-of-range section target is rejected', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/tests');
  await page.getByRole('button', { name: '+ Add Goal' }).first().click();
  const dialog = page.locator('md-dialog');
  // first section target input: set beyond max
  const lastTarget = dialog.locator('input[type="number"]').last();
  await lastTarget.fill('9999');
  await dialog.getByRole('button', { name: 'Save goal' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
});

test('task deadline: set via dialog, shown and overdue state', async ({ page }) => {
  await seed(page, {
    tasks: [
      {
        id: 't1',
        title: 'Deadline task',
        category: 'Study',
        estimatedSessions: 4,
        minGoal: 1,
        maxGoal: 4,
        cadence: 'daily',
        notes: '',
        deadline: '2020-01-01',
        isCompleted: false,
        createdAt: Date.now(),
      },
    ],
  });
  await page.goto('/#/app/focus');
  await expect(page.getByText('overdue').first()).toBeVisible();
});

const planTask = {
  id: 'pt1', title: 'Math practice', category: 'Study', estimatedSessions: 8,
  minGoal: 2, maxGoal: 6, cadence: 'daily', notes: '', isCompleted: false,
  createdAt: Date.now(), completedSessions: 2,
};
const planGoal = {
  id: 'pg1', testId: 'sat', testName: 'SAT Digital', testDate: (() => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })(),
  targetScore: 1500, currentBaselineScore: 1200, sectionTargets: {},
  weeklyHours: 5, weeklyPomodoros: 10, completedPomodoros: 4, scoresHistory: [],
};

test('plan page: week agenda shows study blocks, deadline and test date', async ({ page }) => {
  await seed(page, { tasks: [planTask], testGoals: [planGoal] });
  await page.goto('/#/app/plan');
  await expect(page.getByText('Math practice').first()).toBeVisible();
  await expect(page.getByText('SAT Digital').first()).toBeVisible();
  await expect(page.getByText('Weekly plan from test goals')).toBeVisible();
  await expect(page.getByText('Sessions / week')).toBeVisible();
});

test('plan page: empty state with one-tap actions', async ({ page }) => {
  await seed(page);
  await page.goto('/#/app/plan');
  await expect(page.getByText('Nothing planned yet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add test' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set cadence' })).toBeVisible();
});

test('arabic: plan page and intake search render RTL', async ({ page }) => {
  await seed(page, { locale: 'ar', tasks: [planTask], testGoals: [planGoal] });
  await page.goto('/#/app/plan');
  await expect(page.getByText('الخطة الأسبوعية للأهداف')).toBeVisible();
  await expect(page.getByText('اليوم').first()).toBeVisible();
  await expect(page.getByText('Math practice').first()).toBeVisible();
  await page.goto('/#/app/tests');
  await page.getByRole('searchbox').fill('SAT');
  await expect(page.getByText('SAT Digital').first()).toBeVisible();
});
