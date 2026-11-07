import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'focus_plan_m3e_v1';

const baseState = {
  locale: 'en',
  themeMode: 'light',
  onboardingCompleted: true,
  seedHex: '#2e6b52',
};

const task = (id: string, title: string) => ({
  id,
  title,
  category: 'Study',
  estimatedSessions: 4,
  completedSessions: 0,
  minGoal: 2,
  maxGoal: 4,
  cadence: 'daily',
  notes: '',
  isCompleted: false,
  createdAt: 1000,
});

const goal = {
  id: 'goal_gat',
  testId: 'gat_qudurat',
  testName: 'Saudi GAT (Qudurat)',
  testDate: '2027-01-01',
  targetScore: 80,
  currentBaselineScore: 60,
  sectionTargets: {},
  weeklyHours: 10,
  weeklyPomodoros: 20,
  completedPomodoros: 0,
  scoresHistory: [],
};

async function seed(page: import('@playwright/test').Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, state: { ...baseState, ...extra } },
  );
}

test('task templates: save list, apply, rename, delete', async ({ page }) => {
  await seed(page, { tasks: [task('t1', 'Alpha'), task('t2', 'Beta')] });
  await page.goto('/#/app/settings');
  await page.waitForTimeout(400);

  await page.getByPlaceholder('Template name').fill('My list');
  await page.getByRole('button', { name: 'Save task list as template' }).click();
  await expect(page.getByText('My list · 2 items')).toBeVisible();

  // Applying duplicates the two tasks
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!).tasks.length);
  await page.getByRole('button', { name: 'Load template' }).click();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!).tasks.length);
  expect(after).toBe(before + 2);

  // Rename then delete
  const tplRow = page.locator('li', { hasText: 'My list' });
  await tplRow.getByRole('button', { name: 'Rename' }).click();
  await page.getByPlaceholder('My list').fill('Renamed tpl');
  await page.getByRole('button', { name: 'Rename' }).click();
  await expect(page.getByText(/Renamed tpl/)).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await expect(page.getByText('Renamed tpl')).toHaveCount(0);
});

test('JSON and CSV import validate and never crash', async ({ page }) => {
  await seed(page, { tasks: [] });
  await page.goto('/#/app/settings');
  await page.waitForTimeout(400);

  const csv = 'title,category,estimatedSessions,minGoal,maxGoal,cadence,notes\nImported task,Study,3,1,3,daily,note\n';
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: 'tasks.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await expect(page.getByText(/Imported tasks successfully/)).toBeVisible({ timeout: 5000 });

  await page.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{oops'),
  });
  await expect(page.getByText(/Import failed/)).toBeVisible({ timeout: 5000 });

  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!).tasks.length);
  expect(count).toBe(1);
});

test('editable test sections validate and persist', async ({ page }) => {
  await seed(page, { testGoals: [goal] });
  await page.goto('/#/app/tests');
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: 'Edit sections' }).click();
  await expect(page.getByText('Test sections')).toBeVisible();

  // Break validation: set a min above max on the first row's min input
  const minInputs = page.locator('md-dialog input[type="number"]');
  await minInputs.nth(0).fill('500');
  await page.getByRole('button', { name: 'Save Task' }).click();
  await expect(page.getByRole('alert')).toBeVisible();

  // Fix it and save
  await minInputs.nth(0).fill('0');
  await page.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText('custom').first()).toBeVisible();

  const saved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return s.testGoals[0].customSections?.length;
  });
  expect(saved).toBeGreaterThan(0);
});
