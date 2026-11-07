/**
 * Editable test-section helpers. Framework-free; unit tested in Vitest.
 */
import { TestSection, StandardizedTestDefinition, UserTestGoal } from '../data/tests/catalog';

export interface SectionValidationError {
  sectionId: string;
  field: 'name' | 'minScore' | 'maxScore' | 'defaultTargetScore';
}

/**
 * Validates a candidate section list for a test goal.
 * Rules: at least one section, unique ids, non-empty names,
 * minScore < maxScore, defaultTargetScore within [minScore, maxScore],
 * all values finite numbers.
 */
export function validateTestSections(
  sections: TestSection[]
): { ok: boolean; errors: SectionValidationError[] } {
  const errors: SectionValidationError[] = [];
  if (!Array.isArray(sections) || sections.length === 0) {
    return { ok: false, errors: [{ sectionId: '*', field: 'name' }] };
  }
  const seen = new Set<string>();
  for (const s of sections) {
    if (!s || typeof s !== 'object') {
      errors.push({ sectionId: '*', field: 'name' });
      continue;
    }
    if (typeof s.id !== 'string' || s.id.length === 0 || s.id.length > 60 || seen.has(s.id)) {
      errors.push({ sectionId: String(s.id ?? '*'), field: 'name' });
      continue;
    }
    seen.add(s.id);
    if (typeof s.nameEn !== 'string' || s.nameEn.trim().length === 0 || s.nameEn.length > 120) {
      errors.push({ sectionId: s.id, field: 'name' });
    }
    if (!Number.isFinite(s.minScore) || !Number.isFinite(s.maxScore) || !(s.minScore < s.maxScore)) {
      errors.push({ sectionId: s.id, field: 'minScore' });
      errors.push({ sectionId: s.id, field: 'maxScore' });
    }
    if (
      !Number.isFinite(s.defaultTargetScore) ||
      s.defaultTargetScore < s.minScore ||
      s.defaultTargetScore > s.maxScore
    ) {
      errors.push({ sectionId: s.id, field: 'defaultTargetScore' });
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Sections effective for a goal: user-edited list wins over the catalog
 * definition; catalog wins over an empty list.
 */
export function resolveGoalSections(
  goal: Pick<UserTestGoal, 'customSections'>,
  definition: Pick<StandardizedTestDefinition, 'sections'> | undefined
): TestSection[] {
  if (goal.customSections && goal.customSections.length > 0) return goal.customSections;
  return definition?.sections ?? [];
}

/** Slugify a section name into a stable id. */
export function sectionIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return slug || `sec_${Date.now().toString(36)}`;
}
