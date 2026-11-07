import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS, getCategoryLabel, getCadenceLabel } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';

export const PlanView: React.FC = () => {
  const { locale, tasks, setActiveTaskId, setActiveTab } = useAppStore();
  const t = TRANSLATIONS[locale];

  const categories = [
    { id: 'Standardized Tests', name: t.categories.standardizedTests, icon: 'school', count: tasks.filter((x) => x.category === 'Standardized Tests').length },
    { id: 'Study', name: t.categories.study, icon: 'menu_book', count: tasks.filter((x) => x.category === 'Study').length },
    { id: 'School', name: t.categories.school, icon: 'history_edu', count: tasks.filter((x) => x.category === 'School').length },
    { id: 'Work', name: t.categories.work, icon: 'work', count: tasks.filter((x) => x.category === 'Work').length },
    { id: 'Extracurriculars', name: t.categories.extracurriculars, icon: 'sports_score', count: tasks.filter((x) => x.category === 'Extracurriculars').length },
    { id: 'Personal', name: t.categories.personal, icon: 'self_improvement', count: tasks.filter((x) => x.category === 'Personal').length },
  ];

  const startTaskInTimer = (taskId: string) => {
    setActiveTaskId(taskId);
    setActiveTab('focus');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold font-display"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.nav.plan}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {locale === 'ar'
            ? 'تنظيم المهام والموضوعات الدراسية مع تحديد أهداف الجلسات والتكرارات.'
            : 'Structured study cadences, categories, and min/max session thresholds.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-8">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 rounded-2xl border transition-all"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <MaterialIcon name={cat.icon} size={22} />
            </div>
            <div
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {cat.name}
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {cat.count} {cat.count === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-3xl p-6 border mb-8"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-bold"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {locale === 'ar' ? 'أهداف التكرار الأسبوعية واليومية' : 'Repetition Goals & Session Thresholds'}
          </h2>
          <button
            onClick={() => setActiveTab('focus')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
            style={{
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            {locale === 'ar' ? 'إدارة المهام في المؤقت' : 'Manage in Focus Timer'}
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="min-w-0 flex-1 text-start">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--md-sys-color-on-surface)' }}
                >
                  {task.title}
                </div>
                <div
                  className="flex items-center gap-2 text-xs mt-1 min-w-0"
                  style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <span className="font-medium shrink-0">{getCategoryLabel(t, task.category)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getCadenceLabel(t, task.cadence)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">
                    {t.tasks.minGoal}: {task.minGoal} / {t.tasks.maxGoal}: {task.maxGoal}
                  </span>
                </div>
              </div>

              <button
                onClick={() => startTaskInTimer(task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-transform active:scale-95"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                <MaterialIcon name="play_arrow" size={16} filled />
                <span>{locale === 'ar' ? 'بدء التركيز' : 'Focus'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
