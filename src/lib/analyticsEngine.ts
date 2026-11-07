/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FocusSessionRecord {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  durationMinutes: number;
  taskId: string | null;
  taskTitle: string;
  category: string;
}

export type TimeFilter = 'day' | 'week' | 'month' | 'year' | 'allTime';

export interface BarChartPoint {
  label: string;
  sublabel?: string;
  dateStr: string;
  minutes: number;
  sessions: number;
  topCategory?: string;
}

export interface LineChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
  dateStr: string;
}

export interface CategoryBreakdown {
  category: string;
  minutes: number;
  sessions: number;
  percentage: number;
  colorVar: string;
}

export interface HeatmapCell {
  dateStr: string;
  dayLabel: string;
  sessions: number;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = empty, 4 = heavy (4+ sessions)
}

export interface SectionGapResult {
  sectionId: string;
  sectionName: string;
  targetScore: number;
  actualScore: number;
  gap: number; // actual - target (negative = deficit)
  status: 'surplus' | 'met' | 'deficit';
  recommendedWeeklyPomodoros: number;
}

export interface ScoreLoopAnalysis {
  goalId: string;
  testName: string;
  targetScore: number;
  latestScore: number;
  overallGap: number;
  daysRemaining: number;
  sectionGaps: SectionGapResult[];
  recommendedTotalWeeklyPomodoros: number;
  recommendationNarrativeEn: string;
  recommendationNarrativeAr: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Standardized Tests': 'var(--md-sys-color-primary)',
  'Study': 'var(--md-sys-color-secondary)',
  'School': 'var(--md-sys-color-tertiary)',
  'Work': 'var(--md-sys-color-primary-container)',
  'Extracurriculars': 'var(--md-sys-color-tertiary-container)',
  'Personal': 'var(--md-sys-color-outline)',
};

export function getCategoryColorVar(category: string): string {
  return CATEGORY_COLORS[category] || 'var(--md-sys-color-primary)';
}

/**
 * Filter sessions by time range.
 */
export function filterSessionsByTime(
  sessions: FocusSessionRecord[],
  filter: TimeFilter,
  referenceDate = new Date()
): FocusSessionRecord[] {
  const refTime = referenceDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return sessions.filter((s) => {
    const diffMs = refTime - s.timestamp;
    if (diffMs < -oneDayMs) return false; // future sanity check

    switch (filter) {
      case 'day': {
        const todayStr = referenceDate.toISOString().split('T')[0];
        return s.dateStr === todayStr;
      }
      case 'week':
        return diffMs <= 7 * oneDayMs;
      case 'month':
        return diffMs <= 30 * oneDayMs;
      case 'year':
        return diffMs <= 365 * oneDayMs;
      case 'allTime':
      default:
        return true;
    }
  });
}

/**
 * Aggregate sessions into Bar Chart data points.
 */
export function generateBarChartData(
  sessions: FocusSessionRecord[],
  filter: TimeFilter,
  referenceDate = new Date()
): BarChartPoint[] {
  if (filter === 'day') {
    // 6 4-hour slots of the day (0-4, 4-8, 8-12, 12-16, 16-20, 20-24)
    const slots = [
      { label: '00-04', minHour: 0, maxHour: 4 },
      { label: '04-08', minHour: 4, maxHour: 8 },
      { label: '08-12', minHour: 8, maxHour: 12 },
      { label: '12-16', minHour: 12, maxHour: 16 },
      { label: '16-20', minHour: 16, maxHour: 20 },
      { label: '20-24', minHour: 20, maxHour: 24 },
    ];

    const todayStr = referenceDate.toISOString().split('T')[0];
    const todaySessions = sessions.filter((s) => s.dateStr === todayStr);

    return slots.map((slot) => {
      const inSlot = todaySessions.filter((s) => {
        const hour = new Date(s.timestamp).getHours();
        return hour >= slot.minHour && hour < slot.maxHour;
      });
      const minutes = inSlot.reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        label: slot.label,
        dateStr: todayStr,
        minutes,
        sessions: inSlot.length,
        topCategory: inSlot[0]?.category || undefined,
      };
    });
  }

  if (filter === 'week') {
    // Last 7 days
    const points: BarChartPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];

      const daySessions = sessions.filter((s) => s.dateStr === dateStr);
      const minutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

      points.push({
        label: dayLabel,
        sublabel: `${d.getMonth() + 1}/${d.getDate()}`,
        dateStr,
        minutes,
        sessions: daySessions.length,
        topCategory: daySessions[0]?.category,
      });
    }
    return points;
  }

  if (filter === 'month') {
    // 4 7-day buckets
    const points: BarChartPoint[] = [];
    for (let w = 3; w >= 0; w--) {
      const startDay = w * 7;
      const endDay = (w + 1) * 7;
      const label = `W-${4 - w}`;

      const bucketSessions = sessions.filter((s) => {
        const diffDays = Math.floor((referenceDate.getTime() - s.timestamp) / (24 * 60 * 60 * 1000));
        return diffDays >= startDay && diffDays < endDay;
      });

      const minutes = bucketSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      points.push({
        label,
        sublabel: `Week ${4 - w}`,
        dateStr: '',
        minutes,
        sessions: bucketSessions.length,
        topCategory: bucketSessions[0]?.category,
      });
    }
    return points;
  }

  // year or allTime: 12 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const points: BarChartPoint[] = [];
  const currentMonth = referenceDate.getMonth();

  for (let i = 5; i >= 0; i--) {
    const mIndex = (currentMonth - i + 12) % 12;
    const label = monthNames[mIndex];

    const inMonth = sessions.filter((s) => {
      const d = new Date(s.timestamp);
      return d.getMonth() === mIndex;
    });

    const minutes = inMonth.reduce((sum, s) => sum + s.durationMinutes, 0);
    points.push({
      label,
      dateStr: '',
      minutes,
      sessions: inMonth.length,
      topCategory: inMonth[0]?.category,
    });
  }

  return points;
}

/**
 * Generate smooth SVG path for Line Chart.
 */
export function generateSvgLinePath(
  points: { x: number; y: number }[],
  smoothness = 0.2
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * smoothness;
    const cp1y = p1.y + (p2.y - p0.y) * smoothness;
    const cp2x = p2.x - (p3.x - p1.x) * smoothness;
    const cp2y = p2.y - (p3.y - p1.y) * smoothness;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

/**
 * Category Breakdown calculation.
 */
export function calculateCategoryBreakdown(sessions: FocusSessionRecord[]): CategoryBreakdown[] {
  const map: Record<string, { minutes: number; sessions: number }> = {};
  let totalMinutes = 0;

  sessions.forEach((s) => {
    const cat = s.category || 'Study';
    if (!map[cat]) map[cat] = { minutes: 0, sessions: 0 };
    map[cat].minutes += s.durationMinutes;
    map[cat].sessions += 1;
    totalMinutes += s.durationMinutes;
  });

  if (totalMinutes === 0) return [];

  return Object.entries(map)
    .map(([cat, data]) => ({
      category: cat,
      minutes: data.minutes,
      sessions: data.sessions,
      percentage: Math.round((data.minutes / totalMinutes) * 100),
      colorVar: getCategoryColorVar(cat),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/**
 * Task completion efficiency (Estimated vs Actual pomodoros).
 */
export function calculateTaskCompletionRatio(tasks: { estimatedSessions: number; completedSessions: number; isCompleted: boolean }[]) {
  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedSessions || 0), 0);
  const totalCompleted = tasks.reduce((sum, t) => sum + (t.completedSessions || 0), 0);
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const ratio = totalEstimated > 0 ? Math.round((totalCompleted / totalEstimated) * 100) : 100;

  return {
    totalEstimated,
    totalCompleted,
    completedTasksCount,
    totalTasks: tasks.length,
    accuracyPercent: Math.min(200, ratio),
  };
}

/**
 * 28-day Activity Heatmap matrix (4 weeks x 7 days).
 */
export function generateActivityHeatmap(
  sessions: FocusSessionRecord[],
  referenceDate = new Date()
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  for (let i = 27; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];

    const daySessions = sessions.filter((s) => s.dateStr === dateStr);
    const count = daySessions.length;
    const minutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count === 1) level = 1;
    else if (count === 2) level = 2;
    else if (count === 3) level = 3;
    else if (count >= 4) level = 4;

    cells.push({
      dateStr,
      dayLabel,
      sessions: count,
      minutes,
      level,
    });
  }

  return cells;
}

/**
 * Score Loop & Gap Analysis.
 */
export function analyzeScoreLoop(
  goal: {
    id: string;
    testName: string;
    targetScore: number;
    currentBaselineScore: number;
    testDate: string;
    weeklyPomodoros: number;
    sectionTargets: Record<string, number>;
    scoresHistory: { date: string; score: number; sectionScores: Record<string, number> }[];
  },
  sectionCatalog: { id: string; nameEn: string; nameAr: string; defaultTargetScore: number }[]
): ScoreLoopAnalysis {
  const latestTrial = goal.scoresHistory[0];
  const latestScore = latestTrial ? latestTrial.score : goal.currentBaselineScore;
  const overallGap = latestScore - goal.targetScore;

  const now = new Date().getTime();
  const examTime = new Date(goal.testDate).getTime();
  const daysRemaining = Math.max(1, Math.ceil((examTime - now) / (1000 * 60 * 60 * 24)));
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));

  const sectionGaps: SectionGapResult[] = sectionCatalog.map((sec) => {
    const target = goal.sectionTargets[sec.id] || sec.defaultTargetScore;
    const actual = (latestTrial?.sectionScores && latestTrial.sectionScores[sec.id] !== undefined)
      ? latestTrial.sectionScores[sec.id]
      : Math.round(target * 0.88);

    const gap = actual - target;
    let status: 'surplus' | 'met' | 'deficit' = 'met';
    if (gap > 0) status = 'surplus';
    else if (gap < 0) status = 'deficit';

    // Adaptive formula: if deficit, calculate required weekly pomodoros to close deficit before exam
    let recommendedWeekly = Math.max(4, Math.round(goal.weeklyPomodoros / (sectionCatalog.length || 1)));
    if (gap < 0) {
      const deficitPoints = Math.abs(gap);
      const extraNeeded = Math.ceil((deficitPoints * 1.5) / weeksRemaining);
      recommendedWeekly += extraNeeded;
    } else if (gap > 0) {
      recommendedWeekly = Math.max(2, recommendedWeekly - 1); // Maintain without over-allocating
    }

    return {
      sectionId: sec.id,
      sectionName: sec.nameEn,
      targetScore: target,
      actualScore: actual,
      gap,
      status,
      recommendedWeeklyPomodoros: recommendedWeekly,
    };
  });

  const recommendedTotalWeekly = sectionGaps.reduce((sum, s) => sum + s.recommendedWeeklyPomodoros, 0);

  const largestDeficitSection = [...sectionGaps].sort((a, b) => a.gap - b.gap)[0];

  const narrativeEn = largestDeficitSection && largestDeficitSection.gap < 0
    ? `Target score gap is ${Math.abs(overallGap)} points. We recommend focusing on ${largestDeficitSection.sectionName} with ${largestDeficitSection.recommendedWeeklyPomodoros} pomodoros/week over the remaining ${weeksRemaining} weeks.`
    : `You are on pace to meet your target score of ${goal.targetScore}. Maintain current steady cadence of ${recommendedTotalWeekly} pomodoros/week.`;

  const narrativeAr = largestDeficitSection && largestDeficitSection.gap < 0
    ? `فارق الدرجة عن الهدف هو ${Math.abs(overallGap)} نقطة. نوصي بتكثيف التركيز على ${largestDeficitSection.sectionName} بمعدل ${largestDeficitSection.recommendedWeeklyPomodoros} جلسة أسبوعياً خلال الأسابيع ${weeksRemaining} المتبقية.`
    : `أداؤك متوافق مع هدف الوصول لدرجة ${goal.targetScore}. حافظ على وتيرة المذاكرة الحالية بمعدل ${recommendedTotalWeekly} جلسة أسبوعياً.`;

  return {
    goalId: goal.id,
    testName: goal.testName,
    targetScore: goal.targetScore,
    latestScore,
    overallGap,
    daysRemaining,
    sectionGaps,
    recommendedTotalWeeklyPomodoros: recommendedTotalWeekly,
    recommendationNarrativeEn: narrativeEn,
    recommendationNarrativeAr: narrativeAr,
  };
}

/**
 * Format records into RFC 4180 CSV string.
 */
export function exportSessionsToCsv(sessions: FocusSessionRecord[]): string {
  const headers = ['Session ID', 'Date', 'Timestamp', 'Duration Minutes', 'Category', 'Task Title'];
  const rows = sessions.map((s) => [
    `"${s.id}"`,
    `"${s.dateStr}"`,
    s.timestamp,
    s.durationMinutes,
    `"${s.category.replace(/"/g, '""')}"`,
    `"${s.taskTitle.replace(/"/g, '""')}"`,
  ]);

  // BOM so Excel opens UTF-8 Arabic correctly.
  return '﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Default realistic session logs generation (for testing & initial richness).
 */
export function generateDefaultSessionLogs(): FocusSessionRecord[] {
  const records: FocusSessionRecord[] = [];
  const categories = [
    { cat: 'Standardized Tests', task: 'GAT Quantitative Speed Drills' },
    { cat: 'Standardized Tests', task: 'Saudi SAAT Physics Revision' },
    { cat: 'Study', task: 'SAT Reading Evidence Analysis' },
    { cat: 'School', task: 'Calculus Assignment & Proofs' },
    { cat: 'Work', task: 'Research Presentation Slides' },
    { cat: 'Extracurriculars', task: 'Competitive Programming Set' },
  ];

  const now = new Date();

  // Generate 42 sessions spanning the last 21 days
  for (let i = 20; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // 1 to 4 sessions per day
    const daySeed = (i * 3 + 7) % 4 + 1;
    for (let s = 0; s < daySeed; s++) {
      const catObj = categories[(i + s) % categories.length];
      const hour = 10 + s * 3;
      const sessionTime = new Date(d);
      sessionTime.setHours(hour, (s * 15) % 60, 0, 0);

      records.push({
        id: `sess_hist_${i}_${s}`,
        timestamp: sessionTime.getTime(),
        dateStr,
        durationMinutes: 25,
        taskId: `sample_task_${(s % 2) + 1}`,
        taskTitle: catObj.task,
        category: catObj.cat,
      });
    }
  }

  return records;
}
