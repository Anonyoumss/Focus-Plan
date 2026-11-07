import {
  validateIntakeOutput,
  validateStudyPlanOutput,
  validatePostTestOutput,
  type IntakeConsultBody,
} from './validation';

export interface SectionTargetSuggestion {
  sectionId: string;
  targetScore: number;
  weeklyPomodoros: number;
}

export interface IntakeConsultResult {
  sectionTargets: SectionTargetSuggestion[];
  totalWeeklyPomodoros: number;
  strategySummary: string;
  aiSuggested: boolean;
  disclaimer: string;
  isOfflineFallback?: boolean;
}

export interface IntakeConsultInput {
  testId: string;
  testName?: string;
  currentScore: number;
  targetScore: number;
  weeksRemaining?: number;
  currentDailyHours?: number;
  sections?: Array<{
    id: string;
    nameEn: string;
    nameAr?: string;
    minScore?: number;
    maxScore?: number;
    defaultTargetScore?: number;
  }>;
  locale?: 'en' | 'ar';
}

export interface StudyPlanTaskItem {
  title: string;
  sectionId: string;
  estimatedPomodoros: number;
  dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
}

export interface StudyPlanResult {
  tasks: StudyPlanTaskItem[];
  aiSuggested: boolean;
  disclaimer: string;
  isOfflineFallback?: boolean;
}

export interface StudyPlanInput {
  testId: string;
  testName: string;
  weeklyPomodoroTarget: number;
  sectionPriorities: Array<{
    sectionId: string;
    sectionName: string;
    gap: number;
  }>;
  locale?: 'en' | 'ar';
}

export interface PostTestAnalysisResult {
  overallGap: number;
  weakestSection: string;
  recommendedWeeklyShift: Array<{
    sectionId: string;
    deltaPomodoros: number;
  }>;
  analysisNarrative: string;
  aiSuggested: boolean;
  disclaimer: string;
  isOfflineFallback?: boolean;
}

export interface PostTestAnalysisInput {
  testId: string;
  testName: string;
  targetScore: number;
  actualScores: Record<string, number>;
  sectionTargets: Record<string, number>;
  sectionNames?: Record<string, string>;
  locale?: 'en' | 'ar';
}

const AI_BASE = ((import.meta.env.VITE_AI_API_URL as string | undefined) || '').replace(/\/+$/, '');

const OFFLINE_DISCLAIMER = {
  en: 'Offline estimate (heuristic, not AI). Verify with official testing authorities.',
  ar: 'تقدير محلي (خوارزمية وليس ذكاءً اصطناعياً). يرجى التحقق من الجهة الرسمية.',
} as const;

function offlineDisclaimer(locale?: 'en' | 'ar'): string {
  return OFFLINE_DISCLAIMER[locale === 'ar' ? 'ar' : 'en'];
}

/**
 * Returns a Firebase ID token for the signed-in user, or null for guests /
 * when Firebase is not configured. The AI proxy requires auth; guests get
 * the offline estimate path.
 */
async function getIdToken(): Promise<string | null> {
  try {
    const { getFirebaseAuth, isFirebaseConfigured } = await import('../firebase/client');
    if (!isFirebaseConfigured()) return null;
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

async function aiFetch(path: string, body: unknown): Promise<Response | null> {
  const token = await getIdToken();
  if (!token) return null;
  try {
    return await fetch(`${AI_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

/** Check if the AI proxy is reachable and configured. Cached per session. */
let statusPromise: Promise<{ available: boolean; model: string }> | null = null;
export function checkGeminiStatus(): Promise<{ available: boolean; model: string }> {
  if (!statusPromise) {
    statusPromise = (async () => {
      try {
        const res = await fetch(`${AI_BASE}/api/gemini/status`);
        if (!res.ok) return { available: false, model: 'offline-fallback' };
        const data = await res.json();
        return { available: Boolean(data.available), model: data.model || 'gemini' };
      } catch {
        return { available: false, model: 'offline-fallback' };
      }
    })();
  }
  return statusPromise;
}

/** Deterministic client-side heuristic fallback for intake consult */
export function localFallbackIntakeConsult(input: IntakeConsultInput): IntakeConsultResult {
  const sections = input.sections || [];
  const targetScore = input.targetScore;
  const currentScore = input.currentScore;
  const gap = Math.max(0, targetScore - currentScore);
  const weeks = Math.max(1, input.weeksRemaining || 8);
  const dailyHours = Math.max(1, input.currentDailyHours || 2);

  // 1 hour ~ 2 pomodoros (25m + 5m break)
  const estimatedWeeklyPomodoros = Math.min(40, Math.max(6, Math.round(dailyHours * 5 * 2)));

  const sectionCount = sections.length || 1;
  const basePerSection = Math.floor(estimatedWeeklyPomodoros / sectionCount);
  const remainder = estimatedWeeklyPomodoros % sectionCount;

  const sectionTargets: SectionTargetSuggestion[] = sections.map((sec, idx) => {
    const min = sec.minScore ?? 0;
    const max = sec.maxScore ?? (targetScore * 1.2);
    // Baseline distribution
    const secTarget = sec.defaultTargetScore ?? Math.round(min + (max - min) * 0.75);
    return {
      sectionId: sec.id,
      targetScore: secTarget,
      weeklyPomodoros: basePerSection + (idx < remainder ? 1 : 0),
    };
  });

  const isAr = input.locale === 'ar';
  const strategySummary = isAr
    ? `خطة معيارية للوصول إلى ${targetScore} موزعة على ${weeks} أسابيع بمعدل ${estimatedWeeklyPomodoros} جلسة أسبوعياً (الفارق الإجمالي: ${gap} نقطة). تم تخصيص جلسات متساوية لجميع أقسام الاختبار.`
    : `Standard benchmark preparation over ${weeks} weeks targeting a score of ${targetScore} (${estimatedWeeklyPomodoros} weekly pomodoros, overall gap: ${gap} points). Balanced distribution across all exam sections.`;

  return {
    sectionTargets,
    totalWeeklyPomodoros: estimatedWeeklyPomodoros,
    strategySummary,
    aiSuggested: false,
    disclaimer: offlineDisclaimer(input.locale),
    isOfflineFallback: true,
  };
}

/** Deterministic client-side heuristic fallback for study plan generator */
export function localFallbackStudyPlan(input: StudyPlanInput): StudyPlanResult {
  const isAr = input.locale === 'ar';
  const targetTotal = Math.max(4, input.weeklyPomodoroTarget || 20);
  const priorities = input.sectionPriorities.length > 0
    ? input.sectionPriorities
    : [{ sectionId: 'general', sectionName: isAr ? 'المراجعة الشاملة' : 'General Review', gap: 10 }];

  const weekdays: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = [
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  ];

  const tasks: StudyPlanTaskItem[] = [];
  let dayIdx = 0;
  const pomodorosPerTask = Math.max(2, Math.round(targetTotal / (priorities.length * 2)));

  for (const prio of priorities) {
    tasks.push({
      title: isAr
        ? `تدريب مكثف: ${prio.sectionName}`
        : `Targeted Practice: ${prio.sectionName}`,
      sectionId: prio.sectionId,
      estimatedPomodoros: pomodorosPerTask,
      dayOfWeek: weekdays[dayIdx % 7],
    });
    dayIdx++;

    tasks.push({
      title: isAr
        ? `حل نموذج تدريبي ومراجعة أخطاء ${prio.sectionName}`
        : `Drill Set & Error Review: ${prio.sectionName}`,
      sectionId: prio.sectionId,
      estimatedPomodoros: Math.max(1, pomodorosPerTask - 1),
      dayOfWeek: weekdays[dayIdx % 7],
    });
    dayIdx++;
  }

  return {
    tasks,
    aiSuggested: false,
    disclaimer: offlineDisclaimer(input.locale),
    isOfflineFallback: true,
  };
}

/** Deterministic client-side heuristic fallback for post-test score analysis */
export function localFallbackPostTestAnalysis(input: PostTestAnalysisInput): PostTestAnalysisResult {
  const isAr = input.locale === 'ar';
  const sections = Object.keys(input.actualScores);

  let weakestSection = sections[0] || 'general';
  let largestGap = -Infinity;
  let totalGap = 0;

  const recommendedWeeklyShift: Array<{ sectionId: string; deltaPomodoros: number }> = [];

  for (const sec of sections) {
    const actual = input.actualScores[sec] ?? 0;
    const target = input.sectionTargets[sec] ?? actual;
    const gap = target - actual;
    totalGap += gap;
    if (gap > largestGap) {
      largestGap = gap;
      weakestSection = sec;
    }
  }

  for (const sec of sections) {
    if (sec === weakestSection && largestGap > 0) {
      recommendedWeeklyShift.push({ sectionId: sec, deltaPomodoros: 4 });
    } else {
      recommendedWeeklyShift.push({ sectionId: sec, deltaPomodoros: -1 });
    }
  }

  const secName = input.sectionNames?.[weakestSection] || weakestSection;
  const analysisNarrative = isAr
    ? `أكبر فجوة سجلت في قسم "${secName}" بفارق ${Math.max(0, largestGap)} نقطة عن الدرجة المستهدفة. نوصي بزيادة 4 جلسات دراسية أسبوعياً لهذا القسم وتعديل باقي الأقسام بالتوازي.`
    : `Largest score gap observed in "${secName}" (${Math.max(0, largestGap)} points below target). We recommend shifting +4 weekly pomodoros to this section to rebuild foundational proficiency.`;

  return {
    overallGap: Math.max(0, totalGap),
    weakestSection,
    recommendedWeeklyShift,
    analysisNarrative,
    aiSuggested: false,
    disclaimer: offlineDisclaimer(input.locale),
    isOfflineFallback: true,
  };
}

/** Request Feature (a): Test Intake Consult */
export async function requestIntakeConsult(input: IntakeConsultInput): Promise<IntakeConsultResult> {
  const body: IntakeConsultBody = {
    testId: input.testId,
    testName: input.testName,
    currentScore: input.currentScore,
    targetScore: input.targetScore,
    weeksRemaining: input.weeksRemaining,
    currentDailyHours: input.currentDailyHours,
    sections: input.sections?.map((s) => ({
      id: s.id,
      nameEn: s.nameEn,
      nameAr: s.nameAr,
      minScore: s.minScore,
      maxScore: s.maxScore,
      defaultTargetScore: s.defaultTargetScore,
    })),
    locale: input.locale,
  };
  const res = await aiFetch('/api/gemini/intake-consult', body);
  if (!res || !res.ok) return localFallbackIntakeConsult(input);
  try {
    const data = await res.json();
    const validated = validateIntakeOutput(data, body);
    if (!validated) return localFallbackIntakeConsult(input);
    return {
      ...validated,
      aiSuggested: true,
      disclaimer: data.disclaimer || (input.locale === 'ar' ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق' : 'AI suggested, verify'),
      isOfflineFallback: false,
    };
  } catch {
    return localFallbackIntakeConsult(input);
  }
}

/** Request Feature (b): Study Plan Generator */
export async function requestStudyPlan(input: StudyPlanInput): Promise<StudyPlanResult> {
  const res = await aiFetch('/api/gemini/study-plan', {
    testId: input.testId,
    testName: input.testName,
    weeklyPomodoroTarget: input.weeklyPomodoroTarget,
    sectionPriorities: input.sectionPriorities,
    locale: input.locale,
  });
  if (!res || !res.ok) return localFallbackStudyPlan(input);
  try {
    const data = await res.json();
    const validated = validateStudyPlanOutput(data, {
      testId: input.testId,
      testName: input.testName,
      weeklyPomodoroTarget: input.weeklyPomodoroTarget,
      sectionPriorities: input.sectionPriorities,
      locale: input.locale,
    });
    if (!validated) return localFallbackStudyPlan(input);
    return {
      ...validated,
      tasks: validated.tasks.map((t) => ({
        ...t,
        dayOfWeek: t.dayOfWeek as StudyPlanTaskItem['dayOfWeek'],
      })),
      aiSuggested: true,
      disclaimer: data.disclaimer || (input.locale === 'ar' ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق' : 'AI suggested, verify'),
      isOfflineFallback: false,
    };
  } catch {
    return localFallbackStudyPlan(input);
  }
}

/** Request Feature (c): Post-Test Analysis */
export async function requestPostTestAnalysis(input: PostTestAnalysisInput): Promise<PostTestAnalysisResult> {
  const res = await aiFetch('/api/gemini/post-test-analysis', {
    testId: input.testId,
    testName: input.testName,
    targetScore: input.targetScore,
    actualScores: input.actualScores,
    sectionTargets: input.sectionTargets,
    sectionNames: input.sectionNames,
    locale: input.locale,
  });
  if (!res || !res.ok) return localFallbackPostTestAnalysis(input);
  try {
    const data = await res.json();
    const validated = validatePostTestOutput(data, {
      testId: input.testId,
      testName: input.testName,
      targetScore: input.targetScore,
      actualScores: input.actualScores,
      sectionTargets: input.sectionTargets,
      sectionNames: input.sectionNames,
      locale: input.locale,
    });
    if (!validated) return localFallbackPostTestAnalysis(input);
    return {
      ...validated,
      aiSuggested: true,
      disclaimer: data.disclaimer || (input.locale === 'ar' ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق' : 'AI suggested, verify'),
      isOfflineFallback: false,
    };
  } catch {
    return localFallbackPostTestAnalysis(input);
  }
}
