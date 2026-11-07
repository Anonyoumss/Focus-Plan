import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { calculateGoalPercent } from '../../lib/streakCalculator';

export const ProgressStatCards: React.FC = () => {
  const {
    locale,
    streak,
    todaySessionsCount,
    dailyGoalSessions,
    completedFocusSessions,
    sessionLogs,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const goalPercent = calculateGoalPercent(todaySessionsCount, dailyGoalSessions);
  const totalFocusHours = (sessionLogs.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <MaterialIcon name="timer" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
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

      <div
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <MaterialIcon name="local_fire_department" size={20} style={{ color: 'var(--md-sys-color-tertiary)' }} filled />
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
            <MaterialIcon name="ac_unit" size={14} style={{ color: 'var(--md-sys-color-primary)' }} />
            {streak.streakFreezes} {t.streaks.streakFreezes}
          </span>
        </div>
      </div>

      <div
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <MaterialIcon name="flag" size={20} style={{ color: 'var(--md-sys-color-secondary)' }} />
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
  );
};
