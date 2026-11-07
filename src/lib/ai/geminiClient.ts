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

/** Check if the server-side Gemini key is configured and reachable. */
export async function checkGeminiStatus(): Promise<{ available: boolean; model: string }> {
  try {
    const res = await fetch('/api/gemini/status');
    if (!res.ok) return { available: false, model: 'offline-fallback' };
    const data = await res.json();
    return { available: Boolean(data.available), model: data.model || 'gemini-3.8-flash' };
  } catch {
    return { available: false, model: 'offline-fallback' };
  }
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
    aiSuggested: true,
    disclaimer: isAr
      ? 'مقترح بالمعايير المحلية، يرجى التحقق من الجهة الرسمية للاختبار'
      : 'AI suggested, verify with official testing authorities',
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
    aiSuggested: true,
    disclaimer: isAr
      ? 'مقترح بالمعايير المحلية، يرجى مراجعة الخطة والتحقق'
      : 'AI suggested, verify with your study plan and official sources',
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
    aiSuggested: true,
    disclaimer: isAr
      ? 'مقترح بالمعايير المحلية، يرجى التحقق من تقرير الدرجات الرسمي'
      : 'AI suggested, verify with your official score report',
    isOfflineFallback: true,
  };
}

/** Request Feature (a): Test Intake Consult */
export async function requestIntakeConsult(input: IntakeConsultInput): Promise<IntakeConsultResult> {
  try {
    const res = await fetch('/api/gemini/intake-consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      return localFallbackIntakeConsult(input);
    }

    const data = await res.json();
    if (!data.sectionTargets || !Array.isArray(data.sectionTargets)) {
      return localFallbackIntakeConsult(input);
    }

    return {
      sectionTargets: data.sectionTargets,
      totalWeeklyPomodoros: data.totalWeeklyPomodoros || 20,
      strategySummary: data.strategySummary || '',
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
  try {
    const res = await fetch('/api/gemini/study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      return localFallbackStudyPlan(input);
    }

    const data = await res.json();
    if (!data.tasks || !Array.isArray(data.tasks)) {
      return localFallbackStudyPlan(input);
    }

    return {
      tasks: data.tasks,
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
  try {
    const res = await fetch('/api/gemini/post-test-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      return localFallbackPostTestAnalysis(input);
    }

    const data = await res.json();
    if (typeof data.overallGap !== 'number' || !data.weakestSection) {
      return localFallbackPostTestAnalysis(input);
    }

    return {
      overallGap: data.overallGap,
      weakestSection: data.weakestSection,
      recommendedWeeklyShift: Array.isArray(data.recommendedWeeklyShift) ? data.recommendedWeeklyShift : [],
      analysisNarrative: data.analysisNarrative || '',
      aiSuggested: true,
      disclaimer: data.disclaimer || (input.locale === 'ar' ? 'مقترح بالذكاء الاصطناعي، يرجى التحقق' : 'AI suggested, verify'),
      isOfflineFallback: false,
    };
  } catch {
    return localFallbackPostTestAnalysis(input);
  }
}
