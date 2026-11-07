import React, { useState } from 'react';
import { UserTestGoal, TEST_CATALOG } from '../../data/tests/catalog';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import { requestPostTestAnalysis, PostTestAnalysisResult } from '../../lib/ai/geminiClient';
import { resolveGoalSections } from '../../lib/testSections';

interface AiPostTestAnalysisModalProps {
  goal: UserTestGoal;
  onClose: () => void;
  onApplyAdjustment?: (recommendedPomodoros: number) => void;
}

export const AiPostTestAnalysisModal: React.FC<AiPostTestAnalysisModalProps> = ({
  goal,
  onClose,
  onApplyAdjustment,
}) => {
  const { locale, updateTestGoal } = useAppStore();
  const isAr = locale === 'ar';

  const definition = TEST_CATALOG.find((x) => x.id === goal.testId);
  const sections = resolveGoalSections(goal, definition);

  // Latest test attempt or fallback to baseline
  const latestAttempt = goal.scoresHistory[goal.scoresHistory.length - 1];

  const initialActualScores: Record<string, number> = {};
  sections.forEach((s) => {
    initialActualScores[s.id] =
      latestAttempt?.sectionScores?.[s.id] ??
      Math.round(goal.currentBaselineScore / (sections.length || 1));
  });

  const [actualScores, setActualScores] = useState<Record<string, number>>(initialActualScores);
  const [targetOverall] = useState<number>(goal.targetScore);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PostTestAnalysisResult | null>(null);
  const [editedNarrative, setEditedNarrative] = useState<string>('');
  const [shifts, setShifts] = useState<Array<{ sectionId: string; deltaPomodoros: number }>>([]);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setIsApplied(false);
    try {
      const sectionNames: Record<string, string> = {};
      sections.forEach((s) => {
        sectionNames[s.id] = isAr ? s.nameAr : s.nameEn;
      });

      const res = await requestPostTestAnalysis({
        testId: goal.testId,
        testName: goal.testName,
        targetScore: targetOverall,
        actualScores,
        sectionTargets: goal.sectionTargets,
        sectionNames,
        locale: isAr ? 'ar' : 'en',
      });

      setAnalysisResult(res);
      setEditedNarrative(res.analysisNarrative);
      setShifts(res.recommendedWeeklyShift);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyShifts = () => {
    const netShift = shifts.reduce((sum, s) => sum + s.deltaPomodoros, 0);
    const newWeeklyTotal = Math.max(4, (goal.weeklyPomodoros || 20) + netShift);

    updateTestGoal(goal.id, {
      weeklyPomodoros: newWeeklyTotal,
      weeklyHours: Math.round((newWeeklyTotal * 25) / 60),
    });

    if (onApplyAdjustment) {
      onApplyAdjustment(newWeeklyTotal);
    }

    setIsApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-in fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-xl p-6 space-y-5"
        style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          borderColor: 'var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--md-sys-color-tertiary-container)',
                color: 'var(--md-sys-color-on-tertiary-container)',
              }}
            >
              <MaterialIcon name="troubleshoot" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">
                  {isAr ? `تحليل نتائج الاختبار: ${goal.testName}` : `Post-Test Analysis: ${goal.testName}`}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border uppercase"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    borderColor: 'var(--md-sys-color-primary)',
                  }}
                >
                  {isAr ? 'تحليل ذكي' : 'AI Analysis'}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isAr
                  ? 'تشخيص الفجوات بين درجاتك الفعلية والمستهدفة وتعديل خطة المذاكرة.'
                  : 'Diagnostic analysis between real scores and benchmarks with compensatory shifts.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Scores verification/entry */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {isAr ? 'الدرجات الفعلية التي حققتها بالأقسام:' : 'Your Real / Mock Section Scores:'}
            </span>
            <span className="font-timer tabular-nums text-xs" style={{ color: 'var(--md-sys-color-primary)' }}>
              {isAr ? `الهدف الكلي: ${targetOverall}` : `Target: ${targetOverall}`}
            </span>
          </div>

          <div className="space-y-2">
            {sections.map((sec) => {
              const actual = actualScores[sec.id] ?? 0;
              const target = goal.sectionTargets[sec.id] ?? sec.defaultTargetScore;
              const diff = actual - target;

              return (
                <div
                  key={sec.id}
                  className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {isAr ? sec.nameAr : sec.nameEn}
                    </span>
                    <span className="ms-2 text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      ({isAr ? `الهدف: ${target}` : `Target: ${target}`})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={actual}
                      onChange={(e) =>
                        setActualScores((prev) => ({
                          ...prev,
                          [sec.id]: Number(e.target.value),
                        }))
                      }
                      className="w-20 px-2 py-1 rounded-lg border text-center font-timer font-bold outline-none"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        borderColor: 'var(--md-sys-color-outline-variant)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                    />
                    <span
                      className={`text-[11px] font-bold w-12 text-end tabular-nums ${
                        diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-opacity"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <MaterialIcon name={isLoading ? 'sync' : 'auto_awesome'} size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>
              {isLoading
                ? (isAr ? 'جاري تحليل الأداء والفجوات...' : 'Analyzing Score Gaps...')
                : (isAr ? 'تحليل نتائج الاختبار وتقديم التوصيات' : 'Analyze Scores & Recommend Shifts')}
            </span>
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div
            className="p-4 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--md-sys-color-secondary-container)',
                  color: 'var(--md-sys-color-on-secondary-container)',
                }}
              >
                <MaterialIcon name="check_circle" size={14} />
                <span>{analysisResult.disclaimer}</span>
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--md-sys-color-error)' }}>
                {isAr
                  ? `الفجوة الكلية: ${analysisResult.overallGap} نقطة`
                  : `Overall Gap: ${analysisResult.overallGap} pts`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'التحليل التشخيصي والتوجيهات:' : 'Diagnostic Narrative:'}
              </label>
              <textarea
                value={editedNarrative}
                onChange={(e) => setEditedNarrative(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border text-xs leading-relaxed outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            {/* Recommended pomodoro adjustments */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span className="block text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'تعديلات جلسات البومودورو الأسبوعية المقترحة:' : 'Recommended Weekly Pomodoro Adjustments:'}
              </span>
              <div className="space-y-2">
                {shifts.map((s, idx) => {
                  const secDef = sections.find((x) => x.id === s.sectionId);
                  const name = secDef ? (isAr ? secDef.nameAr : secDef.nameEn) : s.sectionId;
                  return (
                    <div
                      key={s.sectionId}
                      className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        borderColor: 'var(--md-sys-color-outline-variant)',
                      }}
                    >
                      <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {isAr ? 'التعديل الأسبوعي:' : 'Shift:'}
                        </span>
                        <input
                          type="number"
                          value={s.deltaPomodoros}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setShifts((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, deltaPomodoros: val } : item))
                            );
                          }}
                          className="w-16 px-2 py-1 rounded-lg border text-center font-timer font-bold outline-none"
                          style={{
                            backgroundColor: 'var(--md-sys-color-surface)',
                            borderColor: 'var(--md-sys-color-outline-variant)',
                            color: s.deltaPomodoros >= 0 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)',
                          }}
                        />
                        <span className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {isAr ? 'جلسة' : 'poms'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isApplied ? (
              <div
                className="p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  borderColor: 'var(--md-sys-color-primary)',
                }}
              >
                <MaterialIcon name="check" size={18} />
                <span>{isAr ? 'تم تطبيق تعديلات الخطة الأسبوعية بنجاح!' : 'Weekly adjustments applied to goal!'}</span>
              </div>
            ) : (
              <button
                onClick={handleApplyShifts}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mt-3"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                <MaterialIcon name="tune" size={18} />
                <span>{isAr ? 'تطبيق التعديلات على الخطة الأسبوعية' : 'Apply Adjustments to Weekly Goal'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
