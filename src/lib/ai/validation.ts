/**
 * Shared request/response validation for the Gemini proxy endpoints.
 * Framework-free: used by server.ts and by the client geminiClient.
 * All user-supplied text is treated as untrusted.
 */

export interface SectionSpec {
  id: string;
  nameEn?: string;
  nameAr?: string;
  minScore?: number;
  maxScore?: number;
  defaultTargetScore?: number;
}

export interface IntakeConsultBody {
  testId: string;
  testName?: string;
  currentScore: number;
  targetScore: number;
  weeksRemaining?: number;
  currentDailyHours?: number;
  sections?: SectionSpec[];
  locale?: 'en' | 'ar';
}

export interface StudyPlanBody {
  testId: string;
  testName?: string;
  weeklyPomodoroTarget?: number;
  sectionPriorities: Array<{ sectionId: string; sectionName?: string; gap?: number }>;
  locale?: 'en' | 'ar';
}

export interface PostTestBody {
  testId: string;
  testName?: string;
  targetScore: number;
  actualScores: Record<string, number>;
  sectionTargets?: Record<string, number>;
  sectionNames?: Record<string, string>;
  locale?: 'en' | 'ar';
}

const MAX_STRING = 500;
const MAX_SECTIONS = 50;
const MAX_TASKS = 60;
const MAX_SCORE_MAP = 100;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, max = MAX_STRING): string | undefined {
  return typeof v === 'string' && v.length <= max ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function intIn(v: unknown, min: number, max: number): number | undefined {
  const n = num(v);
  return n !== undefined && Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

function locale(v: unknown): 'en' | 'ar' {
  return v === 'ar' ? 'ar' : 'en';
}

export function validateIntakeBody(body: unknown): IntakeConsultBody | null {
  if (!isObj(body)) return null;
  const testId = str(body.testId, 100);
  const currentScore = num(body.currentScore);
  const targetScore = num(body.targetScore);
  if (!testId || currentScore === undefined || targetScore === undefined) return null;
  if (currentScore < 0 || targetScore < 0 || currentScore > 1e6 || targetScore > 1e6) return null;

  let sections: SectionSpec[] | undefined;
  if (body.sections !== undefined) {
    if (!Array.isArray(body.sections) || body.sections.length > MAX_SECTIONS) return null;
    sections = [];
    for (const raw of body.sections) {
      if (!isObj(raw)) return null;
      const id = str(raw.id, 64);
      if (!id) return null;
      const minScore = raw.minScore === undefined ? undefined : num(raw.minScore);
      const maxScore = raw.maxScore === undefined ? undefined : num(raw.maxScore);
      if ((raw.minScore !== undefined && minScore === undefined) ||
          (raw.maxScore !== undefined && maxScore === undefined)) return null;
      if (minScore !== undefined && maxScore !== undefined && minScore > maxScore) return null;
      sections.push({
        id,
        nameEn: str(raw.nameEn, 120),
        nameAr: str(raw.nameAr, 120),
        minScore,
        maxScore,
        defaultTargetScore: raw.defaultTargetScore === undefined ? undefined : num(raw.defaultTargetScore),
      });
    }
  }

  return {
    testId,
    testName: str(body.testName, 120),
    currentScore,
    targetScore,
    weeksRemaining: intIn(body.weeksRemaining, 1, 520),
    currentDailyHours: num(body.currentDailyHours) !== undefined && (body.currentDailyHours as number) >= 0 && (body.currentDailyHours as number) <= 24
      ? (body.currentDailyHours as number)
      : undefined,
    sections,
    locale: locale(body.locale),
  };
}

export function validateStudyPlanBody(body: unknown): StudyPlanBody | null {
  if (!isObj(body)) return null;
  const testId = str(body.testId, 100);
  if (!testId || !Array.isArray(body.sectionPriorities) || body.sectionPriorities.length > MAX_SECTIONS) return null;
  const sectionPriorities: StudyPlanBody['sectionPriorities'] = [];
  for (const raw of body.sectionPriorities) {
    if (!isObj(raw)) return null;
    const sectionId = str(raw.sectionId, 64);
    if (!sectionId) return null;
    sectionPriorities.push({
      sectionId,
      sectionName: str(raw.sectionName, 120),
      gap: num(raw.gap),
    });
  }
  const wpt = body.weeklyPomodoroTarget === undefined ? undefined : intIn(body.weeklyPomodoroTarget, 1, 200);
  if (body.weeklyPomodoroTarget !== undefined && wpt === undefined) return null;
  return {
    testId,
    testName: str(body.testName, 120),
    weeklyPomodoroTarget: wpt,
    sectionPriorities,
    locale: locale(body.locale),
  };
}

export function validatePostTestBody(body: unknown): PostTestBody | null {
  if (!isObj(body)) return null;
  const testId = str(body.testId, 100);
  const targetScore = num(body.targetScore);
  if (!testId || targetScore === undefined || targetScore < 0 || targetScore > 1e6) return null;
  if (!isObj(body.actualScores)) return null;
  const actualScores: Record<string, number> = {};
  const entries = Object.entries(body.actualScores);
  if (entries.length > MAX_SCORE_MAP) return null;
  for (const [k, v] of entries) {
    const key = str(k, 64);
    const val = num(v);
    if (!key || val === undefined || val < 0 || val > 1e6) return null;
    actualScores[key] = val;
  }
  const sectionTargets = isObj(body.sectionTargets)
    ? Object.fromEntries(
        Object.entries(body.sectionTargets)
          .map(([k, v]) => [str(k, 64), num(v)] as const)
          .filter((e): e is readonly [string, number] => e[0] !== null && e[1] !== undefined),
      )
    : undefined;
  const sectionNames = isObj(body.sectionNames)
    ? Object.fromEntries(
        Object.entries(body.sectionNames)
          .map(([k, v]) => [str(k, 64), str(v, 120)] as const)
          .filter((e): e is readonly [string, string] => e[0] !== null && e[1] !== undefined),
      )
    : undefined;
  return {
    testId,
    testName: str(body.testName, 120),
    targetScore,
    actualScores,
    sectionTargets,
    sectionNames,
    locale: locale(body.locale),
  };
}

/* ---------------- Output validation ---------------- */

export interface IntakeOutput {
  sectionTargets: Array<{ sectionId: string; targetScore: number; weeklyPomodoros: number }>;
  totalWeeklyPomodoros: number;
  strategySummary: string;
  aiSuggested: boolean;
  disclaimer: string;
}

/** Reject AI output whose section targets fall outside the ranges the client sent. */
export function validateIntakeOutput(raw: unknown, input: IntakeConsultBody): IntakeOutput | null {
  if (!isObj(raw) || !Array.isArray(raw.sectionTargets)) return null;
  if (raw.sectionTargets.length > MAX_SECTIONS) return null;
  const ranges = new Map((input.sections ?? []).map((s) => [s.id, s]));
  const sectionTargets: IntakeOutput['sectionTargets'] = [];
  for (const item of raw.sectionTargets) {
    if (!isObj(item)) return null;
    const sectionId = str(item.sectionId, 64);
    const targetScore = num(item.targetScore);
    const weeklyPomodoros = intIn(item.weeklyPomodoros, 0, 500);
    if (!sectionId || targetScore === undefined || weeklyPomodoros === undefined) return null;
    const spec = ranges.get(sectionId);
    if (spec) {
      if (spec.minScore !== undefined && targetScore < spec.minScore) return null;
      if (spec.maxScore !== undefined && targetScore > spec.maxScore) return null;
    }
    sectionTargets.push({ sectionId, targetScore, weeklyPomodoros });
  }
  const totalWeeklyPomodoros = intIn(raw.totalWeeklyPomodoros, 0, 2000);
  if (totalWeeklyPomodoros === undefined) return null;
  const strategySummary = str(raw.strategySummary, 4000);
  if (strategySummary === undefined) return null;
  return {
    sectionTargets,
    totalWeeklyPomodoros,
    strategySummary,
    aiSuggested: raw.aiSuggested === true,
    disclaimer: str(raw.disclaimer, 500) ?? '',
  };
}

export interface StudyPlanOutput {
  tasks: Array<{ title: string; sectionId: string; estimatedPomodoros: number; dayOfWeek: string }>;
  aiSuggested: boolean;
  disclaimer: string;
}

const DAYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export function validateStudyPlanOutput(raw: unknown, input: StudyPlanBody): StudyPlanOutput | null {
  if (!isObj(raw) || !Array.isArray(raw.tasks) || raw.tasks.length > MAX_TASKS) return null;
  const knownSections = new Set(input.sectionPriorities.map((s) => s.sectionId));
  const tasks: StudyPlanOutput['tasks'] = [];
  for (const item of raw.tasks) {
    if (!isObj(item)) return null;
    const title = str(item.title, 200);
    const sectionId = str(item.sectionId, 64);
    const estimatedPomodoros = intIn(item.estimatedPomodoros, 1, 100);
    const dayOfWeek = str(item.dayOfWeek, 8);
    if (!title || !sectionId || estimatedPomodoros === undefined || !dayOfWeek || !DAYS.has(dayOfWeek)) return null;
    if (knownSections.size > 0 && !knownSections.has(sectionId)) return null;
    tasks.push({ title, sectionId, estimatedPomodoros, dayOfWeek });
  }
  return {
    tasks,
    aiSuggested: raw.aiSuggested === true,
    disclaimer: str(raw.disclaimer, 500) ?? '',
  };
}

export interface PostTestOutput {
  overallGap: number;
  weakestSection: string;
  recommendedWeeklyShift: Array<{ sectionId: string; deltaPomodoros: number }>;
  analysisNarrative: string;
  aiSuggested: boolean;
  disclaimer: string;
}

export function validatePostTestOutput(raw: unknown, _input: PostTestBody): PostTestOutput | null {
  if (!isObj(raw)) return null;
  const overallGap = num(raw.overallGap);
  const weakestSection = str(raw.weakestSection, 64);
  const analysisNarrative = str(raw.analysisNarrative, 8000);
  if (overallGap === undefined || overallGap < -1e6 || overallGap > 1e6) return null;
  if (!weakestSection || analysisNarrative === undefined) return null;
  const shift: PostTestOutput['recommendedWeeklyShift'] = [];
  if (raw.recommendedWeeklyShift !== undefined) {
    if (!Array.isArray(raw.recommendedWeeklyShift) || raw.recommendedWeeklyShift.length > MAX_SECTIONS) return null;
    for (const item of raw.recommendedWeeklyShift) {
      if (!isObj(item)) return null;
      const sectionId = str(item.sectionId, 64);
      const deltaPomodoros = intIn(item.deltaPomodoros, -100, 100);
      if (!sectionId || deltaPomodoros === undefined) return null;
      shift.push({ sectionId, deltaPomodoros });
    }
  }
  return {
    overallGap,
    weakestSection,
    recommendedWeeklyShift: shift,
    analysisNarrative,
    aiSuggested: raw.aiSuggested === true,
    disclaimer: str(raw.disclaimer, 500) ?? '',
  };
}
