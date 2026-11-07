/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { TEST_CATALOG, UserTestGoal } from '../../data/tests/catalog';
import { MaterialIcon } from '../common/MaterialIcon';
import { analyzeScoreLoop } from '../../lib/analyticsEngine';
import { resolveGoalSections } from '../../lib/testSections';
import { AiPostTestAnalysisModal } from './AiPostTestAnalysisModal';

interface ScoreLoopModalProps {
  goal: UserTestGoal;
  onClose: () => void;
  /** Open the score-entry form immediately (used by the post-test prompt). */
  autoLog?: boolean;
}

export const ScoreLoopModal: React.FC<ScoreLoopModalProps> = ({ goal, onClose, autoLog = false }) => {
  const { locale, updateTestGoal } = useAppStore();
  const t = TRANSLATIONS[locale];

  const definition = useMemo(() => {
    return TEST_CATALOG.find((x) => x.id === goal.testId);
  }, [goal.testId]);

  const sections = useMemo(() => resolveGoalSections(goal, definition), [goal, definition]);

  // Analysis
  const analysis = useMemo(() => {
    return analyzeScoreLoop(goal, sections);
  }, [goal, sections]);

  // Form State for logging new attempt
  const [isLoggingAttempt, setIsLoggingAttempt] = useState(autoLog);
  const [showAiAnalysis, setShowAiAnalysis] = useState<boolean>(false);
  const [overallScore, setOverallScore] = useState<number>(goal.currentBaselineScore);
  const [sectionScores, setSectionScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    sections.forEach((sec) => {
      init[sec.id] = goal.sectionTargets[sec.id] || sec.defaultTargetScore;
    });
    return init;
  });
  const [notes, setNotes] = useState<string>('');
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  const handleSectionScoreChange = (secId: string, val: number) => {
    setSectionScores((prev) => ({ ...prev, [secId]: val }));
  };

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = {
      date: todayStr,
      score: overallScore,
      sectionScores: { ...sectionScores },
      notes: notes || 'Mock exam trial',
    };

    const newHistory = [newEntry, ...goal.scoresHistory];

    updateTestGoal(goal.id, {
      scoresHistory: newHistory,
      currentBaselineScore: overallScore,
    });

    setIsLoggingAttempt(false);
  };

  const handleApplyRecommendation = () => {
    updateTestGoal(goal.id, {
      weeklyPomodoros: analysis.recommendedTotalWeeklyPomodoros,
    });
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl rounded-3xl p-6 border shadow-2xl my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                }}
              >
                {definition?.code || 'TEST'}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {analysis.daysRemaining} {t.tests.daysRemaining}
              </span>
            </div>
            <h2
              className="text-xl font-bold font-display"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {goal.testName} · {t.scoreLoop.title}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.scoreLoop.subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>

        {/* Target vs Current Benchmark Banner */}
        <div
          className="p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-6">
            <div>
              <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.scoreLoop.target}
              </span>
              <span className="text-2xl font-bold font-timer tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
                {goal.targetScore}
              </span>
            </div>

            <div className="h-8 w-px" style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }} />

            <div>
              <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.scoreLoop.actual}
              </span>
              <span className="text-2xl font-bold font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {analysis.latestScore}
              </span>
            </div>

            <div className="h-8 w-px" style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }} />

            <div>
              <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.scoreLoop.gap}
              </span>
              <span
                className="text-2xl font-bold font-timer tabular-nums"
                style={{
                  color: analysis.overallGap >= 0 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)',
                }}
              >
                {analysis.overallGap >= 0 ? `+${analysis.overallGap}` : analysis.overallGap}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsLoggingAttempt(!isLoggingAttempt)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            <MaterialIcon name="edit" size={16} />
            <span>{isLoggingAttempt ? t.tasks.cancel : t.scoreLoop.logNewAttempt}</span>
          </button>
        </div>

        {/* LOG FORM (Collapsible) */}
        {isLoggingAttempt && (
          <form
            onSubmit={handleSaveAttempt}
            className="p-5 rounded-2xl border mb-6 space-y-4 animate-in fade-in"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-primary)',
            }}
          >
            <h3 className="text-sm font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {t.scoreLoop.logNewAttempt}
            </h3>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {locale === 'ar' ? 'الدرجة الكلية المحققة' : 'Overall Composite Score'}
              </label>
              <input
                type="number"
                required
                value={overallScore}
                onChange={(e) => setOverallScore(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border text-sm font-timer font-bold tabular-nums outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            {/* Per-Section Score Inputs */}
            {sections.length > 0 && (
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {t.scoreLoop.sectionBreakdown}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sections.map((sec) => (
                    <div key={sec.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                      <span className="block text-xs font-medium truncate mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {locale === 'ar' ? sec.nameAr : sec.nameEn}
                      </span>
                      <input
                        type="number"
                        value={sectionScores[sec.id] || 0}
                        onChange={(e) => handleSectionScoreChange(sec.id, parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-timer tabular-nums outline-none"
                        style={{
                          backgroundColor: 'var(--md-sys-color-surface-container-low)',
                          borderColor: 'var(--md-sys-color-outline-variant)',
                          color: 'var(--md-sys-color-on-surface)',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {t.tasks.notes}
              </label>
              <input
                type="text"
                placeholder={locale === 'ar' ? 'ملاحظات المحاولة (مثال: اختبار تجريبي كامل بدون وقت إضافي)' : 'Trial notes (e.g. Official Practice Test #2)'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLoggingAttempt(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {t.tasks.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                {t.tasks.save}
              </button>
            </div>
          </form>
        )}

        {/* Per-Section Gap Analysis Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.scoreLoop.gapAnalysis}
          </h3>

          <div className="space-y-2.5">
            {analysis.sectionGaps.map((sec) => {
              const isDeficit = sec.gap < 0;
              return (
                <div
                  key={sec.sectionId}
                  className="p-3.5 rounded-2xl border flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div>
                    <span className="text-sm font-semibold block" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {sec.sectionName}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {t.scoreLoop.target}: {sec.targetScore} · {t.scoreLoop.actual}: {sec.actualScore} ·{' '}
                      {sec.targetScore > 0 ? `${Math.round((sec.actualScore / sec.targetScore) * 100)}%` : '—'}{' '}
                      {locale === 'ar' ? 'من الهدف' : 'of goal'}
                    </span>
                  </div>

                  <div className="text-end font-timer tabular-nums">
                    <span
                      className="text-sm font-bold block"
                      style={{
                        color: isDeficit ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)',
                      }}
                    >
                      {sec.gap > 0 ? `+${sec.gap}` : sec.gap}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {sec.recommendedWeeklyPomodoros} {locale === 'ar' ? 'جلسة/أسبوع' : 'pomodoros/wk'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adaptive Recommendations Card */}
        <div
          className="p-4 rounded-2xl border mb-6"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MaterialIcon name="lightbulb" size={20} style={{ color: 'var(--md-sys-color-secondary)' }} />
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {t.scoreLoop.adaptiveRecommendations}
            </h4>
          </div>

          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {locale === 'ar' ? analysis.recommendationNarrativeAr : analysis.recommendationNarrativeEn}
          </p>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {locale === 'ar' ? 'المعدل الأسبوعي المقترح:' : 'Recommended Weekly Volume:'}{' '}
              <span className="font-timer font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>
                {analysis.recommendedTotalWeeklyPomodoros} {locale === 'ar' ? 'جلسة' : 'sessions'}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAiAnalysis(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  borderColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-primary)',
                }}
                title={locale === 'ar' ? 'تشخيص دقيق وتعديل الجلسات بالذكاء الاصطناعي' : 'AI Diagnostic Analysis'}
              >
                <MaterialIcon name="troubleshoot" size={14} />
                <span>{locale === 'ar' ? 'تحليل ذكي' : 'AI Analysis'}</span>
              </button>

              <button
                onClick={handleApplyRecommendation}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                {t.scoreLoop.applyRecommendation}
              </button>
            </div>
          </div>

          {appliedNotice && (
            <div
              className="mt-2 text-xs font-semibold text-center animate-in fade-in"
              style={{ color: 'var(--md-sys-color-primary)' }}
            >
              {t.scoreLoop.appliedSuccess}
            </div>
          )}
        </div>

        {/* Historical Progress List */}
        <div>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {t.scoreLoop.historyTitle}
          </h3>

          {goal.scoresHistory.length === 0 ? (
            <div className="text-xs p-4 rounded-xl border text-center" style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}>
              {t.scoreLoop.noHistory}
            </div>
          ) : (
            <>
              {/* History vs goal line chart */}
              {(() => {
                const pts = [...goal.scoresHistory].reverse(); // oldest -> newest
                const W = 560, H = 120, PAD = 8;
                const all = pts.map((p) => p.score).concat([goal.targetScore, goal.currentBaselineScore]);
                const min = Math.min(...all, 0);
                const max = Math.max(...all, 1);
                const x = (i: number) => PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2);
                const y = (v: number) => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2);
                const goalY = y(goal.targetScore);
                const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 mb-2" role="img" aria-label={locale === 'ar' ? 'مخطط الدرجات' : 'Score history chart'}>
                    <line x1={PAD} x2={W - PAD} y1={goalY} y2={goalY} stroke="var(--md-sys-color-primary)" strokeWidth="1.5" strokeDasharray="5 4" />
                    <path d={path} fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="2" />
                    {pts.map((p, i) => (
                      <circle key={i} cx={x(i)} cy={y(p.score)} r="3.5" fill="var(--md-sys-color-secondary)" />
                    ))}
                    <text x={PAD} y={goalY - 4} fontSize="10" fill="var(--md-sys-color-primary)">{goal.targetScore}</text>
                  </svg>
                );
              })()}
              <div className="space-y-2">
              {goal.scoresHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div>
                    <span className="font-semibold block font-timer tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {item.date}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {item.notes || 'Mock trial'}
                    </span>
                  </div>

                  <div className="text-end font-timer font-bold text-sm tabular-nums" style={{ color: 'var(--md-sys-color-primary)' }}>
                    {item.score}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showAiAnalysis && (
        <AiPostTestAnalysisModal
          goal={goal}
          onClose={() => setShowAiAnalysis(false)}
        />
      )}
    </div>
  );
};
