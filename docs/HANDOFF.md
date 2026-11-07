# HANDOFF — Focus Plan M3E

## State (verified 2026-11-07, Devin taking over from Cursor)

- Repo: Anonyoumss/Focus-Plan, branch main, 4 commits, clean tree except untracked `.cursor/` plan file.
- Stack: React 19 + Vite 8 + TS + Zustand + Tailwind v4 + Vitest + Playwright. No router, no Firebase yet.

## Verified command results

- `npm install`: OK. 3 audit vulns, all dev-only via vitest chain: `@vitest/mocker` <=4.1.11 (moderate), `tinypool` <=2.1.1 (critical x2 advisories). Fix requires vitest 5 (breaking).
- `npx tsc --noEmit`: pass.
- `npm test` (vitest run): FAILS at file level — vitest picks up `e2e/audit-screenshots.spec.ts` (Playwright spec) because there is no vitest config excluding `e2e/`. The 18 real unit tests pass.
- `npm run build`: pass.
- `npx playwright test`: 8/8 pass (needed `npx playwright install chromium`; browsers now in `~/.cache/ms-playwright`). Screenshots refreshed in `docs/screenshots/`.

## Known broken / half-done (verified in code)

- New users get fake data: `useAppStore.ts` seeds 2 sample tasks, 2 test goals (dates 2026-12-15 / 2026-12-05), streak 4, coins 35, 42 generated session logs.
- `ProgressView.tsx` `daysOfWeek` is hardcoded dummy data; total focus hours = completedFocusSessions*25 ignores real session durations.
- Badge raw key bug: `evaluateBadges` returns `descKey: 'streakRuleNotice'` which lives under `t.streaks`, but ProgressView looks it up in `t.badges` → raw key shown. EN/AR dictionaries are actually in parity (240 keys each); no test enforces it.
- Gradient chart fill `m3eLineGrad` in TelemetryCharts.tsx; onboarding uses `backdrop-blur-xs`.
- Store unreachable on phone bottom nav (only first 5 items + settings button).
- No hash routes, no landing page, no wavy ring (plain dash-offset circle), no Start/Pause morph.
- Deps to remove or use: `@google/genai`, `dotenv`, `express`, `tsx`, `canvas-confetti`, `@types/express`; `motion` installed unused; `anime.js` and `@material/web` absent. `.env.example` still has GEMINI_API_KEY placeholder.
- Cadence union lacks 'hourly'. No task reorder, no N shortcut.
- Terms/Privacy already describe local-only accurately; Privacy mentions an opt-in public leaderboard that does not exist yet (minor).
- Test catalog has `officialPortal` URLs but no per-field source URLs; no "verify on official site" labeling seen in UI copy yet.

## Milestone status

- 2a honesty/bugs: not started (all items confirmed still broken).
- 2b build: not started.
- 3 Firebase: not started. DECISIONS.md already records Spark honor-system decision.
- 4 Social/store: not started (Friends is labeled local demo).
- 5 Study tools: not started.
- 6 Publish: not started (README/CODEBASE exist but describe aspirational features; CONTRIBUTING.md missing).

## Commands

- Dev: `npm run dev` (port 3000). Tests: `npx vitest run` (broken, see above), `npm test`. E2E: `npx playwright test`.
- Lint is only `tsc --noEmit`; no ESLint config yet.
