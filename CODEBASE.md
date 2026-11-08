# Codebase map

## Layout

```
src/
  App.tsx                 hash router + theme/locale effects + ambient stop
  main.tsx                entry, dev-only emulator hook
  store/useAppStore.ts    Zustand store: all state, actions, persistence,
                          cloud sync lifecycle, reminder loop
  lib/                    framework-free logic (Vitest-tested)
    timerEngine.ts        countdown math, modes, durations
    streakCalculator.ts   3+/day streaks, freezes
    coinsEngine.ts        coins/points/badges rules
    analyticsEngine.ts    category breakdown, heatmap, score-loop analysis,
                          CSV export
    groupStats.ts         leaderboard ranking, award period math
    syncMerge.ts          per-record updatedAt LWW merge + tombstones
    templates.ts          task-template validate/blueprint/apply
    dataPort.ts           JSON/CSV task import/export validation
    testSections.ts       editable test-section validation/resolution
    reminders.ts          quiet hours, cooldown, candidate building
    soundEngine.ts        Web Audio chimes/ambient/tick
    router.ts             hash route parse/navigate
    firebase/             client.ts (env config), auth.ts, sync.ts
                          (pull/push/tombstones), cloudSync.ts (debounced
                          diff push), groups.ts (groups/wallet/awards/
                          profiles/leaderboard), emulatorHook.ts (dev only)
  components/             focus/, plan/, tests/, progress/, friends/,
                          store/, settings/, legal/, landing/, layout/,
                          auth/, onboarding/, common/
  data/tests/catalog.ts   standardized-test definitions + UserTestGoal
  design/theme.ts         M3 tonal palette sync, seed colors
  i18n/translations.ts    EN/AR string tables (parity-tested)
e2e/                      Playwright specs + emulator-helpers.ts
tests/rules/              Firestore rules unit tests (emulator)
docs/                     HANDOFF, screenshots, plans
firestore.rules           Security Rules
.github/workflows/        ci.yml, deploy.yml (GitHub Pages)
```

## Data model (localStorage `focus_plan_m3e_v1`)

`locale, themeMode, seedHex, onboardingCompleted, timerConfig, tasks[],
taskTemplates[], testGoals[], streak, coins, focusPoints, inventory,
transactions[], sessionLogs[], activeTaskId, timerMode, isRunning,
targetEndTime, activeGroupId, groupFocusTaskId, reminderSettings,
tickSoundEnabled, tickVolume, syncMeta`.

- `TaskItem`: id, title, category, estimatedSessions, completedSessions,
  minGoal, maxGoal, cadence, notes, isCompleted, createdAt.
- `TaskTemplate`: id, title, kind(task|list), items[] (blueprints),
  createdAt + rules-required fields.
- `UserTestGoal`: testId, testName, testDate, targetScore,
  currentBaselineScore, sectionTargets{}, customSections? (TestSection[]),
  weeklyPomodoros, scoresHistory[].
- `FocusSessionRecord`: id, timestamp, dateStr, durationMinutes,
  taskId, taskTitle, category.

## Sync & merge

Guest = localStorage only. Signed-in = Firestore under
`users/{uid}/` with offline persistence. `persistState` stamps
`updatedAt` per record into the cloud slice only (via hash→meta map in
`syncMeta`) and enqueues a debounced (800ms) diff push
(`cloudSync.ts`). Pulls merge per record: newer `updatedAt` wins, ties
keep local, remote tombstones (`{_deleted:true,updatedAt}`) delete.
Synced collections: tasks, sessionLogs (append-only), testGoals,
templates; settings as `settings/main` doc. Deletes are tombstones,
never hard deletes (rules deny them).

## Firestore rules summary

Per-user isolation on `users/{uid}/**`. Shape/size validation on every
doc. Wallet balances are NOT client-writable: rules require matching
ledger rows and catalog-price deltas in the same transaction. Group
subtree: invite-code capability join, member-only reads, owner role
transfer, append-only sessions, create-only award docs
(`groupId_day_YYYY-MM-DD`, `groupId_week_YYYY-Www`). Public visibility
only via whitelisted projection docs + opt-in `publicLeaderboard`.
31 rules tests in `tests/rules/`.

## Design tokens

`src/design/theme.ts` generates the full `--md-sys-color-*` set from a
seed hex via `@material/material-color-utilities`; Roboto Flex for
timer/headlines, Plus Jakarta Sans body, Readex Pro Arabic; Material
Symbols Rounded icons; `prefers-reduced-motion` respected; logical CSS
properties for RTL. Anti-template rules in AGENTS.md are enforced by
review + screenshot suite (`e2e/audit-screenshots.spec.ts`).

## How to…

- **Add a catalog test**: append a `StandardizedTestDefinition` to
  `TEST_CATALOG` in `src/data/tests/catalog.ts` — id, code, names EN/AR,
  score scale, `sections[]` (id/nameEn/nameAr/min/max/defaultTarget),
  `sourceUrls` + `unverifiedFields` (mark unconfirmed fields so the UI
  shows "verify on official site"), `officialPortal`, description.
- **Add a language**: add a `Translations` block in
  `src/i18n/translations.ts` (the type enforces parity), extend the
  `locale` union in the store, and check RTL (`dir`) handling in
  `App.tsx`.
- **Add a badge**: add the rule in `src/lib/coinsEngine.ts`, a
  translation key, and it appears in Progress automatically.
- **Add a synced collection**: extend `SYNCED_COLLECTIONS` + merge in
  `syncMerge.ts`, pull/push in `firebase/sync.ts`, rules match + tests,
  `syncedSliceOf`/`persistState` mapping in the store.

## Repo tidy notes (this pass)

- `bun.lock`, root `icon.svg`, `metadata.json` removed. `public/icon.svg` is
  the single icon source (served at `/icon.svg` in dev and copied to `dist/`
  in builds); `package-lock.json` is the only lockfile.
- `server.ts` stays at repo root: it is the `npm start` entry for the Express
  dev/prod host and now delegates AI logic to `src/lib/ai/proxyCore.ts`, shared
  with the Vercel functions in `api/gemini/`.
- `.github/`: CODEOWNERS, PR template, issue templates (bug, feature,
  catalog correction, security link), FUNDING.yml.
- `docs/logo/`: six logo interpretations awaiting owner pick.
- `docs/screenshots/extension/options-real.png`: captured from the unpacked
  extension in Chromium via Playwright.
