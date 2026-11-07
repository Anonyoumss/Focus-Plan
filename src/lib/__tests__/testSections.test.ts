import { describe, it, expect } from 'vitest';
import { validateTestSections, resolveGoalSections, sectionIdFromName } from '../testSections';
import type { TestSection } from '../../data/tests/catalog';

const sec = (over: Partial<TestSection> = {}): TestSection => ({
  id: 's1',
  nameEn: 'Reading',
  nameAr: 'قراءة',
  minScore: 0,
  maxScore: 100,
  defaultTargetScore: 50,
  ...over,
});

describe('validateTestSections', () => {
  it('accepts a valid list', () => {
    expect(validateTestSections([sec(), sec({ id: 's2' })]).ok).toBe(true);
  });
  it('rejects empty, dup ids, empty names', () => {
    expect(validateTestSections([]).ok).toBe(false);
    expect(validateTestSections([sec(), sec()]).ok).toBe(false);
    expect(validateTestSections([sec({ nameEn: '  ' })]).ok).toBe(false);
  });
  it('rejects min >= max and target outside range', () => {
    expect(validateTestSections([sec({ minScore: 100, maxScore: 100 })]).ok).toBe(false);
    expect(validateTestSections([sec({ minScore: 50, maxScore: 40 })]).ok).toBe(false);
    expect(validateTestSections([sec({ defaultTargetScore: 120 })]).ok).toBe(false);
    expect(validateTestSections([sec({ defaultTargetScore: -1 })]).ok).toBe(false);
  });
  it('rejects non-finite values', () => {
    expect(validateTestSections([sec({ minScore: NaN })]).ok).toBe(false);
  });
});

describe('resolveGoalSections', () => {
  const def = { sections: [sec({ id: 'cat1' })] };
  it('prefers customSections over catalog', () => {
    const out = resolveGoalSections({ customSections: [sec({ id: 'c1' })] }, def);
    expect(out[0].id).toBe('c1');
  });
  it('falls back to catalog then empty', () => {
    expect(resolveGoalSections({}, def)[0].id).toBe('cat1');
    expect(resolveGoalSections({}, undefined)).toEqual([]);
    expect(resolveGoalSections({ customSections: [] }, def)[0].id).toBe('cat1');
  });
});

describe('sectionIdFromName', () => {
  it('slugifies', () => {
    expect(sectionIdFromName('Quantitative Reasoning!')).toBe('quantitative_reasoning');
    expect(sectionIdFromName('!!!')).toMatch(/^sec_/);
  });
});
