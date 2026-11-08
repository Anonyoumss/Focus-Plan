/**
 * In-app reminder scheduling logic. Pure; framework-free.
 * Reminders fire only while the app is open (no push); quiet hours
 * suppress them. Spark-plan honest fallback, documented in DECISIONS.md.
 */

export interface ReminderSettings {
  enabled: boolean;
  /** 'HH:MM' 24h local time strings; quietStart > quietEnd wraps midnight. */
  quietStart: string;
  quietEnd: string;
  /** Last-notified timestamps keyed by reminder id, epoch ms. */
  lastFired: Record<string, number>;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  lastFired: {},
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeString(v: string): boolean {
  return TIME_RE.test(v);
}

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** True when `now` falls inside the quiet-hours window. */
export function isQuietHour(now: Date, quietStart: string, quietEnd: string): boolean {
  if (!isValidTimeString(quietStart) || !isValidTimeString(quietEnd)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = minutesOfDay(quietStart);
  const end = minutesOfDay(quietEnd);
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end; // wraps midnight
}

/** Minimum gap between repeat notifications for the same reminder id. */
export const REMINDER_MIN_INTERVAL_MS = 60 * 60 * 1000; // 1h

export interface DueReminder {
  id: string;
  title: string;
  body: string;
}

/**
 * Given candidate reminders and settings, return those that should fire now:
 * enabled, not quiet hours, and not fired within the min interval.
 */
export function dueReminders(
  candidates: DueReminder[],
  settings: ReminderSettings,
  now: Date
): DueReminder[] {
  if (!settings.enabled) return [];
  if (isQuietHour(now, settings.quietStart, settings.quietEnd)) return [];
  return candidates.filter((c) => {
    const last = settings.lastFired[c.id];
    return last === undefined || now.getTime() - last >= REMINDER_MIN_INTERVAL_MS;
  });
}

/** Mark reminders as fired at `now`. */
export function markFired(
  settings: ReminderSettings,
  ids: string[],
  now: Date
): ReminderSettings {
  const lastFired = { ...settings.lastFired };
  for (const id of ids) lastFired[id] = now.getTime();
  return { ...settings, lastFired };
}

/**
 * Build reminder candidates from app data:
 * - tasks whose cadence is 'daily' and which have open goal sessions
 * - test goals whose testDate is within `daysAhead` days
 * Returns at most a handful; caller decides notification text.
 */
export function buildReminderCandidates(
  tasks: {
    id: string;
    title: string;
    cadence: string;
    isCompleted: boolean;
    completedSessions: number;
    minGoal: number;
    maxGoal: number;
    deadline?: string;
    deadlineTime?: string;
  }[],
  testGoals: { id: string; testName: string; testDate: string }[],
  now: Date,
  daysAhead = 3
): DueReminder[] {
  const out: DueReminder[] = [];
  for (const t of tasks) {
    if (t.isCompleted) continue;
    if (t.cadence !== 'daily') continue;
    const done = Math.min(t.completedSessions, t.maxGoal || t.minGoal || 1);
    const goal = t.maxGoal || t.minGoal || 1;
    if (done >= goal) continue;
    out.push({
      id: `task_${t.id}`,
      title: 'Focus Plan',
      body: `Daily goal pending: ${t.title}`,
    });
  }
  // Task deadlines: fire when the deadline is today or within the horizon,
  // and once when overdue (still incomplete).
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  for (const t of tasks) {
    if (!t.deadline || t.isCompleted) continue;
    const dueToday = t.deadline === todayStr;
    const dueSoon = t.deadline > todayStr && t.deadline <= new Date(now.getTime() + daysAhead * 86400000).toISOString().slice(0, 10);
    const overdue = t.deadline < todayStr;
    if (!dueToday && !dueSoon && !overdue) continue;
    const timePart = t.deadlineTime ? ` ${t.deadlineTime}` : '';
    out.push({
      id: `deadline_${t.id}_${t.deadline}`,
      title: 'Focus Plan',
      body: overdue
        ? `Overdue: ${t.title} (was due ${t.deadline}${timePart})`
        : `Due ${t.deadline}${timePart}: ${t.title}`,
    });
  }

  const horizon = now.getTime() + daysAhead * 86400000;
  for (const g of testGoals) {
    const d = new Date(g.testDate).getTime();
    if (Number.isFinite(d) && d >= now.getTime() && d <= horizon) {
      const days = Math.ceil((d - now.getTime()) / 86400000);
      out.push({
        id: `test_${g.id}`,
        title: 'Focus Plan',
        body: `${g.testName} is in ${days} day${days === 1 ? '' : 's'}`,
      });
    }
  }
  return out.slice(0, 5);
}
