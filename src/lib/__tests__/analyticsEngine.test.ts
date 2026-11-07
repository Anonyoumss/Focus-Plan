/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  filterSessionsByTime,
  generateBarChartData,
  calculateCategoryBreakdown,
  calculateTaskCompletionRatio,
  analyzeScoreLoop,
  exportSessionsToCsv,
  FocusSessionRecord,
} from '../analyticsEngine';

describe('analyticsEngine', () => {
  const refDate = new Date('2026-11-06T12:00:00Z');

  const sampleSessions: FocusSessionRecord[] = [
    {
      id: 's1',
      timestamp: refDate.getTime() - 1000 * 60 * 60, // 1 hr ago today
      dateStr: '2026-11-06',
      durationMinutes: 25,
      taskId: 't1',
      taskTitle: 'GAT Quant',
      category: 'Standardized Tests',
    },
    {
      id: 's2',
      timestamp: refDate.getTime() - 1000 * 60 * 60 * 3, // 3 hrs ago today
      dateStr: '2026-11-06',
      durationMinutes: 25,
      taskId: 't1',
      taskTitle: 'GAT Quant',
      category: 'Standardized Tests',
    },
    {
      id: 's3',
      timestamp: refDate.getTime() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      dateStr: '2026-11-03',
      durationMinutes: 25,
      taskId: 't2',
      taskTitle: 'Calculus',
      category: 'School',
    },
    {
      id: 's4',
      timestamp: refDate.getTime() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
      dateStr: '2026-10-22',
      durationMinutes: 50,
      taskId: 't3',
      taskTitle: 'SAT Reading',
      category: 'Study',
    },
  ];

  it('filters sessions accurately by time range', () => {
    const day = filterSessionsByTime(sampleSessions, 'day', refDate);
    expect(day.length).toBe(2);

    const week = filterSessionsByTime(sampleSessions, 'week', refDate);
    expect(week.length).toBe(3);

    const month = filterSessionsByTime(sampleSessions, 'month', refDate);
    expect(month.length).toBe(4);
  });

  it('generates week bar chart data points', () => {
    const barWeek = generateBarChartData(sampleSessions, 'week', refDate);
    expect(barWeek.length).toBe(7);
    const todayBar = barWeek[barWeek.length - 1];
    expect(todayBar.sessions).toBe(2);
    expect(todayBar.minutes).toBe(50);
  });

  it('calculates category breakdown percentages accurately', () => {
    const breakdown = calculateCategoryBreakdown(sampleSessions);
    expect(breakdown.length).toBe(3);

    const totalPercent = breakdown.reduce((acc, c) => acc + c.percentage, 0);
    expect(totalPercent).toBeGreaterThanOrEqual(98);
    expect(totalPercent).toBeLessThanOrEqual(102);

    const satCat = breakdown.find((b) => b.category === 'Study');
    expect(satCat?.minutes).toBe(50);
  });

  it('calculates task completion ratio', () => {
    const tasks = [
      { estimatedSessions: 4, completedSessions: 4, isCompleted: true },
      { estimatedSessions: 6, completedSessions: 3, isCompleted: false },
    ];
    const stats = calculateTaskCompletionRatio(tasks);
    expect(stats.totalEstimated).toBe(10);
    expect(stats.totalCompleted).toBe(7);
    expect(stats.accuracyPercent).toBe(70);
    expect(stats.completedTasksCount).toBe(1);
  });

  it('analyzes score loop, per-section gaps and generates recommendations', () => {
    const testGoal = {
      id: 'goal_gat',
      testName: 'Saudi GAT (Qudurat)',
      targetScore: 92,
      currentBaselineScore: 82,
      testDate: '2026-12-18', // ~6 weeks away
      weeklyPomodoros: 18,
      sectionTargets: {
        gat_quant: 94,
        gat_verbal: 90,
      },
      scoresHistory: [
        {
          date: '2026-11-01',
          score: 82,
          sectionScores: {
            gat_quant: 80, // -14 deficit
            gat_verbal: 91, // +1 surplus
          },
        },
      ],
    };

    const sections = [
      { id: 'gat_quant', nameEn: 'Quantitative', nameAr: 'الكمي', defaultTargetScore: 94 },
      { id: 'gat_verbal', nameEn: 'Verbal', nameAr: 'اللفظي', defaultTargetScore: 90 },
    ];

    const result = analyzeScoreLoop(testGoal, sections);
    expect(result.overallGap).toBe(-10);
    expect(result.sectionGaps.length).toBe(2);

    const quantGap = result.sectionGaps.find((s) => s.sectionId === 'gat_quant');
    expect(quantGap?.gap).toBe(-14);
    expect(quantGap?.status).toBe('deficit');
    expect(quantGap?.recommendedWeeklyPomodoros).toBeGreaterThan(9);

    const verbalGap = result.sectionGaps.find((s) => s.sectionId === 'gat_verbal');
    expect(verbalGap?.gap).toBe(1);
    expect(verbalGap?.status).toBe('surplus');

    expect(result.recommendationNarrativeEn).toContain('Quantitative');
  });

  it('exports RFC 4180 formatted CSV records', () => {
    const csv = exportSessionsToCsv(sampleSessions);
    expect(csv).toContain('Session ID,Date,Timestamp,Duration Minutes,Category,Task Title');
    expect(csv).toContain('"Standardized Tests","GAT Quant"');
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(5); // 1 header + 4 rows
  });
});
