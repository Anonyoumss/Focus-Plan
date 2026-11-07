import { describe, it, expect } from 'vitest';
import { importTasksJson, importTasksCsv, exportTasksCsv } from '../dataPort';
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
  notes: '',
  isCompleted: false,
  createdAt: 1000,
  ...over,
});

describe('dataPort JSON', () => {
  it('imports a bare array of tasks', () => {
    const r = importTasksJson(JSON.stringify([task()]));
    expect(r.ok).toBe(true);
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0].title).toBe('Read chapter 4');
    expect(r.tasks[0]).not.toHaveProperty('id');
  });

  it('imports {tasks:[...]} export shape', () => {
    const r = importTasksJson(JSON.stringify({ tasks: [task(), task({ id: 't2' })] }));
    expect(r.ok).toBe(true);
    expect(r.tasks).toHaveLength(2);
  });

  it('rejects malformed JSON and bad shapes without throwing', () => {
    expect(importTasksJson('{not json').ok).toBe(false);
    expect(importTasksJson('{"foo":1}').ok).toBe(false);
    expect(importTasksJson('[]').ok).toBe(false);
    expect(importTasksJson(JSON.stringify([{ title: 'x' }])).ok).toBe(false);
    expect(importTasksJson(JSON.stringify([task({ cadence: 'bogus' as any })])).ok).toBe(false);
    expect(importTasksJson(JSON.stringify([task({ maxGoal: 1, minGoal: 5 })])).ok).toBe(false);
  });
});

describe('dataPort CSV', () => {
  it('round-trips export/import', () => {
    const csv = exportTasksCsv([task({ notes: 'has, comma' })]);
    const r = importTasksCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.tasks[0].notes).toBe('has, comma');
    expect(r.tasks[0].cadence).toBe('daily');
  });

  it('rejects bad header and bad rows', () => {
    expect(importTasksCsv('a,b,c').ok).toBe(false);
    expect(importTasksCsv('title,category,estimatedSessions,minGoal,maxGoal,cadence,notes\nonly,two').ok).toBe(false);
    expect(
      importTasksCsv('title,category,estimatedSessions,minGoal,maxGoal,cadence,notes\nx,cat,abc,1,2,daily,n')
        .ok
    ).toBe(false);
  });
});
