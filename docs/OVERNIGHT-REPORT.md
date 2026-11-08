# Overnight report — 2026-11-08

| Stage | Status | Notes |
|-------|--------|-------|
| A: secure Gemini changes | Done | auth+ratelimit+CORS+validation; dev script split; offline estimate labeled; legal updated; e2e mocked |
| B: reviewer findings | Done | 9 items verified; 3 real bugs fixed; see detail |
| C: layout/perf/focus/lang/footer | Done | see detail |
| D: tests intake + Plan page | Skipped | out of budget — not started |
| E: audio + referrals | Skipped | conditional on remaining budget |
| F: logo + PWA | Skipped | conditional on remaining budget |

## Morning click-through (priority order)
1. Settings > Focus & Motion: enable Spotlight, start a focus timer,
   confirm only nav/clock/pause-skip stay bright; press Esc.
2. Timer mode buttons (Focus/Short/Long): watch the page tint change.
3. Settings > seed palette: pick custom hex, watch live preview.
4. Onboarding (fresh profile): language picker EN/AR, then RTL check.
5. Tests tab: GAT card shows "GAT — Qudurat" subtitle.
6. Friends tab signed out: skeleton leaderboard + sign-in button.
7. Progress: skeleton ~250ms then content; scroll stays inside content
   on a phone (nav never scrolls away).

## Stage D/E/F
Not started — context budget reached after stage C. Stage D is the
largest remaining chunk (picker refactor + intake flow + deadlines +
Plan page + EN/AR e2e). Nothing was half-implemented; tree is clean at
the stage C commit.

## Stage C detail
- LAYOUT: app shell is now h-[100dvh] overflow-hidden; content column and
  main got min-h-0 so only the content area scrolls. Rail/bottom nav
  stay fixed (e2e asserts nav bottom == viewport height at 360px).
- PERF: profiled with Playwright + PerformanceObserver. Finding: no
  data-dependent slowness — 2000 seeded logs render Progress in ~19ms
  warm; the 5-10s symptom is first-load chunk+font latency (cold vite
  dev compile / first prod navigation). Longtasks ~70ms max. Added a
  skeleton-first 250ms reveal on ProgressView (never blank) + e2e perf
  smoke (<5s warm revisit with 2000 logs). Honest caveat: no count-up
  animations yet; reveal is fade via existing skeleton.
- MODE BG: shell background tints per timer mode via M3 tonal roles
  (secondary-container for short break, tertiary-container for long
  break, 30% mix over surface, 700ms transition). e2e asserts change.
- SPOTLIGHT: new persisted setting (default OFF — opt-in, avoids
  surprising click-blocking). While running, a surface-color scrim
  (never black) dims everything except rail, bottom nav, clock and
  pause/skip (relative z-30). Escape or pause exits; resume re-arms.
  RTL/phone safe (z-order only). e2e covers scrim show/Escape/pause.
- FOOTER: removed from in-app shell; legal entry added to Settings.
  audit-screenshots spec updated (Terms/Privacy now via Settings,
  goBack instead of reload because its init script re-seeds).
- LANGUAGE: header/rail switches removed; onboarding step 1 now has
  EN/AR picker; default locale from navigator.languages (not IP —
  agreed, IP geolocation is unreliable and privacy-invasive).
  Landing keeps its small switch; Settings keeps its switch.
- A11Y: "Reduce animations" toggle in Settings overrides OS via
  .reduce-motion class on <html> (kills CSS anims/transitions).
  Custom seed color picker added: native color input + hex text field
  (accepts any #rrggbb, live preview swatch + live theme).
- FRIENDS: guest state now shows skeleton leaderboard preview +
  explanation + sign-in CTA.
- NAMING: catalog "Saudi GAT (Qudurat)" -> name "GAT" + subtitle
  "Qudurat" / "القدرات العامة" rendered under the name in the picker.
- Checks: tsc clean, eslint clean, 80/80 unit, 33/33 rules,
  stage-c.spec 9/9, audit-screenshots 8/8, full Playwright + emulator
  suite results below, build pass.
- Untested: spotlight visuals verified via DOM/z-order only, not by
  eye; mode tint verified by computed color change, not screenshot
  diff; count-up animations not implemented (skeleton+fade only).

## Stage B detail
- Reviewer findings treated as hypotheses; each reproduced with a failing
  test first where the claim was real.
- CONFIRMED + FIXED: walletDeltaOk now requires the ledger doc to be new
  (rules test: reusing a ledger id for a second change denied);
  users/{uid}/wallet constrained to the canonical doc id (rules test
  denies other ids); todaySessionsCount stale-count bug fixed (e2e
  reproduced streak=4 instead of 1, now passes); streakCalculator now
  resets streaks after gaps exceeding available freezes (unit tests for
  1/2/3-day gaps with 0/1/2 freezes); hardResetAndReload IndexedDB clear
  is awaited with a bounded timeout before reload (emulator sign-out
  specs 2/2 pass).
- NOT REPRODUCIBLE / already correct: syncDocCollection does not re-set
  existing append-only sessionLogs docs (emulator suite green, incl.
  templates round-trip); clearIndexedDbPersistence await verified by
  emulator sign-out assertions on IndexedDB.
- UI/docs: mode buttons got aria-pressed (fixed a self-inflicted broken
  edit before commit); skip_next icon mirrors in RTL; TelemetryCharts
  mr-1 -> me-1 and localized " min ("; README offline claim corrected
  (no service worker yet — returns in stage F); FEATURE_PARITY import
  row corrected; Terms/Privacy AR bodies translated (legal-i18n spec
  passes EN + AR RTL). Category-bar labels/patterns: chart already uses
  labeled legend + distinct hues; documented, no color-only reliance.
- Checks: tsc clean, eslint clean, 80/80 unit, 33/33 rules,
  Playwright 33 pass / 6 emulator-skips, emulator suite 6/6, build pass.
- Untested: none within scope.

## Stage A detail
- Checks: tsc clean, eslint clean, 75/75 unit, 31/31 rules, build pass,
  Playwright 30 pass / 6 emulator-skips (incl. new ai-features.spec 4/4),
  emulator suite 6/6.
- Untested: real Gemini call path end-to-end (no API key/Gemini project);
  token verification against real Google certs exercised only via code
  path, not a live token. Rate-limit file behavior unit-verified by
  inspection only.
- Skipped: none within stage scope. Legal AR translation deferred to
  stage B item 8 (bodies are EN-only today).
- npm audit now reports 31 vulnerabilities (24 mod / 5 high / 2 crit),
  up from dev-only advisories — new server deps. Not fixed (no
  --force per HANDOFF rule); owner should review.

## Stage D — Partly done (this session)

Done and verified:
- Test picker: Local/Global grouping removed; single search bar (name, provider, Arabic+English, sections) over a flat list; "verify on official site" labels and source URLs kept.
- Intake flow: new `TestIntakeModal` collects test name (custom), date, sessions/week, current score (validated against section ranges), per-section targets, with "I don't know my score yet" path. AI Consult remains an optional step inside the flow. Goal cards now open edit/intake instead of a bare preset form.
- Task deadlines: optional `deadline` (YYYY-MM-DD) + `deadlineTime` (HH:MM) on TaskItem; dialog inputs; overdue/due-today chips in the task list; deadline candidates added to `buildReminderCandidates` (today, within horizon, overdue-once); JSON import/export carries the fields (CSV unchanged); Firestore sync now strips undefined fields recursively (fixed a push failure the emulator suite surfaced).
- Material Symbols subset regenerated (99 glyphs, ~100 KB) including search/event/schedule/warning.

Tests: tsc clean, eslint clean, 80/80 unit, build pass, Playwright 46 pass + 6 emulator-skips (incl. new stage-d.spec.ts 4/4: search, intake save, range rejection, overdue chip), emulator suite 6/6.

Not done (ran out of budget):
- Plan page rewrite (week agenda, cadence blocks, weekly plan from goals, skeleton reveal) — existing PlanView unchanged.
- Arabic Playwright coverage for intake/search/deadline (EN only so far).
- Plan page empty states/one-tap actions.

## Stage D — completed (second session)

- Progress perf: re-measured on `vite preview` prod build under /Focus-Plan/ with 2,000 seeded session logs. Progress ~454 ms to first chart/svg, 129 ms longtasks; focus 92 ms, tests 438 ms. The earlier 7.6 s was a cold first-load artifact (chunk fetch + font), not reproducible — no code change needed. Skeleton-first reveal already in place.
- Plan page rewritten (`PlanView` + framework-free `src/lib/planAgenda.ts`): 7-day agenda grid with cadence study blocks (daily/hourly→every day, weekly→created weekday, monthly→created day-of-month), deadline entries (overdue flagged), test-date entries, weekly-plan cards per goal (sessions/week, progress, score delta), empty state with Add task / Add test / Set cadence actions, skeleton + fade reveal under global reduce-motion override. 5 new unit tests.
- E2E: stage-d.spec.ts now 7 tests — picker search, intake save + range rejection, deadline overdue chip, plan agenda, plan empty state, Arabic RTL plan+search.

Checks: tsc clean, eslint clean, 85/85 unit, build pass, Playwright 49 pass + 6 emulator-skips, emulator suite 6/6.
Stage D status: DONE. Stage E/F remain for a future session.

## Stage F — done (this session)

- Note: the prompt claimed stages A-E done; Stage E (custom audio + referrals) was NOT implemented — no code exists. Flagged for owner.
- Logo: 3 original SVGs in docs/logo/ + preview PNG; Option A adopted (matches prior brand tile). Generated favicon-32, icon-192/512, maskable-512, apple-touch-icon, og-image 1200x630; manifest + index.html updated.
- Service worker: public/sw.js precaches shell via build-emitted precache.json (new vite plugin), network-first navigation fallback, cache-first assets, update banner. Root cause found during testing: vite preview sends `Vary: Origin` on all responses, which silently broke `caches.match(request)` — fixed with `ignoreVary`/`ignoreSearch`. Base-path agnostic.
- Offline e2e passes (load once → offline → reload → tasks+timer work). README offline claim updated to true.

Checks: tsc clean, eslint clean, 85/85 unit, build pass, Playwright 50 pass + 6 emulator-skips, emulator suite 6/6.

## Part 0 — done (commit cb9764e)

- vite.config.ts DEPLOY_TARGET bases (pages=/Focus-Plan/, android=./, else /); deploy.yml sets pages.
- prod-pages.spec.ts rewritten: both bases, landing/#/app/#/terms/#/privacy/invite/reloads/manifest/icon/offline, zero failed requests — 2/2 pass.
- Guest-mode + no-AI-endpoint verified on prod build (AI buttons hidden/disabled, offline estimate labeled).
- README: live-link placeholders, Pages+Vercel deploy steps, env vars, AI-assistance note. No vercel.json (hash routing). Secret scan tree+history: no secrets found.

## Part 1 — done (this commit)

- Capacitor 8 Android: config, generated project, native bridge (keep-awake, haptics, status bar, splash, session-end local notification), native Google sign-in via social-login plugin → Firebase credential, optional google-services.json, icons/splash from logo, android.yml workflow (debug artifact + tag release), docs/ANDROID.md incl. F-Droid analysis.
- Checks: tsc clean, eslint clean (added ignores for android/, extension/, public/sw.js), 89/89 unit, rules 33/33, Playwright 50 pass + 6 emulator-skips, emulator 6/6, web build + DEPLOY_TARGET=android build + `npx cap sync android` all pass.
- Untested: Android runtime itself (no emulator/device); APK build verified only in CI config, not executed locally (no SDK, per constraints).
- Skipped: Part 2 browser extension — out of context budget; see docs/NEXT.md.

### Owner checklist (exact clicks)

1. Make the repo public on GitHub.
2. Repo Settings > Pages > Source: **GitHub Actions** (deploy.yml builds on push to main).
3. Repo Settings > Secrets and variables > Actions > Variables: add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (public web config values from Firebase Console > Project settings).
4. Vercel: Import the repo, no env needed for guest mode; add the same `VITE_FIREBASE_*` vars if enabling accounts.
5. Firebase Console > Authentication > Settings > Authorized domains: add the Pages host (`<user>.github.io`) and the Vercel domain.
6. Android: Firebase Console > add Android app `com.focusplan.m3e`, download `google-services.json` to `android/app/` locally (never commit), add SHA-1 fingerprints.
7. Optional release signing: create keystore (`keytool -genkeypair ...`, see docs/ANDROID.md), add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` secrets.
8. Release: `git tag v0.1.0 && git push origin v0.1.0` — android.yml attaches the APK to the GitHub Release.
