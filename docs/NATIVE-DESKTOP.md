# Native desktop apps (from scratch, no webview)

`native/` contains real native implementations — not wrappers:

- `native/macos/` — SwiftUI app (SwiftPM executable, bundled to `.app`
  in CI). Liquid Glass via `.ultraThinMaterial` window background and
  native materials. EN/AR with RTL layout direction, light/dark/system
  theme, end-timestamp timer that survives process restart, local JSON
  persistence in Application Support.
- `native/linux/` — GTK4 + libadwaita C app. Adwaita styling (closest
  native Linux equivalent of Material), EN/AR + RTL via
  `gtk_widget_set_direction`, local JSON state in
  `~/.local/share/focus-plan/state.json`.
- `android-native/` — Kotlin + Jetpack Compose M3 (already native).

## Offline / backend status

These apps are **100% local and offline-first**: timer, tasks, streaks,
language and settings persist to a JSON file; no network calls are made.
Firebase login/sync is NOT yet wired into the native shells — it is a
documented gap (the web app and Capacitor app keep full Firebase). A
future milestone should add Firebase Auth (Google) + Firestore sync per
platform (Firebase iOS SDK for macOS, firebase-cpp-sdk or REST for GTK).

## CI

`.github/workflows/native-desktop.yml` builds both on push to main and
on `v*` tags (attaching `focus-plan-linux-x86_64.tar.gz` and
`focus-plan-macos-arm64.tar.gz` to the GitHub Release).

## Honest status

- Compiled in CI only; never launched on a real Mac or Linux desktop.
- Feature scope is intentionally minimal (timer, tasks, streak, settings)
  versus the full web app (tests catalog, groups, store, audio, AI).
