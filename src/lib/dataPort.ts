/**
 * JSON/CSV import & export for tasks with strict validation.
 * Malformed input returns an error result; it never throws to the UI.
 */
import type { TaskItem } from '../store/useAppStore';
import { isValidTaskBlueprint } from './templates';

export interface PortResult {
  ok: boolean;
  tasks: Omit<TaskItem, 'id' | 'createdAt' | 'completedSessions' | 'isCompleted'>[];
  error?: string;
}

const ok = (
  tasks: PortResult['tasks'],
): PortResult => ({ ok: true, tasks });
const fail = (error: string): PortResult => ({ ok: false, tasks: [], error });

function normalizeBlueprint(raw: unknown): PortResult['tasks'][number] | null {
  if (!isValidTaskBlueprint(raw)) return null;
  const b = raw as Record<string, unknown>;
  return {
    title: b.title as string,
    category: (b.category as string) || 'General',
    estimatedSessions: (b.estimatedSessions as number) ?? 1,
    minGoal: (b.minGoal as number) ?? 1,
    maxGoal: (b.maxGoal as number) ?? (b.minGoal as number) ?? 1,
    cadence: b.cadence as TaskItem['cadence'],
    notes: (b.notes as string) ?? '',
  };
}

/** Parse a JSON string into validated task blueprints. Accepts either a
 * full app export ({tasks:[...]}) or a bare array of task objects. */
export function importTasksJson(text: string): PortResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return fail('invalid-json');
  }
  let arr: unknown;
  if (Array.isArray(data)) arr = data;
  else if (data && typeof data === 'object' && Array.isArray((data as any).tasks)) {
    arr = (data as any).tasks;
  } else {
    return fail('no-tasks-array');
  }
  const list = arr as unknown[];
  if (list.length === 0) return fail('empty');
  if (list.length > 500) return fail('too-many');
  const tasks: PortResult['tasks'] = [];
  for (const item of list) {
    // Accept full TaskItem exports too (extra runtime fields are dropped).
    const candidate =
      item && typeof item === 'object' && 'blueprint' in (item as object)
        ? (item as any).blueprint
        : item;
    const b = normalizeBlueprint(candidate);
    if (!b) return fail('invalid-task');
    tasks.push(b);
  }
  return ok(tasks);
}

const CSV_HEADER = 'title,category,estimatedSessions,minGoal,maxGoal,cadence,notes';

/** Serialize tasks to CSV (RFC-4180-ish quoting). */
export function exportTasksCsv(tasks: TaskItem[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = tasks.map((t) =>
    [t.title, t.category, t.estimatedSessions, t.minGoal, t.maxGoal, t.cadence, t.notes]
      .map(esc)
      .join(','),
  );
  return [CSV_HEADER, ...rows].join('\n');
}

/** Parse a tasks CSV. Requires the exact header row. */
export function importTasksCsv(text: string): PortResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return fail('empty');
  if (lines[0].trim() !== CSV_HEADER) return fail('bad-header');
  if (lines.length > 501) return fail('too-many');

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = false;
        } else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };

  const tasks: PortResult['tasks'] = [];
  for (const line of lines.slice(1)) {
    const f = parseLine(line);
    if (f.length !== 7) return fail('bad-row');
    const [title, category, est, min, max, cadence, notes] = f;
    const b = normalizeBlueprint({
      title, category, estimatedSessions: Number(est), minGoal: Number(min),
      maxGoal: Number(max), cadence, notes,
    });
    if (!b) return fail('invalid-task');
    tasks.push(b);
  }
  return tasks.length ? ok(tasks) : fail('empty');
}
