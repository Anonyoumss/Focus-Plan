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
