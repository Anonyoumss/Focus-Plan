# Feature parity

Checked on milestone 3 (Firebase, emulator-first), 2026-11-08. Milestones 2a and 2b remain in place.

Commands that ran:

- `npm install` succeeded. `npm audit` reports dev-only advisories (vitest/eslint chains plus firebase-tools). See DECISIONS.md Decisions 8 and 16. Vitest was not upgraded per owner decision; do NOT run `npm audit fix --force`.
- `npm run lint` (`tsc --noEmit`) exited 0. `npx eslint .` exited 0 with 0 errors, 0 warnings.
- `npm test` (Vitest 3.2.7, config `vitest.config.ts` excludes `e2e/`): 5 files, 22 tests, all passed.
- `npm run build` (Vite 8.3.6) exited 0.
- `npx playwright test` (`@playwright/test` 1.65.0, Chromium): 15 passed, 0 failed; `e2e/firebase-emulators.spec.ts` self-skips without Firebase env vars.
- `npm run test:rules` (`firebase emulators:exec --only firestore`): 14/14 rules tests passed (`tests/rules/firestore.rules.test.ts`).
- `npm run test:e2e:firebase` (Auth + Firestore emulators + Playwright): 1/1 passed — Google sign-in via the emulator popup, guest-data migration dialog, task create + cloud sync, reload persistence, sign-out wiping on-screen and persisted data.
- Emulator toolchain: `firebase-tools` 15.35.0 (devDependency), `firebase` JS SDK 13.1.0, `@firebase/rules-unit-testing` 6.0.0, Firestore emulator v1.22.0, Java 21.0.13 (Temurin JRE installed user-local at `~/tools/jdk-21.0.13+9-jre`; firebase-tools 15.x requires Java 21+).

Labels mean only what was run. A screen that rendered is not proof that its buttons do the real job.

Tomato is GPL-3.0. This repo does not copy that source. Pomofocus behavior below is the public product behavior, not a claim that `bermarte/pomofocus` implements it.

## Verified in browser

Playwright opened the app in all 8 combinations (en/ar × light/dark × 360px/1280px) with a horizontal-overflow assertion, plus functional flows in `e2e/app-flows.spec.ts` (English, light, desktop viewport).

| What was checked | Result |
| :--- | :--- |
| Hash routes | `#/` landing, `#/app` and `#/app/<tab>` app screens, `#/terms`, `#/privacy`, `#/invite/<code>` placeholder. Deep links and reloads resolve via `parseHashRoute` in `src/lib/router.ts`; unknown paths fall back to landing. Verified by direct navigation in probes and the screenshot suite (`/#/app` entry point). |
| Landing page | Renders the real `TimerDisplay`, `TaskList`, and `ProgressStatCards` components, a tests section listing the real catalog with official-site links, and a footer with Terms/Privacy. One primary CTA "Start focusing" navigates to `#/app` with no login. Header also has a small secondary "Open app" link. No gradients, emojis, card grids, or fake content. |
| Invite route | `#/invite/DEMO-GROUP-7` renders "Group invites are not open yet" placeholder; screenshot captured in all 8 combinations. |
| Onboarding | New users see the modal; "Skip Setup" dismisses it (Playwright). |
| Timer start / pause / reload | Start Focus becomes Pause Timer; pausing restores Start. After restart + `page.reload()`, the Pause button returns and persisted state shows `isRunning: true` with `targetEndTime` set. Recovery is driven by the persisted `targetEndTime`, not a fresh duration. |
| Expired timer exactly-once | Seeded `isRunning: true` with a `targetEndTime` 10s in the past (simulating expiry while the tab was closed). On load the session completed once: 1 session log, coins 10→11, 1 transaction, `isRunning` false. After a second reload the counts were unchanged — no double award. |
| `N` shortcut scope | On `#/` (landing, TaskList mounted but Shell absent) pressing `n` opened no dialog. On `#/app/focus` it opened the new-task dialog. |
| Wavy ring | While running, the SVG path `d` attribute is populated (325 chars) and animates. With `page.emulateMedia({ reducedMotion: 'reduce' })` (Chromium `reducedMotion: 'reduce'` context), the paused ring path is byte-identical across 1.6s samples; without it the path keeps changing. Tested via a Playwright probe, not a committed spec. |
| Start/Pause morph | `motion.button` animates `borderRadius` 999 to 20 with a spring (`stiffness 420, damping 32`); icon crossfades via `AnimatePresence`. `useReducedMotion()` switches the spring to `duration: 0` and disables icon transitions. Computed radius while running: 20px. |
| Store purchase | Seeded 50 coins, bought the 10-coin streak freeze via the Material Web filled button: coins became 40 and `inventory.streak_freeze` became 1 in persisted state. |
| Score entry | Seeded SAT goal, opened Score Loop, logged a 1400 attempt: `currentBaselineScore` became 1400 and `scoresHistory` gained one entry. |
| Task create / edit / reorder | `N` key opens the new-task dialog; created two tasks, edited one via its edit button, moved it up with the "Move task up" button; persisted `tasks` order verified. `md-dialog` required `slot="content"` wrapping (fixed in `MdControls`). |
| Material Web controls | `md-switch` in Settings toggles `selected` on click. `md-dialog` opens on `N`, closes on Escape. `md-filled-button` drives store purchase. Rendered in AR screenshots with no overflow; no RTL-specific defect observed, so no custom fallback was needed. |
| `lang`/`dir`, theme, overflow | Unchanged from 2a; still asserted in all 8 combinations including the new landing and invite screenshots. |
| Friends screen, progress real data, Arabic phone, empty default state | Unchanged from 2a, still verified. |
| Guest mode without Firebase config | With no `VITE_FIREBASE_*` vars the app boots cleanly, Settings shows "Cloud sync is not configured", and the sign-in button is absent (Playwright probe, no console errors). |
| Firebase sign-in (emulator) | `npm run test:e2e:firebase` drives the real popup flow against the Auth emulator: "Add new account" → email → "Sign in with Google.com" → popup closes → app shows "Signed in as". |
| Guest-to-cloud migration | First sign-in with local data shows the "Merge your data" dialog (never silent). "Import device data" pushes the local slice to Firestore, writes `meta/migration`, and enables sync. Repeated/reload sign-ins do not re-prompt (marker check). Verified in the emulator e2e. |
| Cloud sync persistence | Task created while signed in appears in Firestore and survives `page.reload()`; the migrated guest task also persists. Sign-out wipes the previous user's tasks from screen and from `localStorage`. |
| Firestore Security Rules | 14 emulator tests: cross-user read/write denied, unauthenticated denied, invalid cadence/oversized title/settings shape denied, append-only session logs, wallet nonzero-create denied, balance edit without ledger row denied, catalog-price spend with matching ledger row allowed, non-catalog amount denied, oversized award denied, ledger rows immutable. |

Not exercised in the browser: completing a pomodoro end-to-end (session log write on finish), sounds, notifications, wake lock, export downloads, print, drag-and-drop reorder by pointer (keyboard/button path tested; HTML5 drag handlers are compiled only), Join.

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

- Timer mode buttons beyond focus, duration settings, auto-start flags, task delete/clear, estimated versus completed counts.
- Web Audio synth, document title updates, Notification API call, Wake Lock call.
- Keyboard listeners for Space, R, S, 1, 2, 3, `?`, and `N`. `N` is verified end-to-end including its `/app`-only scope; the other shortcuts remain untested in the browser.
- Pointer-based drag reorder (`draggable` + drag events in `TaskList`). The up/down buttons cover the same `moveTask` store action.
- JSON and CSV task export from Settings. No import.
- Seed colors through `@material/material-color-utilities`.
- Print stylesheet in `WeeklyReportModal.tsx`. No PDF file writer.
- Skeleton component. The Progress refresh button shows it for 400ms. Charts do not use it for their first paint.
- PWA `manifest.json` with `start_url: "/#/app"` so installed PWAs open the app, not the landing page. No service worker file.
- ESLint flat config (`eslint.config.js`, `npm run lint:eslint`).
- `MdSlider` (timer duration sliders) and `MdSelect` (ambient sound) wrappers exist; the slider was not driven in the browser, the select renders in screenshots.
- `anime.js` drives the WavyRing phase loop; `motion` drives the button morph. Both verified visually/via DOM probes above.

## Not in this codebase

- Path-based URL routes. Routing is hash-based (`#/...`); a static host serves `index.html` for any path, and deep links/refresh work through the hash parser.
- Real Firebase project wiring. Everything was verified against the Emulator Suite with demo config; no production Firebase project exists yet. App Check is a documented placeholder, not implemented.
- Multi-device conflict resolution beyond last-write-wins per document. Offline edits made while signed in can be overwritten by a cloud pull on the next sign-in (DECISIONS.md).
- Google Tasks, Google Calendar, Gemini, FCM.
- Per-topic timer lengths.
- Real friend groups, working invite links, shared tasks, public leaderboard, or profile privacy. The invite route is a placeholder.
- Goal and test-date reminders (in-app Notifications API). Moved to milestone 5; scheduled push is later work.
- Chrome theme reading. Pages cannot read it.

## Fixed in milestone 3 (Firebase, emulator-first)

- Firebase JS SDK 13.1.0 modular client (`src/lib/firebase/client.ts`) gated entirely on `VITE_FIREBASE_*` env vars; guest mode with zero config, no crashes, sign-in hidden.
- Google sign-in (`auth.ts`, `signInWithPopup` + `GoogleAuthProvider`), sign-out that wipes the previous user's local data (`wipeUserData` in `useAppStore.ts`), auth loading handled before the shell renders.
- Firestore sync (`sync.ts`, `cloudSync.ts`): tasks, sessionLogs, testGoals, templates, settings under `users/{uid}/...`; 800ms debounced push with signature diffing; pull on sign-in; Firestore offline persistence enabled.
- Guest-to-cloud migration dialog (`MigrationDialog.tsx`): explicit import/cloud/later choice, idempotent writes keyed by entity id, `meta/migration` completion marker so reloads do not re-prompt (Decision 18).
- `firestore.rules` + 14 emulator rules tests covering isolation, shape/size validation, append-only logs, and the ledger-gated wallet model (Decision 17).
- Terms/Privacy updated to describe only what exists: Google sign-in and Firestore sync. No friends/leaderboard claims.
- Playwright emulator spec `e2e/firebase-emulators.spec.ts` (sign-in, migrate, sync, reload, sign-out) run via `npm run test:e2e:firebase`.

## Fixed in milestone 2b (was missing in the 2a audit)

- Hash router with landing, app tabs, terms, privacy, and invite placeholder (`src/lib/router.ts`, `src/App.tsx`).
- Landing page reusing real app components with footer links.
- Wavy SVG progress ring (`WavyRing.tsx`, anime.js) and Start/Pause shape morph (`motion`), both reduced-motion aware.
- Selective `@material/web` integration: switches, sliders, selects, dialogs, buttons in settings/store/timer/task dialog. Custom components kept where Material Web has no equivalent or where RTL was unverified.
- Task reorder (drag + up/down buttons) and the `N` new-task shortcut.
- `md-dialog` content-slot fix: children must be wrapped in `slot="content"` or the dialog renders empty.
- Playwright functional suite (`e2e/app-flows.spec.ts`) covering onboarding, timer lifecycle incl. reload recovery and expired-timer exactly-once, `N` route scoping, store purchase, score entry, and task create/edit/reorder.

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

- `npm audit` dev-chain findings remain by owner decision (DECISIONS.md Decision 8); installing `firebase-tools` 15.35.0 raised the count — still dev-only, still no `--force` fix.
- Catalog sections for unverified tests (GAT, SAAT, STEP, KFUPM Early SAAT, ACT sections, TOEFL sections, Duolingo) are plausible defaults flagged "verify on official site", not confirmed data. Saudi test score scales are unconfirmed. Owner accepted these as flagged.
- Dialogs still use `shadow-xl`/`shadow-2xl`; some cards still use `rounded-2xl`/`rounded-3xl` rather than the full varied shape scale.
- `.env.example` documents the `VITE_FIREBASE_*` keys (empty) and `VITE_USE_EMULATORS`; real values go in `.env.local` (gitignored).
- Functional Playwright flows run in English only; Arabic/RTL coverage is screenshot + overflow assertions.
- `md-dialog`/`md-slider`/`md-select` RTL behavior was checked via rendered screenshots without dedicated interaction tests.
