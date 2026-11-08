# Changelog

All notable changes to Focus Plan M3E. Generated from conventional commits;
see [Releases](https://github.com/Anonyoumss/Focus-Plan/releases) for binaries.

## [0.2.0] - 2026-11-08

### Added
- Custom audio library: 5 alarm presets, 4 tick styles, 5 ambient beds,
  custom uploads stored locally (IndexedDB), device-only.
- Referral program: `referralCodes` collection, atomic redemption,
  15 Focus Coins reward, `#/referral/<code>` landing page.
- Three.js easter-egg game + PomoDefense3D arcade, physics mascot clock,
  badge system, AI plan assistant (AI Studio integration).
- Native Android app (`android-native/`, Kotlin + Compose M3).
- Desktop apps via Tauri 2 (`desktop/`): Linux (.deb/AppImage),
  macOS (.app/.dmg, Intel + Apple Silicon, Liquid Glass vibrancy),
  Windows (NSIS/MSI). Artifacts attach to `v*` releases as draft.

### Fixed
- Removed duplicate/stale Firestore referral rules that conflicted with
  the client schema (`usesCount`/`rewardCoins`); tightened referral code
  updates to `usesCount`-only diffs and referral markers to create-only.

## [Unreleased]

### Added
- Capacitor Android app (`android/`, `com.focusplan.m3e`) with native
  keep-awake, haptics, status bar, splash, session-end local notifications,
  and native Google sign-in via `@capgo/capacitor-social-login`.
- `.github/workflows/android.yml`: debug APK artifact on main pushes,
  signed/unsigned release APK on `v*` tags.
- MV3 browser extension (`extension/`): opt-in domain-level on/off-task
  tracking during focus sessions, allow/block lists, gentle nudges,
  Chrome + Firefox builds, `externally_connectable` gated by trusted origins.
- `.github/workflows/extension.yml`: Chrome + Firefox zips on `v*` tags.
- Focus insights card (Progress) and Browser extension settings card.
- Gemini AI proxy shared core (`src/lib/ai/proxyCore.ts`) powering both the
  Express dev server and Vercel serverless functions (`api/gemini/*`).
- Firestore-backed per-user daily AI quota for serverless deploys.
- DEPLOY_TARGET-based Vite base (`pages` / `android` / `/`).

### Fixed
- Firestore sync: recursive `undefined` stripping before writes.
- Sign-out/account-switch: full local + IndexedDB wipe then reload.
- Wallet ledger reuse, stale streak day-count, streak-freeze gap reset,
  awaited IndexedDB persistence clear.
- Service worker `Vary: Origin` cache mismatch breaking offline reload.

## [0.1.0] - 2026-11-08

First public release: Pomodoro timer, tasks/goals/cadences, standardized-test
catalog with intake flow and score loop, streaks/coins/badges/store, groups +
leaderboards + public opt-in profiles, EN/AR RTL, offline PWA, Android APK,
browser extension, Gemini AI proxy.
