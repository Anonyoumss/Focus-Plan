import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { TEST_CATALOG, StandardizedTestDefinition, UserTestGoal } from '../../data/tests/catalog';
import { MaterialIcon } from '../common/MaterialIcon';
import { ScoreLoopModal } from './ScoreLoopModal';

export const TestsView: React.FC = () => {
  const { locale, testGoals, addTestGoal, deleteTestGoal } = useAppStore();
  const t = TRANSLATIONS[locale];

  const [activeScoreLoopGoal, setActiveScoreLoopGoal] = useState<UserTestGoal | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'saudi' | 'international'>('all');

  const filteredCatalog = TEST_CATALOG.filter((test) => {
    if (activeFilter === 'saudi') return test.category === 'saudi';
    if (activeFilter === 'international') return test.category === 'international';
    return true;
  });

  const adoptTestGoal = (test: StandardizedTestDefinition) => {
    const existing = testGoals.find((g) => g.testId === test.id);
    if (existing) {
      alert(locale === 'ar' ? 'هذا الاختبار مضاف بالفعل في قائمة أهدافك.' : 'This exam is already in your active goals.');
      return;
    }

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + test.typicalPrepWeeks * 7);
    const dateStr = defaultDate.toISOString().split('T')[0];

    const sectionTargets: Record<string, number> = {};
    test.sections.forEach((s) => {
      sectionTargets[s.id] = s.defaultTargetScore;
    });

    const newGoal: UserTestGoal = {
      id: `goal_${test.id}`,
      testId: test.id,
      testName: locale === 'ar' ? test.nameAr : test.nameEn,
      testDate: dateStr,
      targetScore: test.sections.reduce((acc, s) => acc + s.defaultTargetScore, 0) / test.sections.length,
      currentBaselineScore: Math.round(test.minScore + (test.maxScore - test.minScore) * 0.7),
      sectionTargets,
      weeklyHours: 10,
      weeklyPomodoros: 20,
      completedPomodoros: 0,
      scoresHistory: [],
    };

    addTestGoal(newGoal);
  };

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
                          style={{ color: 'var(--md-sys-color-outline)' }}
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

                      <div
                        className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                        style={{
                          backgroundColor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                        }}
                      >
                        {daysLeft} {t.tests.daysRemaining}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs my-3 tabular-nums">
                      <div>
                        <span style={{ color: 'var(--md-sys-color-outline)' }}>{t.tests.currentScore}: </span>
                        <span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                          {goal.currentBaselineScore}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-outline)' }}>{t.tests.targetScore}: </span>
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

                    {definition && (
                      <div className="space-y-1.5 mb-4">
                        {definition.sections.map((sec) => (
                          <div key={sec.id} className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {locale === 'ar' ? sec.nameAr : sec.nameEn}
                            </span>
                            <span className="font-semibold tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {sec.defaultTargetScore}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <button
                      onClick={() => setActiveScoreLoopGoal(goal)}
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

          <div
            className="flex items-center p-0.5 rounded-lg border text-xs"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor: activeFilter === 'all' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeFilter === 'all' ? 'var(--md-sys-color-on-primary)' : 'inherit',
              }}
            >
              {locale === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setActiveFilter('saudi')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'saudi' ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor: activeFilter === 'saudi' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeFilter === 'saudi' ? 'var(--md-sys-color-on-primary)' : 'inherit',
              }}
            >
              {locale === 'ar' ? 'السعودية' : 'Saudi'}
            </button>
            <button
              onClick={() => setActiveFilter('international')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'international' ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor: activeFilter === 'international' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: activeFilter === 'international' ? 'var(--md-sys-color-on-primary)' : 'inherit',
              }}
            >
              {locale === 'ar' ? 'الدولية' : 'Global'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCatalog.map((test) => {
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
                        color: 'var(--md-sys-color-outline)',
                      }}
                    >
                      {test.code}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--md-sys-color-outline)' }}>
                      {test.sections.length} {t.tests.sections}
                    </span>
                  </div>

                  <h3
                    className="text-sm font-bold mb-1"
                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                  >
                    {locale === 'ar' ? test.nameAr : test.nameEn}
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
                              style={{ color: 'var(--md-sys-color-outline)' }}
                            >
                              <span>{fieldLabel}</span>
                              <MaterialIcon name="open_in_new" size={10} />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
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
        </div>
      </div>

      {activeScoreLoopGoal && (
        <ScoreLoopModal
          goal={activeScoreLoopGoal}
          onClose={() => setActiveScoreLoopGoal(null)}
        />
      )}
    </div>
  );
};
