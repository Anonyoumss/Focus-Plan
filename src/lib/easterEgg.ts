import { evaluateBadges } from './streakCalculator';
import { calculateGoalPercent } from './streakCalculator';

export interface EasterEggInput {
  todaySessionsCount: number;
  todayCountDate: string;
  dailyGoalSessions: number;
  streak: { currentStreak: number };
  completedFocusSessions: number;
  testGoals: { scoresHistory: unknown[] }[];
}

/**
 * Unlock rule (Stage E): the 3D mini-game opens when the user owns any
 * badge OR completes 4 focus sessions in one local day.
 */
export function isEasterEggUnlocked(s: EasterEggInput, todayStr: string): boolean {
  const todayCount = s.todayCountDate === todayStr ? s.todaySessionsCount : 0;
  if (todayCount >= 4) return true;
  const badges = evaluateBadges(
    s.streak.currentStreak,
    s.completedFocusSessions,
    calculateGoalPercent(s.todaySessionsCount, s.dailyGoalSessions),
    s.testGoals.some((g) => g.scoresHistory.length > 0),
    s.testGoals.some((g) => g.scoresHistory.length > 1),
  );
  return badges.some((b) => b.unlockedAt !== null);
}
