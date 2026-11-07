# Feature parity

Checked on milestone 2a (honesty and bugs), 2026-11-07.

Commands that ran:

- `npm install` succeeded. `npm audit` reports 13 vulnerability paths collapsing to 3 advisories, all dev-only. See DECISIONS.md Decision 8. Vitest was not upgraded per owner decision.
- `npm run lint` (`tsc --noEmit`) exited 0. `npx eslint .` exited 0 with 0 errors, 0 warnings.
- `npm test` (Vitest 3.2.7, config `vitest.config.ts` excludes `e2e/`): 5 files, 22 tests, all passed.
- `npm run build` (Vite 8.3.6) exited 0.
- `npx playwright test` (`@playwright/test` 1.65.0, Chromium): 8 passed, 0 failed. Each run asserts `document.documentElement.scrollWidth <= viewport width + 1` at 360px and 1280px. Screenshots are in `docs/screenshots/`.

Labels mean only what was run. A screen that rendered is not proof that its buttons do the real job.

Tomato is GPL-3.0. This repo does not copy that source. Pomofocus behavior below is the public product behavior, not a claim that `bermarte/pomofocus` implements it.

## Verified in browser

Playwright opened `/` with stored `locale` and `themeMode`, at 1280x800 and 360x740, English and Arabic, light and dark, including a horizontal-overflow assertion.

| What was checked | Result |
| :--- | :--- |
| App shell, onboarding, and Skip | Onboarding rendered. Skip removed it. Overlay is a plain `bg-black/60` scrim; `backdrop-blur-xs` removed. |
| `lang` and `dir` | `en`/`ltr` and `ar`/`rtl` matched the stored locale. |
| Dark theme class | `html` had class `dark` when `themeMode` was `dark`. |
| Tabs | Focus, Plan, Tests, Progress, Friends render in every combination. On phone the bottom bar shows Focus, Plan, Tests, Progress, and a More sheet containing Friends, Store, and Settings. Desktop rail shows all destinations. Store is reachable on phone through More. |
| Horizontal overflow | None at 360px or 1280px in all 8 combinations. Fixed: ambient-sound select, Start button row wrap, Material Symbols ligature fallback text clipped via `overflow: hidden`. |
| Start control | English, light, desktop only: Start Focus became Pause Timer. The countdown itself was not timed. |
| Friends screen | Visible copy says the circle and standings are local demo data. |
| Progress screen | Total focus hours now sums real `sessionLogs` durations. The week row is computed from real session logs (3+ sessions marks a streak day). Badge descriptions resolve through `lookupTranslationString` across namespaces; `streakRuleNotice` no longer renders as a raw key. |
| Arabic phone Focus | Rendered RTL with no horizontal overflow. Category names in task rows are translated via `getCategoryLabel`. Bottom bar no longer covers content (`pb-20` on the content column). |
| Empty default state | Fresh profile seeds zero tasks, goals, streak, coins, and session logs. Verified by code inspection (`tasks: []`, `testGoals: []`, `sessionLogs: []`, streak/coins zeroed); the Playwright suite seeds only locale/theme/onboarding keys. |

Not exercised in the browser: completing a pomodoro end-to-end, editing a task, sounds, notifications, wake lock, export downloads, store purchase, score entry, print, keyboard shortcuts, or Join. The "Load demo data" button was not clicked in the browser; it is covered by code inspection only.

## Unit tested only

These passed in Vitest. They were not driven in the browser.

| Behavior | Test file |
| :--- | :--- |
| Remaining seconds, `MM:SS`, progress ratio, next mode after 4 focus sessions | `src/lib/__tests__/timerEngine.test.ts` |
| Goal percent including 8/4 = 200. Streak does not advance at 2 sessions. Streak advances at 3. A missed day uses one freeze or resets the streak. | `src/lib/__tests__/streakCalculator.test.ts` |
| Purchase allowed only when coins cover the price. Streak-freeze purchase writes a spend transaction. `awardPoints` adds coins. | `src/lib/__tests__/coinsEngine.test.ts` |
| Session time filter, week bars, category percentages, estimated-vs-actual ratio, score-loop gaps, CSV quoting | `src/lib/__tests__/analyticsEngine.test.ts` |
| EN/AR translation key parity, badge key resolution (`streakRuleNotice` found under `streaks`), helper lookups | `src/i18n/__tests__/translations.test.ts` |

The streak tests use the dates written in that file. They do not prove the live clock or timezone.

## Compiled only

Present in source and included in the production build. Not verified by the checks above.

- Timer mode buttons, duration settings, auto-start flags, task add/edit/delete/clear, estimated versus completed counts.
- Web Audio synth, document title updates, Notification API call, Wake Lock call.
- Keyboard listeners for Space, R, S, 1, 2, 3, and `?`. There is no `N` listener.
- JSON and CSV task export from Settings. No import.
- Seed colors through `@material/material-color-utilities`.
- Test catalog cards and score-loop modal. `sourceUrls` and `unverifiedFields` are rendered in the catalog UI; only URLs confirmed against official pages are filled (SAT, ACT scores, IELTS, TOEFL scores, KFUPM dates). etec.gov.sa and englishtest.duolingo.com could not be confirmed, so GAT/SAAT/STEP/Duolingo fields are flagged unverified and the UI shows "Verify on official site". Section lists for unverified tests remain as editable defaults, not confirmed facts.
- Print stylesheet in `WeeklyReportModal.tsx`. No PDF file writer.
- Skeleton component. The Progress refresh button shows it for 400ms. Charts do not use it for their first paint.
- PWA `manifest.json`. No service worker file.
- ESLint flat config (`eslint.config.js`, `npm run lint:eslint`).

## Not in this codebase

- URL routes `/terms` and `/privacy`. Those screens are tab state.
- Landing page.
- `@material/web`, `anime.js`. `motion` is installed and not imported.
- Wavy progress ring and a shape-morphing Start control. The timer SVG is a circular dash offset.
- Firebase Auth, Firestore, rules, or emulator tests.
- Google Tasks, Google Calendar, Gemini, FCM.
- Task drag reorder, per-topic timer lengths.
- Real friend groups, invite links, shared tasks, public leaderboard, or profile privacy.
- Goal and test-date reminders (in-app Notifications API). Moved to milestone 5; scheduled push is later work.
- Chrome theme reading. Pages cannot read it.

## Fixed in milestone 2a (was broken in the Step 0 audit)

- Fake default data removed; demo data is opt-in via Settings.
- `npm test` no longer collects Playwright specs (`vitest.config.ts`).
- Badge raw-key bug fixed; EN/AR parity test added.
- Progress total focus uses real session durations; dummy `daysOfWeek` row replaced with computed values.
- Gradient chart fill removed (flat tonal fills); onboarding backdrop blur removed.
- Store reachable on phone via More sheet.
- Arabic 360px overflow fixed; category names translated.
- Terms/Privacy rewritten for local-only reality; Privacy no longer claims a public leaderboard; Terms states scheduled push reminders are not shipped.
- Unused deps removed (`@google/genai`, `dotenv`, `express`, `tsx`, `@types/express`, `canvas-confetti`); `GEMINI_API_KEY` removed from `.env.example`.
- `hourly` added to the cadence union, form, and translations.
- Horizontal-overflow regression assertion added to the Playwright suite.

## Remaining known issues

- `npm audit` dev-chain findings remain by owner decision (DECISIONS.md Decision 8).
- Catalog sections for unverified tests (GAT, SAAT, STEP, KFUPM Early SAAT, ACT sections, TOEFL sections, Duolingo) are plausible defaults flagged "verify on official site", not confirmed data. Saudi test score scales are unconfirmed.
- Dialogs still use `shadow-xl`/`shadow-2xl`; some cards still use `rounded-2xl`/`rounded-3xl` rather than the full varied shape scale.
- `.env.example` no longer documents any keys; Firebase config keys arrive in milestone 3.
- No `docs/original-brief.md` or `docs/ai-studio-plan.md` in repo yet (owner adding them).
