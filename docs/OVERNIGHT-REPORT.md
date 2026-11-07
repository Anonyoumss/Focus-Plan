# Overnight report — 2026-11-08

| Stage | Status | Notes |
|-------|--------|-------|
| A: secure Gemini changes | Done | auth+ratelimit+CORS+validation; dev script split; offline estimate labeled; legal updated; e2e mocked |
| B: reviewer findings | Done | 9 items verified; 3 real bugs fixed; see detail |
| C: layout/perf/focus/lang/footer | Done | see detail |
| D: tests intake + Plan page | Pending | |
| E: audio + referrals | Pending | |
| F: logo + PWA | Pending | |

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
