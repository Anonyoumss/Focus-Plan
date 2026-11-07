import { describe, it, expect } from 'vitest';
import {
  toBlueprint,
  applyTemplate,
  validateTemplate,
  TaskTemplate,
} from '../templates';
import type { TaskItem } from '../../store/useAppStore';

const task = (over: Partial<TaskItem> = {}): TaskItem => ({
  id: 't1',
  title: 'Read chapter 4',
  category: 'Math',
  estimatedSessions: 6,
  completedSessions: 2,
  minGoal: 4,
  maxGoal: 8,
  cadence: 'daily',
  notes: 'focus',
  isCompleted: false,
  createdAt: 1000,
  ...over,
});

const tpl = (items = [toBlueprint(task())]): TaskTemplate => ({
  id: 'tpl_1',
  title: 'My template',
  kind: items.length === 1 ? 'task' : 'list',
  items,
  createdAt: 2000,
  category: 'Templates',
  cadence: 'daily',
  minGoal: 0,
  maxGoal: 0,
});

describe('templates', () => {
  it('toBlueprint drops runtime fields', () => {
    const b = toBlueprint(task());
    expect(b).toEqual({
      title: 'Read chapter 4',
      category: 'Math',
      estimatedSessions: 6,
      minGoal: 4,
      maxGoal: 8,
      cadence: 'daily',
      notes: 'focus',
    });
  });

  it('applyTemplate materializes fresh tasks', () => {
    const out = applyTemplate(tpl(), (() => { let i = 0; return () => `id_${++i}`; })(), 5000);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: 'id_1',
      title: 'Read chapter 4',
      minGoal: 4,
      completedSessions: 0,
      isCompleted: false,
      createdAt: 5000,
    });
  });

  it('applyTemplate expands list templates', () => {
    const t = tpl([toBlueprint(task()), toBlueprint(task({ id: 't2', title: 'B' }))]);
    t.kind = 'list';
    const out = applyTemplate(t, (() => { let i = 0; return () => `x${++i}`; })());
    expect(out.map((o) => o.title)).toEqual(['Read chapter 4', 'B']);
  });

  it('validateTemplate accepts valid and rejects malformed', () => {
    expect(validateTemplate(tpl())).toBe(true);
    expect(validateTemplate(null)).toBe(false);
    expect(validateTemplate({})).toBe(false);
    expect(validateTemplate({ ...tpl(), title: '' })).toBe(false);
    expect(validateTemplate({ ...tpl(), items: [] })).toBe(false);
    expect(validateTemplate({ ...tpl(), items: [{ title: 'x' }] })).toBe(false);
    expect(validateTemplate({ ...tpl(), kind: 'bogus' })).toBe(false);
  });
});
