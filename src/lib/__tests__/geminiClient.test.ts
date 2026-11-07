import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  localFallbackIntakeConsult,
  localFallbackStudyPlan,
  localFallbackPostTestAnalysis,
  requestIntakeConsult,
  requestStudyPlan,
  requestPostTestAnalysis,
} from '../ai/geminiClient';

describe('Gemini AI Client & Offline Heuristics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Feature (a): Test Intake Consult (offline fallback)', () => {
    it('produces schema-compliant section targets and weekly pomodoro estimates', () => {
      const result = localFallbackIntakeConsult({
        testId: 'SAT',
        testName: 'SAT',
        currentScore: 1100,
        targetScore: 1400,
        weeksRemaining: 8,
        currentDailyHours: 2,
        sections: [
          { id: 'math', nameEn: 'Math', minScore: 200, maxScore: 800, defaultTargetScore: 700 },
          { id: 'reading_writing', nameEn: 'Reading & Writing', minScore: 200, maxScore: 800, defaultTargetScore: 700 },
        ],
        locale: 'en',
      });

      expect(result.aiSuggested).toBe(true);
      expect(result.isOfflineFallback).toBe(true);
      expect(result.disclaimer).toContain('verify');
      expect(result.totalWeeklyPomodoros).toBeGreaterThanOrEqual(6);
      expect(result.sectionTargets).toHaveLength(2);
      expect(result.sectionTargets[0].sectionId).toBe('math');
      expect(result.sectionTargets[1].sectionId).toBe('reading_writing');
      expect(result.strategySummary).toContain('1400');
    });

    it('handles Arabic locale correctly', () => {
      const result = localFallbackIntakeConsult({
        testId: 'GAT',
        testName: 'القدرات العامة',
        currentScore: 70,
        targetScore: 90,
        weeksRemaining: 6,
        currentDailyHours: 3,
        sections: [
          { id: 'quantitative', nameEn: 'Quantitative', nameAr: 'الكمي', minScore: 0, maxScore: 100, defaultTargetScore: 90 },
          { id: 'verbal', nameEn: 'Verbal', nameAr: 'اللفظي', minScore: 0, maxScore: 100, defaultTargetScore: 90 },
        ],
        locale: 'ar',
      });

      expect(result.strategySummary).toContain('خطة معيارية');
      expect(result.disclaimer).toContain('الجهة الرسمية');
    });
  });

  describe('Feature (b): Study Plan Generator (offline fallback)', () => {
    it('generates distributed weekly tasks with pomodoros and assigned weekdays', () => {
      const result = localFallbackStudyPlan({
        testId: 'SAT',
        testName: 'SAT',
        weeklyPomodoroTarget: 20,
        sectionPriorities: [
          { sectionId: 'math', sectionName: 'Math', gap: 15 },
          { sectionId: 'reading_writing', sectionName: 'Reading & Writing', gap: 5 },
        ],
        locale: 'en',
      });

      expect(result.aiSuggested).toBe(true);
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);
      result.tasks.forEach((task) => {
        expect(task.title).toBeTruthy();
        expect(task.estimatedPomodoros).toBeGreaterThan(0);
        expect(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']).toContain(task.dayOfWeek);
      });
    });
  });

  describe('Feature (c): Post-Test Analysis (offline fallback)', () => {
    it('identifies weakest section and proposes compensatory pomodoro shifts', () => {
      const result = localFallbackPostTestAnalysis({
        testId: 'IELTS',
        testName: 'IELTS',
        targetScore: 7.5,
        actualScores: {
          listening: 8.0,
          reading: 7.5,
          writing: 6.0,
          speaking: 6.5,
        },
        sectionTargets: {
          listening: 7.5,
          reading: 7.5,
          writing: 7.5,
          speaking: 7.5,
        },
        locale: 'en',
      });

      expect(result.aiSuggested).toBe(true);
      expect(result.weakestSection).toBe('writing');
      expect(result.overallGap).toBeGreaterThan(0);
      const writingShift = result.recommendedWeeklyShift.find((s) => s.sectionId === 'writing');
      expect(writingShift?.deltaPomodoros).toBeGreaterThan(0);
    });
  });

  describe('Graceful degradation when server API is unavailable', () => {
    it('requestIntakeConsult seamlessly falls back to local heuristic on network failure', async () => {
      // Mock global fetch rejection
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

      const result = await requestIntakeConsult({
        testId: 'SAT',
        currentScore: 1000,
        targetScore: 1300,
        sections: [{ id: 'math', nameEn: 'Math' }],
      });

      expect(result.aiSuggested).toBe(true);
      expect(result.isOfflineFallback).toBe(true);
    });

    it('requestStudyPlan seamlessly falls back to local heuristic on HTTP 503 error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'GEMINI_KEY_UNAVAILABLE', fallback: true }),
      }));

      const result = await requestStudyPlan({
        testId: 'GAT',
        testName: 'القدرات',
        weeklyPomodoroTarget: 16,
        sectionPriorities: [{ sectionId: 'quant', sectionName: 'الكمي', gap: 10 }],
      });

      expect(result.aiSuggested).toBe(true);
      expect(result.isOfflineFallback).toBe(true);
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it('requestPostTestAnalysis seamlessly falls back to local heuristic on HTTP 500 error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'INFERENCE_ERROR', fallback: true }),
      }));

      const result = await requestPostTestAnalysis({
        testId: 'SAT',
        testName: 'SAT',
        targetScore: 1400,
        actualScores: { math: 600, verbal: 650 },
        sectionTargets: { math: 700, verbal: 700 },
      });

      expect(result.aiSuggested).toBe(true);
      expect(result.isOfflineFallback).toBe(true);
      expect(result.weakestSection).toBe('math');
    });
  });
});
