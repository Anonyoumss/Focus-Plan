# Overnight report — 2026-11-08

| Stage | Status | Notes |
|-------|--------|-------|
| A: secure Gemini changes | Done | auth+ratelimit+CORS+validation; dev script split; offline estimate labeled; legal updated; e2e mocked |
| B: reviewer findings | Done | 9 items verified; 3 real bugs fixed; see detail |
| C: layout/perf/focus/lang/footer | Pending | |
| D: tests intake + Plan page | Pending | |
| E: audio + referrals | Pending | |
| F: logo + PWA | Pending | |

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
