# HANDOFF — Focus Plan M3E

## State (verified 2026-11-08, milestone 2b complete)

- Repo: Anonyoumss/Focus-Plan, branch main. Do not push.
- Stack: React 19 + Vite 8 + TS ~5.9 + Zustand + Tailwind v4 + Vitest 3.2.7 + Playwright 1.65 + ESLint flat config + `motion` + `animejs` + `@material/web`.
- Milestone 2a (honesty/bugs) and 2b (build) are done and verified. Next: milestone 3 (Firebase Spark: Auth, Firestore, rules, emulator, guest migration).

## Verified command results (post-2b)

- `npm run lint` (`tsc --noEmit`): pass. `npx eslint .`: 0 errors, 0 warnings.
- `npm test`: 5 files, 22 tests pass. `vitest.config.ts` excludes `e2e/`.
- `npm run build`: pass (~750 kB JS, ~36 kB CSS; chunk-size warning only).
- `npx playwright test`: 13/13 pass — 8 screenshot/overflow combos + 5 functional flows (`e2e/app-flows.spec.ts`: onboarding, timer start/pause/reload, store purchase, score entry, task create/edit/reorder).
- Reduced-motion: probed via Playwright `reducedMotion: 'reduce'` context — paused WavyRing path is static; without it the path animates. Not a committed spec.
- `npm audit`: 13 paths / 3 advisories, all dev-only. Accepted per owner; DECISIONS.md Decision 8. Do NOT run `npm audit fix --force`.

## What changed in 2b

- Hash router `src/lib/router.ts`: `#/` landing, `#/app/<tab>`, `#/terms`, `#/privacy`, `#/invite/<code>` placeholder. `App.tsx` parses hash on load + `hashchange`.
- `LandingPage` reuses real `TimerDisplay`, `TaskList`, `ProgressStatCards`, catalog list, footer Terms/Privacy, single primary CTA "Start focusing" → `#/app`.
- `WavyRing.tsx`: anime.js-driven SVG wave; reduced-motion freezes phase. `TimerDisplay` Start/Pause uses `motion.button` borderRadius spring + `AnimatePresence`, disabled under `useReducedMotion`.
- `@material/web` selective: `MdSwitch`, `MdSlider`, `MdSelect`-style select, `MdDialog`, `MdFilledButton` wrappers in `MdControls.tsx`; registered in `material-web.ts`, typed in `types/material-web.d.ts`. Gotcha: md-dialog children MUST be wrapped in `slot="content"` (Decision 15).
- Task reorder: HTML5 drag + up/down buttons (`moveTask` in store, `moveUp`/`moveDown` i18n keys). `N` shortcut dispatches `focus-plan:new-task`; TaskList opens the dialog and focuses the title input.
- Timer persistence: `isRunning` + `targetEndTime` persisted; reload recovery verified by Playwright.
- New i18n keys: `landing.*`, `invite.*`, `tasks.moveUp/moveDown`.
- Screenshots refreshed incl. `landing.png` and `invite.png` per combo.

## Known gaps / cautions

- Functional Playwright flows are EN-only; AR/RTL coverage is screenshots + overflow assertions.
- Pointer drag reorder compiled only; button reorder is browser-tested.
- `md-slider`/`md-select` not interaction-tested; they render in screenshots.
- Catalog unverified defaults (GAT/SAAT/STEP/Duolingo etc.) accepted by owner as flagged "verify on official site".
- `docs/original-brief.md` and `docs/ai-studio-plan.md` still not in repo (owner adding).
- TypeScript ~5.9 (typescript-eslint constraint). Revisit at milestone 3+.
- Landing header has a secondary "Open app" link besides the primary "Start focusing" CTA — intentional nav affordance, noted in FEATURE_PARITY.

## Commands

- Dev: `npm run dev` (port 3000). Unit: `npm test`. Lint: `npm run lint && npm run lint:eslint`. Build: `npm run build`. E2E: `npx playwright test` (Chromium installed).
