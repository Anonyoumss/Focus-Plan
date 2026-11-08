import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { navigateToAppTab } from '../../lib/router';
import { buildWeekAgenda, buildWeeklyPlan, type AgendaEntry } from '../../lib/planAgenda';

const KIND_ICON: Record<AgendaEntry['kind'], string> = {
  study: 'timer',
  deadline: 'event',
  test: 'quiz',
};

export const PlanView: React.FC = () => {
  const { locale, tasks, testGoals, setActiveTaskId } = useAppStore();
  const t = TRANSLATIONS[locale];
  const ar = locale === 'ar';

  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 200);
    return () => window.clearTimeout(id);
  }, []);

  const days = useMemo(() => buildWeekAgenda(tasks, testGoals, new Date()), [tasks, testGoals]);
  const weeklyPlan = useMemo(() => buildWeeklyPlan(testGoals), [testGoals]);
  const isEmpty = tasks.filter((x) => !x.isCompleted).length === 0 && testGoals.length === 0;

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const weekdayFmt = useMemo(
    () => new Intl.DateTimeFormat(ar ? 'ar-SA' : 'en-US', { weekday: 'short' }),
    [ar],
  );
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(ar ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }),
    [ar],
  );

  const focusTask = (taskId: string) => {
    setActiveTaskId(taskId);
    navigateToAppTab('focus');
  };

  const addTask = () => {
    navigateToAppTab('focus');
    window.setTimeout(() => window.dispatchEvent(new Event('focus-plan:new-task')), 300);
  };

  const entryColors: Record<AgendaEntry['kind'], { bg: string; fg: string }> = {
    study: {
      bg: 'var(--md-sys-color-secondary-container)',
      fg: 'var(--md-sys-color-on-secondary-container)',
    },
    deadline: {
      bg: 'var(--md-sys-color-tertiary-container)',
      fg: 'var(--md-sys-color-on-tertiary-container)',
    },
    test: {
      bg: 'var(--md-sys-color-primary-container)',
      fg: 'var(--md-sys-color-on-primary-container)',
    },
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {t.nav.plan}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {ar
            ? 'أجندة الأسبوع: مواعيد الاختبارات، المواعيد النهائية للمهام، وكتل الدراسة المجدولة.'
            : 'Your week at a glance: test dates, task deadlines, and scheduled study blocks.'}
        </p>
      </div>

      {!revealed ? (
        <div className="space-y-4" aria-hidden="true">
          <SkeletonLoader variant="card" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="!h-40" />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="space-y-6 transition-opacity duration-300"
          style={{ opacity: revealed ? 1 : 0 }}
        >
          {isEmpty ? (
            <div
              className="rounded-3xl border border-dashed p-10 text-center"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
              }}
            >
              <MaterialIcon name="calendar_month" size={40} className="mx-auto mb-3 opacity-60" />
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {ar ? 'لا يوجد شيء مخطط بعد' : 'Nothing planned yet'}
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {ar
                  ? 'أضف مهمة أو هدف اختبار لعرض أجندة أسبوعك وكتل الدراسة.'
                  : 'Add a task or a test goal to see your week agenda and study blocks.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={addTask}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
                >
                  {ar ? 'إضافة مهمة' : 'Add task'}
                </button>
                <button
                  onClick={() => navigateToAppTab('tests')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-primary)' }}
                >
                  {ar ? 'إضافة اختبار' : 'Add test'}
                </button>
                <button
                  onClick={() => navigateToAppTab('focus')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {ar ? 'ضبط التكرار' : 'Set cadence'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Week agenda */}
              <section aria-label={ar ? 'أجندة الأسبوع' : 'Week agenda'}>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, i) => {
                    const d = new Date(`${day.date}T12:00:00`);
                    const isToday = day.date === todayKey;
                    return (
                      <div
                        key={day.date}
                        className="rounded-2xl border p-2 min-h-36 flex flex-col"
                        style={{
                          backgroundColor: isToday
                            ? 'var(--md-sys-color-secondary-container)'
                            : 'var(--md-sys-color-surface-container-low)',
                          borderColor: isToday
                            ? 'var(--md-sys-color-secondary)'
                            : 'var(--md-sys-color-outline-variant)',
                        }}
                      >
                        <div className="text-center pb-2 mb-1 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                          <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {i === 0 ? (ar ? 'اليوم' : 'Today') : weekdayFmt.format(d)}
                          </div>
                          <div className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {dayFmt.format(d)}
                          </div>
                        </div>
                        <div className="space-y-1.5 flex-1">
                          {day.entries.map((entry) => {
                            const colors = entryColors[entry.kind];
                            return (
                              <button
                                key={entry.id}
                                onClick={() => entry.taskId && focusTask(entry.taskId)}
                                disabled={!entry.taskId}
                                className="w-full text-start rounded-lg px-2 py-1.5 text-[11px] leading-tight cursor-pointer disabled:cursor-default transition-transform active:scale-95"
                                style={{ backgroundColor: colors.bg, color: colors.fg }}
                                title={entry.title}
                              >
                                <span className="flex items-center gap-1 font-semibold">
                                  <MaterialIcon name={KIND_ICON[entry.kind]} size={12} />
                                  <span className="truncate flex-1">{entry.title}</span>
                                </span>
                                {entry.detail && (
                                  <span className="block truncate opacity-80">
                                    {entry.kind === 'deadline' && entry.overdue
                                      ? ar ? 'متأخر' : 'overdue'
                                      : entry.detail}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {day.entries.length === 0 && (
                            <div className="text-[10px] text-center opacity-40 pt-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              —
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Weekly plan from test goals */}
              {weeklyPlan.length > 0 && (
                <section aria-label={ar ? 'الخطة الأسبوعية' : 'Weekly plan'}>
                  <h2 className="text-base font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {ar ? 'الخطة الأسبوعية للأهداف' : 'Weekly plan from test goals'}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {weeklyPlan.map((g) => (
                      <div
                        key={g.id}
                        className="rounded-2xl border p-4"
                        style={{
                          backgroundColor: 'var(--md-sys-color-surface-container-low)',
                          borderColor: 'var(--md-sys-color-outline-variant)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {g.testName}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {g.testDate} · {g.daysLeft} {ar ? 'يوم متبقٍ' : g.daysLeft === 1 ? 'day left' : 'days left'}
                            </div>
                          </div>
                          <MaterialIcon name="quiz" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <span>{ar ? 'جلسات هذا الأسبوع' : 'Sessions / week'}</span>
                            <span className="font-semibold tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {g.weeklyPomodoros}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, g.weeklyPomodoros > 0 ? (g.completedPomodoros / Math.max(1, g.weeklyPomodoros * 4)) * 100 : 0)}%`,
                                backgroundColor: 'var(--md-sys-color-primary)',
                              }}
                            />
                          </div>
                          <div className="text-[11px] mt-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {g.currentBaselineScore != null && g.targetScore != null && (
                              <>{ar ? 'الحالي' : 'Current'}: {g.currentBaselineScore} → {ar ? 'المستهدف' : 'Target'}: {g.targetScore} · </>
                            )}
                            {g.completedPomodoros} {ar ? 'جلسة مكتملة' : 'sessions done'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
