import React, { useState } from 'react';
import { StandardizedTestDefinition, UserTestGoal, TestSection } from '../../data/tests/catalog';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import { requestIntakeConsult, IntakeConsultResult } from '../../lib/ai/geminiClient';
import { resolveGoalSections } from '../../lib/testSections';

interface AiIntakeConsultModalProps {
  test: StandardizedTestDefinition;
  existingGoal?: UserTestGoal;
  onClose: () => void;
  onApply: (goal: UserTestGoal) => void;
}

export const AiIntakeConsultModal: React.FC<AiIntakeConsultModalProps> = ({
  test,
  existingGoal,
  onClose,
  onApply,
}) => {
  const { locale } = useAppStore();
  const isAr = locale === 'ar';

  const [initialDefaults] = useState(() => {
    if (existingGoal?.testDate) {
      const msLeft = new Date(existingGoal.testDate).getTime() - Date.now();
      const weeks = Math.max(1, Math.round(msLeft / (1000 * 60 * 60 * 24 * 7))) || test.typicalPrepWeeks;
      return { date: existingGoal.testDate, weeks };
    }
    const d = new Date();
    d.setDate(d.getDate() + test.typicalPrepWeeks * 7);
    return { date: d.toISOString().split('T')[0], weeks: test.typicalPrepWeeks };
  });

  const [currentScore, setCurrentScore] = useState<number>(
    existingGoal?.currentBaselineScore ?? Math.round(test.minScore + (test.maxScore - test.minScore) * 0.6)
  );
  const [targetScore, setTargetScore] = useState<number>(
    existingGoal?.targetScore ?? Math.round(test.minScore + (test.maxScore - test.minScore) * 0.85)
  );
  const [weeksRemaining, setWeeksRemaining] = useState<number>(initialDefaults.weeks);
  const [dailyHours, setDailyHours] = useState<number>(existingGoal?.weeklyHours ? Math.round(existingGoal.weeklyHours / 5) : 2);
  const [testDate, setTestDate] = useState<string>(initialDefaults.date);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consultResult, setConsultResult] = useState<IntakeConsultResult | null>(null);

  // Editable fields populated from result
  const [editedTargets, setEditedTargets] = useState<Record<string, number>>({});
  const [editedPomodoros, setEditedPomodoros] = useState<number>(20);
  const [editedSummary, setEditedSummary] = useState<string>('');

  const sections: TestSection[] = existingGoal
    ? resolveGoalSections(existingGoal, test)
    : test.sections.map((s) => ({
        id: s.id,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        minScore: s.minScore,
        maxScore: s.maxScore,
        defaultTargetScore: s.defaultTargetScore,
      }));

  const handleRunConsult = async () => {
    setIsLoading(true);
    try {
      const res = await requestIntakeConsult({
        testId: test.id,
        testName: isAr ? test.nameAr : test.nameEn,
        currentScore,
        targetScore,
        weeksRemaining,
        currentDailyHours: dailyHours,
        sections: sections.map((s) => ({
          id: s.id,
          nameEn: s.nameEn,
          nameAr: s.nameAr,
          minScore: s.minScore,
          maxScore: s.maxScore,
          defaultTargetScore: s.defaultTargetScore,
        })),
        locale: isAr ? 'ar' : 'en',
      });

      setConsultResult(res);
      setEditedPomodoros(res.totalWeeklyPomodoros);
      setEditedSummary(res.strategySummary);

      const targetMap: Record<string, number> = {};
      res.sectionTargets.forEach((st) => {
        targetMap[st.sectionId] = st.targetScore;
      });
      setEditedTargets(targetMap);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const finalSectionTargets: Record<string, number> = { ...editedTargets };
    sections.forEach((s) => {
      if (finalSectionTargets[s.id] === undefined) {
        finalSectionTargets[s.id] = s.defaultTargetScore;
      }
    });

    const newGoal: UserTestGoal = {
      id: existingGoal?.id || `goal_${test.id}_${testDate.replace(/-/g, '')}`,
      testId: test.id,
      testName: isAr ? test.nameAr : test.nameEn,
      testDate,
      targetScore,
      currentBaselineScore: currentScore,
      sectionTargets: finalSectionTargets,
      weeklyHours: Math.round((editedPomodoros * 25) / 60),
      weeklyPomodoros: editedPomodoros,
      completedPomodoros: existingGoal?.completedPomodoros || 0,
      scoresHistory: existingGoal?.scoresHistory || [],
      customSections: existingGoal?.customSections,
    };

    onApply(newGoal);
    onClose();
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
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name="psychology" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">
                  {isAr ? `استشارة تحضير ${test.nameAr}` : `AI Intake: ${test.nameEn}`}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border uppercase"
                  style={{
                    backgroundColor: 'var(--md-sys-color-tertiary-container)',
                    color: 'var(--md-sys-color-on-tertiary-container)',
                    borderColor: 'var(--md-sys-color-tertiary)',
                  }}
                >
                  {isAr ? 'مقترح ذكي' : 'AI Suggested'}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isAr
                  ? 'تحديد أهداف الأقسام وتوزيع جلسات البومودورو وفق مستواك الحالي.'
                  : 'Synthesize baseline score, target benchmark, and weekly pomodoro targets.'}
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

        {/* Input Form */}
        <div
          className="p-4 rounded-2xl border space-y-4"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'الدرجة الحالية (أو التجريبية):' : 'Current Baseline Score:'}
              </label>
              <input
                type="number"
                min={test.minScore}
                max={test.maxScore}
                value={currentScore}
                onChange={(e) => setCurrentScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border outline-none font-timer font-bold"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
              <span className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isAr ? `النطاق: ${test.minScore} - ${test.maxScore}` : `Scale: ${test.minScore} - ${test.maxScore}`}
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'الدرجة المستهدفة:' : 'Target Score:'}
              </label>
              <input
                type="number"
                min={test.minScore}
                max={test.maxScore}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border outline-none font-timer font-bold"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-primary)',
                }}
              />
              <span className="text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isAr ? 'حدد طموحك الواقعي للاختبار' : 'Your admissions target threshold'}
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'الأسابيع المتبقية:' : 'Weeks of Preparation:'}
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeksRemaining}
                onChange={(e) => setWeeksRemaining(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border outline-none font-timer"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'ساعات المذاكرة اليومية:' : 'Daily Study Hours:'}
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={dailyHours}
                onChange={(e) => setDailyHours(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border outline-none font-timer"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {isAr ? 'تاريخ الاختبار المقرر:' : 'Scheduled Exam Date:'}
            </label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border outline-none text-xs font-timer"
              style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {isAr
                ? 'ملاحظة أمان: لا يقترح الذكاء الاصطناعي مواعيد اختبارات رسمية. اختر موعدك الفعلي من موقع الجهة.'
                : 'Safety rule: AI never invents official exam dates. Select your actual booking date.'}
            </p>
          </div>

          <button
            onClick={handleRunConsult}
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
                ? (isAr ? 'جاري استشارة الذكاء الاصطناعي...' : 'Consulting AI Model...')
                : (isAr ? 'توليد توصيات الأقسام وساعات الدراسة' : 'Generate Targets & Weekly Load')}
            </span>
          </button>
        </div>

        {/* Results Area (Editable) */}
        {consultResult && (
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
                <span>{consultResult.disclaimer}</span>
              </span>
              <span className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isAr ? 'قابل للتعديل يدوياً' : 'Editable below'}
              </span>
            </div>

            {/* Strategy narrative */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'ملخص الاستراتيجية:' : 'Strategic Summary:'}
              </label>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border text-xs leading-relaxed outline-none"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              />
            </div>

            {/* Total Pomodoros */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'إجمالي جلسات البومودورو الأسبوعية (25 دقيقة):' : 'Weekly Pomodoros Target (25m each):'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={4}
                  max={80}
                  value={editedPomodoros}
                  onChange={(e) => setEditedPomodoros(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded-lg border text-center font-timer font-bold text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-primary)',
                  }}
                />
              </div>
            </div>

            {/* Per-section editable targets */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
              <span className="block text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {isAr ? 'أهداف أقسام الاختبار المقترحة:' : 'Recommended Section Targets:'}
              </span>
              <div className="space-y-2">
                {sections.map((sec) => {
                  const targetVal = editedTargets[sec.id] ?? sec.defaultTargetScore;
                  return (
                    <div
                      key={sec.id}
                      className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        borderColor: 'var(--md-sys-color-outline-variant)',
                      }}
                    >
                      <div>
                        <span className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {isAr ? sec.nameAr : sec.nameEn}
                        </span>
                        {sec.minScore !== undefined && (
                          <span className="ms-1.5 text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            ({sec.minScore}-{sec.maxScore})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {isAr ? 'الدرجة:' : 'Target:'}
                        </span>
                        <input
                          type="number"
                          min={sec.minScore ?? 0}
                          max={sec.maxScore ?? 1000}
                          value={targetVal}
                          onChange={(e) =>
                            setEditedTargets((prev) => ({
                              ...prev,
                              [sec.id]: Number(e.target.value),
                            }))
                          }
                          className="w-20 px-2 py-1 rounded-lg border text-center font-timer font-bold outline-none"
                          style={{
                            backgroundColor: 'var(--md-sys-color-surface)',
                            borderColor: 'var(--md-sys-color-outline-variant)',
                            color: 'var(--md-sys-color-on-surface)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mt-4"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              <MaterialIcon name="check" size={18} />
              <span>{isAr ? 'اعتماد وحفظ في خطتي الدراسية' : 'Save & Apply to My Goals'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
