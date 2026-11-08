# Vercel setup for Focus Plan

The Vite app deploys to Vercel with **no config file** (hash routing needs no
rewrites). This file documents the environment variables to set in the
Vercel dashboard.

## Dashboard click path

1. https://vercel.com → your project `focus-plan-delta` → **Settings** →
   **Environment Variables**.
2. For each variable below, enter the name + value, and tick
   **Production**, **Preview**, and **Development**, then **Save**.
3. **Redeploy** (Deployments → latest → ⋯ → Redeploy) so the new env is baked
   into the static build.

Or with the CLI (after `npm i -g vercel && vercel login`):

```bash
vercel env add VITE_FIREBASE_API_KEY production preview development
# paste the value when prompted; repeat per variable
```

## Variables

Public by design (safe to expose — they ship in the JS bundle anyway):

| Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | the web API key from Firebase Console → Project settings → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `focus-plan-m3e` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `<project>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | sender id from the same page |
| `VITE_FIREBASE_APP_ID` | web app id from the same page |
| `VITE_AI_API_URL` | `https://focus-plan-delta.vercel.app` (the Vercel host itself serves `/api/gemini/*`) |

Server-only (NEVER prefix with `VITE_`, never commit):

| Name | Notes |
|---|---|
| `GEMINI_API_KEY` | **Secret.** Owner adds this manually in the dashboard. Used only by `api/gemini/*` functions. |
| `FIREBASE_PROJECT_ID` | `focus-plan-m3e` — used server-side for ID-token verification and the `aiUsage` quota |
| `AI_DAILY_LIMIT` | optional, default `30` |
| `AI_ALLOWED_ORIGINS` | optional; defaults already cover the Pages + Vercel hosts |

## Firebase Auth providers to enable (Console → Authentication → Sign-in method)

The app currently uses **Google** sign-in. If you want the additional
methods from the Firebase docs, enable them here:

- **Email/Password** and **Email link (passwordless)**:
  https://firebase.google.com/docs/auth/web/email-link-auth — enable the
  "Email/Password" provider, then configure authorized domains.
- **Phone** (Android native only, via the Capacitor app):
  https://firebase.google.com/docs/auth/android/phone-auth — requires the
  Blaze plan for phone auth SMS on real projects, reCAPTCHA setup, and the
  Android app's SHA-1. The web app does not implement phone auth.

## Authorized domains (Console → Authentication → Settings → Authorized domains)

Add every host that serves the app:

- `anonyoumss.github.io` (GitHub Pages)
- `focus-plan-delta.vercel.app` (Vercel)
- `localhost` (already present by default)
- For the Android app, the WebView origin is `https://localhost` (Capacitor
  serves from `https://localhost` by default) — covered by the default.
