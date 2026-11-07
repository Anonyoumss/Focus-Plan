# Architecture & Engineering Decisions Log: Focus Plan M3E

This log documents all technical, structural, and design decisions made during the development of Focus Plan M3E.

---

## Decision 1: Google Material 3 Expressive Dynamic Palette Engine
- **Decision**: Adopt `@material/material-color-utilities` to generate full tonal palettes at runtime from a seed color hex or image, applying tokens via CSS custom properties (`--md-sys-color-*`).
- **Rationale**: Guarantees authentic Material 3 color harmony across both light and dark modes, and enables user customization without brittle CSS overrides.
- **Alternatives Considered**: Static CSS color variables or third-party Tailwind color palettes. Rejected because they lack the perceptual luminance and tonal tonal container contrast required by M3.

---

## Decision 2: Iconography Standard
- **Decision**: Standardize exclusively on **Google Material Symbols Rounded**, loaded via Google Fonts. No emojis or Lucide icons in any UI component or label.
- **Rationale**: Ensures pixel-perfect alignment with M3 design principles, provides consistent font metrics, and complies with anti-slop guidelines.

---

## Decision 3: Typography Strategy
- **Decision**:
  - `Roboto Flex` for the timer countdown digits and headlines with tabular figures (`tabular-nums`) and variable axes.
  - `Plus Jakarta Sans` for body copy and general UI controls.
  - `Readex Pro` for native Arabic typography and line height balance.
- **Rationale**: Prevents horizontal jitter as numbers countdown and provides natural Arabic script aesthetics under RTL.

---

## Decision 4: Synthesized Audio with Web Audio API
- **Decision**: Synthesize both completion bell chimes (harmonic sine oscillators with exponential decay) and focus ambient sound (pink noise and alpha binaural waves) directly via the browser's native `AudioContext`.
- **Rationale**: Completely self-contained; zero network requests for `.mp3`/`.wav` audio files; 100% offline capable and functional inside PWA environments.

---

## Decision 5: Framework-Free Core Logic (`/src/lib/`)
- **Decision**: Keep countdown math, streak algorithms, badge evaluations, and coin transaction validation in pure TypeScript modules decoupled from React.
- **Rationale**: Enables lightning-fast automated unit testing with Vitest and allows direct 1:1 porting to native Android (Kotlin / Jetpack Compose) or Capacitor in future expansion phases.

---

## Decision 6: Spark-plan wallet and leaderboards are an honor system
- **Decision**: Without Cloud Functions, coins, focus minutes, and daily or weekly awards are written by the client. Firestore Security Rules can reject some impossible deltas, but they cannot prove that a session was actually completed. Leaderboards are an honor system and are not cheat-proof.
- **Rationale**: The Firebase Spark plan does not include Cloud Functions. A scheduled or trusted server writer would require the Blaze plan.
- **Source**: Firebase pricing and Cloud Functions requirements, https://firebase.google.com/pricing and https://firebase.google.com/docs/functions (recorded 2026-11-07).

---

## Decision 7: Direct esbuild range matches Vite 8.3.6
- **Decision**: The direct `esbuild` devDependency is `^0.28.2`.
- **Rationale**: `npm install` failed with `ERESOLVE` because `package.json` asked for `esbuild@^0.25.0` while the published Vite 8.3.6 peer dependency is `esbuild@^0.27.0 || ^0.28.0`. `0.28.2` is a published version and is already the esbuild copy nested under `tsx` in `bun.lock`.
- **Source**: `npm view vite@8.3.6 peerDependencies` and `npm view esbuild versions`, run on 2026-11-07.

---

## Decision 8: npm audit findings are dev-only and accepted for now
- **Decision**: Leave the audit findings unfixed. `npm audit` reports 13 vulnerability paths (11 moderate, 2 critical) collapsing to 3 advisories, all inside devDependencies: `@vitest/mocker` <=4.1.11 (moderate, GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8), `tinypool` <=2.1.1 (critical, GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr), and `minimatch` 7.0.0-11.0.0 (moderate, GHSA-g3hv-75wg-m249, via eslint). None ship to the browser bundle. Fixes require vitest 5 or eslint 9 downgrades/upgrades that are breaking; `npm audit fix --force` was not run.
- **Rationale**: Owner decision 2026-11-07: do not upgrade vitest; revisit when moving to milestone 3+ tooling.
- **Source**: `npm audit` run on 2026-11-07.

---

## Decision 9: TypeScript pinned to ~5.9 for ESLint compatibility
- **Decision**: `typescript` devDependency is `~5.9.3`, not 7.x. `typescript-eslint` (latest 8.72.x) peers `typescript >=4.8.4 <6.1.0`, so ESLint cannot run against TS 7. `tsc --noEmit`, Vitest, and the Vite build (esbuild) are unaffected.
- **Rationale**: Minimal ESLint was required for milestone 2a; TS 7 is brand new and the typescript-eslint toolchain does not support it yet.
- **Source**: `npm view typescript-eslint@latest peerDependencies`, 2026-11-07.

---

## Decision 10: Demo data is opt-in, never seeded
- **Decision**: New users start with zero tasks, goals, streak, coins, and session logs. Sample content loads only via the labeled "Load demo data" button in Settings (`demoDataLoaded` flag persisted). Friends screen rows remain labeled local demo.
- **Rationale**: Honest parity requirement — generated history must not masquerade as user data.

---

## Decision 11: Phone navigation uses a "More" sheet
- **Decision**: The mobile bottom bar shows Focus, Plan, Tests, Progress, and More. Friends, Store, and Settings open from the More bottom sheet. Desktop rail keeps all destinations.
- **Rationale**: Material navigation bars cap at 5 destinations; Store was unreachable on phone before.

---

## Decision 12: Catalog facts carry per-field source URLs or stay flagged
- **Decision**: `StandardizedTestDefinition` has `sourceUrls` (scoreScale/sections/dates) and `unverifiedFields`. Only URLs confirmed by fetching the official page on 2026-11-07 are filled (SAT, ACT scores page, IELTS, TOEFL scores). etec.gov.sa requires JavaScript and englishtest.duolingo.com returned non-HTML, so GAT/SAAT/STEP/Duolingo fields stay unverified and the UI shows "Verify on official site". KFUPM keeps only its `/important-dates` link; its section list is unverified. No test dates are prefilled anywhere.
- **Rationale**: Owner rule — never invent catalog facts; blank means verify on the official site.

---

## Decision 13: Hash routing for all app surfaces
- **Decision**: Routes are hash-based (`#/` landing, `#/app/<tab>`, `#/terms`, `#/privacy`, `#/invite/<code>`), parsed by `src/lib/router.ts`. Unknown or empty hashes fall back to landing. GitHub Pages serves `index.html` for any path, so hash routes keep deep links and refresh working without an SPA fallback rewrite.
- **Rationale**: Milestone 2b requirement; zero server config needed and Capacitor can serve the same bundle.

## Decision 14: anime.js package name and SVG morph approach
- **Decision**: The npm package is `animejs` (v4 line); `npm install anime.js` returns E404. `WavyRing` animates the SVG path `d` attribute's wave phase in a loop via `animate()`; with `prefers-reduced-motion: reduce` the phase is frozen at 0 and only progress-driven redraws happen. The Start/Pause morph uses `motion` (`motion.button` borderRadius spring + `AnimatePresence` icon swap), disabled via `useReducedMotion()`.
- **Rationale**: Owner-specified libraries; anime.js for SVG, motion for springs.

## Decision 15: Selective @material/web with a content-slot wrapper
- **Decision**: `@material/web` is used for switches (Settings), sliders (timer durations), selects (ambient sound), dialogs (task create/edit), and filled buttons (Store). `MdDialog` wraps children in `<div slot="content">` because md-dialog only renders slotted `content`; without it the dialog body is empty (found via Playwright). Custom components were kept for the timer ring, charts, nav, and cards. No RTL-specific defect was observed in AR screenshots, so no custom fallback was needed; RTL interaction coverage is thinner than LTR and is noted in FEATURE_PARITY.md.
- **Rationale**: Milestone 2b "no wholesale rewrite" constraint.

## Decision 16: Firebase SDK 13.1.0, emulator-first, env-only config
- **Decision**: `firebase` 13.1.0 (modular SDK) with `@firebase/rules-unit-testing` 6.0.0 for rules tests and `firebase-tools` 15.35.0 as a devDependency for the Emulator Suite. All config comes from `VITE_FIREBASE_*` env vars; `.env.example` ships empty values plus `VITE_USE_EMULATORS`. With no config the app runs fully as a guest: sign-in UI is hidden and Settings shows a "cloud sync not configured" state. App Check is a documented placeholder only, not implemented.
- **Rationale**: Milestone 3 requirement; the emulator needs no real project, and missing env must never crash the app.
- **Source**: `npm view firebase version` and firebase.google.com docs, 2026-11-08.

## Decision 17: What Firestore Rules can and cannot enforce without Cloud Functions
- **Decision**: Rules enforce per-user isolation (`users/{uid}/...` readable/writable only by that uid), field types and size caps, append-only session logs, and a wallet model where balance changes require a matching ledger row in the same transaction and spend amounts must equal catalog prices. Rules CANNOT prove a focus session really happened, cap awards per day, or prevent a modified client from writing plausible-looking ledger rows within the allowed deltas. Coins, points, streaks and wallet fields are therefore client-writable within tight rule bounds — an honor system, same as Decision 6. Real enforcement needs Cloud Functions (Blaze plan) or a trusted server; until then leaderboards must not be presented as cheat-proof.
- **Rationale**: Milestone 3 requirement to record the rules boundary honestly.
- **Source**: `firestore.rules`, `tests/rules/firestore.rules.test.ts` (14 emulator tests).

## Decision 18: Migration completion is marked in Firestore, not localStorage
- **Decision**: Guest-to-cloud resolution writes `users/{uid}/meta/migration {completed:true}`. `handleAuthUser` checks this marker before comparing local vs cloud data; without it every reload after a successful import re-detected "both sides have data" and re-opened the merge dialog (found by the Playwright emulator test). "Decide later" writes no marker, so the prompt returns on the next sign-in as intended. Both "Import device data" and "Use cloud data" mark completion; "Use cloud data" also writes the marker so the prompt does not return.
- **Rationale**: The marker is the only durable record that survives reloads and devices; localStorage cannot distinguish "already migrated" from "new conflict".
- **Source**: e2e/firebase-emulators.spec.ts failure and fix, 2026-11-08.

## Decision 19: Group writes cannot share a batch with membership-gated writes
- **Decision**: `createGroup` commits group + owner member + invite code + membership index in one batch, then creates the shared task in a second write. Firestore rules evaluate `exists()`/`get()` against pre-batch state, so a task create guarded by `isGroupMember()` fails inside the same batch and rejects the whole commit (found by the groups emulator Playwright test and reproduced in rules-unit-testing). `joinGroupByCode` likewise treats a permission-denied member-doc read as "not a member" and proceeds to the idempotent self-add batch.
- **Rationale**: Milestone 4 group creation must work under the strict rules; splitting the dependent write is the minimal fix and keeps rules strict.
- **Source**: e2e/groups-emulator.spec.ts, tests/rules/firestore.rules.test.ts batch test.

## Decision 20: Group awards are claimed lazily with create-only docs, walk-back limited
- **Decision**: Daily (+1 focus point) and weekly (+7) group awards are claimed by the first member to open the app after a period boundary, per `awardPeriodsToClaim` in `src/lib/groupStats.ts`: today plus the previous 6 days, and the current ISO week plus the previous 3 weeks. Each claim is one transaction containing a create-only `users/{uid}/groupAwards/{gid}_day_YYYY-MM-DD` (or `_week_YYYY-Www`) doc, a ledger row, and the wallet update; a losing concurrent claim retries, sees the doc, and skips, so double awards are impossible. Periods older than the window are forfeited — nobody can claim them later.
- **Rationale**: Spark plan has no Cloud Functions or scheduled jobs; this is the documented fallback. The walk-back window bounds how far back awards can be claimed so idle groups do not farm old periods.
- **Source**: `src/lib/firebase/groups.ts` claimGroupAwards, `src/lib/groupStats.ts`.

## Decision 21: Public visibility uses a separate projection, never the private doc
- **Decision**: `users/{uid}/profile/main` (alias) is owner-read only. `users/{uid}/public/profile` is readable by any signed-in user but the client writes only opted-in stat keys — unshared stats are omitted entirely, and rules whitelist the allowed keys so smuggled fields are rejected. `publicLeaderboard/{uid}` is a separate opt-in doc (default absent = not listed) carrying only alias, weeklyMinutes, streak. Rules tests prove hidden fields cannot be read and extra fields cannot be written.
- **Rationale**: Milestone 4 requirement; the viewer's client must never receive the private user document.
- **Source**: firestore.rules public/profile + publicLeaderboard matches, rules tests.

## Decision 22: Leaderboards and awards are an honor system without Cloud Functions
- **Decision**: Group sessions, wallet deltas, and award claims are written by the client within rule bounds (own uid only, append-only sessions, ledger-matched wallet changes, capped deltas). Rules cannot prove a pomodoro happened, cannot verify award eligibility historically, and cannot stop a modified client from inflating minutes within caps. Terms and Privacy state this plainly; the public board is opt-in for this reason.
- **Rationale**: Extends Decision 17 to the social surface; real enforcement needs Blaze/Cloud Functions.

## Decision 23: Reminders are in-app only; scheduled push is not shipped
- **Decision**: Milestone 5 reminders fire browser Notifications from a 60s interval while the app tab is visible, gated by user opt-in, quiet hours (wrap-midnight aware), and a 1-hour per-reminder cooldown. Candidates come from daily-goal tasks below goal and test dates within 3 days (`src/lib/reminders.ts`, pure + unit tested). No service worker or FCM — Terms continue to state scheduled push is not shipped.
- **Rationale**: Spark plan and no Cloud Functions; in-app reminders are the honest free-tier implementation.
- **Source**: `src/lib/reminders.ts`, `useAppStore.ts` reminder loop, Settings reminders card.

## Decision 24: Persisted tick-sound settings and the templates slice key
- **Decision**: `tickSoundEnabled`/`tickVolume` are restored from persisted state (they were hardcoded defaults, silently ignoring user settings across reloads). The cloud push slice maps local `taskTemplates` to the synced `templates` collection inside `persistState`; previously the mismatch meant template writes were always empty and remote templates could be tombstoned by unrelated pushes.
- **Rationale**: Found by the template emulator round-trip and the sounds spec; both are covered by regression tests now.
- **Source**: `useAppStore.ts` persistState/syncedSliceOf, `e2e/templates-emulator.spec.ts`, `e2e/m6-sounds.spec.ts`.
