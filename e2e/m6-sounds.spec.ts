import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'focus_plan_m3e_v1';

async function seed(page: import('@playwright/test').Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    },
    {
      key: STORAGE_KEY,
      state: {
        locale: 'en', themeMode: 'light', onboardingCompleted: true,
        seedHex: '#2e6b52', tasks: [], testGoals: [], sessionLogs: [],
        ...extra,
      },
    },
  );
}

test('sounds: tick plays only while running; ambient stops on route change', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__audio = { osc: 0, srcStart: 0, srcStop: 0 };
    const AC = window.AudioContext;
    if (AC) {
      window.AudioContext = class extends AC {
        constructor() {
          super();
          const orig = this.createOscillator.bind(this);
          this.createOscillator = () => {
            (window as any).__audio.osc++;
            return orig();
          };
        }
      } as typeof AudioContext;
    }
    const origStop = AudioScheduledSourceNode.prototype.stop;
    AudioScheduledSourceNode.prototype.stop = function (...args: unknown[]) {
      (window as any).__audio.srcStop++;
      return (origStop as any).apply(this, args);
    };
    const origStart = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (...args: unknown[]) {
      (window as any).__audio.srcStart++;
      return (origStart as any).apply(this, args);
    };
  });
  await seed(page, { tickSoundEnabled: true, tickVolume: 0.5 });
  await page.goto('/#/app/focus');
  await page.waitForTimeout(600);

  const oscCount = () => page.evaluate(() => (window as any).__audio.osc);

  // Start: tick oscillators are created each second
  await page.getByRole('button', { name: 'Start Focus' }).click();
  await page.waitForTimeout(2400);
  const running = await oscCount();
  expect(running).toBeGreaterThan(0);

  // Pause: no new oscillators
  await page.getByRole('button', { name: 'Pause Timer' }).click();
  await page.waitForTimeout(1800);
  const paused = await oscCount();
  await page.waitForTimeout(1200);
  expect(await oscCount()).toBe(paused);

  // Ambient: start pink noise, then leave app routes -> source stopped
  await page.locator('select').first().selectOption('whitenoise');
  await page.waitForTimeout(400);
  const srcStart = await page.evaluate(() => (window as any).__audio.srcStart);
  expect(srcStart).toBeGreaterThan(0);

  await page.evaluate(() => { window.location.hash = '#/terms'; });
  await page.waitForTimeout(600);
  const srcStop = await page.evaluate(() => (window as any).__audio.srcStop);
  expect(srcStop).toBeGreaterThan(0);
});
