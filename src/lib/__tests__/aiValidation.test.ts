import { describe, it, expect } from 'vitest';
import {
  validateIntakeBody,
  validateStudyPlanBody,
  validatePostTestBody,
  validateIntakeOutput,
  validateStudyPlanOutput,
  validatePostTestOutput,
} from '../ai/validation';

const intakeInput = {
  testId: 'SAT',
  currentScore: 1000,
  targetScore: 1400,
  sections: [
    { id: 'math', minScore: 200, maxScore: 800 },
    { id: 'verbal', minScore: 200, maxScore: 800 },
  ],
};

describe('AI request validation', () => {
  it('accepts a well-formed intake body and strips unknown fields', () => {
    const out = validateIntakeBody({ ...intakeInput, evil: '<script>', locale: 'ar' });
    expect(out).not.toBeNull();
    expect(out!.locale).toBe('ar');
    expect((out as any).evil).toBeUndefined();
  });

  it('rejects missing scores, bad types, oversized strings and inverted ranges', () => {
    expect(validateIntakeBody({ testId: 'SAT' })).toBeNull();
    expect(validateIntakeBody({ ...intakeInput, currentScore: 'high' })).toBeNull();
    expect(validateIntakeBody({ ...intakeInput, testId: 'x'.repeat(200) })).toBeNull();
    expect(validateIntakeBody({
      ...intakeInput,
      sections: [{ id: 's', minScore: 800, maxScore: 200 }],
    })).toBeNull();
    expect(validateIntakeBody({ ...intakeInput, sections: Array(60).fill({ id: 's' }) })).toBeNull();
  });

  it('rejects malformed study-plan and post-test bodies', () => {
    expect(validateStudyPlanBody({ testId: 'SAT', sectionPriorities: 'nope' })).toBeNull();
    expect(validateStudyPlanBody({
      testId: 'SAT',
      sectionPriorities: [{ sectionId: 'math' }],
      weeklyPomodoroTarget: 9999,
    })).toBeNull();
    expect(validatePostTestBody({ testId: 'SAT', targetScore: 7, actualScores: [] })).toBeNull();
    expect(validatePostTestBody({
      testId: 'SAT', targetScore: 7,
      actualScores: { a: Number.NaN },
    })).toBeNull();
  });
});

describe('AI output validation', () => {
  const goodIntake = {
    sectionTargets: [
      { sectionId: 'math', targetScore: 700, weeklyPomodoros: 10 },
      { sectionId: 'verbal', targetScore: 750, weeklyPomodoros: 10 },
    ],
    totalWeeklyPomodoros: 20,
    strategySummary: 'ok',
    aiSuggested: true,
    disclaimer: 'd',
  };

  it('accepts in-range output', () => {
    const out = validateIntakeOutput(goodIntake, intakeInput);
    expect(out).not.toBeNull();
    expect(out!.sectionTargets).toHaveLength(2);
  });

  it('rejects out-of-range section targets', () => {
    const bad = {
      ...goodIntake,
      sectionTargets: [{ sectionId: 'math', targetScore: 9999, weeklyPomodoros: 10 }],
    };
    expect(validateIntakeOutput(bad, intakeInput)).toBeNull();
    const below = {
      ...goodIntake,
      sectionTargets: [{ sectionId: 'math', targetScore: 10, weeklyPomodoros: 10 }],
    };
    expect(validateIntakeOutput(below, intakeInput)).toBeNull();
  });

  it('rejects unknown section ids only when ranges were provided? (unknown ids allowed)', () => {
    const out = validateIntakeOutput({
      ...goodIntake,
      sectionTargets: [{ sectionId: 'extra', targetScore: 500, weeklyPomodoros: 5 }],
    }, intakeInput);
    expect(out).not.toBeNull();
  });

  it('rejects malformed study-plan output', () => {
    const body = {
      testId: 'SAT', testName: 'SAT', weeklyPomodoroTarget: 20,
      sectionPriorities: [{ sectionId: 'math', sectionName: 'Math', gap: 5 }],
    };
    expect(validateStudyPlanOutput({
      tasks: [{ title: 'Drill', sectionId: 'math', estimatedPomodoros: 4, dayOfWeek: 'mon' }],
      aiSuggested: true, disclaimer: 'd',
    }, body)).not.toBeNull();
    expect(validateStudyPlanOutput({
      tasks: [{ title: 'Drill', sectionId: 'unknown', estimatedPomodoros: 4, dayOfWeek: 'mon' }],
      aiSuggested: true, disclaimer: 'd',
    }, body)).toBeNull();
    expect(validateStudyPlanOutput({
      tasks: [{ title: 'Drill', sectionId: 'math', estimatedPomodoros: 4, dayOfWeek: 'funday' }],
      aiSuggested: true, disclaimer: 'd',
    }, body)).toBeNull();
  });

  it('rejects malformed post-test output', () => {
    const body = {
      testId: 'SAT', testName: 'SAT', targetScore: 1400,
      actualScores: { math: 600 }, sectionTargets: { math: 700 },
    };
    expect(validatePostTestOutput({
      overallGap: 100, weakestSection: 'math',
      recommendedWeeklyShift: [{ sectionId: 'math', deltaPomodoros: 4 }],
      analysisNarrative: 'gap', aiSuggested: true, disclaimer: 'd',
    }, body)).not.toBeNull();
    expect(validatePostTestOutput({
      overallGap: 'big', weakestSection: 'math',
      recommendedWeeklyShift: [], analysisNarrative: 'x',
      aiSuggested: true, disclaimer: 'd',
    }, body)).toBeNull();
  });
});
