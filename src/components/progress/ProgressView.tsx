import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS, lookupTranslationString } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { calculateGoalPercent, evaluateBadges } from '../../lib/streakCalculator';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { TelemetryCharts } from './TelemetryCharts';
import FocusInsightsCard from './FocusInsightsCard';
import { ProgressStatCards } from './ProgressStatCards';
import { WeeklyReportModal } from './WeeklyReportModal';

export const ProgressView: React.FC = () => {
  const {
    locale,
    streak,
    todaySessionsCount,
    dailyGoalSessions,
    completedFocusSessions,
    testGoals,
    sessionLogs,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [isLoading, setIsLoading] = useState(false);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  // Skeleton-first reveal: data is synchronous from the store, so show the
  // skeleton briefly on first paint, then fade the real content in.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  const goalPercent = calculateGoalPercent(todaySessionsCount, dailyGoalSessions);

  const hasLoggedTestScore = testGoals.some((g) => g.scoresHistory.length > 0);
  const hasScoreImprovement = testGoals.some((g) => g.scoresHistory.length > 1);

  const badges = evaluateBadges(
    streak.currentStreak,
    completedFocusSessions,
    goalPercent,
    hasLoggedTestScore,
    hasScoreImprovement
  );

  // Past 7 days derived from real session logs (3+ sessions = streak day)
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const count = sessionLogs.filter((s) => s.dateStr === dateStr).length;
    return {
      label: d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' }),
      count,
      active: count >= 3,
    };
  });

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeeklyReportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            <MaterialIcon name="summarize" size={18} />
            <span>{t.reports.weeklyReport}</span>
          </button>

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
      </div>

      {!revealed ? (
        <div aria-busy="true" aria-label={locale === 'ar' ? 'جارٍ التحميل' : 'Loading'}>
          <SkeletonLoader variant="card" count={2} />
          <SkeletonLoader variant="text" count={4} />
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader variant="card" count={2} />
          <SkeletonLoader variant="text" count={4} />
        </div>
      ) : (
        <>
          {/* Top Key Metrics Row */}
          <div className="mb-8">
            <ProgressStatCards />
          </div>

          <FocusInsightsCard />

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
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
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
                    style={{ color: day.active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)' }}
                  />
                  <span className="text-xs font-timer font-bold tabular-nums">
                    {day.count} {locale === 'ar' ? 'جلسة' : 'sess'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Charts & Trendlines */}
          <TelemetryCharts />

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
                const titleText = lookupTranslationString(t, badge.titleKey) || badge.titleKey;
                const descText = lookupTranslationString(t, badge.descKey) || badge.descKey;

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
                        <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
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

      {showWeeklyReportModal && (
        <WeeklyReportModal onClose={() => setShowWeeklyReportModal(false)} />
      )}
    </div>
  );
};
