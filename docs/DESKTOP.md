# Desktop apps (Linux + macOS)

`desktop/` is a Tauri 2 shell that serves the same production web build
(`dist/`, `DEPLOY_TARGET` unset so base is `/`) inside a native window.

## What is native and what is shared

- Native: window, menus, app bundle, installer, single binary.
- Shared: all UI, timer, streaks, badges, store, friends, tests, audio,
  referrals, easter egg, jumping clock, Firebase sync — the exact same
  code as the web app and Capacitor Android app. Material 3 Expressive
  styling, EN/AR + RTL, and light/dark all come from the web bundle.

## macOS Liquid Glass

`src/main.rs` applies `window-vibrancy` with
`NSVisualEffectMaterial::Sidebar` on macOS, giving the window the native
Liquid Glass vibrancy material. The same source builds for both
`aarch64-apple-darwin` (Apple Silicon) and `x86_64-apple-darwin`
(Intel MacBooks) — the CI workflow targets both.

## Build

```bash
npm ci && npm run build          # produces dist/
cd desktop/src-tauri && cargo tauri build
```

CI (`.github/workflows/desktop.yml`) builds `.deb` + AppImage on Ubuntu
and `.app` + `.dmg` on macOS (both architectures).

## Honest status

- Compiled only in CI; not yet run on a real Linux desktop or Mac.
- This is a native-packaged web app, not a from-scratch GTK/SwiftUI
  rewrite. If a fully native port is wanted later, the framework-free
  logic in `src/lib` ports directly; only the UI layer would be rebuilt.
- CSP in `tauri.conf.json` allows the Vercel AI endpoint and Firebase
  hosts only; custom audio stays in IndexedDB on-device.
