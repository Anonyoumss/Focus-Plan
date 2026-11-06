import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { calculateGoalPercent, evaluateBadges } from '../../lib/streakCalculator';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const ProgressView: React.FC = () => {
  const {
    locale,
    streak,
    todaySessionsCount,
    dailyGoalSessions,
    completedFocusSessions,
    testGoals,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [isLoading, setIsLoading] = useState(false);

  const goalPercent = calculateGoalPercent(todaySessionsCount, dailyGoalSessions);
  const totalFocusMinutes = completedFocusSessions * 25;
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const hasLoggedTestScore = testGoals.some((g) => g.scoresHistory.length > 0);
  const hasScoreImprovement = testGoals.some((g) => g.scoresHistory.length > 1);

  const badges = evaluateBadges(
    streak.currentStreak,
    completedFocusSessions,
    goalPercent,
    hasLoggedTestScore,
    hasScoreImprovement
  );

  // Past 7 days dummy distribution for weekly consistency
  const daysOfWeek = [
    { label: 'Mon', count: 4, active: true },
    { label: 'Tue', count: 5, active: true },
    { label: 'Wed', count: 3, active: true },
    { label: 'Thu', count: 4, active: true },
    { label: 'Fri', count: 2, active: false },
    { label: 'Sat', count: 5, active: true },
    { label: 'Sun', count: todaySessionsCount, active: todaySessionsCount >= 3 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.nav.progress}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {locale === 'ar'
              ? 'مؤشرات الأداء الدراسي، سلاسل الأيام المتتالية، والأوسمة المكتسبة.'
              : 'Study telemetry, 3+ session habit streaks, and milestone achievements.'}
          </p>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 400);
          }}
          className="p-2 rounded-xl border hover:opacity-80 transition-opacity cursor-pointer"
          style={{
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
          title="Refresh stats"
        >
          <MaterialIcon name="refresh" size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader variant="card" count={2} />
          <SkeletonLoader variant="text" count={4} />
        </div>
      ) : (
        <>
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Total Focus Time */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MaterialIcon name="timer" size={20} className="text-emerald-600" />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--md-sys-color-outline)' }}
                >
                  {locale === 'ar' ? 'إجمالي وقت التركيز' : 'Total Focus Time'}
                </span>
              </div>
              <div
                className="text-3xl font-bold font-timer tabular-nums"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {totalFocusHours} <span className="text-sm font-normal">hrs</span>
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {completedFocusSessions} {t.timer.sessionNumber.toLowerCase()}s completed
              </div>
            </div>

            {/* Streak Card */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MaterialIcon name="local_fire_department" size={20} className="text-orange-500" filled />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--md-sys-color-outline)' }}
                >
                  {t.streaks.streakTitle}
                </span>
              </div>
              <div
                className="text-3xl font-bold font-timer tabular-nums"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {streak.currentStreak} <span className="text-sm font-normal">{t.streaks.dayStreak}</span>
              </div>
              <div
                className="text-xs mt-1 flex items-center justify-between"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                <span>{t.streaks.bestStreak}: {streak.bestStreak}</span>
                <span className="flex items-center gap-1 font-medium">
                  <MaterialIcon name="ac_unit" size={14} className="text-cyan-600" />
                  {streak.streakFreezes} {t.streaks.streakFreezes}
                </span>
              </div>
            </div>

            {/* Daily Goal Percentage */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MaterialIcon name="flag" size={20} className="text-indigo-600" />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--md-sys-color-outline)' }}
                >
                  {t.timer.dailyTarget}
                </span>
              </div>
              <div
                className="text-3xl font-bold font-timer tabular-nums"
                style={{
                  color: goalPercent >= 100 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)',
                }}
              >
                {goalPercent}%
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {todaySessionsCount} / {dailyGoalSessions} {t.timer.sessionNumber.toLowerCase()}s today
              </div>
            </div>
          </div>

          {/* Weekly Consistency Visualizer */}
          <div
            className="p-6 rounded-3xl border mb-8"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {locale === 'ar' ? 'انتظام الأسبوع (شرط 3 جلسات يومياً)' : 'Weekly Consistency (3+ Sessions Rule)'}
              </h2>
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--md-sys-color-outline)' }}
              >
                {t.streaks.streakRuleNotice}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {daysOfWeek.map((day, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: day.active
                      ? 'var(--md-sys-color-primary-container)'
                      : 'var(--md-sys-color-surface-container-low)',
                    borderColor: day.active
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-outline-variant)',
                    color: day.active
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <span className="text-xs font-semibold">{day.label}</span>
                  <MaterialIcon
                    name={day.active ? 'check_circle' : 'circle'}
                    size={20}
                    filled={day.active}
                    className={day.active ? 'text-emerald-700' : 'opacity-30'}
                  />
                  <span className="text-xs font-timer font-bold tabular-nums">
                    {day.count} {locale === 'ar' ? 'جلسة' : 'p'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges and Milestones Shelf */}
          <div>
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.badges.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {badges.map((badge) => {
                const isUnlocked = badge.unlockedAt !== null;
                const titleText = (t.badges as any)[badge.titleKey] || badge.titleKey;
                const descText = (t.badges as any)[badge.descKey] || badge.descKey;

                return (
                  <div
                    key={badge.id}
                    className="p-4 rounded-2xl border flex items-start gap-3.5"
                    style={{
                      backgroundColor: isUnlocked
                        ? 'var(--md-sys-color-surface-container-low)'
                        : 'var(--md-sys-color-surface-container-lowest)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      opacity: isUnlocked ? 1 : 0.65,
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isUnlocked
                          ? 'var(--md-sys-color-primary-container)'
                          : 'var(--md-sys-color-surface-container-highest)',
                        color: isUnlocked
                          ? 'var(--md-sys-color-on-primary-container)'
                          : 'var(--md-sys-color-outline)',
                      }}
                    >
                      <MaterialIcon name={badge.icon} size={24} filled={isUnlocked} />
                    </div>

                    <div className="truncate text-start">
                      <div
                        className="text-sm font-bold truncate"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}
                      >
                        {titleText}
                      </div>
                      <div
                        className="text-xs line-clamp-2 mt-0.5"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                      >
                        {descText}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-20 h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${badge.progressPercent}%`,
                              backgroundColor: 'var(--md-sys-color-primary)',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--md-sys-color-outline)' }}>
                          {isUnlocked ? t.badges.unlocked : `${badge.progressPercent}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
