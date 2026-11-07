# Feature parity

Checked on commit parent `591de4d` plus this audit, 2026-11-07.

Commands that ran:

- `npm install` succeeded after changing the direct `esbuild` range. See DECISIONS.md.
- `npx tsc --noEmit` exited 0. There is no ESLint config. `npm run lint` is that same `tsc` script.
- `npm test` (Vitest 3.2.7): 4 files, 18 tests, all passed.
- `npm run build` (Vite 8.3.6) exited 0.
- `npx playwright test` (`@playwright/test` 1.65.0, Chromium 158.0.8127.18): 8 passed, 0 failed. Screenshots are in `docs/screenshots/`.

Labels mean only what was run. A screen that rendered is not proof that its buttons do the real job.

Tomato is GPL-3.0. This repo does not copy that source. Pomofocus behavior below is the public product behavior, not a claim that `bermarte/pomofocus` implements it.

## Verified in browser

Playwright opened `/` with stored `locale` and `themeMode`, at 1280x800 and 360x740, English and Arabic, light and dark.

| What was checked | Result |
| :--- | :--- |
| App shell, onboarding, and Skip | Onboarding rendered. Skip removed it. |
| `lang` and `dir` | `en`/`ltr` and `ar`/`rtl` matched the stored locale. |
| Dark theme class | `html` had class `dark` when `themeMode` was `dark`. |
| Tabs | Focus, Plan, Tests, Progress, Friends, Settings, Terms, and Privacy rendered in every combination. Store rendered on the desktop rail only. |
| Start control | English, light, desktop only: Start Focus became Pause Timer. The countdown itself was not timed. |
| Friends screen | Visible copy says the circle and standings are local demo data. Names Tariq, Fahad, Sarah, and Omar are still shown. |
| Progress screen | Renders. The week row is not the same data as the chart. Total focus on the top card was 0.0 hrs while the chart card said 7.9 hrs. One badge description showed the raw key `streakRuleNotice`. |
| Arabic phone Focus | Rendered RTL, and the task titles overflow. English category names stay in the task rows. The bottom bar covers part of the list. |

Phone Store is unreachable from Mobile Bottom Navigation. Notes: `docs/screenshots/*/phone/store.unreachable.txt`.

Not exercised in the browser: completing a pomodoro, editing a task, sounds, notifications, wake lock, export downloads, store purchase, score entry, print, keyboard shortcuts, or Join.

## Unit tested only

These passed in Vitest. They were not driven in the browser.

| Behavior | Test file |
| :--- | :--- |
| Remaining seconds, `MM:SS`, progress ratio, next mode after 4 focus sessions | `src/lib/__tests__/timerEngine.test.ts` |
| Goal percent including 8/4 = 200. Streak does not advance at 2 sessions. Streak advances at 3. A missed day uses one freeze or resets the streak. | `src/lib/__tests__/streakCalculator.test.ts` |
| Purchase allowed only when coins cover the price. Streak-freeze purchase writes a spend transaction. `awardPoints` adds coins. | `src/lib/__tests__/coinsEngine.test.ts` |
| Session time filter, week bars, category percentages, estimated-vs-actual ratio, score-loop gaps, CSV quoting | `src/lib/__tests__/analyticsEngine.test.ts` |

The streak tests use the dates written in that file. They do not prove the live clock or timezone.

## Compiled only

Present in source and included in the production build. Not verified by the checks above.

- Timer mode buttons, duration settings, auto-start flags, task add/edit/delete/clear, estimated versus completed counts.
- Web Audio synth, document title updates, Notification API call, Wake Lock call.
- Keyboard listeners for Space, R, S, 1, 2, 3, and `?`. There is no `N` listener.
- JSON and CSV task export from Settings. No import.
- Seed colors Sage, Teal, Clay, Indigo, and Crimson through `@material/material-color-utilities`.
- Test catalog cards and score-loop modal. Catalog score scales and the prefilled dates `2026-12-15` and `2026-12-05` were not checked against an official site in this audit.
- Print stylesheet in `WeeklyReportModal.tsx`. No PDF file writer.
- Skeleton component. The Progress refresh button shows it for 400ms. Charts do not use it for their first paint.
- PWA `manifest.json`. No service worker file.

## Not in this codebase

- URL routes `/terms` and `/privacy`. Those screens are tab state.
- Landing page.
- `@material/web`, `anime.js`. `motion` is installed and not imported.
- Wavy progress ring and a shape-morphing Start control. The timer SVG is a circular dash offset.
- Firebase Auth, Firestore, rules, or emulator tests.
- Google Tasks, Google Calendar, Gemini, FCM.
- Hourly cadence, per-topic timer lengths, task drag reorder.
- Real friend groups, invite links, shared tasks, public leaderboard, or profile privacy.
- Chrome theme reading. Pages cannot read it.

## Contradictions with AGENTS.md and the Desktop plan

Source: `/home/nothingos/Desktop/implementation_plan.md` and `AGENTS.md`.

- `FEATURE_PARITY.md` previously said most of the list was verified in the browser. This audit did not find a Playwright suite or screenshots in that commit.
- Chart area fill uses `linearGradient` `m3eLineGrad` in `src/components/progress/TelemetryCharts.tsx`.
- Onboarding overlay uses `backdrop-blur-xs` and `bg-black/60`.
- `--md-sys-color-surface-container-lowest` and several `on-*` roles in `src/index.css` are `#ffffff` before the runtime theme runs.
- `rounded-2xl` and `rounded-3xl` are used on most cards. The Desktop plan asks for a 28px extra-large step. `--md-shape-xxl` is 32px.
- Progress and Plan use three-column card rows. Progress icons use Tailwind palette classes (`text-emerald-600`, `text-orange-500`, `text-indigo-600`, `text-cyan-600`) instead of M3 roles.
- Dialogs use `shadow-xl` or `shadow-2xl`.
- Default tasks, a 4-day streak, 35 coins, test goals, and `generateDefaultSessionLogs()` load as if they were the user's history. Friends is the only block labeled demo in the UI.
- Privacy and Terms describe Firebase sign-in and Google Tasks or Calendar. Those integrations are not implemented.
- `arrow_back` on the legal pages is not mirrored for RTL.
- `.env.example` still has a placeholder `GEMINI_API_KEY`. No live key was found in git history. `@google/genai` is a dependency and is not imported by `src/`.
- `DEPLOY.md` is named by the Desktop plan and is not in the repo.
