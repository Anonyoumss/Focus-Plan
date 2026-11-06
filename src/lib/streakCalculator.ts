export interface DailySessionLog {
  date: string;
  completedPomodoros: number;
  totalMinutes: number;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  streakFreezes: number;
  freezeUsedDates: string[];
}

export interface Badge {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  unlockedAt: string | null;
  progressPercent: number;
}

export const STREAK_MIN_POMODOROS = 3;

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return getTodayDateString(date);
}

export function calculateGoalPercent(completedSessions: number, targetSessions: number): number {
  if (targetSessions <= 0) return 0;
  return Math.round((completedSessions / targetSessions) * 100);
}

export function updateStreakOnSessionComplete(
  currentStreakState: StreakState,
  todaySessionsCount: number,
  todayStr: string = getTodayDateString()
): StreakState {
  const yesterdayStr = getPreviousDateString(todayStr);
  const updated: StreakState = { ...currentStreakState };

  if (todaySessionsCount < STREAK_MIN_POMODOROS) {
    return updated;
  }

  if (updated.lastActiveDate === todayStr) {
    return updated;
  }

  if (updated.lastActiveDate === yesterdayStr) {
    updated.currentStreak += 1;
    updated.lastActiveDate = todayStr;
  } else if (!updated.lastActiveDate) {
    updated.currentStreak = 1;
    updated.lastActiveDate = todayStr;
  } else {
    if (updated.streakFreezes > 0 && !updated.freezeUsedDates.includes(yesterdayStr)) {
      updated.streakFreezes -= 1;
      updated.freezeUsedDates = [...updated.freezeUsedDates, yesterdayStr];
      updated.currentStreak += 1;
      updated.lastActiveDate = todayStr;
    } else {
      updated.currentStreak = 1;
      updated.lastActiveDate = todayStr;
    }
  }

  if (updated.currentStreak > updated.bestStreak) {
    updated.bestStreak = updated.currentStreak;
  }

  return updated;
}

export function evaluateBadges(
  streak: number,
  totalSessions: number,
  dailyGoalPercent: number,
  hasLoggedTestScore: boolean,
  hasScoreImprovement: boolean
): Badge[] {
  return [
    {
      id: 'streak_3',
      titleKey: 'streakMilestone',
      descKey: 'streakRuleNotice',
      icon: 'local_fire_department',
      unlockedAt: streak >= 3 ? 'unlocked' : null,
      progressPercent: Math.min(100, Math.round((streak / 3) * 100)),
    },
    {
      id: 'streak_7',
      titleKey: 'streakMilestone',
      descKey: 'streakRuleNotice',
      icon: 'verified',
      unlockedAt: streak >= 7 ? 'unlocked' : null,
      progressPercent: Math.min(100, Math.round((streak / 7) * 100)),
    },
    {
      id: 'overachiever_200',
      titleKey: 'overachievement',
      descKey: 'overachievementDesc',
      icon: 'rocket_launch',
      unlockedAt: dailyGoalPercent >= 200 ? 'unlocked' : null,
      progressPercent: Math.min(100, dailyGoalPercent),
    },
    {
      id: 'hours_50',
      titleKey: 'hoursMilestone',
      descKey: 'hoursMilestone',
      icon: 'school',
      unlockedAt: totalSessions >= 120 ? 'unlocked' : null,
      progressPercent: Math.min(100, Math.round((totalSessions / 120) * 100)),
    },
    {
      id: 'first_score',
      titleKey: 'firstScore',
      descKey: 'firstScore',
      icon: 'military_tech',
      unlockedAt: hasLoggedTestScore ? 'unlocked' : null,
      progressPercent: hasLoggedTestScore ? 100 : 0,
    },
    {
      id: 'score_improved',
      titleKey: 'scoreImproved',
      descKey: 'scoreImproved',
      icon: 'trending_up',
      unlockedAt: hasScoreImprovement ? 'unlocked' : null,
      progressPercent: hasScoreImprovement ? 100 : 0,
    },
  ];
}
