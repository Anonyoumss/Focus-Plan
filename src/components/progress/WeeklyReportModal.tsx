/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  calculateCategoryBreakdown,
  calculateTaskCompletionRatio,
  exportSessionsToCsv,
} from '../../lib/analyticsEngine';

interface WeeklyReportModalProps {
  onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ onClose }) => {
  const { locale, streak, tasks, testGoals, sessionLogs } = useAppStore();
  const t = TRANSLATIONS[locale];

  const [periodUnit, setPeriodUnit] = useState<'week' | 'month'>('week');
  const [periodOffset, setPeriodOffset] = useState(0);

  // Compute start/end for the selected week or month. Offset 0 = current
  // period; older offsets reach back (week: up to 8 back, month: up to 12).
  const periodRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (periodUnit === 'week') {
      end = new Date(now);
      end.setDate(end.getDate() - periodOffset * 7);
      start = new Date(end);
      start.setDate(start.getDate() - 6);
    } else {
      // Month: offset 0 = current month-to-date is confusing for reports;
      // use the last complete month for offset 0? No — use calendar month
      // containing today minus offset, full month bounds.
      const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1);
      const target = new Date(firstOfThis.getFullYear(), firstOfThis.getMonth() - periodOffset, 1);
      start = new Date(target.getFullYear(), target.getMonth(), 1);
      end = new Date(target.getFullYear(), target.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    start.setHours(0, 0, 0, 0);
    const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return {
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
      startTime: start.getTime(),
      endTime: end.getTime(),
      dayCount,
      label: start.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' }),
    };
  }, [periodUnit, periodOffset, locale]);
  const weekRange = periodRange;

  // Filter sessions for this week
  const weeklySessions = useMemo(() => {
    return sessionLogs.filter(
      (s) => s.timestamp >= weekRange.startTime && s.timestamp <= weekRange.endTime
    );
  }, [sessionLogs, weekRange]);

  // Daily breakdown across the whole selected period
  const dailyData = useMemo(() => {
    const map: Record<string, { minutes: number; sessions: number; categories: Record<string, number> }> = {};
    for (let i = periodRange.dayCount - 1; i >= 0; i--) {
      const d = new Date(periodRange.endTime);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      map[str] = { minutes: 0, sessions: 0, categories: {} };
    }

    weeklySessions.forEach((s) => {
      if (!map[s.dateStr]) {
        map[s.dateStr] = { minutes: 0, sessions: 0, categories: {} };
      }
      map[s.dateStr].minutes += s.durationMinutes;
      map[s.dateStr].sessions += 1;
      map[s.dateStr].categories[s.category] = (map[s.dateStr].categories[s.category] || 0) + 1;
    });

    return Object.entries(map).map(([dateStr, data]) => {
      const topCat = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Study';
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' });
      return {
        dateStr,
        dayName,
        minutes: data.minutes,
        sessions: data.sessions,
        topCategory: topCat,
      };
    });
  }, [weeklySessions, periodRange, locale]);

  const totalMinutes = useMemo(() => {
    return weeklySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [weeklySessions]);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessionsCount = weeklySessions.length;
  const avgDailyHours = (totalMinutes / (periodRange.dayCount * 60)).toFixed(1);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(weeklySessions);
  }, [weeklySessions]);

  const taskStats = useMemo(() => {
    return calculateTaskCompletionRatio(tasks);
  }, [tasks]);

  const handleDownloadCsv = () => {
    const csvContent = exportSessionsToCsv(weeklySessions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `focus_plan_weekly_report_${weekRange.startStr}_to_${weekRange.endStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl rounded-3xl p-6 sm:p-8 border shadow-2xl my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:m-0 print:p-6"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        {/* Printable Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-5 mb-6 print:border-b-2" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                }}
              >
                {locale === 'ar' ? 'تقرير دوري' : 'Focus Dossier'}
              </span>
              <span className="text-xs font-timer font-semibold tabular-nums" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {weekRange.startStr} → {weekRange.endStr}
              </span>
            </div>

            <h1
              className="text-2xl font-bold font-display"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {t.reports.weeklyReport}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {locale === 'ar'
                ? 'ملخص تحليلي للمجهود الدراسي، وتيرة الانتظام، وجاهزية الاختبارات المعيارية.'
                : 'Audited telemetry summary of study hours, streak continuity, and exam prep progress.'}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              title={t.reports.printPdf}
            >
              <MaterialIcon name="print" size={20} />
            </button>

            <button
              onClick={handleDownloadCsv}
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
              title={t.reports.downloadCsv}
            >
              <MaterialIcon name="download" size={20} />
            </button>

            <button
              onClick={onClose}
              aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Period Selector (Hidden in Print) */}
        <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
          <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {t.reports.weekSelector}:
          </span>
          <div
            className="inline-flex p-1 rounded-2xl border text-xs"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {(['week', 'month'] as const).map((u) => (
              <button
                key={u}
                onClick={() => {
                  setPeriodUnit(u);
                  setPeriodOffset(0);
                }}
                className="px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: periodUnit === u ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: periodUnit === u ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {u === 'week' ? (locale === 'ar' ? 'أسبوع' : 'Week') : (locale === 'ar' ? 'شهر' : 'Month')}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setPeriodOffset((o) => Math.min(o + 1, periodUnit === 'week' ? 8 : 12))}
              disabled={periodOffset >= (periodUnit === 'week' ? 8 : 12)}
              aria-label={locale === 'ar' ? 'فترة أقدم' : 'Older period'}
              className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            >
              <MaterialIcon name={locale === 'ar' ? 'chevron_left' : 'chevron_left'} size={16} />
            </button>
            <span className="text-xs font-semibold px-1 tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {periodUnit === 'month' ? periodRange.label : `${weekRange.startStr} → ${weekRange.endStr}`}
            </span>
            <button
              onClick={() => setPeriodOffset((o) => Math.max(o - 1, 0))}
              disabled={periodOffset <= 0}
              aria-label={locale === 'ar' ? 'فترة أحدث' : 'Newer period'}
              className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            >
              <MaterialIcon name="chevron_right" size={16} />
            </button>
          </div>
        </div>

        {/* 4 Core Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.analytics.totalHours}
            </span>
            <span className="text-2xl font-bold font-timer tabular-nums block mt-1" style={{ color: 'var(--md-sys-color-primary)' }}>
              {totalHours} <span className="text-xs font-normal">hrs</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.analytics.totalSessions}
            </span>
            <span className="text-2xl font-bold font-timer tabular-nums block mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {totalSessionsCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.analytics.dailyAvg}
            </span>
            <span className="text-2xl font-bold font-timer tabular-nums block mt-1" style={{ color: 'var(--md-sys-color-secondary)' }}>
              {avgDailyHours} <span className="text-xs font-normal">hrs</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.streaks.streakTitle}
            </span>
            <span className="text-2xl font-bold font-timer tabular-nums block mt-1" style={{ color: 'var(--md-sys-color-tertiary)' }}>
              {streak.currentStreak} <span className="text-xs font-normal">{t.streaks.dayStreak}</span>
            </span>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.reports.dailyBreakdown}
          </h3>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.date}</th>
                  <th className="py-2.5 px-3 text-start font-semibold uppercase">{locale === 'ar' ? 'اليوم' : 'Day'}</th>
                  <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.minutes}</th>
                  <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.sessions}</th>
                  <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.topCategory}</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((d) => (
                  <tr
                    key={d.dateStr}
                    className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                  >
                    <td className="py-2.5 px-3 font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {d.dateStr}
                    </td>
                    <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {d.dayName}
                    </td>
                    <td className="py-2.5 px-3 font-timer font-bold tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
                      {d.minutes}m
                    </td>
                    <td className="py-2.5 px-3 font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {d.sessions}
                    </td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {d.topCategory}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown & Standardized Tests Readiness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Subject Allocation */}
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.reports.studyEffort}
            </h3>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {locale === 'ar' ? 'لا توجد جلسات في هذا الأسبوع.' : 'No sessions recorded for this week.'}
              </p>
            ) : (
              <div className="space-y-2">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.colorVar }} />
                      <span className="truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {cat.category}
                      </span>
                    </div>
                    <span className="font-timer font-bold tabular-nums shrink-0" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {cat.minutes}m ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Prep Status */}
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.reports.testPrepOverview}
            </h3>

            {testGoals.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {locale === 'ar' ? 'لم يتم تحديد أهداف اختبارات بعد.' : 'No active test goals registered.'}
              </p>
            ) : (
              <div className="space-y-2">
                {testGoals.map((g) => (
                  <div key={g.id} className="p-2.5 rounded-xl border flex items-center justify-between text-xs" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div>
                      <span className="font-semibold block truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {g.testName}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {g.testDate}
                      </span>
                    </div>

                    <div className="text-end font-timer tabular-nums">
                      <span className="block font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>
                        {g.currentBaselineScore} / {g.targetScore}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {g.completedPomodoros} / {g.weeklyPomodoros} p
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Completion Efficiency Footer */}
        <div
          className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div>
            <span className="font-bold block" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {t.reports.taskCompletionStatus}
            </span>
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {taskStats.completedTasksCount} / {taskStats.totalTasks} {locale === 'ar' ? 'مهمة منجزة بالكامل' : 'tasks marked complete'} ({taskStats.totalCompleted} {locale === 'ar' ? 'جلسة من أصل' : 'of'} {taskStats.totalEstimated} {locale === 'ar' ? 'مقدرة' : 'estimated'})
            </span>
          </div>

          <div className="font-timer font-bold text-lg tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
            {taskStats.accuracyPercent}%
          </div>
        </div>

        {/* Action Buttons (Print / CSV / Close) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t print:hidden" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            <MaterialIcon name="table_chart" size={16} />
            <span>{t.reports.downloadCsv}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            <MaterialIcon name="print" size={16} />
            <span>{t.reports.printPdf}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            {t.reports.closeReport}
          </button>
        </div>
      </div>
    </div>
  );
};
