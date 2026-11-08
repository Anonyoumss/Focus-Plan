# Native Android app (`android-native/`)

A pure Kotlin + Jetpack Compose rewrite — **no Capacitor, no WebView**. The
Capacitor app in `android/` is unchanged and still shipped; this is a
parallel native client.

## Stack

- Kotlin 2.0.21, AGP 8.13, compileSdk 36, minSdk 24, Gradle 8.14.3
- Jetpack Compose + Material 3 (dynamic `darkColorScheme`/`lightColorScheme`)
- DataStore + kotlinx.serialization for local persistence
- Firebase Auth (Google sign-in via Credential Manager) + Firestore,
  initialized at runtime from public config — **no google-services.json needed**

## What works today

- Focus timer: focus/short/long modes, start/pause/reset, task picker.
  State persists as `targetEndTime` (epoch millis) so it survives process
  death; remaining time is derived from the wall clock.
- Tasks: add, toggle done, delete; sessions-per-day goal counters.
- Progress: today minutes, streak (3+ focus sessions/day rule), 7-day bar row.
- Settings: EN/AR language toggle, Google sign-in, sync status.
- Session logs append locally; on sign-in, tasks + last 500 sessions push to
  `users/{uid}/tasks` and `users/{uid}/sessions` in Firestore (merge writes).

## Firebase config

Put public values in `android-native/local.properties` (gitignored) or pass
as `-P` gradle properties:

```
FP_FIREBASE_API_KEY=...
FP_FIREBASE_APP_ID=...
FP_FIREBASE_PROJECT_ID=focus-plan-m3e
FP_FIREBASE_SENDER_ID=...
FP_WEB_CLIENT_ID=...   # OAuth web client id for Credential Manager
```

Empty values = guest mode, app still builds and runs.

## Build

```bash
cd android-native
gradle assembleDebug        # or use Android Studio
```

CI: `.github/workflows/android-native.yml` builds a debug APK on pushes
that touch `android-native/`.

## Honest gaps (not yet implemented)

- No notifications/alarm scheduling for session end yet (timer survives
  process death via timestamps, but no system notification fires).
- Firestore sync is push-only v1; no pull/merge/conflict handling, no
  groups, leaderboards, wallet, badges, store, test catalog, reports,
  templates, import/export, or extension bridge.
- The full feature parity of the web app is NOT claimed — see
  FEATURE_PARITY.md; this is the foundation layer.
- Runtime not yet exercised on a device/emulator.
