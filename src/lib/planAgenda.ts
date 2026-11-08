import type { TaskItem } from '../store/useAppStore';
import type { UserTestGoal } from '../data/tests/catalog';

export interface AgendaEntry {
  kind: 'study' | 'deadline' | 'test';
  id: string;
  title: string;
  /** Secondary line, e.g. cadence label or "min 2 · max 6". */
  detail: string;
  taskId?: string;
  overdue?: boolean;
}

export interface AgendaDay {
  /** Local date key YYYY-MM-DD. */
  date: string;
  entries: AgendaEntry[];
}

export interface WeeklyPlanGoal {
  id: string;
  testName: string;
  testDate: string;
  daysLeft: number;
  weeklyPomodoros: number;
  completedPomodoros: number;
  currentBaselineScore?: number;
  targetScore?: number;
}

const DAY_MS = 86400000;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dates within [start, start+6d] on which a task's cadence produces a block. */
export function cadenceDatesInWeek(task: TaskItem, weekDates: string[]): string[] {
  const created = new Date(task.createdAt);
  switch (task.cadence) {
    case 'daily':
    case 'hourly':
      return weekDates;
    case 'weekly': {
      // Recur on the weekday the task was created, next occurrence in window.
      const targetDow = created.getDay();
      return weekDates.filter((dk) => new Date(`${dk}T12:00:00`).getDay() === targetDow);
    }
    case 'monthly': {
      const dom = created.getDate();
      return weekDates.filter((dk) => Number(dk.slice(8, 10)) === dom);
    }
    default:
      return [];
  }
}

/**
 * Build a 7-day agenda starting at `start` (local midnight). Entries:
 * - study blocks from each task's cadence
 * - deadline entries on the task's deadline date (kind 'deadline', overdue flagged)
 * - test date entries from test goals
 */
export function buildWeekAgenda(
  tasks: TaskItem[],
  testGoals: UserTestGoal[],
  start: Date,
): AgendaDay[] {
  const days: AgendaDay[] = [];
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dateKey(d);
    weekDates.push(key);
    days.push({ date: key, entries: [] });
  }
  const byDate = new Map(days.map((d) => [d.date, d]));
  const todayKey = dateKey(new Date());

  for (const task of tasks) {
    if (task.isCompleted) continue;
    for (const dk of cadenceDatesInWeek(task, weekDates)) {
      byDate.get(dk)!.entries.push({
        kind: 'study',
        id: `study_${task.id}_${dk}`,
        title: task.title,
        detail: `${task.minGoal}–${task.maxGoal}`,
        taskId: task.id,
      });
    }
    if (task.deadline) {
      const day = byDate.get(task.deadline);
      if (day) {
        day.entries.push({
          kind: 'deadline',
          id: `deadline_${task.id}`,
          title: task.title,
          detail: task.deadlineTime ?? '',
          taskId: task.id,
          overdue: task.deadline < todayKey,
        });
      }
    }
  }

  for (const goal of testGoals) {
    if (!goal.testDate) continue;
    const day = byDate.get(goal.testDate.slice(0, 10));
    if (day) {
      day.entries.push({
        kind: 'test',
        id: `test_${goal.id}`,
        title: goal.testName,
        detail: goal.targetScore != null ? `→ ${goal.targetScore}` : '',
      });
    }
  }

  return days;
}

/** Per-goal weekly plan summary cards. */
export function buildWeeklyPlan(testGoals: UserTestGoal[], now: Date = new Date()): WeeklyPlanGoal[] {
  return testGoals
    .filter((g) => g.testDate)
    .map((g) => {
      const testDate = new Date(`${g.testDate.slice(0, 10)}T12:00:00`);
      const daysLeft = Math.max(0, Math.ceil((testDate.getTime() - now.getTime()) / DAY_MS));
      return {
        id: g.id,
        testName: g.testName,
        testDate: g.testDate.slice(0, 10),
        daysLeft,
        weeklyPomodoros: g.weeklyPomodoros ?? 0,
        completedPomodoros: g.completedPomodoros ?? 0,
        currentBaselineScore: g.currentBaselineScore,
        targetScore: g.targetScore,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
