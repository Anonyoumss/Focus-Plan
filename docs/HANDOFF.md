# HANDOFF — Focus Plan M3E

## State (verified 2026-11-08, milestone 4 complete)

- Repo: Anonyoumss/Focus-Plan, branch main. Milestone 4 committed locally; do not push unless asked.
- Stack: React 19 + Vite 8 + TS ~5.9 + Zustand + Tailwind v4 + Vitest 3.2.7 + Playwright 1.65 + ESLint flat config + `motion` + `animejs` + `@material/web` + `firebase` 13.1.0.
- Milestones 2a (honesty), 2b (build), 3 (Firebase emulator-first), and 4 (social/store backend) are done and verified. Next: milestone 5 (study tools) or 6 (publish) per owner.

## Verified command results (post-4)

- `npm run lint` (`tsc --noEmit`): pass. `npx eslint .`: 0 errors, 0 warnings.
- `npm test`: 7 files, 39 tests pass. `vitest.config.ts` excludes `e2e/`.
- `npm run build`: pass (~750 kB JS chunk warning only).
- `npx playwright test`: 15/15 pass; both emulator specs self-skip without Firebase env.
- `npm run test:rules`: 31/31 Firestore rules tests pass (project `demo-focus-plan-test`).
- `npm run test:e2e:firebase`: 6/6 pass — sign-in/migrate/sync/sign-out (asserts clean storage/IDB/UI after reload), sign-out-then-different-user, two-user groups flow (create group, join by invite link and by code, shared 25-min session on leaderboard, hidden public-profile fields, rule-enforced store purchase).
- `npm audit`: dev-only advisories (vitest/eslint chains + firebase-tools deps). Accepted per owner; DECISIONS.md Decisions 8 and 16. Do NOT run `npm audit fix --force`.

## Emulator prerequisites (already installed on this machine)

- `firebase-tools` 15.35.0 is a devDependency (`npx firebase`). It requires **Java 21+**; Java 17 fails with "firebase-tools no longer supports Java version before 21".
- Java 21.0.13 (Temurin JRE) is installed user-local at `~/tools/jdk-21.0.13+9-jre` — no sudo. Prefix commands:
  `JAVA_HOME=~/tools/jdk-21.0.13+9-jre PATH=~/tools/jdk-21.0.13+9-jre/bin:$PATH`
- First emulator run downloads `cloud-firestore-emulator-v1.22.0.jar` into `~/.cache/firebase/emulators`.
- Emulator ports (firebase.json): Auth 9099, Firestore 8080, UI 4000. Demo project IDs: `demo-focus-plan-test` (rules tests), `demo-focus-plan-m3e` (app e2e).

## Firebase console setup (only needed for a REAL project — everything above works without it)

1. console.firebase.google.com → Add project → name it (e.g. `focus-plan`), Spark plan (free). No need to enable Analytics.
2. Project settings → Your apps → `</>` Web → register app (any nickname). Copy the config values.
3. Authentication → Sign-in method → enable **Google** provider (support email required).
4. Authentication → Settings → Authorized domains: add `localhost` and `anonyoumss.github.io` (GitHub Pages). Firebase auth domains also allow `*.firebaseapp.com` by default.
5. Firestore → create database (production mode, closest region) → Rules tab: paste `firestore.rules` from repo and publish. The rules now cover groups, profiles, public board, awards, and wallet — publish the current file, not an older copy.
6. Put the web config in `.env.local` (gitignored) using the names in `.env.example`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Leave `VITE_USE_EMULATORS=false` (or unset) for the real project; set `true` only for local emulator work.
7. Optional but recommended before real users: Firebase App Check (reCAPTCHA) — documented placeholder, see DECISIONS.md.

## What changed in 4

- `src/lib/groupStats.ts`: pure period keys (`dayKey`, ISO `weekKey`), award walk-back windows (7 days / 4 weeks), `rankLeaderboard` (minutes → focus points → streak), `minutesByMember`, `recentDayKeys`.
- `src/lib/firebase/groups.ts`: groups, members, tasks, sessions, invite codes, memberships, wallet/ledger transactions (`creditWallet`, `spendCoins`, `reconcileWallet`), lazy group awards (`claimGroupAwards`), private/public profiles, public board.
- `src/lib/firebase/emulatorHook.ts`: `window.__fpEmu` test hook installed only when `VITE_USE_EMULATORS=true`; never in production.
- Store (`useAppStore.ts`): `activeGroupId`/`groupFocusTaskId` persisted; `purchaseItem` is async and runs `spendCoins` when signed in; pomodoro completion mirrors earned coins/FP via `creditWallet` and logs group minutes via `logGroupSession`; `adoptWalletAndClaimAwards` runs on sign-in/migration (wallet reconcile + award claims + FP refresh).
- UI: `FriendsView` rewritten as real groups (create/join/leave, roster, shared tasks, day/week leaderboard, alias + public opt-in, public board); `InvitePage` resolves codes and joins for real; guests see a sign-in prompt (demo data removed).
- Rules: groups/members/tasks/sessions/inviteCodes/memberships, `users/{uid}/groupAwards`, `profile/main` (owner-only), `public/profile` + `publicLeaderboard` (field whitelists), wallet focus-point deltas and replay protection.
- Sync conflict fix (step 0): `src/lib/syncMerge.ts` per-record `updatedAt` + tombstones; deletes sync; offline edits survive pulls.
- Legal: Terms/Privacy cover groups, member-visible data, public-board opt-in/opt-out, honor-system limits.
- E2E: `e2e/groups-emulator.spec.ts` (two users, full flow) added to `npm run test:e2e:firebase`.

## Known gaps / cautions

- Leaderboards, awards, and wallet deltas are an honor system: rules bound what clients can write but cannot prove a pomodoro happened (Decision 22; extends Decision 17). Terms/Privacy say so.
- Firestore rules cannot see same-batch writes: any rule guarded by `exists()`/`get()` on a doc written in the same batch fails. `createGroup` therefore commits membership docs first, then the task (Decision 19). Keep this in mind for future multi-doc writes.
- Group awards walk back only 7 days / 4 weeks; older unclaimed periods are forfeited (Decision 20).
- Public board stats (`weeklyMinutes`, `streak`) refresh when the member saves profile settings, not continuously.
- Last-write-wins per document for user data sync; per-record `updatedAt` merge (step 0) protects offline edits, but there is no conflict UI.
- "Decide later" re-prompts migration on every sign-in by design.
- Functional Playwright flows are EN-only; AR/RTL coverage is screenshots + overflow assertions.
- Catalog unverified defaults accepted by owner as flagged.
- `docs/original-brief.md` and `docs/ai-studio-plan.md` are in repo (owner-added, commit 5888cee).
- TypeScript ~5.9 (typescript-eslint constraint).
- GitHub Pages `/Focus-Plan/` base path and manifest `start_url` base-path handling is milestone 6 work (owner flagged).

## Commands

- Dev: `npm run dev` (port 3000). Unit: `npm test`. Lint: `npm run lint && npm run lint:eslint`. Build: `npm run build`. E2E: `npx playwright test` (Chromium installed).
- Rules tests: `JAVA_HOME=~/tools/jdk-21.0.13+9-jre PATH=~/tools/jdk-21.0.13+9-jre/bin:$PATH npm run test:rules`.
- Emulator app e2e: same env prefix + `npm run test:e2e:firebase` (runs both emulator specs).
- Emulators manually: `npm run firebase:emulators` (auth 9099, firestore 8080, UI http://127.0.0.1:4000).
## Post-M5 hardening pass

- New specs: `e2e/m6-hardening.spec.ts` (score loop e2e incl. custom sections, month/older report periods, CSV BOM+Arabic, PDF via page.pdf + pdftotext, reminders via injected clock, Arabic functional settings/sections), `e2e/m6-sounds.spec.ts` (AudioContext spy), `e2e/templates-emulator.spec.ts` (cloud template round-trip; added to `npm run test:e2e:firebase`).
- Bugs found and fixed: templates were never pushed to Firestore (`taskTemplates` vs `templates` key mismatch in the persist slice); tick sound settings ignored persisted values; `isQuietHour` test expectations corrected; score-loop modal gained aria-label and post-test-date prompt.
- Reports now export CSV with UTF-8 BOM for Excel/Arabic; PDF verified by content extraction, not just screenshots.
- Still untested: real Notification permission prompt UX in a headed browser, audible output (spied engine calls instead), PDF visual RTL inspection by eye (content verified via pdftotext; screenshots saved under docs/screenshots/report-print-*.png).

## Milestone 6 (publish prep)

- Pages deploy workflow + CI workflow added; prod build verified under `/Focus-Plan/` via `vite preview` + Playwright.
- README/CODEBASE/CONTRIBUTING/CoC/SECURITY/LICENSE(MIT)/issue+PR templates written to match the code.
- Scan: clean — no secrets in tree or history; tool dirs removed; no history rewrite required.
- Owner actions remaining: push, make repo public, enable Pages (GitHub Actions source), add `VITE_FIREBASE_*` repo variables, add `anonyoumss.github.io` to Firebase authorized domains, publish `firestore.rules`.


## Polish pass (post-M6)
- A11y: all `outline` text colors moved to `on-surface-variant`; fixed
  viewport meta (removed user-scalable lock), added aria-labels to the
  theme toggle, ambient-sound select and report close button.
- Perf: routes are React.lazy; Firebase SDK (629 kB chunk) and the
  emulator hook load only via dynamic import — absent from the initial
  bundle in guest mode. Env config split into `lib/firebase/config.ts`.
  Fonts narrowed to used weight ranges, display=swap kept.
- Lighthouse (prod build, /Focus-Plan/): landing mobile 97/100/96/100,
  landing desktop 99/100/96/100, app mobile 92/96/96/100.
- Bundle: main chunk 1,160 kB -> 522 kB (gzip 345 -> 154 kB).
- RESOLVED: sign-out/account-switch now hard-resets and reloads
  (Decision 26). Root cause of the recurring row was the emulator spec's
  own addInitScript re-seeding localStorage on every page.goto after
  sign-out — the app wipe was already correct. seedGuest now seeds once
  per context via a sessionStorage flag. Sign-out also clears Firestore
  IndexedDB persistence (bounded 1.5s) before reload.

## Sign-out phantom-task bug — RESOLVED
- Root cause: test fixture, not app code. `seedGuest`/`addInitScript`
  re-injected `guest_task_1` into localStorage on every `page.goto`
  after sign-out, and Zustand rehydrated it. Fixed by seeding once per
  browser context (sessionStorage flag) in both seed helpers.
- Hardening kept: `hardResetAndReload()` on sign-out and on uid change —
  wipes user data, bounded Firestore IDB persistence clear, removes the
  storage key, reloads to a clean guest. Product rule: sign-out starts
  an empty guest (Decision 26).
- Emulator spec now asserts post-sign-out: zero task rows, empty
  tasks/sessionLogs/testGoals/taskTemplates in localStorage and store,
  no firestore* IndexedDB databases. New spec covers sign-out then
  sign-in as a different user (user A's task must not appear for B).
- Note for future tests: the Sign In button sits below the fold on
  Settings; Playwright actionability click can stall — dispatch a DOM
  click for post-reload sign-ins.

## Stage A — Gemini AI integration secured (2026-11-08)

- `server.ts` is now a standalone AI proxy: `npm run dev` is plain Vite
  again; `npm run dev:server` / `npm run start` run `node server.ts`
  (Node 24 type-strips TS; verified live). Client reads `VITE_AI_API_URL`
  (empty = same origin); unreachable/404 disables AI buttons via
  `checkGeminiStatus()` and any modal shows the labeled offline estimate.
- Security: every `/api/gemini/*` POST requires a Firebase ID token
  (Google certs, RS256; emulator tokens accepted only when
  FIREBASE_AUTH_EMULATOR_HOST is set). Per-uid daily cap (default 30,
  `AI_DAILY_LIMIT`) persisted in `data/ai-usage.json` — survives
  restarts, single-host only. Strict input validation + output
  re-validation incl. section score ranges (`src/lib/ai/validation.ts`,
  shared client/server, unit tested). CORS allowlist
  (`AI_ALLOWED_ORIGINS`). Logs are method+path+status only; provider
  error bodies are never forwarded.
- Added deps: `express` (HTTP), `dotenv` (env), `@google/genai` (Gemini
  SDK), `@types/express` (types). `tsx` removed — `node server.ts` runs
  natively on Node 24. `bun.lock` left in place (see OVERNIGHT-QUESTIONS).
- Offline fallback is labeled "Offline estimate (heuristic, not AI)"
  EN/AR and `aiSuggested:false`. AI output only writes on explicit user
  confirm in each modal. Terms/Privacy disclose the free-tier data-use
  caveat (verified against Google docs).
- Guests get the offline estimate (no ID token). e2e: `ai-features.spec.ts`
  mocks `/api/gemini/status`; unit tests cover request/response validation.

## Overnight run state (stages A–C done, D–F not started)

- Stage A (Gemini proxy security), B (reviewer findings), C (layout,
  perf, spotlight, language, footer, GAT rename) are committed and
  green: tsc/eslint clean, 80/80 unit, 33/33 rules, Playwright 42 pass /
  6 emulator-skips, emulator suite 6/6, build pass.
- NOT STARTED: Stage D (test picker flat search, intake flow, task
  deadlines, real Plan page, EN/AR e2e), Stage E (custom audio,
  referrals), Stage F (logo, service worker/PWA offline). These are the
  next work items; see docs/OVERNIGHT-REPORT.md for the click-through
  list and docs/OVERNIGHT-QUESTIONS.md for autonomous decisions.
- Stage C caveats: spotlight visuals verified by DOM/z-order only;
  perf "slowness" was first-load latency, not data volume — Progress
  skeleton-first reveal added; count-up animations not implemented.
- Test-env gotcha: a stale `vite` dev server on :3000 makes the
  emulator suite self-skip (it reuses the server without emulator env
  vars). Kill any `vite --port=3000` process before
  `npm run test:e2e:firebase`.

## Stage D — DONE (a80fcf3 + follow-up commit)

All Stage D items shipped: searchable flat test picker, TestIntakeModal intake
flow (incl. optional AI consult), task deadlines end-to-end (UI chips,
reminder candidates, JSON port, sync undefined-strip), Plan page week agenda
(src/lib/planAgenda.ts + PlanView), EN+AR e2e (stage-d.spec.ts, 7 tests).
Progress 7.6 s figure was a cold-load artifact: prod-build probe with 2,000
logs shows ~450 ms first paint, 129 ms longtasks.

Next: Stage E (custom audio library + referrals) then Stage F (logo, service
worker/PWA offline). See docs/OVERNIGHT-QUESTIONS.md for open decisions.

Caution: md-dialog has no role="dialog" — locate via page.locator('md-dialog') in specs.

## Stage F — DONE

Logo options + adopted icons shipped; real service worker with precache
(precache.json emitted by vite plugin), offline-verified e2e. README
offline claim now accurate. Gotcha recorded: `Vary: Origin` response
header breaks `caches.match` — always pass `ignoreVary` in SW lookups.

STILL NOT DONE: Stage E (custom audio library + referrals) — never
implemented; the overnight prompt incorrectly listed it as done. Next
session should do Stage E, then optionally Android/Capacitor.

## Part 0 + Part 1 (hosting prep + Android) — this session

- Part 0 committed earlier (`cb9764e`): DEPLOY_TARGET bases, dual-base prod e2e, README hosting/env/AI-assistance note, secret scan clean, no vercel.json (hash routes need no rewrites).
- Part 1: Capacitor 8 Android app. Native bridge `src/lib/native/capacitor.ts` — all dynamic imports, no-ops off-native, unit-tested. Timer recovery relies on persisted `targetEndTime` + scheduled local notification. Native Google sign-in via `@capgo/capacitor-social-login` (ID token → Firebase credential); popup kept for web. `android/app/google-services.json` optional & gitignored. Workflow `.github/workflows/android.yml`: Node 22, Temurin 21, setup-android, debug APK artifact always, release APK on `v*` tags. Launcher icons + splash generated from `public/icon.svg`; notification icon `ic_stat_notify`.
- Gotchas: eslint needed ignores for `android/**`, `extension/**`, `public/sw.js`; Playwright browsers live in `.playwright-browsers` (set `PLAYWRIGHT_BROWSERS_PATH`); Java for emulators is `~/tools/jdk-21.0.13+9-jre` (export JAVA_HOME+PATH).
- **Android runtime untested** — no emulator/device; CI builds the APK. Part 2 (browser extension) NOT started — see docs/NEXT.md.

## Part 2 (browser extension) — done

- `extension/`: MV3, classic-script core (`src/core.js`, pure reducer) shared by Chrome service worker (`importScripts`) and Firefox event page (manifest `background.scripts`). Pinned `key` → stable ID `hppldplcookimjhlkmanllinfjnbnjff`. `externally_connectable` gated by extension-side `trustedOrigins`.
- App: `src/lib/extension/client.ts` (sendMessage wrapper, session mirroring), store fields `extensionData/Connected/Lists` (persisted locally, NOT synced to Firestore), `FocusInsightsCard` on Progress, `ExtensionSettingsCard` in Settings, timer hooks in startTimer/pauseTimer/setTimerMode.
- i18n: privacy section 5 added EN+AR. Settings/insights UI uses inline bilingual strings (existing pattern).
- Gotcha: vitest include is `src/**` only — extension core tests live at `src/lib/extension/core.test.ts` and `createRequire`/globalThis-import `extension/src/core.js`. Playwright storage key is `focus_plan_m3e_v1` and init scripts must not overwrite on reload.
- Untested: real browser extension runtime (tabs events, onMessageExternal, notifications, options page) — documented in docs/EXTENSION.md.
