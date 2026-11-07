import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

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

const dstr = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};
const ts = (offsetDays: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(h, 0, 0, 0);
  return d.getTime();
};

const session = (id: string, off: number, minutes: number, category: string, title: string) => ({
  id,
  timestamp: ts(off),
  dateStr: dstr(off),
  durationMinutes: minutes,
  taskId: null,
  taskTitle: title,
  category,
});

// ---------- Score loop ----------

const gatGoal = {
  id: 'goal_gat',
  testId: 'gat_qudurat',
  testName: 'Saudi GAT (Qudurat)',
  testDate: '2020-06-01',
  targetScore: 90,
  currentBaselineScore: 72,
  sectionTargets: { gat_quant: 95, gat_verbal: 85 },
  weeklyHours: 10,
  weeklyPomodoros: 20,
  completedPomodoros: 0,
  scoresHistory: [
    { date: '2020-05-01', score: 72, sectionScores: { gat_quant: 78, gat_verbal: 66 }, notes: 'Diagnostic' },
  ],
};

const customGoal = {
  id: 'goal_custom',
  testId: 'custom',
  testName: 'Custom test',
  testDate: '2020-06-01',
  targetScore: 30,
  currentBaselineScore: 20,
  sectionTargets: { cs1: 30 },
  customSections: [
    { id: 'cs1', nameEn: 'Essay', nameAr: 'مقال', minScore: 0, maxScore: 50, defaultTargetScore: 30 },
  ],
  weeklyHours: 5,
  weeklyPomodoros: 10,
  completedPomodoros: 0,
  scoresHistory: [],
};

test('score loop: post-test prompt, per-section scores, chart, apply recommendation', async ({ page }) => {
  await seed(page, { testGoals: [gatGoal, customGoal] });
  await page.goto('/#/app/tests');
  await page.waitForTimeout(500);

  // Post-test-date prompt appears and opens the log form directly
  const logBtn = page.getByRole('button', { name: /Log your score/ }).first();
  await expect(logBtn).toBeVisible();
  await logBtn.click();

  const form = page.locator('form');
  await expect(form).toBeVisible();
  const nums = form.locator('input[type="number"]');
  // overall + 2 catalog sections
  await expect(nums).toHaveCount(3);
  await nums.nth(0).fill('75');
  await nums.nth(1).fill('80'); // gat_quant
  await nums.nth(2).fill('70'); // gat_verbal
  await form.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(400);

  // Percent of goal per section + history + chart
  await expect(page.getByText(/of goal/).first()).toBeVisible();
  await expect(page.locator('svg[role="img"]')).toBeVisible();
  const saved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return s.testGoals.find((g: { id: string }) => g.id === 'goal_gat');
  });
  expect(saved.scoresHistory).toHaveLength(2);
  expect(saved.scoresHistory[0].sectionScores.gat_quant).toBe(80);

  // Apply recommendation changes weekly pomodoros
  const before = saved.weeklyPomodoros;
  await page.getByRole('button', { name: /Apply|تطبيق/ }).first().click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    return s.testGoals.find((g: { id: string }) => g.id === 'goal_gat').weeklyPomodoros;
  });
  expect(after).not.toBe(before);
  await page.getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(300);

  // Custom sections case (second goal card)
  await page.getByRole('button', { name: /Log your score/ }).first().click();
  const cform = page.locator('form');
  await cform.locator('input[type="number"]').nth(0).fill('25');
  await cform.locator('input[type="number"]').nth(1).fill('25'); // Essay section
  await cform.getByRole('button', { name: 'Save Task' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText(/\d+% of goal/).first()).toBeVisible();
  const customSaved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!);
    const g = s.testGoals.find((x: { id: string }) => x.id === 'goal_custom');
    return { history: g.scoresHistory.length, sections: g.customSections?.length };
  });
  expect(customSaved.history).toBe(1);
  expect(customSaved.sections).toBe(1);
});

// ---------- Reports ----------

test('reports: month mode, older periods, CSV BOM+Arabic, print PDF', async ({ page }) => {
  const logs = [
    session('s1', 1, 50, 'رياضيات', 'مهمة رياضيات'),
    session('s2', 3, 25, 'Physics', 'Ch 4'),
    session('s3', 40, 30, 'Chemistry', 'Equations'),
    session('s4', 75, 45, 'رياضيات', 'مراجعة'),
  ];
  await seed(page, { sessionLogs: logs });
  await page.goto('/#/app/progress');
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: 'Weekly Focus Report' }).click();
  await expect(page.getByText('Focus Dossier')).toBeVisible();

  // Month mode shows a full month of daily rows
  await page.getByRole('dialog').getByRole('button', { name: 'Month', exact: true }).click();
  await page.waitForTimeout(300);
  const monthRows = await page.locator('tbody tr').count();
  expect(monthRows).toBeGreaterThan(20);

  // Older period navigation changes the label/range
  const periodLabel = page.getByRole('button', { name: 'Older period' }).locator('xpath=following-sibling::span[1]');
  const labelBefore = await periodLabel.textContent();
  await page.getByRole('button', { name: 'Older period' }).click();
  await page.waitForTimeout(300);
  const labelAfter = await periodLabel.textContent();
  expect(labelAfter).not.toBe(labelBefore);
  await page.getByRole('button', { name: 'Newer period' }).click();

  // CSV download: UTF-8 BOM + Arabic content
  const dl = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Export CSV Report' }).first().click();
  const download = await dl;
  const csvPath = await download.path();
  const csv = readFileSync(csvPath!, 'utf-8');
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain('مهمة رياضيات');

  // Print emulation screenshot (what the PDF looks like) + real PDF
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: 'docs/screenshots/report-print-en.png', fullPage: true });
  await page.pdf({ path: '/tmp/report-en.pdf', format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  const pdfSize = readFileSync('/tmp/report-en.pdf').length;
  expect(pdfSize).toBeGreaterThan(5000);
  await page.keyboard.press('Escape');
});

test('reports: Arabic RTL dark print rendering', async ({ page }) => {
  await seed(page, {
    locale: 'ar',
    themeMode: 'dark',
    sessionLogs: [session('s1', 1, 50, 'رياضيات', 'مهمة')],
  });
  await page.goto('/#/app/progress');
  await page.waitForTimeout(500);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('button', { name: 'التقرير الأسبوعي للتركيز' }).click();
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: 'docs/screenshots/report-print-ar-dark.png', fullPage: true });
  await page.pdf({ path: '/tmp/report-ar.pdf', format: 'A4', printBackground: true });
  expect(readFileSync('/tmp/report-ar.pdf').length).toBeGreaterThan(5000);
});

// ---------- Reminders ----------

test('reminders: fires once, quiet hours, cooldown, hidden tab, denied', async ({ page, context }) => {
  await context.grantPermissions(['notifications']);
  await page.addInitScript(() => {
    (window as any).__notifLog = [];
    (window as any).__notifPermission = 'granted';
    class FakeNotification {
      static get permission() { return (window as any).__notifPermission; }
      static requestPermission() { return Promise.resolve((window as any).__notifPermission); }
      constructor(public title: string, public opts?: NotificationOptions) {
        (window as any).__notifLog.push({ title, body: opts?.body });
      }
    }
    (window as any).Notification = FakeNotification;
  });
  await seed(page, {
    tasks: [{
      id: 't1', title: 'Math', category: 'Study', estimatedSessions: 4,
      completedSessions: 0, minGoal: 2, maxGoal: 4, cadence: 'daily',
      notes: '', isCompleted: false, createdAt: 1,
    }],
    testGoals: [{ id: 'g1', testName: 'GAT', testDate: '2026-01-09', targetScore: 1, currentBaselineScore: 0, sectionTargets: {}, weeklyHours: 1, weeklyPomodoros: 1, completedPomodoros: 0, scoresHistory: [] }],
    reminderSettings: { enabled: true, quietStart: '12:30', quietEnd: '13:00', lastFired: {} },
  });
  await page.goto('/#/app');
  await page.waitForTimeout(500);

  const check = (iso: string) =>
    page.evaluate((d) => (window as any).__fpDebug.runReminderCheck(new Date(d)), iso);
  const count = () => page.evaluate(() => (window as any).__notifLog.length);

  // Hidden tab: no fire
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  });
  await check('2026-01-07T12:00:00');
  expect(await count()).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });

  // Quiet hours: no fire
  await check('2026-01-07T12:45:00');
  expect(await count()).toBe(0);

  // Normal: fires for task + near test (2 notifications)
  await check('2026-01-07T12:00:00');
  expect(await count()).toBe(2);

  // Cooldown: same +30min does not re-fire
  await check('2026-01-07T12:30:00');
  expect(await count()).toBe(2);

  // After 1h cooldown: fires again
  await check('2026-01-07T14:00:00');
  expect(await count()).toBe(4);

  // Permission denied: nothing fires even past cooldown
  await page.evaluate(() => { (window as any).__notifPermission = 'denied'; });
  await check('2026-01-07T16:00:00');
  expect(await count()).toBe(4);
});

test('reminders: denied permission shows clear message in Settings', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Notification = class {
      static permission = 'denied';
      static requestPermission() { return Promise.resolve('denied'); }
    };
  });
  await seed(page, {
    reminderSettings: { enabled: true, quietStart: '22:00', quietEnd: '07:00', lastFired: {} },
  });
  await page.goto('/#/app/settings');
  await page.waitForTimeout(400);
  await expect(
    page.getByText(/Notifications are blocked|الإشعارات محظورة/),
  ).toBeVisible();
});

// ---------- Arabic functional ----------

test('arabic: settings templates/import/reminders/sounds + sections modal', async ({ page }) => {
  await seed(page, {
    locale: 'ar',
    tasks: [{
      id: 't1', title: 'مهمة ألفا', category: 'دراسة', estimatedSessions: 4,
      completedSessions: 0, minGoal: 2, maxGoal: 4, cadence: 'daily',
      notes: '', isCompleted: false, createdAt: 1,
    }],
    testGoals: [{ ...gatGoal, testName: 'قدرات' }],
  });
  await page.goto('/#/app/settings');
  await page.waitForTimeout(500);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  // Sounds card: tick switch
  await page.getByRole('switch', { name: 'صوت التكتكة أثناء عمل المؤقت' }).click();

  // Reminders card: enable
  await page.getByRole('switch', { name: 'تفعيل التذكيرات' }).click();

  // Templates: save list + apply
  await page.getByPlaceholder('اسم القالب').fill('قالب عربي');
  await page.getByRole('button', { name: 'حفظ قائمة المهام كقالب' }).click();
  await expect(page.getByText(/قالب عربي/)).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!).tasks.length);
  await page.getByRole('button', { name: 'تحميل القالب' }).click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('focus_plan_m3e_v1')!).tasks.length);
  expect(after).toBe(before + 1);

  // Import CSV (Arabic header is same CSV_HEADER)
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: 't.csv', mimeType: 'text/csv',
    buffer: Buffer.from('title,category,estimatedSessions,minGoal,maxGoal,cadence,notes\nمهمة مستوردة,عام,2,1,2,daily,\n'),
  });
  await expect(page.getByText(/تم استيراد المهام/)).toBeVisible({ timeout: 5000 });

  // Sections modal in Arabic
  await page.goto('/#/app/tests');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'تحرير الأقسام' }).first().click();
  await expect(page.getByText('أقسام الاختبار')).toBeVisible();
  await page.getByRole('button', { name: 'إضافة قسم' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'حفظ المهمة' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByText('مخصص').first()).toBeVisible();
});
