import { describe, it, expect } from 'vitest';
import {
  calculateRemainingSeconds,
  formatTime,
  calculateProgress,
  getNextMode,
} from '../timerEngine';

describe('timerEngine unit tests', () => {
  it('correctly calculates remaining seconds from target timestamp', () => {
    const now = 1000000;
    const target = now + 125 * 1000;
    expect(calculateRemainingSeconds(target, now)).toBe(125);

    expect(calculateRemainingSeconds(now - 1000, now)).toBe(0);
    expect(calculateRemainingSeconds(now, now)).toBe(0);
  });

  it('formats seconds into MM:SS correctly', () => {
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(300)).toBe('05:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
  });

  it('calculates progress percentage accurately', () => {
    expect(calculateProgress(1500, 1500)).toBe(0);
    expect(calculateProgress(750, 1500)).toBe(0.5);
    expect(calculateProgress(0, 1500)).toBe(1);
    expect(calculateProgress(-10, 1500)).toBe(1);
  });

  it('transitions modes according to Pomodoro intervals', () => {
    expect(getNextMode('focus', 1, 4)).toBe('shortBreak');
    expect(getNextMode('focus', 2, 4)).toBe('shortBreak');
    expect(getNextMode('focus', 3, 4)).toBe('shortBreak');
    expect(getNextMode('focus', 4, 4)).toBe('longBreak');
    expect(getNextMode('shortBreak', 1, 4)).toBe('focus');
    expect(getNextMode('longBreak', 4, 4)).toBe('focus');
  });
});
