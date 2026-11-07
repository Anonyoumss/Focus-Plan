/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS, getCategoryLabel } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  TimeFilter,
  filterSessionsByTime,
  generateBarChartData,
  generateSvgLinePath,
  calculateCategoryBreakdown,
  calculateTaskCompletionRatio,
  generateActivityHeatmap,
  BarChartPoint,
} from '../../lib/analyticsEngine';

export const TelemetryCharts: React.FC = () => {
  const { locale, sessionLogs, tasks } = useAppStore();
  const t = TRANSLATIONS[locale];

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [activeView, setActiveView] = useState<'bar' | 'line' | 'categories' | 'heatmap' | 'table'>('bar');
  const [hoveredPoint, setHoveredPoint] = useState<BarChartPoint | null>(null);

  // Filtered session records
  const filteredSessions = useMemo(() => {
    return filterSessionsByTime(sessionLogs, timeFilter);
  }, [sessionLogs, timeFilter]);

  // Bar chart data
  const barData = useMemo(() => {
    return generateBarChartData(sessionLogs, timeFilter);
  }, [sessionLogs, timeFilter]);

  // Line chart coordinates
  const linePoints = useMemo(() => {
    const width = 640;
    const height = 180;
    const padding = 32;

    if (barData.length === 0) return { path: '', points: [], maxMinutes: 0 };

    const maxMinutes = Math.max(1, ...barData.map((d) => d.minutes));
    const stepX = (width - padding * 2) / Math.max(1, barData.length - 1);

    const pts = barData.map((d, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - (d.minutes / maxMinutes) * (height - padding * 2);
      return { x, y, label: d.label, value: d.minutes, dateStr: d.dateStr };
    });

    const path = generateSvgLinePath(pts);
    return { path, points: pts, maxMinutes };
  }, [barData]);

  // Category breakdown
  const categoriesData = useMemo(() => {
    return calculateCategoryBreakdown(filteredSessions);
  }, [filteredSessions]);

  // Heatmap data
  const heatmapCells = useMemo(() => {
    return generateActivityHeatmap(sessionLogs);
  }, [sessionLogs]);

  // Task completion accuracy
  const taskRatio = useMemo(() => {
    return calculateTaskCompletionRatio(tasks);
  }, [tasks]);

  // Summary Metrics for selected time range
  const totalMinutes = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [filteredSessions]);

  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessionsCount = filteredSessions.length;

  const divisorDays = timeFilter === 'day' ? 1 : timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365;
  const dailyAverageHours = (totalMinutes / (divisorDays * 60)).toFixed(1);

  const maxBarMinutes = Math.max(1, ...barData.map((d) => d.minutes));

  return (
    <div
      className="p-6 rounded-3xl border mb-8"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      {/* Header with Title and Time Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2
            className="text-lg font-bold font-display"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.analytics.title}
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {t.analytics.subtitle}
          </p>
        </div>

        {/* Time Filter Segmented Switcher */}
        <div
          className="inline-flex items-center p-1 rounded-2xl border text-xs font-medium self-start md:self-auto"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          {(['day', 'week', 'month', 'year', 'allTime'] as TimeFilter[]).map((f) => {
            const isSelected = timeFilter === f;
            const label = t.analytics[f];
            return (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className="px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium"
                style={{
                  backgroundColor: isSelected ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: isSelected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Summary Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div
          className="p-3.5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
            {t.analytics.totalHours}
          </div>
          <div className="text-2xl font-bold font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {totalHours} <span className="text-xs font-normal">hrs</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {totalSessionsCount} {t.analytics.sessions.toLowerCase()}
          </div>
        </div>

        <div
          className="p-3.5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
            {t.analytics.dailyAvg}
          </div>
          <div className="text-2xl font-bold font-timer tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
            {dailyAverageHours} <span className="text-xs font-normal">hrs/day</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {timeFilter} window
          </div>
        </div>

        <div
          className="p-3.5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
            {t.analytics.completionRate}
          </div>
          <div className="text-2xl font-bold font-timer tabular-nums" style={{ color: 'var(--md-sys-color-secondary)' }}>
            {taskRatio.accuracyPercent}%
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {taskRatio.totalCompleted} / {taskRatio.totalEstimated} est. sessions
          </div>
        </div>

        <div
          className="p-3.5 rounded-2xl border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--md-sys-color-outline)' }}>
            {t.analytics.topCategory}
          </div>
          <div className="text-base font-bold truncate mt-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {categoriesData[0] ? getCategoryLabel(t, categoriesData[0].category) : 'General'}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {categoriesData[0]?.percentage || 0}% of focus effort
          </div>
        </div>
      </div>

      {/* Chart View Modes Tabs */}
      <div className="flex items-center gap-1.5 border-b pb-3 mb-5 overflow-x-auto text-xs" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
        <button
          onClick={() => setActiveView('bar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 font-medium"
          style={{
            backgroundColor: activeView === 'bar' ? 'var(--md-sys-color-primary)' : 'transparent',
            borderColor: activeView === 'bar' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            color: activeView === 'bar' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="bar_chart" size={16} />
          <span>{t.analytics.barChart}</span>
        </button>

        <button
          onClick={() => setActiveView('line')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 font-medium"
          style={{
            backgroundColor: activeView === 'line' ? 'var(--md-sys-color-primary)' : 'transparent',
            borderColor: activeView === 'line' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            color: activeView === 'line' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="show_chart" size={16} />
          <span>{t.analytics.lineChart}</span>
        </button>

        <button
          onClick={() => setActiveView('categories')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 font-medium"
          style={{
            backgroundColor: activeView === 'categories' ? 'var(--md-sys-color-primary)' : 'transparent',
            borderColor: activeView === 'categories' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            color: activeView === 'categories' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="pie_chart" size={16} />
          <span>{t.analytics.categoryBreakdown}</span>
        </button>

        <button
          onClick={() => setActiveView('heatmap')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 font-medium"
          style={{
            backgroundColor: activeView === 'heatmap' ? 'var(--md-sys-color-primary)' : 'transparent',
            borderColor: activeView === 'heatmap' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            color: activeView === 'heatmap' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="calendar_view_month" size={16} />
          <span>{t.analytics.heatmap}</span>
        </button>

        <button
          onClick={() => setActiveView('table')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 font-medium"
          style={{
            backgroundColor: activeView === 'table' ? 'var(--md-sys-color-primary)' : 'transparent',
            borderColor: activeView === 'table' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            color: activeView === 'table' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="table_chart" size={16} />
          <span>{t.analytics.tableView}</span>
        </button>
      </div>

      {/* VIEW 1: Bar Chart */}
      {activeView === 'bar' && (
        <div className="relative">
          <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 px-1">
            {barData.map((pt, idx) => {
              const heightPercent = Math.max(6, Math.round((pt.minutes / maxBarMinutes) * 100));
              const isHovered = hoveredPoint?.label === pt.label;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setHoveredPoint(pt)}
                >
                  {/* Bar */}
                  <div
                    className="w-full max-w-[44px] rounded-t-xl transition-all duration-300 relative"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: isHovered
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-primary-container)',
                      border: '1px solid var(--md-sys-color-primary)',
                      opacity: pt.minutes > 0 ? 1 : 0.25,
                    }}
                  >
                    {pt.minutes > 0 && (
                      <span
                        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-timer font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}
                      >
                        {pt.minutes}m
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <span
                      className="block text-xs font-semibold"
                      style={{ color: 'var(--md-sys-color-on-surface)' }}
                    >
                      {pt.label}
                    </span>
                    {pt.sublabel && (
                      <span
                        className="block text-[10px]"
                        style={{ color: 'var(--md-sys-color-outline)' }}
                      >
                        {pt.sublabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="mt-3 p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div>
                <span className="font-bold mr-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {hoveredPoint.label} {hoveredPoint.sublabel ? `(${hoveredPoint.sublabel})` : ''}
                </span>
                {hoveredPoint.topCategory && (
                  <span className="text-[11px]" style={{ color: 'var(--md-sys-color-outline)' }}>
                    · {getCategoryLabel(t, hoveredPoint.topCategory)}
                  </span>
                )}
              </div>
              <div className="font-timer font-bold tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
                {hoveredPoint.minutes} min ({hoveredPoint.sessions} {t.analytics.sessions.toLowerCase()})
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Line Chart */}
      {activeView === 'line' && (
        <div className="w-full">
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox="0 0 640 180"
              className="w-full h-52 overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Gridlines */}
              <line x1="32" y1="32" x2="608" y2="32" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 3" opacity="0.5" />
              <line x1="32" y1="88" x2="608" y2="88" stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 3" opacity="0.5" />
              <line x1="32" y1="148" x2="608" y2="148" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1" opacity="0.75" />

              {/* Flat tonal area fill */}
              {linePoints.path && (
                <path
                  d={`${linePoints.path} L 608 148 L 32 148 Z`}
                  fill="var(--md-sys-color-primary-container)"
                  fillOpacity="0.45"
                />
              )}

              {/* Smooth curve line */}
              {linePoints.path && (
                <path
                  d={linePoints.path}
                  fill="none"
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {linePoints.points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="var(--md-sys-color-surface)"
                    stroke="var(--md-sys-color-primary)"
                    strokeWidth="2.5"
                    className="transition-transform group-hover:scale-125"
                  />
                  <text
                    x={pt.x}
                    y={166}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--md-sys-color-on-surface-variant)"
                    fontWeight="600"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="text-center text-[11px] mt-2" style={{ color: 'var(--md-sys-color-outline)' }}>
            {locale === 'ar' ? 'منحنى تسارع جلسات التركيز عبر الزمن' : 'Continuous focus velocity trendline'}
          </div>
        </div>
      )}

      {/* VIEW 3: Category Breakdown */}
      {activeView === 'categories' && (
        <div className="space-y-4">
          {/* Stacked Percentage Bar */}
          <div
            className="w-full h-4 rounded-xl overflow-hidden flex border"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {categoriesData.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.colorVar,
                }}
                title={`${cat.category}: ${cat.percentage}%`}
              />
            ))}
          </div>

          {/* List of categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {categoriesData.map((cat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.colorVar }}
                  />
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                  >
                    {getCategoryLabel(t, cat.category)}
                  </span>
                </div>

                <div className="text-end font-timer tabular-nums text-xs">
                  <span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {cat.minutes} min
                  </span>
                  <span
                    className="block text-[11px]"
                    style={{ color: 'var(--md-sys-color-outline)' }}
                  >
                    {cat.percentage}% ({cat.sessions} {locale === 'ar' ? 'جلسة' : 'sess'})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: Activity Heatmap */}
      {activeView === 'heatmap' && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {t.analytics.activityHeatmapTitle} (4 Weeks)
            </span>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--md-sys-color-outline)' }}>
              <span>{t.analytics.less}</span>
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }} />
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', opacity: 0.5 }} />
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--md-sys-color-primary)', opacity: 0.7 }} />
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--md-sys-color-primary)' }} />
              <span>{t.analytics.more}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {heatmapCells.map((cell, idx) => {
              let bg = 'var(--md-sys-color-surface-container-highest)';
              let border = 'var(--md-sys-color-outline-variant)';
              if (cell.level === 1) bg = 'var(--md-sys-color-primary-container)';
              if (cell.level === 2) bg = 'var(--md-sys-color-primary-container)';
              if (cell.level >= 3) {
                bg = 'var(--md-sys-color-primary)';
                border = 'var(--md-sys-color-primary)';
              }

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border flex flex-col items-center justify-between min-h-[58px] transition-transform hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: bg,
                    borderColor: border,
                    color: cell.level >= 3 ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                  }}
                  title={`${cell.dateStr}: ${cell.sessions} sessions (${cell.minutes} min)`}
                >
                  <span className="text-[10px] opacity-75 font-semibold">
                    {new Date(`${cell.dateStr}T12:00:00`).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'narrow' })}
                  </span>
                  <span className="text-xs font-bold font-timer tabular-nums">{cell.sessions}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 5: Accessible Table View */}
      {activeView === 'table' && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr
                className="border-b text-start"
                style={{
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-outline)',
                }}
              >
                <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.date}</th>
                <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.minutes}</th>
                <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.sessions}</th>
                <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.topCategory}</th>
                <th className="py-2.5 px-3 text-start font-semibold uppercase">{t.analytics.task}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.slice(0, 10).map((s) => (
                <tr
                  key={s.id}
                  className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                >
                  <td className="py-2.5 px-3 font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {s.dateStr}
                  </td>
                  <td className="py-2.5 px-3 font-timer font-bold tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
                    {s.durationMinutes}m
                  </td>
                  <td className="py-2.5 px-3 font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    1
                  </td>
                  <td className="py-2.5 px-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                    >
                      {getCategoryLabel(t, s.category)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 truncate max-w-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {s.taskTitle}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSessions.length > 10 && (
            <div className="text-center text-[11px] pt-3" style={{ color: 'var(--md-sys-color-outline)' }}>
              {locale === 'ar' ? `عرض أول 10 من إجمالي ${filteredSessions.length} جلسة` : `Showing first 10 of ${filteredSessions.length} sessions`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
