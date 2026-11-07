import { describe, it, expect } from 'vitest';
import {
  calculateGoalPercent,
  updateStreakOnSessionComplete,
  StreakState,
} from '../streakCalculator';

describe('streakCalculator unit tests', () => {
  it('calculates goal percentages properly, handling 200%+ overachievement', () => {
    expect(calculateGoalPercent(4, 4)).toBe(100);
    expect(calculateGoalPercent(8, 4)).toBe(200);
    expect(calculateGoalPercent(2, 4)).toBe(50);
    expect(calculateGoalPercent(0, 4)).toBe(0);
  });

  it('only advances streak when 3 or more sessions are completed in a day', () => {
    const initialState: StreakState = {
      currentStreak: 2,
      bestStreak: 5,
      lastActiveDate: '2026-11-04',
      streakFreezes: 1,
      freezeUsedDates: [],
    };

    const todayStr = '2026-11-05';

    const partialState = updateStreakOnSessionComplete(initialState, 2, todayStr);
    expect(partialState.currentStreak).toBe(2);
    expect(partialState.lastActiveDate).toBe('2026-11-04');

    const completedState = updateStreakOnSessionComplete(initialState, 3, todayStr);
    expect(completedState.currentStreak).toBe(3);
    expect(completedState.bestStreak).toBe(5);
    expect(completedState.lastActiveDate).toBe('2026-11-05');
  });

  it('consumes a streak freeze when a day was missed', () => {
    const stateWithFreeze: StreakState = {
      currentStreak: 4,
      bestStreak: 4,
      lastActiveDate: '2026-11-03',
      streakFreezes: 1,
      freezeUsedDates: [],
    };

    const todayStr = '2026-11-05';
    const updated = updateStreakOnSessionComplete(stateWithFreeze, 3, todayStr);

    expect(updated.currentStreak).toBe(5);
    expect(updated.streakFreezes).toBe(0);
    expect(updated.freezeUsedDates).toContain('2026-11-04');
    expect(updated.lastActiveDate).toBe('2026-11-05');
  });

  it('resets streak to 1 if a day was missed and no freeze is available', () => {
    const stateWithoutFreeze: StreakState = {
      currentStreak: 10,
      bestStreak: 10,
      lastActiveDate: '2026-11-01',
      streakFreezes: 0,
      freezeUsedDates: [],
    };

    const todayStr = '2026-11-05';
    const updated = updateStreakOnSessionComplete(stateWithoutFreeze, 3, todayStr);

    expect(updated.currentStreak).toBe(1);
    expect(updated.bestStreak).toBe(10);
    expect(updated.lastActiveDate).toBe('2026-11-05');
  });
});

describe('streak gap and freeze boundaries', () => {
  const base = (over: Partial<StreakState>): StreakState => ({
    currentStreak: 5,
    bestStreak: 5,
    lastActiveDate: '2026-11-01',
    streakFreezes: 0,
    freezeUsedDates: [],
    ...over,
  });

  it('gap of exactly 1 missed day consumes one freeze', () => {
    const s = updateStreakOnSessionComplete(
      base({ lastActiveDate: '2026-11-04', streakFreezes: 1 }), 3, '2026-11-06');
    expect(s.currentStreak).toBe(6);
    expect(s.streakFreezes).toBe(0);
  });

  it('gap larger than the freezes resets the streak', () => {
    // 3 missed days, only 1 freeze -> cannot cover the gap
    const s = updateStreakOnSessionComplete(
      base({ lastActiveDate: '2026-11-01', streakFreezes: 1 }), 3, '2026-11-05');
    expect(s.currentStreak).toBe(1);
    expect(s.streakFreezes).toBe(1);
  });

  it('gap of 2 missed days needs 2 freezes; with 1 it resets', () => {
    const s = updateStreakOnSessionComplete(
      base({ lastActiveDate: '2026-11-01', streakFreezes: 1 }), 3, '2026-11-04');
    expect(s.currentStreak).toBe(1);
  });

  it('consecutive-day gap still extends without consuming a freeze', () => {
    const s = updateStreakOnSessionComplete(
      base({ lastActiveDate: '2026-11-04', streakFreezes: 2 }), 3, '2026-11-05');
    expect(s.currentStreak).toBe(6);
    expect(s.streakFreezes).toBe(2);
  });

  it('month boundary rollover counts correctly', () => {
    const s = updateStreakOnSessionComplete(
      base({ lastActiveDate: '2026-10-31', streakFreezes: 1 }), 3, '2026-11-02');
    expect(s.currentStreak).toBe(6);
    expect(s.streakFreezes).toBe(0);
  });
});
