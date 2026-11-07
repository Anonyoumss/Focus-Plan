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
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, state: { ...baseState, ...extra } },
  );
}

const gatGoal = {
  id: 'goal_gat',
  testId: 'gat_qudurat',
  testName: 'Saudi GAT (Qudurat)',
  testDate: '2099-06-01',
  targetScore: 90,
  currentBaselineScore: 72,
  sectionTargets: { gat_quant: 95, gat_verbal: 85 },
  weeklyHours: 10,
  weeklyPomodoros: 20,
  completedPomodoros: 0,
  scoresHistory: [],
};

/** Guests have no Firebase token, so AI calls always take the offline path;
 *  mock only the status endpoint to enable the buttons. */
async function mockAiAvailable(page: import('@playwright/test').Page) {
  await page.route('**/api/gemini/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: true, model: 'mock' }),
    }),
  );
}

test.describe('AI features (mocked endpoint)', () => {
  test('intake consult: offline estimate, edit before save, EN', async ({ page }) => {
    await mockAiAvailable(page);
    await seed(page, { testGoals: [gatGoal] });
    await page.goto('/#/app/tests');
    await page.waitForTimeout(700);

    await page.getByRole('button', { name: 'AI Consult' }).first().click();
    const modal = page.locator('div.fixed.inset-0').last();
    await expect(modal.getByText(/AI Intake/)).toBeVisible();

    await modal.getByRole('button', { name: /Generate Targets/ }).click();
    await page.waitForTimeout(600);

    // Offline estimate must be labeled, never "AI suggested"
    await expect(modal.getByText(/Offline estimate/)).toBeVisible();

    // Editable before saving: change a section target then apply
    const targetInputs = modal.locator('input[type="number"]');
    const count = await targetInputs.count();
    expect(count).toBeGreaterThan(0);
    await targetInputs.nth(count - 1).fill('88');
    await modal.getByRole('button', { name: /Save & Apply/ }).click();
    await page.waitForTimeout(500);

    const saved = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
      return s.testGoals.find((g: { id: string }) => g.id === 'goal_gat');
    });
    expect(saved).toBeTruthy();
    const vals = Object.values(saved.sectionTargets as Record<string, number>);
    expect(vals).toContain(88);
  });

  test('intake consult modal renders RTL in Arabic', async ({ page }) => {
    await mockAiAvailable(page);
    await seed(page, { locale: 'ar', testGoals: [{ ...gatGoal, testName: 'قدرات' }] });
    await page.goto('/#/app/tests');
    await page.waitForTimeout(700);

    await page.getByRole('button', { name: /استشارة/ }).first().click();
    const modal = page.locator('div.fixed.inset-0').last();
    await expect(modal.getByText(/استشارة/)).toBeVisible();
    await modal.getByRole('button', { name: /توليد توصيات/ }).click();
    await page.waitForTimeout(600);
    await expect(modal.getByText(/تقدير محلي/)).toBeVisible();
  });

  test('study plan and post-test modals open and show offline estimate', async ({ page }) => {
    await mockAiAvailable(page);
    await seed(page, { testGoals: [gatGoal] });
    await page.goto('/#/app/tests');
    await page.waitForTimeout(700);

    await page.getByRole('button', { name: 'Study Plan' }).first().click();
    let modal = page.locator('div.fixed.inset-0').last();
    await modal.getByRole('button', { name: /Generate Weekly Study Tasks/ }).click();
    await page.waitForTimeout(600);
    await expect(modal.getByText(/Offline estimate/)).toBeVisible();
    await modal.getByRole('button', { name: 'Close', exact: true }).click().catch(() => {});
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'AI Analysis' }).first().click();
    modal = page.locator('div.fixed.inset-0').last();
    await modal.getByRole('button', { name: /Analyze Scores/ }).click();
    await page.waitForTimeout(600);
    await expect(modal.getByText(/Offline estimate|تقدير محلي/)).toBeVisible();
  });

  test('AI buttons disabled when status endpoint is unreachable', async ({ page }) => {
    await page.route('**/api/gemini/status', (route) => route.abort());
    await seed(page, { testGoals: [gatGoal] });
    await page.goto('/#/app/tests');
    await page.waitForTimeout(900);

    const consult = page.getByRole('button', { name: 'AI Consult' }).first();
    await expect(consult).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Study Plan' }).first()).toBeDisabled();
  });
});
