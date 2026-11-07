import { describe, it, expect } from 'vitest';
import {
  isQuietHour,
  dueReminders,
  markFired,
  buildReminderCandidates,
  DEFAULT_REMINDER_SETTINGS,
} from '../reminders';

const at = (h: number, m = 0) => new Date(2026, 0, 7, h, m);

describe('isQuietHour', () => {
  it('handles same-day and wrapping windows', () => {
    expect(isQuietHour(at(23), '22:00', '07:00')).toBe(true);
    expect(isQuietHour(at(3), '22:00', '07:00')).toBe(true);
    expect(isQuietHour(at(12), '22:00', '07:00')).toBe(false);
    expect(isQuietHour(at(8), '07:00', '22:00')).toBe(true);
    expect(isQuietHour(at(23), '07:00', '22:00')).toBe(false);
    expect(isQuietHour(at(12), 'bad', '22:00')).toBe(false);
  });
});

describe('dueReminders', () => {
  const cand = [{ id: 'a', title: 't', body: 'b' }];
  it('disabled settings suppress all', () => {
    expect(dueReminders(cand, DEFAULT_REMINDER_SETTINGS, at(12))).toEqual([]);
  });
  it('quiet hours suppress', () => {
    const s = { ...DEFAULT_REMINDER_SETTINGS, enabled: true };
    expect(dueReminders(cand, s, at(23))).toEqual([]);
  });
  it('fires when enabled, not quiet, not recently fired', () => {
    const s = { ...DEFAULT_REMINDER_SETTINGS, enabled: true, quietStart: '00:00', quietEnd: '00:00' };
    expect(dueReminders(cand, s, at(12))).toHaveLength(1);
    const fired = markFired(s, ['a'], at(12));
    expect(dueReminders(cand, fired, at(12, 30))).toEqual([]);
    expect(dueReminders(cand, fired, new Date(2026, 0, 7, 14))).toHaveLength(1);
  });
});

describe('buildReminderCandidates', () => {
  it('includes incomplete daily-goal tasks and near test dates only', () => {
    const tasks = [
      { id: 't1', title: 'Math', cadence: 'daily', isCompleted: false, completedSessions: 0, minGoal: 2, maxGoal: 4 },
      { id: 't2', title: 'Done', cadence: 'daily', isCompleted: false, completedSessions: 4, minGoal: 1, maxGoal: 4 },
      { id: 't3', title: 'Weekly', cadence: 'weekly', isCompleted: false, completedSessions: 0, minGoal: 1, maxGoal: 2 },
    ];
    const goals = [
      { id: 'g1', testName: 'GAT', testDate: '2026-01-09' },
      { id: 'g2', testName: 'Far', testDate: '2026-06-01' },
      { id: 'g3', testName: 'Past', testDate: '2025-01-01' },
    ];
    const out = buildReminderCandidates(tasks, goals, at(12), 3);
    expect(out.map((r) => r.id)).toEqual(['task_t1', 'test_g1']);
  });
});
