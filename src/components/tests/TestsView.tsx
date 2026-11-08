import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { TEST_CATALOG, StandardizedTestDefinition, UserTestGoal } from '../../data/tests/catalog';
import { MaterialIcon } from '../common/MaterialIcon';
import { ScoreLoopModal } from './ScoreLoopModal';
import { EditSectionsModal } from './EditSectionsModal';
import { resolveGoalSections } from '../../lib/testSections';
import { AiIntakeConsultModal } from './AiIntakeConsultModal';
import { AiStudyPlanModal } from './AiStudyPlanModal';
import { AiPostTestAnalysisModal } from './AiPostTestAnalysisModal';
import { checkGeminiStatus } from '../../lib/ai/geminiClient';
import { TestIntakeModal } from './TestIntakeModal';

export const TestsView: React.FC = () => {
  const { locale, testGoals, addTestGoal, deleteTestGoal, updateTestGoal } = useAppStore();
  const t = TRANSLATIONS[locale];

  const [activeScoreLoopGoal, setActiveScoreLoopGoal] = useState<{ goal: UserTestGoal; autoLog: boolean } | null>(null);
  const [editingSectionsGoal, setEditingSectionsGoal] = useState<UserTestGoal | null>(null);
  const [search, setSearch] = useState('');
  const [intake, setIntake] = useState<{ test: StandardizedTestDefinition | null } | null>(null);
  const [aiConsultTest, setAiConsultTest] = useState<{ test: StandardizedTestDefinition; existingGoal?: UserTestGoal } | null>(null);
  const [aiStudyPlanGoal, setAiStudyPlanGoal] = useState<UserTestGoal | null>(null);
  const [aiPostTestGoal, setAiPostTestGoal] = useState<UserTestGoal | null>(null);
  // AI proxy availability: when the endpoint is unreachable or unconfigured,
  // AI buttons disable and any opened modal shows the offline estimate.
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void checkGeminiStatus().then((s) => { if (alive) setAiAvailable(s.available); });
    return () => { alive = false; };
  }, []);

  const visibleCatalog = TEST_CATALOG.filter((test) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      test.nameEn,
      test.nameAr,
      test.code,
      test.descriptionEn,
      test.descriptionAr,
      test.officialPortal,
      ...test.sections.flatMap((s) => [s.nameEn, s.nameAr]),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const adoptTestGoal = (test: StandardizedTestDefinition) => {
    const existing = testGoals.find((g) => g.testId === test.id);
    if (existing) {
      alert(locale === 'ar' ? 'هذا الاختبار مضاف بالفعل في قائمة أهدافك.' : 'This exam is already in your active goals.');
      return;
    }
    setIntake({ test });
  };

  const isTestDatePassed = (g: UserTestGoal) =>
    new Date(g.testDate).getTime() < new Date().getTime() &&
    !g.scoresHistory.some((s) => s.date >= g.testDate);

  const calculateDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.tests.title}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {locale === 'ar'
            ? 'خطط تحضيرية للاختبارات السعودية (القدرات والتحصيلي وSTEP) والدولية (SAT وIELTS وTOEFL).'
            : 'Section benchmarks, countdowns, and score progression for Saudi and International admissions tests.'}
        </p>

        <div
          className="mt-4 p-3.5 rounded-2xl border flex items-start gap-3 text-xs"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <MaterialIcon name="info" size={18} style={{ color: 'var(--md-sys-color-primary)' }} className="shrink-0 mt-0.5" />
          <span>{t.tests.verifyNotice}</span>
        </div>
      </div>

      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.tests.myGoals}
        </h2>

        {testGoals.length === 0 ? (
          <div
            className="p-8 rounded-2xl border border-dashed text-center"
            style={{
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <MaterialIcon name="school" size={32} className="opacity-50 mb-2" />
            <p className="text-sm">
              {locale === 'ar' ? 'لم تختر اختباراً مستهدفاً بعد. اختر من الدليل أدناه.' : 'No active test goals yet. Pick from the catalog below.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testGoals.map((goal) => {
              const daysLeft = calculateDaysRemaining(goal.testDate);
              const definition = TEST_CATALOG.find((x) => x.id === goal.testId);
              const goalSections = resolveGoalSections(goal, definition);

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl border flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="truncate">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                        >
                          {definition?.code || 'EXAM'}
                        </span>
                        <h3
                          className="text-base font-bold truncate"
                          style={{ color: 'var(--md-sys-color-on-surface)' }}
                        >
                          {goal.testName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="date"
                          value={goal.testDate}
                          onChange={(e) => e.target.value && updateTestGoal(goal.id, { testDate: e.target.value })}
                          aria-label={t.tests.testDate}
                          className="text-[11px] px-1.5 py-0.5 rounded border outline-none"
                          style={{
                            backgroundColor: 'var(--md-sys-color-surface-container)',
                            borderColor: 'var(--md-sys-color-outline-variant)',
                            color: 'var(--md-sys-color-on-surface)',
                          }}
                        />
                        <div
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--md-sys-color-primary-container)',
                            color: 'var(--md-sys-color-on-primary-container)',
                          }}
                        >
                          {daysLeft} {t.tests.daysRemaining}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs my-3 tabular-nums">
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{t.tests.currentScore}: </span>
                        <span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {goal.currentBaselineScore}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{t.tests.targetScore}: </span>
                        <span className="font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>
                          {goal.targetScore}
                        </span>
                      </div>
                    </div>

                    <div
                      className="w-full h-2 rounded-full overflow-hidden mb-4"
                      style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((goal.currentBaselineScore / (goal.targetScore || 1)) * 100))}%`,
                          backgroundColor: 'var(--md-sys-color-primary)',
                        }}
                      />
                    </div>

                    {goalSections.length > 0 && (
                      <div className="space-y-1.5 mb-4">
                        {goalSections.map((sec) => (
                          <div key={sec.id} className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {locale === 'ar' ? sec.nameAr : sec.nameEn}
                              {sec.minScore !== undefined && (
                                <span className="ms-1 text-[10px]" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                  ({sec.minScore}-{sec.maxScore})
                                </span>
                              )}
                            </span>
                            <span className="font-semibold tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {goal.sectionTargets[sec.id] ?? sec.defaultTargetScore}
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => setEditingSectionsGoal(goal)}
                          className="text-[11px] font-semibold flex items-center gap-1 cursor-pointer mt-1"
                          style={{ color: 'var(--md-sys-color-primary)' }}
                        >
                          <MaterialIcon name="edit" size={13} />
                          <span>{locale === 'ar' ? 'تحرير الأقسام' : 'Edit sections'}</span>
                          {goal.customSections && goal.customSections.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                              {locale === 'ar' ? 'مخصص' : 'custom'}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isTestDatePassed(goal) &&
                    !goal.scoresHistory.some((s) => s.date >= goal.testDate) && (
                      <button
                        onClick={() => setActiveScoreLoopGoal({ goal, autoLog: true })}
                        className="w-full mb-3 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: 'var(--md-sys-color-tertiary-container)',
                          color: 'var(--md-sys-color-on-tertiary-container)',
                        }}
                      >
                        <MaterialIcon name="assignment_turned_in" size={15} />
                        <span>{locale === 'ar' ? 'سجّل درجتك بعد الاختبار' : 'Log your score: test date passed'}</span>
                      </button>
                    )}

                  <div className="flex flex-wrap items-center gap-1.5 my-3 pt-2 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <button
                      disabled={aiAvailable === false}
                      onClick={() => setAiStudyPlanGoal(goal)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: 'var(--md-sys-color-secondary)',
                        color: 'var(--md-sys-color-secondary)',
                      }}
                      title={locale === 'ar' ? 'توليد جدول مهام أسبوعية بالذكاء الاصطناعي' : 'Generate weekly study tasks'}
                    >
                      <MaterialIcon name="date_range" size={14} />
                      <span>{locale === 'ar' ? 'خطة المهام' : 'Study Plan'}</span>
                    </button>

                    <button
                      disabled={aiAvailable === false}
                      onClick={() => setAiPostTestGoal(goal)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: 'var(--md-sys-color-tertiary)',
                        color: 'var(--md-sys-color-tertiary)',
                      }}
                      title={locale === 'ar' ? 'تحليل درجات المحاولات وتعديل الخطة' : 'AI post-test score analysis'}
                    >
                      <MaterialIcon name="troubleshoot" size={14} />
                      <span>{locale === 'ar' ? 'تحليل ذكي' : 'AI Analysis'}</span>
                    </button>

                    {definition && (
                      <button
                        disabled={aiAvailable === false}
                        onClick={() => setAiConsultTest({ test: definition, existingGoal: goal })}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          borderColor: 'var(--md-sys-color-primary)',
                          color: 'var(--md-sys-color-primary)',
                        }}
                        title={locale === 'ar' ? 'استشارة الذكاء الاصطناعي لتعديل المستهدفات' : 'AI intake consultation'}
                      >
                        <MaterialIcon name="psychology" size={14} />
                        <span>{locale === 'ar' ? 'استشارة الأهداف' : 'AI Consult'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <button
                      onClick={() => setActiveScoreLoopGoal({ goal, autoLog: false })}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        borderColor: 'var(--md-sys-color-primary)',
                        color: 'var(--md-sys-color-primary)',
                      }}
                    >
                      <MaterialIcon name="analytics" size={15} />
                      <span>{t.scoreLoop.title}</span>
                    </button>

                    <button
                      onClick={() => deleteTestGoal(goal.id)}
                      className="text-xs hover:underline cursor-pointer"
                      style={{ color: 'var(--md-sys-color-error)' }}
                    >
                      {t.tasks.delete}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.tests.catalogTitle}
          </h2>

          <div className="relative w-full sm:w-72">
            <MaterialIcon
              name="search"
              size={18}
              className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
              ariaLabel={undefined}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'ابحث بالاسم أو القسم أو الجهة' : 'Search name, section or provider'}
              aria-label={locale === 'ar' ? 'بحث في الاختبارات' : 'Search tests'}
              className="w-full ps-9 pe-3 py-2 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleCatalog.map((test) => {
            const isAlreadyAdded = testGoals.some((g) => g.testId === test.id);
            return (
              <div
                key={test.id}
                className="p-4 rounded-2xl border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                        color: 'var(--md-sys-color-on-surface-variant)',
                      }}
                    >
                      {test.code}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {test.sections.length} {t.tests.sections}
                    </span>
                  </div>

                  <h3
                    className="text-sm font-bold mb-1"
                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                  >
                    <span className="flex items-baseline gap-2">
                      {locale === 'ar' ? test.nameAr : test.nameEn}
                      {(locale === 'ar' ? test.subtitleAr : test.subtitleEn) && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                        >
                          {locale === 'ar' ? test.subtitleAr : test.subtitleEn}
                        </span>
                      )}
                    </span>
                  </h3>

                  <p
                    className="text-xs mb-3 line-clamp-2"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    {locale === 'ar' ? test.descriptionAr : test.descriptionEn}
                  </p>
                </div>

                  <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={test.officialPortal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline flex items-center gap-1"
                        style={{ color: 'var(--md-sys-color-primary)' }}
                      >
                        <span>{locale === 'ar' ? 'الموقع الرسمي' : 'Official Portal'}</span>
                        <MaterialIcon name="open_in_new" size={14} />
                      </a>

                      {test.unverifiedFields.length > 0 && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{
                            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface-variant)',
                          }}
                          title={test.unverifiedFields.join(', ')}
                        >
                          <MaterialIcon name="help" size={12} />
                          <span>{t.tests.verifyOnOfficialSite}</span>
                        </span>
                      )}
                    </div>

                    {/* Per-field official source links where confirmed */}
                    {Object.entries(test.sourceUrls).length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {(['scoreScale', 'sections', 'dates'] as const).map((field) => {
                          const url = test.sourceUrls[field];
                          if (!url) return null;
                          const fieldLabel =
                            field === 'scoreScale'
                              ? t.tests.scoreScale
                              : field === 'sections'
                              ? t.tests.sections
                              : t.tests.testDate;
                          return (
                            <a
                              key={field}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] hover:underline flex items-center gap-0.5"
                              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                            >
                              <span>{fieldLabel}</span>
                              <MaterialIcon name="open_in_new" size={10} />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        disabled={aiAvailable === false}
                        onClick={() => setAiConsultTest({ test })}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          borderColor: 'var(--md-sys-color-primary)',
                          color: 'var(--md-sys-color-primary)',
                        }}
                        title={locale === 'ar' ? 'استشارة ذكية لتحديد أهدافك' : 'AI Intake Consult'}
                      >
                        <MaterialIcon name="psychology" size={14} />
                        <span>{locale === 'ar' ? 'استشارة ذكية' : 'AI Consult'}</span>
                      </button>

                      <button
                        disabled={isAlreadyAdded}
                        onClick={() => adoptTestGoal(test)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                        style={{
                          backgroundColor: isAlreadyAdded ? 'transparent' : 'var(--md-sys-color-primary)',
                          color: isAlreadyAdded ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-on-primary)',
                          border: isAlreadyAdded ? '1px solid var(--md-sys-color-outline-variant)' : 'none',
                        }}
                      >
                        {isAlreadyAdded ? (locale === 'ar' ? 'مضاف' : 'Added') : (locale === 'ar' ? '+ إضافة هدف' : '+ Add Goal')}
                      </button>
                    </div>
                  </div>
                </div>
            );
          })}

          <button
            onClick={() => setIntake({ test: null })}
            className="p-4 rounded-2xl border border-dashed text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 min-h-[120px]"
            style={{
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <MaterialIcon name="add" size={16} />
            <span>{locale === 'ar' ? '+ اختبار مخصص' : '+ Custom test'}</span>
          </button>
        </div>
      </div>

      {activeScoreLoopGoal && (
        <ScoreLoopModal
          goal={activeScoreLoopGoal.goal}
          autoLog={activeScoreLoopGoal.autoLog}
          onClose={() => setActiveScoreLoopGoal(null)}
        />
      )}

      {editingSectionsGoal && (
        <EditSectionsModal
          goal={editingSectionsGoal}
          definition={TEST_CATALOG.find((x) => x.id === editingSectionsGoal.testId)}
          onClose={() => setEditingSectionsGoal(null)}
        />
      )}

      {intake && (
        <TestIntakeModal
          test={intake.test}
          locale={locale}
          aiAvailable={aiAvailable ?? undefined}
          onClose={() => setIntake(null)}
          onSave={(goal) => {
            addTestGoal(goal);
            setIntake(null);
          }}
          onAiConsult={
            intake.test
              ? () => {
                  setAiConsultTest({ test: intake.test! });
                  setIntake(null);
                }
              : undefined
          }
        />
      )}

      {aiConsultTest && (
        <AiIntakeConsultModal
          test={aiConsultTest.test}
          existingGoal={aiConsultTest.existingGoal}
          onClose={() => setAiConsultTest(null)}
          onApply={(savedGoal) => {
            const exists = testGoals.find((g) => g.id === savedGoal.id);
            if (exists) {
              updateTestGoal(savedGoal.id, savedGoal);
            } else {
              addTestGoal(savedGoal);
            }
          }}
        />
      )}

      {aiStudyPlanGoal && (
        <AiStudyPlanModal
          goal={aiStudyPlanGoal}
          onClose={() => setAiStudyPlanGoal(null)}
        />
      )}

      {aiPostTestGoal && (
        <AiPostTestAnalysisModal
          goal={aiPostTestGoal}
          onClose={() => setAiPostTestGoal(null)}
        />
      )}
    </div>
  );
};
