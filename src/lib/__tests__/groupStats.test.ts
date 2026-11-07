import { describe, expect, it } from 'vitest';
import {
  awardPeriodsToClaim,
  dayKey,
  groupAwardDayId,
  groupAwardWeekId,
  minutesByMember,
  rankLeaderboard,
  recentDayKeys,
  weekKey,
} from '../groupStats';

describe('period keys', () => {
  it('dayKey formats local dates', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('weekKey returns ISO week keys', () => {
    // 2026-01-01 is a Thursday -> ISO week 1 of 2026.
    expect(weekKey(new Date(2026, 0, 1))).toBe('2026-W01');
    // 2025-12-29 is also ISO week 1 of 2026.
    expect(weekKey(new Date(2025, 11, 29))).toBe('2026-W01');
    // 2026-11-08 (a Sunday) is in the same ISO week as 2026-11-04.
    expect(weekKey(new Date(2026, 10, 8))).toBe(weekKey(new Date(2026, 10, 4)));
  });

  it('award ids embed group and period', () => {
    expect(groupAwardDayId('g1', new Date(2026, 0, 5))).toBe('g1_day_2026-01-05');
    expect(groupAwardWeekId('g1', new Date(2026, 0, 1))).toBe('g1_week_2026-W01');
  });
});

describe('awardPeriodsToClaim', () => {
  it('returns today plus previous days and distinct weeks', () => {
    const now = new Date(2026, 10, 8, 12, 0, 0);
    const { dayKeys, weekKeys } = awardPeriodsToClaim(now);
    expect(dayKeys).toHaveLength(7);
    expect(dayKeys[0]).toBe('2026-11-08');
    expect(dayKeys[6]).toBe('2026-11-02');
    expect(weekKeys.length).toBeGreaterThanOrEqual(1);
    expect(weekKeys.length).toBeLessThanOrEqual(4);
    expect(new Set(weekKeys).size).toBe(weekKeys.length);
  });

  it('walk-back crosses a year boundary', () => {
    const now = new Date(2026, 0, 3, 12, 0, 0); // Jan 3 2026
    const { dayKeys, weekKeys } = awardPeriodsToClaim(now, 7, 4);
    expect(dayKeys).toContain('2025-12-28');
    expect(weekKeys.some((w) => w.startsWith('2025-W'))).toBe(true);
  });
});

describe('rankLeaderboard', () => {
  it('sorts by minutes, then focus points, then streak', () => {
    const entries = [
      { uid: 'a', alias: 'A', minutes: 100, focusPoints: 5, streak: 1 },
      { uid: 'b', alias: 'B', minutes: 100, focusPoints: 9, streak: 0 },
      { uid: 'c', alias: 'C', minutes: 200, focusPoints: 0, streak: 0 },
      { uid: 'd', alias: 'D', minutes: 100, focusPoints: 5, streak: 7 },
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.uid)).toEqual(['c', 'b', 'd', 'a']);
  });
});

describe('minutesByMember / recentDayKeys', () => {
  it('sums only sessions inside the window', () => {
    const sessions = [
      { uid: 'a', minutes: 25, dateStr: '2026-11-08' },
      { uid: 'a', minutes: 25, dateStr: '2026-11-01' }, // outside 7-day window ending 11-08
      { uid: 'b', minutes: 50, dateStr: '2026-11-08' },
    ];
    const keys = recentDayKeys(new Date(2026, 10, 8));
    const totals = minutesByMember(sessions, keys);
    expect(totals.get('a')).toBe(25);
    expect(totals.get('b')).toBe(50);
  });
});
