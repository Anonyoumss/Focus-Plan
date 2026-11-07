import { expect, test } from '@playwright/test';
import { newUserPage } from './emulator-helpers';


test.describe.configure({ mode: 'serial' });

test('templates sync round-trip between two users on emulators', async ({ browser }) => {
  test.setTimeout(240_000);
  const a = await newUserPage(browser, 'tpl-a@example.com', {
    state: {
      tasks: [{
        id: 't1', title: 'Sync task', category: 'Study', estimatedSessions: 3,
        completedSessions: 0, minGoal: 1, maxGoal: 3, cadence: 'daily',
        notes: '', isCompleted: false, createdAt: 1,
      }],
    },
  });
  // Same account = same uid; templates are per-user, so B is a second device.
  const b = await newUserPage(browser, 'tpl-a@example.com');

  // A: save task list as template
  await a.page.goto('/#/app/settings');
  await a.page.waitForTimeout(600);
  await a.page.getByPlaceholder('Template name').fill('Cloud tpl');
  await a.page.getByRole('button', { name: 'Save task list as template' }).click();
  await expect(a.page.getByText('Cloud tpl · 1 items')).toBeVisible();
  await a.page.waitForTimeout(2500); // debounced push

  // B: pull on reload shows the template
  await b.page.goto('/#/app/settings');
  await b.page.waitForTimeout(2500);
  await b.page.reload();
  await b.page.waitForTimeout(2500);
  await expect(b.page.getByText('Cloud tpl')).toBeVisible({ timeout: 15_000 });

  // A: rename -> B sees it
  const aRow = a.page.locator('li', { hasText: 'Cloud tpl' });
  await aRow.getByRole('button', { name: 'Rename' }).click();
  await a.page.getByPlaceholder('Cloud tpl').fill('Cloud tpl v2');
  await a.page.getByRole('button', { name: 'Rename' }).click();
  await a.page.waitForTimeout(2500);
  await b.page.reload();
  await b.page.waitForTimeout(2500);
  await expect(b.page.getByText('Cloud tpl v2')).toBeVisible({ timeout: 15_000 });

  // A: delete -> B no longer sees it
  await a.page.locator('li', { hasText: 'Cloud tpl v2' }).getByRole('button', { name: 'Delete', exact: true }).click();
  await a.page.waitForTimeout(2500);
  await b.page.reload();
  await b.page.waitForTimeout(2500);
  await expect(b.page.getByText('Cloud tpl v2')).toHaveCount(0, { timeout: 15_000 });

  await a.context.close();
  await b.context.close();
});
