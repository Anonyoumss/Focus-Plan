import { describe, expect, it } from 'vitest';
import { buildWeekAgenda, buildWeeklyPlan, cadenceDatesInWeek } from './planAgenda';
import type { TaskItem } from '../store/useAppStore';
import type { UserTestGoal } from '../data/tests/catalog';

const task = (over: Partial<TaskItem> = {}): TaskItem => ({
  id: 't1', title: 'Math', category: 'Study', estimatedSessions: 4,
  completedSessions: 0, minGoal: 2, maxGoal: 6, cadence: 'daily',
  notes: '', isCompleted: false, createdAt: new Date(2025, 0, 6).getTime(), // Monday
  ...over,
});

const goal = (over: Partial<UserTestGoal> = {}): UserTestGoal => ({
  id: 'g1', testId: 'sat', testName: 'SAT', testDate: '2025-06-07',
  targetScore: 1500, currentBaselineScore: 1200, sectionTargets: {},
  weeklyHours: 5, weeklyPomodoros: 10, completedPomodoros: 4, scoresHistory: [],
  ...over,
});

const week = ['2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05', '2025-06-06', '2025-06-07', '2025-06-08'];

describe('cadenceDatesInWeek', () => {
  it('daily and hourly fill every day', () => {
    expect(cadenceDatesInWeek(task({ cadence: 'daily' }), week)).toHaveLength(7);
    expect(cadenceDatesInWeek(task({ cadence: 'hourly' }), week)).toHaveLength(7);
  });
  it('weekly lands on created weekday (Monday = 06-02)', () => {
    expect(cadenceDatesInWeek(task({ cadence: 'weekly' }), week)).toEqual(['2025-06-02']);
  });
  it('monthly lands on created day-of-month', () => {
    expect(cadenceDatesInWeek(task({ cadence: 'monthly', createdAt: new Date(2025, 0, 5).getTime() }), week)).toEqual(['2025-06-05']);
  });
});

describe('buildWeekAgenda', () => {
  it('places study blocks, deadline and test entries on the right days', () => {
    const days = buildWeekAgenda(
      [task({ cadence: 'daily', deadline: '2025-06-04' })],
      [goal()],
      new Date(2025, 5, 2),
    );
    expect(days).toHaveLength(7);
    const d4 = days.find((d) => d.date === '2025-06-04')!;
    expect(d4.entries.some((e) => e.kind === 'study')).toBe(true);
    expect(d4.entries.some((e) => e.kind === 'deadline')).toBe(true);
    const d7 = days.find((d) => d.date === '2025-06-07')!;
    expect(d7.entries.some((e) => e.kind === 'test' && e.title === 'SAT')).toBe(true);
    // completed tasks produce no study blocks
    const done = buildWeekAgenda([task({ isCompleted: true })], [], new Date(2025, 5, 2));
    expect(done.every((d) => d.entries.length === 0)).toBe(true);
  });
});

describe('buildWeeklyPlan', () => {
  it('sorts by days left and carries goal fields', () => {
    const plan = buildWeeklyPlan([goal({ id: 'b', testDate: '2025-12-01' }), goal()], new Date(2025, 5, 1));
    expect(plan[0].id).toBe('g1');
    expect(plan[0].weeklyPomodoros).toBe(10);
    expect(plan[0].daysLeft).toBeGreaterThan(0);
  });
});
