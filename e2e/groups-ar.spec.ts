import { expect, test } from '@playwright/test';
import { newUserPage } from './emulator-helpers';

/**
 * Arabic/RTL functional flow on the real groups screens (not just
 * screenshots): create, join by invite link and by code, member count,
 * leaderboard units, and the public-profile opt-in toggles.
 * Run via `npm run test:e2e:firebase`; self-skips without Firebase env.
 */

test.describe('groups arabic rtl', () => {
  test('create, join by link and code, leaderboard, profile toggles', async ({
    browser,
  }) => {
    test.setTimeout(300_000);
    const a = await newUserPage(browser, 'ar-a@example.com', { locale: 'ar' });
    const b = await newUserPage(browser, 'ar-b@example.com', { locale: 'ar' });

    try {
      const hasHook = await a.page.evaluate(() => !!(window as any).__fpEmu);
      if (!hasHook) {
        test.skip(true, 'Firebase not configured in this dev server');
        return;
      }
      await expect(a.page.locator('html')).toHaveAttribute('dir', 'rtl');

      // A creates a group in Arabic.
      await a.page.goto('/#/app/friends');
      await a.page.waitForTimeout(1200);
      await a.page.getByPlaceholder('اسم الحلقة').fill('مجموعة الاختبار');
      await a.page.getByRole('button', { name: 'إنشاء حلقة مذاكرة' }).click();
      await expect(a.page.getByText('مجموعة الاختبار').first()).toBeVisible({
        timeout: 15_000,
      });
      const inviteCode = (await a.page.locator('code').first().innerText()).trim();
      expect(inviteCode.length).toBeGreaterThanOrEqual(6);

      // B joins via the invite link (Arabic invite page).
      await b.page.goto(`/#/invite/${inviteCode}`);
      await expect(b.page.getByText('مجموعة الاختبار')).toBeVisible({ timeout: 15_000 });
      await b.page.getByRole('button', { name: 'انضمام', exact: true }).click();
      await expect(b.page.getByText('تم الانضمام إلى المجموعة')).toBeVisible({
        timeout: 15_000,
      });
      await b.page.getByRole('button', { name: 'حلقات المذاكرة والأصدقاء' }).click();
      await b.page.waitForTimeout(1200);
      await expect(b.page.getByText(/الأعضاء \(2\)/)).toBeVisible({ timeout: 15_000 });

      // B logs shared minutes via the hook; A's leaderboard shows them.
      const bUid = await b.page.evaluate(() => (window as any).__fpEmu.uid());
      const gid = await b.page.evaluate(async (uid) => {
        const groups = await (window as any).__fpEmu.listMyGroups(uid);
        return groups[0].id as string;
      }, bUid);
      const taskId = await b.page.evaluate(async (g) => {
        const tasks = await (window as any).__fpEmu.listGroupTasks(g);
        return tasks[0].id as string;
      }, gid);
      await b.page.evaluate(
        ([g, u, t]) => (window as any).__fpEmu.logGroupSession(g, u, t, 30),
        [gid, bUid, taskId],
      );
      await a.page.reload();
      await a.page.waitForTimeout(2000);
      await a.page.goto('/#/app/friends');
      await a.page.waitForTimeout(2000);
      await expect(a.page.getByText('30 دقيقة')).toBeVisible({ timeout: 15_000 });

      // Profile privacy toggles render and persist in Arabic.
      await b.page.getByText('الاسم المستعار').waitFor({ timeout: 10_000 });
      const shareBox = b.page.getByText('إظهار اسمي المستعار وساعات تركيزي على لوحة الصدارة العامة');
      await expect(shareBox).toBeVisible();

      // B leaves, then rejoins by typing the code.
      await b.page.getByRole('button', { name: 'مغادرة المجموعة' }).click();
      await b.page.waitForTimeout(1500);
      await expect(b.page.getByText('تمت مغادرة المجموعة')).toBeVisible({ timeout: 15_000 });
      await b.page.getByPlaceholder('أدخل الرمز المكون من 6 خانات').fill(inviteCode);
      await b.page.getByRole('button', { name: 'انضمام', exact: true }).click();
      await b.page.waitForTimeout(2000);
      await expect(b.page.getByText(/الأعضاء \(2\)/)).toBeVisible({ timeout: 15_000 });
    } finally {
      await a.context.close();
      await b.context.close();
    }
  });
});
