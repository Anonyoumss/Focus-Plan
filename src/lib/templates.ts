/**
 * Task templates: reusable task blueprints, including whole-list
 * templates. Pure helpers; framework-free.
 */
import type { TaskItem } from '../store/useAppStore';

export type TemplateKind = 'task' | 'list';

export interface TaskTemplate {
  id: string;
  /** Display name; also written as `title` for rules compatibility. */
  title: string;
  kind: TemplateKind;
  /** For kind='task': the single blueprint. For 'list': all items. */
  items: Omit<TaskItem, 'id' | 'createdAt' | 'completedSessions' | 'isCompleted'>[];
  createdAt: number;
  // Firestore rules for users/{uid}/templates require these fields.
  category: string;
  cadence: TaskItem['cadence'];
  minGoal: number;
  maxGoal: number;
}

const CADENCES = new Set(['hourly', 'daily', 'weekly', 'monthly']);

export function isValidTaskBlueprint(v: unknown): v is TaskTemplate['items'][number] {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.title === 'string' && o.title.length > 0 && o.title.length <= 200 &&
    typeof o.category === 'string' && o.category.length <= 100 &&
    typeof o.cadence === 'string' && CADENCES.has(o.cadence) &&
    typeof o.minGoal === 'number' && o.minGoal >= 0 && o.minGoal <= 10000 &&
    typeof o.maxGoal === 'number' && o.maxGoal >= o.minGoal && o.maxGoal <= 10000 &&
    typeof o.estimatedSessions === 'number' && o.estimatedSessions >= 0 && o.estimatedSessions <= 10000 &&
    (o.notes === undefined || (typeof o.notes === 'string' && o.notes.length <= 2000))
  );
}

export function validateTemplate(v: unknown): v is TaskTemplate {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' && o.id.length <= 80 &&
    typeof o.title === 'string' && o.title.length > 0 && o.title.length <= 200 &&
    (o.kind === 'task' || o.kind === 'list') &&
    Array.isArray(o.items) && o.items.length > 0 && o.items.length <= 100 &&
    o.items.every(isValidTaskBlueprint) &&
    typeof o.createdAt === 'number'
  );
}

/** Convert a live task into a blueprint (drops runtime fields). */
export function toBlueprint(task: TaskItem): TaskTemplate['items'][number] {
  return {
    title: task.title,
    category: task.category,
    estimatedSessions: task.estimatedSessions,
    minGoal: task.minGoal,
    maxGoal: task.maxGoal,
    cadence: task.cadence,
    notes: task.notes,
  };
}

/** Materialize blueprints into new TaskItems with fresh ids. */
export function applyTemplate(
  template: TaskTemplate,
  genId: () => string,
  now: number = Date.now(),
): Omit<TaskItem, never>[] {
  return template.items.map((b) => ({
    ...b,
    id: genId(),
    completedSessions: 0,
    isCompleted: false,
    createdAt: now,
  }));
}
