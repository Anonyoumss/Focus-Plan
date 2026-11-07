import { describe, expect, it } from 'vitest';
import { TRANSLATIONS, Locale, lookupTranslationString } from '../translations';
import { evaluateBadges } from '../../lib/streakCalculator';
import { STORE_ITEMS } from '../../lib/coinsEngine';

function flattenKeys(tree: unknown, prefix = ''): string[] {
  if (!tree || typeof tree !== 'object') return [];
  return Object.entries(tree as Record<string, unknown>).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flattenKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('English and Arabic have identical key sets', () => {
    const enKeys = flattenKeys(TRANSLATIONS.en).sort();
    const arKeys = flattenKeys(TRANSLATIONS.ar).sort();
    expect(enKeys).toEqual(arKeys);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('no translation value is an empty string', () => {
    const check = (tree: unknown) => {
      if (!tree || typeof tree !== 'object') return;
      for (const v of Object.values(tree as Record<string, unknown>)) {
        if (typeof v === 'string') expect(v.length).toBeGreaterThan(0);
        else check(v);
      }
    };
    check(TRANSLATIONS.en);
    check(TRANSLATIONS.ar);
  });

  it('every badge key resolves to a real string in both locales', () => {
    const badges = evaluateBadges(10, 200, 200, true, true);
    for (const locale of ['en', 'ar'] as Locale[]) {
      const t = TRANSLATIONS[locale];
      for (const badge of badges) {
        expect(lookupTranslationString(t, badge.titleKey), `${locale} ${badge.id} title`).toBeTruthy();
        expect(lookupTranslationString(t, badge.descKey), `${locale} ${badge.id} desc`).toBeTruthy();
      }
    }
  });

  it('every store item key resolves to a real string in both locales', () => {
    for (const locale of ['en', 'ar'] as Locale[]) {
      const t = TRANSLATIONS[locale];
      for (const item of STORE_ITEMS) {
        expect(lookupTranslationString(t, item.titleKey), `${locale} ${item.id} title`).toBeTruthy();
        expect(lookupTranslationString(t, item.descKey), `${locale} ${item.id} desc`).toBeTruthy();
      }
    }
  });
});
