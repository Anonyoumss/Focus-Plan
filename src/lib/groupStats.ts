/**
 * Pure helpers for group stats, leaderboards, and award periods.
 * Framework-free; unit-tested in src/lib/__tests__/groupStats.test.ts.
 */

/** Local-date key YYYY-MM-DD (avoids UTC drift for day boundaries). */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO-8601 week key YYYY-Www (week 1 contains the first Thursday). */
export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function groupAwardDayId(groupId: string, date: Date): string {
  return `${groupId}_day_${dayKey(date)}`;
}

export function groupAwardWeekId(groupId: string, date: Date): string {
  return `${groupId}_week_${weekKey(date)}`;
}

/**
 * Period keys to claim when a member opens the app: today plus the
 * previous `dayWindow - 1` days, and the current week plus the previous
 * `weekWindow - 1` weeks. Walk-back is deliberately limited so old
 * periods cannot be farmed forever; documented in DECISIONS.md.
 */
export function awardPeriodsToClaim(
  now: Date,
  dayWindow = 7,
  weekWindow = 4,
): { dayKeys: string[]; weekKeys: string[] } {
  const dayKeys: string[] = [];
  for (let i = 0; i < dayWindow; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    dayKeys.push(dayKey(d));
  }

  const weekKeys: string[] = [];
  const seen = new Set<string>();
  // Step back one day at a time until weekWindow distinct ISO weeks are
  // collected (covers year boundaries correctly).
  for (let i = 0; i < dayWindow * 8 && weekKeys.length < weekWindow; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const wk = weekKey(d);
    if (!seen.has(wk)) {
      seen.add(wk);
      weekKeys.push(wk);
    }
  }
  return { dayKeys, weekKeys };
}

export interface LeaderboardEntry {
  uid: string;
  alias: string;
  minutes: number;
  focusPoints: number;
  streak: number;
  isSelf?: boolean;
}

/**
 * Rank by weekly minutes desc, then focus points desc, then streak desc.
 * Stable for ties (keeps input order).
 */
export function rankLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.minutes - a.minutes ||
      b.focusPoints - a.focusPoints ||
      b.streak - a.streak,
  );
}

/** Sum session minutes per member for the given day keys (local dates). */
export function minutesByMember(
  sessions: { uid: string; minutes: number; dateStr: string }[],
  dayKeys: Set<string>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sessions) {
    if (!dayKeys.has(s.dateStr)) continue;
    out.set(s.uid, (out.get(s.uid) ?? 0) + s.minutes);
  }
  return out;
}

/** The `dayWindow` most recent local date keys ending today (inclusive). */
export function recentDayKeys(now: Date, dayWindow = 7): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i < dayWindow; i++) {
    keys.add(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  return keys;
}
