import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore, TaskItem } from '../../store/useAppStore';
import { TRANSLATIONS, getCategoryLabel } from '../../i18n/translations';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdDialog } from '../common/MdControls';

export const TaskList: React.FC = () => {
  const {
    locale,
    tasks,
    activeTaskId,
    setActiveTaskId,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskDone,
    clearDoneTasks,
    moveTask,
  } = useAppStore();

  const t = TRANSLATIONS[locale];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Standardized Tests');
  const [estimatedSessions, setEstimatedSessions] = useState(4);
  const [minGoal, setMinGoal] = useState(2);
  const [maxGoal, setMaxGoal] = useState(6);
  const [cadence, setCadence] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [notes, setNotes] = useState('');

  const openNewTaskModal = useCallback(() => {
    setEditingTaskId(null);
    setTitle('');
    setCategory('Standardized Tests');
    setEstimatedSessions(4);
    setMinGoal(2);
    setMaxGoal(6);
    setCadence('daily');
    setNotes('');
    setIsModalOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 250);
  }, []);

  // N shortcut opens the new-task modal (dispatched by Shell)
  useEffect(() => {
    const handler = () => openNewTaskModal();
    window.addEventListener('focus-plan:new-task', handler);
    return () => window.removeEventListener('focus-plan:new-task', handler);
  }, [openNewTaskModal]);

  const openEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setCategory(task.category);
    setEstimatedSessions(task.estimatedSessions);
    setMinGoal(task.minGoal);
    setMaxGoal(task.maxGoal);
    setCadence(task.cadence);
    setNotes(task.notes);
    setIsModalOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 250);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, task: TaskItem, index: number) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      moveTask(task.id, index - 1);
    } else if (e.key === 'ArrowDown' && index < tasks.length - 1) {
      e.preventDefault();
      moveTask(task.id, index + 1);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: title.trim(),
        category,
        estimatedSessions,
        minGoal,
        maxGoal,
        cadence,
        notes: notes.trim(),
      });
    } else {
      addTask({
        title: title.trim(),
        category,
        estimatedSessions,
        minGoal,
        maxGoal,
        cadence,
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.tasks.title}
          </h2>
          <span
            className="text-xs"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {tasks.filter((x) => !x.isCompleted).length} active · {tasks.filter((x) => x.isCompleted).length} done
          </span>
          {tasks.length > 1 && (
            <span
              className="block text-[10px] mt-0.5"
              style={{ color: 'var(--md-sys-color-outline)' }}
            >
              {t.tasks.reorderHint}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tasks.some((t) => t.isCompleted) && (
            <button
              onClick={clearDoneTasks}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {t.tasks.clearDone}
            </button>
          )}

          <button
            onClick={openNewTaskModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            <MaterialIcon name="add" size={16} />
            <span>{t.tasks.addTask}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div
            className="text-center py-10 px-4 rounded-2xl border border-dashed"
            style={{
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <MaterialIcon name="checklist" size={32} className="mb-2 opacity-60" />
            <p className="text-sm font-medium">{t.tasks.noTasks}</p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const isSelected = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                data-task-row={task.id}
                onClick={() => setActiveTaskId(task.id)}
                onKeyDown={(e) => handleRowKeyDown(e, task, index)}
                draggable
                onDragStart={(e) => {
                  setDraggedTaskId(task.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', task.id);
                }}
                onDragEnd={() => {
                  setDraggedTaskId(null);
                  setDragOverTaskId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverTaskId(task.id);
                }}
                onDragLeave={() => setDragOverTaskId((cur) => (cur === task.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedTaskId && draggedTaskId !== task.id) {
                    moveTask(draggedTaskId, index);
                  }
                  setDraggedTaskId(null);
                  setDragOverTaskId(null);
                }}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? 'ring-2' : ''
                } ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                style={{
                  backgroundColor: isSelected
                    ? 'var(--md-sys-color-surface-container-high)'
                    : 'var(--md-sys-color-surface-container-low)',
                  borderColor: dragOverTaskId === task.id
                    ? 'var(--md-sys-color-primary)'
                    : isSelected
                    ? 'var(--md-sys-color-primary)'
                    : 'var(--md-sys-color-outline-variant)',
                  boxShadow: isSelected ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                }}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <MaterialIcon
                    name="drag_indicator"
                    size={18}
                    className="mt-1 shrink-0 cursor-grab opacity-50"
                    ariaLabel={t.tasks.reorderHint}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskDone(task.id);
                    }}
                    className="mt-0.5 transition-colors cursor-pointer shrink-0"
                    style={{
                      color: task.isCompleted
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline)',
                    }}
                    aria-label={t.tasks.markDone}
                  >
                    <MaterialIcon
                      name={task.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                      size={20}
                      filled={task.isCompleted}
                      style={{
                        color: task.isCompleted
                          ? 'var(--md-sys-color-primary)'
                          : 'var(--md-sys-color-outline)',
                      }}
                    />
                  </button>

                  <div className="min-w-0 flex-1 text-start">
                    <div
                      className={`text-sm font-semibold truncate ${
                        task.isCompleted ? 'line-through opacity-50' : ''
                      }`}
                      style={{ color: 'var(--md-sys-color-on-surface)' }}
                    >
                      {task.title}
                    </div>

                    <div
                      className="flex items-center gap-2 text-xs mt-1 min-w-0"
                      style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    >
                      <span className="shrink-0">{getCategoryLabel(t, task.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">
                        {task.completedSessions}/{task.estimatedSessions} {t.timer.sessionNumber.toLowerCase()}s
                      </span>
                      {task.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate min-w-0">{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => moveTask(task.id, Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="p-1 rounded transition-colors cursor-pointer disabled:opacity-30"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    title={t.tasks.moveUp}
                    aria-label={t.tasks.moveUp}
                  >
                    <MaterialIcon name="keyboard_arrow_up" size={18} />
                  </button>
                  <button
                    onClick={() => moveTask(task.id, Math.min(tasks.length - 1, index + 1))}
                    disabled={index === tasks.length - 1}
                    className="p-1 rounded transition-colors cursor-pointer disabled:opacity-30"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    title={t.tasks.moveDown}
                    aria-label={t.tasks.moveDown}
                  >
                    <MaterialIcon name="keyboard_arrow_down" size={18} />
                  </button>
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1 rounded transition-colors cursor-pointer"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    title={t.tasks.editTask}
                    aria-label={t.tasks.editTask}
                  >
                    <MaterialIcon name="edit" size={18} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded transition-colors cursor-pointer"
                    style={{ color: 'var(--md-sys-color-error)' }}
                    title={t.tasks.delete}
                    aria-label={t.tasks.delete}
                  >
                    <MaterialIcon name="delete" size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MdDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        label={editingTaskId ? t.tasks.editTask : t.tasks.addTask}
      >
        <div className="w-[34rem] max-w-[calc(100vw-2rem)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {editingTaskId ? t.tasks.editTask : t.tasks.addTask}
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--md-sys-color-outline)' }}
                >
                  {t.tasks.taskName}
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GAT Math Geometry Drills"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--md-sys-color-outline)' }}
                  >
                    {t.tasks.category}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  >
                    <option value="Standardized Tests">{t.categories.standardizedTests}</option>
                    <option value="Study">{t.categories.study}</option>
                    <option value="School">{t.categories.school}</option>
                    <option value="Work">{t.categories.work}</option>
                    <option value="Extracurriculars">{t.categories.extracurriculars}</option>
                    <option value="Personal">{t.categories.personal}</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--md-sys-color-outline)' }}
                  >
                    {t.tasks.cadence}
                  </label>
                  <select
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  >
                    <option value="hourly">{t.tasks.cadenceHourly}</option>
                    <option value="daily">{t.tasks.cadenceDaily}</option>
                    <option value="weekly">{t.tasks.cadenceWeekly}</option>
                    <option value="monthly">{t.tasks.cadenceMonthly}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--md-sys-color-outline)' }}
                  >
                    {t.tasks.estimatedPomodoros}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={estimatedSessions}
                    onChange={(e) => setEstimatedSessions(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border text-sm text-center outline-none tabular-nums"
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--md-sys-color-outline)' }}
                  >
                    {t.tasks.minGoal}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={minGoal}
                    onChange={(e) => setMinGoal(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border text-sm text-center outline-none tabular-nums"
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--md-sys-color-outline)' }}
                  >
                    {t.tasks.maxGoal}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={maxGoal}
                    onChange={(e) => setMaxGoal(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border text-sm text-center outline-none tabular-nums"
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--md-sys-color-outline)' }}
                >
                  {t.tasks.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Target chapters, test section IDs, or reference material..."
                  className="w-full px-3.5 py-2 rounded-xl border text-sm outline-none resize-none"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-colors"
                  style={{
                    borderColor: 'var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {t.tasks.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-transform active:scale-98"
                  style={{
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                  }}
                >
                  {t.tasks.save}
                </button>
              </div>
            </form>
        </div>
      </MdDialog>
    </div>
  );
};
