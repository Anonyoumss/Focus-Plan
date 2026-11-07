# Feature parity

Checked on milestone 4 (social groups, wallet, public profiles), 2026-11-08. Milestones 2a, 2b, and 3 remain in place.

Commands that ran:

- `npm install` succeeded. `npm audit` reports dev-only advisories (vitest/eslint chains plus firebase-tools). See DECISIONS.md Decisions 8 and 16. Vitest was not upgraded per owner decision; do NOT run `npm audit fix --force`.
- `npm run lint` (`tsc --noEmit`) exited 0. `npx eslint .` exited 0 with 0 errors, 0 warnings.
- `npm test` (Vitest 3.2.7, config `vitest.config.ts` excludes `e2e/`): 7 files, 39 tests, all passed.
- `npm run build` (Vite 8.3.6) exited 0.
- `npx playwright test` (`@playwright/test` 1.65.0, Chromium): 15 passed, 0 failed; both emulator specs self-skip without Firebase env vars.
- `npm run test:rules` (`firebase emulators:exec --only firestore`): 31/31 rules tests passed (`tests/rules/firestore.rules.test.ts`).
- `npm run test:e2e:firebase` (Auth + Firestore emulators + Playwright): 2/2 passed — the milestone 3 sign-in/migrate/sync/sign-out flow, plus the two-user groups spec (create, join by link and code, shared minutes, leaderboard order, hidden profile fields, rule-enforced store purchase).
- Emulator toolchain: `firebase-tools` 15.35.0 (devDependency), `firebase` JS SDK 13.1.0, `@firebase/rules-unit-testing` 6.0.0, Firestore emulator v1.22.0, Java 21.0.13 (Temurin JRE installed user-local at `~/tools/jdk-21.0.13+9-jre`; firebase-tools 15.x requires Java 21+).

Labels mean only what was run. A screen that rendered is not proof that its buttons do the real job.

Tomato is GPL-3.0. This repo does not copy that source. Pomofocus behavior below is the public product behavior, not a claim that `bermarte/pomofocus` implements it.

## Verified in browser

Playwright opened the app in all 8 combinations (en/ar × light/dark × 360px/1280px) with a horizontal-overflow assertion, plus functional flows in `e2e/app-flows.spec.ts` (English, light, desktop viewport).

| What was checked | Result |
| :--- | :--- |
| Hash routes | `#/` landing, `#/app` and `#/app/<tab>` app screens, `#/terms`, `#/privacy`, `#/invite/<code>` placeholder. Deep links and reloads resolve via `parseHashRoute` in `src/lib/router.ts`; unknown paths fall back to landing. Verified by direct navigation in probes and the screenshot suite (`/#/app` entry point). |
| Landing page | Renders the real `TimerDisplay`, `TaskList`, and `ProgressStatCards` components, a tests section listing the real catalog with official-site links, and a footer with Terms/Privacy. One primary CTA "Start focusing" navigates to `#/app` with no login. Header also has a small secondary "Open app" link. No gradients, emojis, card grids, or fake content. |
| Invite route | `#/invite/<code>` is real: resolves the code via `inviteCodes`, shows the group name, offers Google sign-in for guests, and joins on click (verified in the two-user emulator spec). Invalid codes show an honest error state. |
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
| Friends/groups screen (guest) | Signed-out users see a sign-in prompt; no demo data is shown. Screenshot captured in all 8 combinations. |
| Groups end-to-end (emulator) | `e2e/groups-emulator.spec.ts`: user A creates a group (real Firestore docs + 6-char invite code), user B joins via `#/invite/<code>` link, leaves via UI, rejoins by typing the code, shared 25-minute group session appears on the leaderboard with B ranked above A, public profile written with `shareStreak:false` is readable by A with the `streak` key absent, and a signed-in store purchase debits the rule-enforced wallet (60 migrated coins − 10 = ~50). |
| Guest mode without Firebase config | With no `VITE_FIREBASE_*` vars the app boots cleanly, Settings shows "Cloud sync is not configured", and the sign-in button is absent (Playwright probe, no console errors). |
| Firebase sign-in (emulator) | `npm run test:e2e:firebase` drives the real popup flow against the Auth emulator: "Add new account" → email → "Sign in with Google.com" → popup closes → app shows "Signed in as". |
| Guest-to-cloud migration | First sign-in with local data shows the "Merge your data" dialog (never silent). "Import device data" pushes the local slice to Firestore, writes `meta/migration`, and enables sync. Repeated/reload sign-ins do not re-prompt (marker check). Verified in the emulator e2e. |
| Cloud sync persistence | Task created while signed in appears in Firestore and survives `page.reload()`; the migrated guest task also persists. Sign-out wipes the previous user's tasks from screen and from `localStorage`. |
| Firestore Security Rules | 31 emulator tests: cross-user read/write denied, unauthenticated denied, invalid cadence/oversized title/settings shape denied, append-only session logs and group sessions, tombstone deletes, wallet nonzero-create denied, balance edit without ledger row denied, catalog-price spend with matching ledger row allowed, non-catalog amount denied, focus-point deltas checked, purchase replay denied, oversized award denied, ledger rows immutable, group membership isolation (non-member read denied, no adding arbitrary members), private profile owner-only, public profile/leaderboard field whitelists, createGroup batch shape. |

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
| Group stats: day/week period keys, ISO week boundaries, leaderboard ranking (minutes → focus points → streak), award walk-back windows (7 days / 4 weeks), per-member minute sums | `src/lib/__tests__/groupStats.test.ts` |
| Sync merge: offline edit survives pull, two-device convergence, tombstone delete propagation, older-tombstone rejection, idempotent re-merge, remote-only adds, settings last-write-wins | `src/lib/__tests__/syncMerge.test.ts` |

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
- Group member alias editing, group rename, group deletion by non-last-owner, ownership-transfer edge cases beyond the tested leave flow.
- Group award claiming in the browser (runs on sign-in via `adoptWalletAndClaimAwards`; exercised indirectly — the two-user spec signs in twice but does not assert award docs). Rules-tested shapes only.
- Public board stat freshness: `weeklyMinutes`/`streak` are written when the member saves profile settings, not continuously recomputed.
- Goal and test-date reminders (in-app Notifications API). Moved to milestone 5; scheduled push is later work.
- Chrome theme reading. Pages cannot read it.

## Fixed in milestone 4 (social + store backend)

- Real groups (`src/lib/firebase/groups.ts`, `src/components/friends/FriendsView.tsx`): create with 6-char invite code, join by code or `#/invite/<code>` link, member roster, leave with ownership transfer, shared group tasks, per-member focus-minute logging on pomodoro completion, day/week leaderboard.
- Group awards: lazy daily (+1 FP) / weekly (+7 FP) claims via create-only docs in one transaction (Decision 20); walk-back window 7 days / 4 weeks.
- Wallet + ledger in Firestore: session earns mirror via `creditWallet`, purchases go through `spendCoins` in a transaction, guest balances migrate in rule-capped chunks on first sign-in (`reconcileWallet`).
- Public profile projection + opt-in public leaderboard (Decision 21); private profile stays owner-only.
- `firestore.rules` extended: groups/members/tasks/sessions/inviteCodes/memberships, groupAwards, profile/public, publicLeaderboard, wallet FP deltas and purchase replay protection. 31 emulator rules tests.
- `syncMerge.ts` conflict fix (step 0): per-record `updatedAt` + tombstones so deletes sync and offline edits are never overwritten by older cloud state.
- Demo friends data and the "Local Demo" label removed; guests see a sign-in prompt instead.
- Terms/Privacy describe groups, member-visible data, public-board opt-in/opt-out, and the honor-system limitation (Decision 22).
- Two-user emulator Playwright spec `e2e/groups-emulator.spec.ts`.

## Fixed in milestone 3 (Firebase, emulator-first)

- Firebase JS SDK 13.1.0 modular client (`src/lib/firebase/client.ts`) gated entirely on `VITE_FIREBASE_*` env vars; guest mode with zero config, no crashes, sign-in hidden.
- Google sign-in (`auth.ts`, `signInWithPopup` + `GoogleAuthProvider`), sign-out that wipes the previous user's local data (`wipeUserData` in `useAppStore.ts`), auth loading handled before the shell renders.
- Firestore sync (`sync.ts`, `cloudSync.ts`): tasks, sessionLogs, testGoals, templates, settings under `users/{uid}/...`; 800ms debounced push with signature diffing; pull on sign-in; Firestore offline persistence enabled.
- Guest-to-cloud migration dialog (`MigrationDialog.tsx`): explicit import/cloud/later choice, idempotent writes keyed by entity id, `meta/migration` completion marker so reloads do not re-prompt (Decision 18).
- `firestore.rules` + 14 emulator rules tests covering isolation, shape/size validation, append-only logs, and the ledger-gated wallet model (Decision 17).
- Terms/Privacy updated to describe only what exists: Google sign-in and Firestore sync. No friends/leaderboard claims.
- Playwright emulator spec `e2e/firebase-emulators.spec.ts` (sign-in, migrate, sync, reload, sign-out) run via `npm run test:e2e:firebase`.

## Added in milestone 5

- Task templates: save one task or the whole open-task list as a named template, apply (materializes fresh tasks), rename, delete; synced via `users/{uid}/templates` with tombstones (`src/lib/templates.ts`, Settings templates card). Playwright: `e2e/m5-features.spec.ts` + emulator round-trip `e2e/templates-emulator.spec.ts` (Verified in browser).
- JSON and CSV task import with strict validation — malformed files rejected without crashing; CSV export of the task list (`src/lib/dataPort.ts`, Settings import card). Verified in browser (import spec).
- Tick sound toggle + volume in Settings, played from `tickTimer` only while the timer runs; ambient audio stops on route change out of `/app` (`soundEngine`, `App.tsx`). Unit-tested logic paths; Verified in browser via AudioContext spy (tick on run only, ambient stops on route change).
- In-app reminders (Decision 23): enable toggle, quiet hours, notification permission flow; unit tested (`reminders.test.ts`), Verified in browser via injected-clock spec (fires once, quiet hours, cooldown, hidden tab, denied path).
- Reports: weekly report modal generalized to week OR month periods with older/newer navigation (8 weeks / 12 months back), daily breakdown across the period, CSV export and print-to-PDF. Verified in browser: month mode, older periods, CSV BOM+Arabic, PDF content checked via pdftotext.
- Editable test sections: add/rename/remove sections, min/max ranges, per-section targets, validation (min < max, target within range), custom badge, "restore catalog"; works for catalog and custom tests (`src/lib/testSections.ts`, `EditSectionsModal.tsx`, custom-test goal button). Verified in browser (sections spec).
- Score loop uses resolved (custom-aware) sections; score attempt logging and adjusted-plan suggestion already existed and now respect custom sections. Verified in browser end-to-end incl. custom sections and recommendation apply.

## Hardened in post-M5 pass

- Score loop end-to-end (Verified in browser, `e2e/m6-hardening.spec.ts`): post-test-date "Log your score" prompt opens the entry form; per-section scores persist; percent-of-goal per section; SVG history chart against the goal line; apply-recommendation updates weekly pomodoros; custom-sections goal covered.
- Reports (Verified in browser): month mode + older/newer navigation driven; CSV export asserted UTF-8 BOM + Arabic content; real PDFs generated via page.pdf and content-checked with pdftotext (EN totals/daily table, AR RTL content); print-emulation screenshots saved.
- Reminders (Verified in browser): reminder loop driven via injected clock — fires once per cooldown window, suppressed by quiet hours and hidden tab, blocked when permission denied; Settings shows a clear denied message.
- Arabic functional flows (Verified in browser): templates save/apply, CSV import, reminders + tick switches, sections modal — all driven in `locale=ar` RTL.
- Template cloud sync (Verified in browser on emulators, `e2e/templates-emulator.spec.ts`): save on device A appears on device B (same account), rename propagates, delete propagates as tombstone. Found and fixed a real bug: `persistState` sent `taskTemplates` where the sync layer expected `templates`, so cloud template writes were always empty.
- Sounds (Verified in browser, `e2e/m6-sounds.spec.ts`): AudioContext spied — tick oscillators created only while timer runs, none after pause; ambient buffer source stopped on route change. Found and fixed: tick settings were not restored from persisted state.

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
