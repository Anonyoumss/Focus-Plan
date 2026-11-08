# Android app (Capacitor)

Focus Plan ships the same React codebase inside a Capacitor Android WebView.
The web build uses `DEPLOY_TARGET=android` (relative `./` asset base), then
`npx cap sync android` copies `dist/` into `android/`.

## How it works

- `capacitor.config.ts`: app id `com.focusplan.m3e`, name "Focus Plan",
  `webDir: dist`. Splash screen and local-notification small icon are configured
  there; launcher icons and splash images were generated from `public/icon.svg`.
- `src/lib/native/capacitor.ts`: the only native bridge. Every plugin is loaded
  via dynamic `import()` and every call checks `window.Capacitor.isNativePlatform()`,
  so the web build and tests never touch native code. All functions are safe
  no-ops on the web.
- Timer: the store already persists `targetEndTime`, so a killed WebView
  recovers on relaunch. In addition `scheduleSessionEndNotification` posts a
  native local notification at the end timestamp (id 4242) on start, and it is
  cancelled on pause/skip/mode change/completion.
- Keep-awake: `@capacitor-community/keep-awake` holds the screen during a
  running timer (web keeps using the Screen Wake Lock API).
- Haptics: light impact on session completion.
- Status bar: synced to the app theme in `App.tsx` (dark theme -> light icons).
- Google sign-in: `signInWithPopup` cannot work in a WebView, so on native
  `signInWithGoogle()` calls `@capgo/capacitor-social-login`, gets a Google
  ID token and exchanges it with `signInWithCredential` (Firebase Auth). On web
  the popup flow is unchanged.

## Building

Android builds run in GitHub Actions (`.github/workflows/android.yml`) — no
local Android SDK is required or installed here.

- Every push to `main` (and manual dispatch) builds a **debug APK** and uploads
  it as the `focus-plan-debug-apk` workflow artifact (14-day retention).
- Pushing a tag `v*` additionally builds a release and attaches the APK to a
  GitHub Release.

### Signing (optional but recommended for releases)

Create a keystore once:

```bash
keytool -genkeypair -v -keystore focus-plan.keystore -alias focusplan \
  -keyalg RSA -keysize 2048 -validity 10000
```

Encode it and add four repository secrets (Settings > Secrets and variables >
Actions):

```bash
base64 -w0 focus-plan.keystore   # -> ANDROID_KEYSTORE_BASE64
```

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | base64 of the .keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `focusplan` (or your alias) |
| `ANDROID_KEY_PASSWORD` | key password |

Without these secrets the release job falls back to the debug APK and the
release notes say so. The keystore file itself must never be committed —
`*.keystore` / `*.jks` are gitignored, and so is `android/app/google-services.json`.

## Google sign-in setup (owner steps)

1. Firebase Console > Project settings > Your apps > Add Android app with
   package name `com.focusplan.m3e`.
2. Download `google-services.json` and place it at
   `android/app/google-services.json` **locally only** (it is gitignored).
   Without it the Gradle build skips the Google Services plugin and the app
   runs fine as a guest.
3. Add the app's SHA-1 fingerprint (debug and/or release) in the same Firebase
   app settings — required for Google sign-in on Android.
4. In Firebase Authentication > Sign-in method, ensure Google provider is
   enabled.

## Getting the APK

- Debug: Actions > "Android APK" > latest run > artifact
  `focus-plan-debug-apk`. Install with `adb install` or copy to the device.
- Release: push a tag (`git tag v0.1.0 && git push origin v0.1.0`) and the APK
  is attached to the GitHub Release.

## Testing status — read this

**No Android emulator or physical device was available during development.**
The Android project compiles config-wise only (`npx cap sync` verified); the
APK build itself runs in CI. Native runtime behaviour — notifications firing,
keep-awake, haptics, status bar, Google sign-in — is **compiled only**, not
verified on a device. The web test suite is unaffected: every native bridge
call is a no-op outside the WebView and is unit-tested as such.

## F-Droid

F-Droid generally rejects apps that depend on proprietary Google services
(Firebase, Play Services). This app uses Firebase Auth/Firestore and
(optionally) Google sign-in via Play Services, so **it cannot qualify for
F-Droid as-is**. To qualify it would need a build variant with all Firebase
and Google dependencies removed (guest/local-only mode, no sign-in, no sync)
— possible because the app already runs fully as a guest, but that is a
separate product decision and build flavor, not done here. Distribution is
via GitHub Releases APKs.
