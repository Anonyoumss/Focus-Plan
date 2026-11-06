# CODEBASE ARCHITECTURE & SYSTEM DESIGN: Focus Plan M3E

This document outlines the codebase architecture, data model, token system, extension patterns, and cross-platform native readiness of **Focus Plan M3E**.

---

## 1. Architectural Philosophy: Decoupled Framework-Free Core

A central architectural decision in Focus Plan M3E is the decoupling of **business logic** from the UI view layer:

- **UI Layer (`/src/components/`, `/src/App.tsx`)**: React 19 functional components utilizing Tailwind CSS v4 and Material 3 Expressive CSS tokens.
- **State Layer (`/src/store/useAppStore.ts`)**: Zustand reactive store maintaining transient UI state and synchronizing persistence with `localStorage` (with a clean upgrade path to Firebase Firestore in Phase 3).
- **Core Engine (`/src/lib/`)**: Pure TypeScript functions with zero React or DOM dependencies.

### Why This Matters for Android / Native Expansion:
Because the timer calculations, streak validations, score scaling formulas, and coin ledgers are located in pure TypeScript files (`/src/lib/`), they can be:
1. Reused 100% inside a **Capacitor** Android shell.
2. Directly ported 1:1 to **Kotlin and Jetpack Compose** data models and ViewModels without deciphering tangled React component lifecycle hooks.

---

## 2. Directory Map

| Directory | Responsibility |
| :--- | :--- |
| `/src/design/theme.ts` | Dynamic M3 palette generator using `@material/material-color-utilities`. Injects CSS variables into `:root` and `.dark`. |
| `/src/i18n/translations.ts` | Dictionary of strings in English and Arabic, supporting bidirectional text rendering (`dir="ltr"` and `dir="rtl"`). |
| `/src/lib/timerEngine.ts` | Target-timestamp countdown logic, time formatting, progress calculation, and screen wake lock integration. |
| `/src/lib/soundEngine.ts` | Browser Web Audio API synthesizer for harmonic completion chimes and ambient noise filters. |
| `/src/lib/streakCalculator.ts` | 3+ daily sessions streak validation, timezone date conversion, and streak freeze deductions. |
| `/src/lib/coinsEngine.ts` | Coins economy, transaction auditing, and store inventory ledger. |
| `/src/lib/__tests__/` | Automated Vitest test suites verifying logic correctness across edge cases. |
| `/src/data/tests/catalog.ts` | Structured schemas for Saudi and International standardized tests with sections, score ranges, and target defaults. |
| `/src/components/common/` | Reusable primitives: `MaterialIcon.tsx` (Google Material Symbols), `SkeletonLoader.tsx`, `ShortcutsModal.tsx`. |
| `/src/components/focus/` | Timer display with SVG wavy progress ring and connected mode buttons, plus the task list manager. |
| `/src/components/plan/` | Category grid, session thresholds, and repeat cadence matrix. |
| `/src/components/tests/` | Standardized test catalog browser, active goals, countdowns, and score logging modal. |
| `/src/components/progress/` | Telemetry cards, 7-day consistency visualization, and achievement badges shelf. |
| `/src/components/friends/` | Study circles, 6-character code sharing, and weekly standings. |
| `/src/components/store/` | Rewards store for redeeming streak freezes, break multipliers, and palette tokens. |
| `/src/components/settings/` | Theme customizer, language toggle, durations config, and JSON/CSV export. |
| `/src/components/legal/` | Terms of Service (`TermsPage.tsx`) and Privacy Policy (`PrivacyPage.tsx`). |
| `/src/components/onboarding/` | 3-step skippable onboarding wizard for first-time visitors. |

---

## 3. Material 3 Expressive Tokens & Shape Scale

The color tokens conform strictly to Google Material Design 3 Expressive specifications:

```css
--md-sys-color-primary
--md-sys-color-on-primary
--md-sys-color-primary-container
--md-sys-color-on-primary-container
--md-sys-color-secondary
--md-sys-color-surface
--md-sys-color-surface-container-low
--md-sys-color-surface-container
--md-sys-color-surface-container-high
--md-sys-color-outline
--md-sys-color-outline-variant
```

### Shape Scale:
Rather than uniform pills, Focus Plan M3E adheres to the M3 shape hierarchy:
- **Extra Small (4px)**: Micro tags and indicators.
- **Small (8px)**: Segmented control tabs and action chips.
- **Medium (12px)**: Buttons, inputs, and category badges.
- **Large (16px)**: Connected button group ends and list rows.
- **Extra Large (24px - 28px)**: Cards, dialogue containers, and navigation rail anchors.
- **Full (9999px)**: Floating circular action triggers and segmented track capsules.

---

## 4. How to Extend the Codebase

### Adding a New Standardized Test
1. Open `/src/data/tests/catalog.ts`.
2. Append a new `StandardizedTestDefinition` object to `TEST_CATALOG`:
   ```ts
   {
     id: 'gre_general',
     code: 'GRE',
     nameEn: 'GRE General Test',
     nameAr: 'اختبار تقييم الخريجين (GRE)',
     category: 'international',
     minScore: 260,
     maxScore: 340,
     scoreUnit: 'Points',
     typicalPrepWeeks: 12,
     officialPortal: 'https://ets.org/gre',
     descriptionEn: 'Graduate record examination for masters and doctoral admissions.',
     descriptionAr: 'اختبار قياس القدرات للدراسات العليا والماجستير والدكتوراه.',
     sections: [
       { id: 'gre_verbal', nameEn: 'Verbal Reasoning', nameAr: 'الاستدلال اللفظي', minScore: 130, maxScore: 170, defaultTargetScore: 160 },
       { id: 'gre_quant', nameEn: 'Quantitative Reasoning', nameAr: 'الاستدلال الكمي', minScore: 130, maxScore: 170, defaultTargetScore: 165 },
     ],
   }
   ```
3. It will immediately appear in the catalog view with section breakdowns, target calculations, and portal links.

### Adding a New Language
1. Open `/src/i18n/translations.ts`.
2. Add your new language code to `Locale` (e.g. `export type Locale = 'en' | 'ar' | 'es'`).
3. Add the translated dictionary inside `TRANSLATIONS`.
4. In `useAppStore.ts` and `Shell.tsx`, the layout automatically applies `dir="ltr"` or `dir="rtl"` based on the locale definition.

---

## 5. Automated Testing Strategy

Vitest is configured for instantaneous unit testing. Run tests at any time with:
```bash
npx vitest run
```
Test suites located in `/src/lib/__tests__/` verify:
1. `timerEngine.test.ts`: Timestamp accuracy, MM:SS formatting, progress math, interval-based mode transitions.
2. `streakCalculator.test.ts`: 3+ session daily minimum, freeze consumption, 200%+ overachievement.
3. `coinsEngine.test.ts`: Purchase authorization, inventory incrementation, and audit transactions.
