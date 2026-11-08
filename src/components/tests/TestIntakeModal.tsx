import React, { useMemo, useState } from 'react';
import { StandardizedTestDefinition, UserTestGoal } from '../../data/tests/catalog';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdDialog } from '../common/MdControls';

interface TestIntakeModalProps {
  /** Catalog definition, or null for a custom test. */
  test: StandardizedTestDefinition | null;
  locale: 'en' | 'ar';
  onClose: () => void;
  onSave: (goal: UserTestGoal) => void;
  /** Optional AI consult step (AI Studio flow), wired by the parent. */
  onAiConsult?: () => void;
  aiAvailable?: boolean;
}

const isAr = (l: 'en' | 'ar') => l === 'ar';

export const TestIntakeModal: React.FC<TestIntakeModalProps> = ({
  test,
  locale,
  onClose,
  onSave,
  onAiConsult,
  aiAvailable,
}) => {
  const ar = isAr(locale);

  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (test?.typicalPrepWeeks ?? 12) * 7);
    return d.toISOString().split('T')[0];
  }, [test]);

  const [customName, setCustomName] = useState('');
  const [testDate, setTestDate] = useState(defaultDate);
  const [weeklyPomodoros, setWeeklyPomodoros] = useState(20);
  const [scoreUnknown, setScoreUnknown] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | ''>(
    test ? Math.round(test.minScore + (test.maxScore - test.minScore) * 0.6) : '',
  );
  const [sectionTargets, setSectionTargets] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    test?.sections.forEach((s) => {
      init[s.id] = s.defaultTargetScore;
    });
    return init;
  });
  const [error, setError] = useState<string | null>(null);

  const sections = test?.sections ?? [];

  const validate = (): string | null => {
    if (!test && !customName.trim()) return ar ? 'أدخل اسم الاختبار' : 'Enter a test name';
    if (!testDate) return ar ? 'اختر تاريخ الاختبار' : 'Pick a test date';
    if (!Number.isInteger(weeklyPomodoros) || weeklyPomodoros < 1 || weeklyPomodoros > 168) {
      return ar ? 'الجلسات الأسبوعية يجب أن تكون بين 1 و168' : 'Weekly sessions must be 1-168';
    }
    if (test) {
      if (!scoreUnknown) {
        if (currentScore === '' || Number(currentScore) < test.minScore || Number(currentScore) > test.maxScore) {
          return ar
            ? `الدرجة الحالية يجب أن تكون بين ${test.minScore} و${test.maxScore}`
            : `Current score must be between ${test.minScore} and ${test.maxScore}`;
        }
      }
      for (const s of sections) {
        const v = sectionTargets[s.id];
        if (v === undefined || v < s.minScore || v > s.maxScore) {
          return ar
            ? `هدف «${ar ? s.nameAr : s.nameEn}» يجب أن يكون بين ${s.minScore} و${s.maxScore}`
            : `Target for "${s.nameEn}" must be between ${s.minScore} and ${s.maxScore}`;
        }
      }
    }
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    const targetScore =
      sections.length > 0
        ? Math.round(sections.reduce((a, s) => a + (sectionTargets[s.id] ?? s.defaultTargetScore), 0) / sections.length)
        : 0;

    const goal: UserTestGoal = {
      id: test ? `goal_${test.id}_${Date.now().toString(36)}` : `goal_custom_${Date.now().toString(36)}`,
      testId: test?.id ?? 'custom',
      testName: test ? (ar ? test.nameAr : test.nameEn) : customName.trim(),
      testDate,
      targetScore,
      currentBaselineScore: scoreUnknown || !test ? (test?.minScore ?? 0) : Number(currentScore),
      sectionTargets: test ? { ...sectionTargets } : {},
      weeklyHours: Math.max(1, Math.round(weeklyPomodoros / 2)),
      weeklyPomodoros,
      completedPomodoros: 0,
      scoresHistory: [],
    };
    onSave(goal);
  };

  const inputStyle = {
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
    borderColor: 'var(--md-sys-color-outline-variant)',
    color: 'var(--md-sys-color-on-surface)',
  };
  const labelStyle = { color: 'var(--md-sys-color-on-surface-variant)' };

  return (
    <MdDialog open onClose={onClose} label={ar ? 'إعداد هدف اختبار' : 'Set up test goal'}>
      <div className="w-[36rem] max-w-[calc(100vw-2rem)] p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {test ? (ar ? test.nameAr : test.nameEn) : ar ? 'اختبار مخصص' : 'Custom test'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            aria-label={ar ? 'إغلاق' : 'Close'}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {!test && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={labelStyle}>
                {ar ? 'اسم الاختبار' : 'Test name'}
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={ar ? 'مثال: اختبار الجامعة الداخلي' : 'e.g. University internal exam'}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={labelStyle}>
                {ar ? 'تاريخ الاختبار' : 'Test date'}
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={labelStyle}>
                {ar ? 'جلسات في الأسبوع' : 'Sessions per week'}
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={weeklyPomodoros}
                onChange={(e) => setWeeklyPomodoros(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {test && (
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                <input
                  type="checkbox"
                  checked={scoreUnknown}
                  onChange={(e) => setScoreUnknown(e.target.checked)}
                  className="w-4 h-4 accent-[var(--md-sys-color-primary)]"
                />
                {ar ? 'لا أعرف درجتي الحالية بعد' : "I don't know my score yet"}
              </label>
              {!scoreUnknown && (
                <div className="mt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={labelStyle}>
                    {ar ? `الدرجة الحالية (${test.minScore}–${test.maxScore})` : `Current score (${test.minScore}–${test.maxScore})`}
                  </label>
                  <input
                    type="number"
                    min={test.minScore}
                    max={test.maxScore}
                    value={currentScore}
                    onChange={(e) => setCurrentScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          )}

          {sections.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
                {ar ? 'الهدف لكل قسم' : 'Target per section'}
              </h4>
              <div className="space-y-2">
                {sections.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm flex-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {ar ? s.nameAr : s.nameEn}
                      <span className="text-[10px] ms-1" style={labelStyle}>({s.minScore}–{s.maxScore})</span>
                    </span>
                    <input
                      type="number"
                      min={s.minScore}
                      max={s.maxScore}
                      value={sectionTargets[s.id] ?? s.defaultTargetScore}
                      onChange={(e) =>
                        setSectionTargets((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                      }
                      className="w-24 px-3 py-1.5 rounded-lg border text-sm outline-none text-center"
                      style={inputStyle}
                      aria-label={ar ? s.nameAr : s.nameEn}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-error)' }} role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {onAiConsult ? (
              <button
                type="button"
                onClick={onAiConsult}
                disabled={aiAvailable === false}
                className="text-xs font-semibold px-3 py-2 rounded-xl border cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                style={{ borderColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-primary)' }}
              >
                <MaterialIcon name="psychology" size={14} />
                <span>{ar ? 'استشارة ذكية (اختياري)' : 'AI consult (optional)'}</span>
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
              >
                {ar ? 'حفظ الهدف' : 'Save goal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MdDialog>
  );
};
