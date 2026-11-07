import { expect, test } from '@playwright/test';
import { newUserPage } from './emulator-helpers';

/**
 * Group award claims against the emulators with a simulated clock.
 * claimGroupAwards(uid, gid, now) accepts an explicit Date so the spec
 * can cross day/week boundaries deterministically. Run via
 * `npm run test:e2e:firebase`; self-skips without Firebase env.
 */

test.describe('group awards emulator', () => {
  test('day/week boundaries award once; concurrent claims cannot double-award', async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const a = await newUserPage(browser, 'award-a@example.com');

    try {
      // Hook availability doubles as the "firebase configured" probe.
      const hasHook = await a.page.evaluate(() => !!(window as any).__fpEmu);
      if (!hasHook) {
        test.skip(true, 'Firebase not configured in this dev server');
        return;
      }

      const result = await a.page.evaluate(async () => {
        const emu = (window as any).__fpEmu;
        const uid = emu.uid() as string;
        const group = await emu.createGroup(uid, 'Award Group', 'AwardA');
        const gid = group.id as string;

        const fp = async () => (await emu.getWallet(uid)).focusPoints as number;

        // t0: Wednesday 2026-01-07. First claim covers 7 day keys
        // (1 FP each) + 4 ISO week keys (7 FP each) = 35 FP over 11 docs.
        const t0 = new Date('2026-01-07T12:00:00');
        const fp0 = await fp();
        const claimed1 = await emu.claimGroupAwards(uid, gid, t0);
        const fp1 = await fp();

        // Same instant again: idempotent, zero new claims.
        const claimedAgain = await emu.claimGroupAwards(uid, gid, t0);
        const fp2 = await fp();

        // +1 day, same ISO week: exactly one new day key -> +1 FP.
        const t1 = new Date('2026-01-08T12:00:00');
        const claimedDay = await emu.claimGroupAwards(uid, gid, t1);
        const fp3 = await fp();

        // +8 days: new ISO week (+7) plus 7 new day keys (+7) -> +14 FP.
        const t2 = new Date('2026-01-15T12:00:00');
        const claimedWeek = await emu.claimGroupAwards(uid, gid, t2);
        const fp4 = await fp();

        return {
          gid,
          inviteCode: group.inviteCode as string,
          claimed1,
          fpDelta1: fp1 - fp0,
          claimedAgain,
          fpAfterRepeat: fp2 - fp1,
          claimedDay,
          fpDeltaDay: fp3 - fp2,
          claimedWeek,
          fpDeltaWeek: fp4 - fp3,
          fpFinal: fp4,
        };
      });

      // 7 daily (7 FP) + 4 weekly (28 FP) = 35 FP, 11 period docs.
      expect(result.claimed1).toBe(11);
      expect(result.fpDelta1).toBe(35);
      expect(result.claimedAgain).toBe(0);
      expect(result.fpAfterRepeat).toBe(0);
      // Thursday is a new day in the same ISO week: +1 day award only.
      expect(result.claimedDay).toBe(1);
      expect(result.fpDeltaDay).toBe(1);
      // Following Thursday: 7 fresh day keys + 1 fresh ISO week.
      expect(result.claimedWeek).toBe(8);
      expect(result.fpDeltaWeek).toBe(14);

      // Second user joins, then BOTH users claim the same fresh window at
      // the same moment: each member earns their own award exactly once
      // (per-user create-only docs), and a repeated raced round adds zero.
      const b = await newUserPage(browser, 'award-b@example.com');
      try {
        const now = new Date('2027-03-03T12:00:00'); // fresh 7+4 window
        const claimBoth = () =>
          Promise.all([
            a.page.evaluate(
              ([g, n]) => (window as any).__fpEmu.claimGroupAwards((window as any).__fpEmu.uid(), g, new Date(n)),
              [result.gid, now.toISOString()],
            ),
            b.page.evaluate(
              async ([g, n, code]) => {
                const emu = (window as any).__fpEmu;
                const uid = emu.uid() as string;
                await emu.joinGroupByCode(uid, 'AwardB', code);
                return emu.claimGroupAwards(uid, g, new Date(n));
              },
              [result.gid, now.toISOString(), result.inviteCode],
            ),
          ]);

        const fpA = () =>
          a.page.evaluate(async () =>
            (window as any).__fpEmu.getWallet((window as any).__fpEmu.uid()).then((w: any) => w.focusPoints),
          );

        const aFp0 = (await fpA()) as number;
        await claimBoth();
        const aFp1 = (await fpA()) as number;
        const bFp = await b.page.evaluate(async () =>
          (window as any).__fpEmu.getWallet((window as any).__fpEmu.uid()).then((w: any) => w.focusPoints),
        );

        // Fresh window = 35 FP each; racing must not exceed or duplicate.
        expect(aFp1 - aFp0).toBe(35);
        expect(bFp).toBe(35);

        // Second raced round on the same window: zero new awards.
        const before2 = (await fpA()) as number;
        await claimBoth();
        expect(((await fpA()) as number) - before2).toBe(0);
      } finally {
        await b.context.close();
      }
    } finally {
      await a.context.close();
    }
  });
});
