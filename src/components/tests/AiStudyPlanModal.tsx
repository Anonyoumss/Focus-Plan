import React, { useState } from 'react';
import { UserTestGoal, TEST_CATALOG } from '../../data/tests/catalog';
import { useAppStore, TaskItem } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import { requestStudyPlan, StudyPlanTaskItem, StudyPlanResult } from '../../lib/ai/geminiClient';
import { resolveGoalSections } from '../../lib/testSections';

interface AiStudyPlanModalProps {
  goal: UserTestGoal;
  onClose: () => void;
}

const WEEKDAYS = [
  { id: 'mon', nameEn: 'Mon', nameAr: 'الإثنين' },
  { id: 'tue', nameEn: 'Tue', nameAr: 'الثلاثاء' },
  { id: 'wed', nameEn: 'Wed', nameAr: 'الأربعاء' },
  { id: 'thu', nameEn: 'Thu', nameAr: 'الخميس' },
  { id: 'fri', nameEn: 'Fri', nameAr: 'الجمعة' },
  { id: 'sat', nameEn: 'Sat', nameAr: 'السبت' },
  { id: 'sun', nameEn: 'Sun', nameAr: 'الأحد' },
] as const;

export const AiStudyPlanModal: React.FC<AiStudyPlanModalProps> = ({ goal, onClose }) => {
  const { locale, addTask } = useAppStore();
  const isAr = locale === 'ar';

  const definition = TEST_CATALOG.find((x) => x.id === goal.testId);
  const sections = resolveGoalSections(goal, definition);

  const [weeklyPomodoros, setWeeklyPomodoros] = useState<number>(goal.weeklyPomodoros || 20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StudyPlanResult | null>(null);
  const [tasks, setTasks] = useState<StudyPlanTaskItem[]>([]);
  const [isSuccessMessage, setIsSuccessMessage] = useState<boolean>(false);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setIsSuccessMessage(false);
    try {
      const sectionPriorities = sections.map((sec) => {
        const target = goal.sectionTargets[sec.id] ?? sec.defaultTargetScore;
        const currentEstimated = goal.currentBaselineScore;
        const gap = Math.max(1, target - currentEstimated);
        return {
          sectionId: sec.id,
          sectionName: isAr ? sec.nameAr : sec.nameEn,
          gap,
        };
      });

      const planRes = await requestStudyPlan({
        testId: goal.testId,
        testName: goal.testName,
        weeklyPomodoroTarget: weeklyPomodoros,
        sectionPriorities,
        locale: isAr ? 'ar' : 'en',
      });

      setResult(planRes);
      setTasks(planRes.tasks);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = (idx: number, updates: Partial<StudyPlanTaskItem>) => {
    setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, ...updates } : t)));
  };

  const handleDeleteTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddNewTask = () => {
    const firstSec = sections[0]?.id || 'general';
    setTasks((prev) => [
      ...prev,
      {
        title: isAr ? 'مهمة دراسية إضافية' : 'Additional Study Task',
        sectionId: firstSec,
        estimatedPomodoros: 2,
        dayOfWeek: 'mon',
      },
    ]);
  };

  const handleAddTasksToStore = () => {
    if (tasks.length === 0) return;

    tasks.forEach((t) => {
      const newTask: TaskItem = {
        id: `task_ai_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        title: t.title,
        category: 'Standardized Tests',
        estimatedSessions: t.estimatedPomodoros,
        completedSessions: 0,
        minGoal: 1,
        maxGoal: Math.max(t.estimatedPomodoros, 4),
        cadence: 'weekly',
        notes: `AI Generated task for ${goal.testName}`,
        isCompleted: false,
        createdAt: Date.now(),
      };
      addTask(newTask);
    });

    setIsSuccessMessage(true);
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
                backgroundColor: 'var(--md-sys-color-secondary-container)',
                color: 'var(--md-sys-color-on-secondary-container)',
              }}
            >
              <MaterialIcon name="date_range" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">
                  {isAr ? `توليد خطة المهام: ${goal.testName}` : `Study Plan: ${goal.testName}`}
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
                  ? 'جدولة مهام أسبوعية لكل قسم وتوزيع جلسات البومودورو على أيام الأسبوع.'
                  : 'Weekly task breakdown per section with pomodoro estimates and schedule.'}
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

        {/* Generator Controls */}
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {isAr ? 'الجلسات الأسبوعية المستهدفة:' : 'Target Weekly Pomodoros:'}
            </label>
            <input
              type="number"
              min={4}
              max={60}
              value={weeklyPomodoros}
              onChange={(e) => setWeeklyPomodoros(Math.max(4, Number(e.target.value)))}
              className="w-20 px-2 py-1 rounded-lg border text-center font-timer font-bold outline-none"
              style={{
                backgroundColor: 'var(--md-sys-color-surface)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-primary)',
              }}
            />
          </div>

          <button
            onClick={handleGeneratePlan}
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
                ? (isAr ? 'جاري إعداد جدول المهام...' : 'Generating Task Schedule...')
                : (isAr ? 'توليد جدول المهام الأسبوعية' : 'Generate Weekly Study Tasks')}
            </span>
          </button>
        </div>

        {/* Task List */}
        {tasks.length > 0 && (
          <div
            className="p-4 rounded-2xl border space-y-3"
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
                <span>{result?.disclaimer || (isAr ? 'مقترح ذكي، يرجى المراجعة' : 'AI suggested, verify')}</span>
              </span>
              <button
                onClick={handleAddNewTask}
                className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
                style={{ color: 'var(--md-sys-color-primary)' }}
              >
                <MaterialIcon name="add" size={16} />
                <span>{isAr ? 'إضافة مهمة' : 'Add task'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border space-y-2 text-xs"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateTask(idx, { title: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border font-medium outline-none"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        borderColor: 'var(--md-sys-color-outline-variant)',
                        color: 'var(--md-sys-color-on-surface)',
                      }}
                    />
                    <button
                      onClick={() => handleDeleteTask(idx)}
                      aria-label={isAr ? 'حذف المهمة' : 'Delete task'}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer shrink-0"
                      style={{ color: 'var(--md-sys-color-error)' }}
                    >
                      <MaterialIcon name="delete" size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {isAr ? 'الجلسات:' : 'Pomodoros:'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={task.estimatedPomodoros}
                        onChange={(e) => handleUpdateTask(idx, { estimatedPomodoros: Math.max(1, Number(e.target.value)) })}
                        className="w-14 px-1.5 py-0.5 rounded border text-center font-timer font-bold"
                        style={{
                          backgroundColor: 'var(--md-sys-color-surface-container)',
                          borderColor: 'var(--md-sys-color-outline-variant)',
                          color: 'var(--md-sys-color-on-surface)',
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {isAr ? 'اليوم:' : 'Day:'}
                      </span>
                      <select
                        value={task.dayOfWeek}
                        onChange={(e) => handleUpdateTask(idx, { dayOfWeek: e.target.value as StudyPlanTaskItem['dayOfWeek'] })}
                        className="px-2 py-1 rounded-lg border outline-none font-medium"
                        style={{
                          backgroundColor: 'var(--md-sys-color-surface-container)',
                          borderColor: 'var(--md-sys-color-outline-variant)',
                          color: 'var(--md-sys-color-on-surface)',
                        }}
                      >
                        {WEEKDAYS.map((w) => (
                          <option key={w.id} value={w.id}>
                            {isAr ? w.nameAr : w.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isSuccessMessage ? (
              <div
                className="p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  borderColor: 'var(--md-sys-color-primary)',
                }}
              >
                <MaterialIcon name="check" size={18} />
                <span>{isAr ? 'تمت إضافة المهام بنجاح إلى جدولك!' : 'Tasks successfully added to Focus Plan!'}</span>
              </div>
            ) : (
              <button
                onClick={handleAddTasksToStore}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mt-3"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                <MaterialIcon name="playlist_add" size={18} />
                <span>{isAr ? `إضافة (${tasks.length}) مهام إلى قائمة مهام التركيز` : `Add (${tasks.length}) Tasks to My Focus Plan`}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
