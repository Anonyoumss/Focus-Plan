# HANDOFF — Focus Plan M3E

## State (verified 2026-11-07, milestone 2a complete)

- Repo: Anonyoumss/Focus-Plan, branch main. Do not push.
- Stack: React 19 + Vite 8 + TS ~5.9 + Zustand + Tailwind v4 + Vitest 3.2.7 + Playwright 1.65 + ESLint flat config. No router, no Firebase yet.
- Milestone 2a (honesty and bugs) is done and verified. Next: milestone 2b (hash routes, landing page, wavy ring, Start/Pause morph, @material/web, anime.js, task reorder + N shortcut).

## Verified command results (post-2a)

- `npm run lint` (`tsc --noEmit`): pass. `npx eslint .`: 0 errors, 0 warnings.
- `npm test`: 5 files, 22 tests pass. `vitest.config.ts` excludes `e2e/`.
- `npm run build`: pass (~458 kB JS, ~35 kB CSS).
- `npx playwright test`: 8/8 pass including a 360px horizontal-overflow assertion. Screenshots refreshed in `docs/screenshots/`.
- `npm audit`: 13 paths / 3 advisories, all dev-only (vitest chain + eslint's minimatch). Accepted per owner; see DECISIONS.md Decision 8. Do NOT run `npm audit fix --force`.

## What changed in 2a

- Empty defaults; labeled "Load demo data" button in Settings (`loadDemoData`, persisted `demoDataLoaded` flag).
- Progress: real `sessionLogs` durations for total focus; week row computed from real logs; badge `descKey` resolved via `lookupTranslationString`.
- i18n: `getCategoryLabel`, `getCadenceLabel`, `lookupTranslationString` helpers; `hourly` cadence added end-to-end; EN/AR parity test in `src/i18n/__tests__/translations.test.ts`.
- Phone nav: bottom bar = Focus, Plan, Tests, Progress, More (sheet with Friends, Store, Settings). Desktop rail unchanged.
- 360px overflow fixed: ambient select constrained, Start row wraps, `.material-symbols-rounded` gets `overflow: hidden` (ligature fallback no longer widens layout).
- Charts: flat tonal fills, no `linearGradient`. Onboarding: scrim only, no blur.
- Terms/Privacy: local-only wording; no leaderboard claim; Terms says scheduled push/Calendar reminders are not shipped. Goal/test-date reminders moved to milestone 5.
- Catalog: `sourceUrls` + `unverifiedFields` per test; "Verify on official site" chip in UI; no prefilled dates. Only officially-confirmed URLs filled (SAT, ACT scores, IELTS, TOEFL scores, KFUPM dates).
- Deps removed: `@google/genai`, `dotenv`, `express`, `tsx`, `@types/express`, `canvas-confetti`. `motion` kept for 2b. `.env.example` has no GEMINI_API_KEY.
- ESLint added; `typescript` pinned ~5.9 (typescript-eslint can't parse TS 7) — DECISIONS.md Decision 9.
- `docs/cursor-plan.md` committed from `.cursor/` plan.

## Known gaps / cautions

- Catalog sections for unverified tests are editable defaults flagged "verify on official site", not confirmed facts. Saudi score scales unconfirmed.
- Store purchase, score entry, task edit flow, sounds, wake lock, export: compiled only, not browser-verified.
- `docs/original-brief.md` and `docs/ai-studio-plan.md` are being added by the owner; they are not in the repo yet.
- TypeScript is ~5.9, not 7.x — required by typescript-eslint. Revisit when TS-eslint supports 7.

## Commands

- Dev: `npm run dev` (port 3000). Unit: `npm test`. Lint: `npm run lint && npm run lint:eslint`. Build: `npm run build`. E2E: `npx playwright test` (Chromium already installed).
