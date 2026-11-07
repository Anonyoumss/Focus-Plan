# Feature Parity Matrix: Pomofocus & Tomato vs Focus Plan M3E

This document tracks feature parity between **Pomofocus**, **Tomato**, and **Focus Plan M3E**. In accordance with project instructions, **each item is honestly classified into: `Verified in browser`, `Unit tested only`, `Untested`, or `Planned`.**

---

## 1. Pomofocus Feature Parity

| Feature | Pomofocus Status | Focus Plan M3E Status | Verification Classification | Implementation & Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Focus / Short / Long Break Modes** | Supported | Done | **Verified in browser** | Connected M3 segmented controls switch modes and update duration state in `TimerDisplay.tsx`. |
| **Custom Timer Durations** | Supported | Done | **Verified in browser** | Configurable via `SettingsView.tsx`; reflected in store state. |
| **Auto-Start Breaks & Pomodoros** | Supported | Done | **Verified in browser** | Auto-transition timer callbacks trigger on countdown zero. |
| **Task Management (CRUD)** | Supported | Done | **Verified in browser** | Adding, editing, completing, and deleting tasks tested in `TaskList.tsx`. |
| **Estimated vs Actual Pomodoros** | Supported | Done | **Verified in browser** | Task sessions increment upon session completion. |
| **Clear Finished Tasks** | Supported | Done | **Verified in browser** | Finished tasks are purged from the list on button click. |
| **Alarm Sound & Volume** | Supported | Done | **Verified in browser** | Web Audio API harmonic chime synthesizer tested in browser. |
| **Tick / Ambient Sound** | Supported | Done | **Verified in browser** | Synthesized pink noise and alpha wave binaural oscillators. |
| **Document Title Countdown** | Supported | Done | **Verified in browser** | Document title updates dynamically with `(MM:SS) Mode · App`. |
| **Web Notifications** | Supported | Done | **Untested** | Browser permissions handled with fallback; notification delivery in background tab untested on live system. |
| **Screen Wake Lock** | Supported | Done | **Untested** | Native `navigator.wakeLock` requested on start; untestable in sandbox without physical screen sleep. |
| **Keyboard Shortcuts** | Supported | Done | **Verified in browser** | Space, R, S, 1, 2, 3, and ? modal verified. |
| **Data Export (JSON & CSV)** | Supported | Done | **Verified in browser** | Blob generation and file download triggers functional in `SettingsView.tsx`. |
| **Google Login & Cloud Sync** | Supported | Planned | **Planned (Phase 3)** | Local storage active in Phase 1; Firebase Auth scheduled for Phase 3. |

---

## 2. Tomato Feature Parity & Material 3 Expressive

| Feature | Tomato Status | Focus Plan M3E Status | Verification Classification | Implementation & Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Material 3 Expressive Design** | Supported | Done | **Verified in browser** | M3 token system derived via `@material/material-color-utilities`. |
| **Dynamic Color Seed Engine** | Supported | Done | **Verified in browser** | Swatches (Sage, Teal, Clay, Indigo, Crimson) apply to CSS tokens. |
| **System / Light / Dark Theme** | Supported | Done | **Verified in browser** | Toggles `.dark` on `<html>` and updates CSS variables. |
| **Floating Bottom Navigation Bar** | Supported | Done | **Verified in browser** | Tested on mobile viewport (<768px) with active indicator pill. |
| **Navigation Rail on Desktop** | Supported | Done | **Verified in browser** | Docked 80px navigation rail on desktop (≥768px) verified. |
| **Wavy Circular Progress Ring** | Supported | Done | **Verified in browser** | SVG strokeDashoffset and circular track fill correctly with time. |
| **Roboto Flex Expressive Digits** | Supported | Done | **Verified in browser** | Tabular figures loaded from Google Fonts for zero-jitter display. |
| **Total Focus Time Metrics** | Supported | Done | **Verified in browser** | Total hours and sessions calculate correctly from session counts. |
| **Weekly Consistency Grid** | Supported | Done | **Verified in browser** | 7-day session distribution rendered in `ProgressView.tsx`. |

---

## 3. Advanced Study & Test Tracking (Focus Plan M3E Innovations)

| Feature | Origin / Category | Status | Verification Classification | Implementation & Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Saudi Standardized Test Catalog** | Focus Innovation | Done | **Verified in browser** | Saudi GAT, SAAT, STEP, KFUPM Early SAAT with section score targets. |
| **Global Standardized Test Catalog** | Focus Innovation | Done | **Verified in browser** | SAT, ACT, IELTS, TOEFL, Duolingo English Test with section scores. |
| **Official Test Portal Disclaimer** | Focus Innovation | Done | **Verified in browser** | Prominent warning banners and direct portal links on exam cards. |
| **Exam Countdown & Target Score** | Focus Innovation | Done | **Verified in browser** | Days remaining calculated from target test date; progress bar verified. |
| **Real Score Logging & History** | Focus Innovation | Done | **Verified in browser** | Modal to record exam scores and append to score history. |
| **Task Repetition Cadences** | Focus Innovation | Done | **Verified in browser** | Daily, weekly, monthly cadence selectors in task creation. |
| **3+ Sessions Daily Streak Rule** | Focus Innovation | Done | **Unit tested only** | Rigorously verified in Vitest suite (`streakCalculator.test.ts`). |
| **Streak Freeze Protection** | Focus Innovation | Done | **Unit tested only** | Verified in Vitest suite (`streakCalculator.test.ts`). |
| **Overachievement Goal (200%+)** | Focus Innovation | Done | **Unit tested only** | Verified in Vitest suite (`streakCalculator.test.ts`). |
| **Focus Coins Economy & Store** | Focus Innovation | Done | **Unit tested only & in browser** | Purchase validation and store inventory verified in Vitest and UI. |
| **Study Circles & Group Codes** | Focus Innovation | Done | **Verified in browser (Demo Data)** | Local demo preview with 6-char code sharing. Cloud sync in Phase 3. |
| **Bilingual English & Arabic RTL** | Focus Innovation | Done | **Verified in browser** | Complete RTL layout, Arabic fonts (`Readex Pro`), and logical spacing verified. |
| **3-Step Skippable Onboarding** | Focus Innovation | Done | **Verified in browser** | Step progression, theme picking, and first goal setup verified. |
| **Plain-Language Terms & Privacy** | Focus Innovation | Done | **Verified in browser** | Local-storage disclosure verified. |
| **Skeleton Loaders for Async Data** | Focus Innovation | Done | **Verified in browser** | Pulse placeholder states verified in `ProgressView.tsx`. |
| **Interactive SVG Bar Chart** | Focus Innovation | Done | **Verified in browser & Unit tested** | Day, Week, Month, Year, All Time filters with interactive tooltips in `TelemetryCharts.tsx`. |
| **Smooth SVG Line Chart (Trendline)** | Focus Innovation | Done | **Verified in browser & Unit tested** | Bezier curve velocity trajectory with tonal gradient fill in `TelemetryCharts.tsx`. |
| **Category Distribution Breakdown** | Focus Innovation | Done | **Verified in browser & Unit tested** | Color-coded M3 chips, minutes, percentages, and stacked visualizer in `TelemetryCharts.tsx`. |
| **Task Planning Accuracy Ratio** | Focus Innovation | Done | **Verified in browser & Unit tested** | Estimated vs actual completed session ratio in `TelemetryCharts.tsx`. |
| **28-Day Activity Heatmap Grid** | Focus Innovation | Done | **Verified in browser & Unit tested** | 4-tier tonal density matrix (0 to 4 sessions) in `TelemetryCharts.tsx`. |
| **Accessible Tabular Telemetry View** | Focus Innovation | Done | **Verified in browser** | Semantic HTML table with screen-reader friendly figures and session records. |
| **Interactive Score Loop & Gap Analysis** | Focus Innovation | Done | **Verified in browser & Unit tested** | Per-section target vs trial score comparisons with surplus/deficit tags in `ScoreLoopModal.tsx`. |
| **Adaptive Session Recommendations** | Focus Innovation | Done | **Verified in browser & Unit tested** | Dynamically calculates needed weekly pomodoros per section based on exam weeks left. |
| **Weekly Printable Focus Report** | Focus Innovation | Done | **Verified in browser** | Formatted M3 report with week selector, daily breakdown, and subject distribution in `WeeklyReportModal.tsx`. |
| **Print / Save PDF Stylesheet** | Focus Innovation | Done | **Verified in browser** | `@media print` styles strip modal chrome and render a clean, high-contrast document. |
| **RFC 4180 CSV Report & Session Export** | Focus Innovation | Done | **Verified in browser & Unit tested** | One-click CSV generation for session logs and weekly telemetry. |
| **Firebase Cloud Firestore Sync** | Cloud Backend | Planned | **Planned (Phase 3)** | Multi-user database synchronization scheduled for Phase 3. |
| **Google Tasks Two-Way Sync** | Integration | Planned | **Planned (Phase 4)** | Google Tasks API integration scheduled for Phase 4. |
| **Google Calendar Study Blocks** | Integration | Planned | **Planned (Phase 4)** | Calendar events scheduled for Phase 4. |
| **Gemini AI Plan & Gap Analysis** | AI Intelligence | Planned | **Planned (Phase 5)** | AI-driven study planner scheduled for Phase 5. |

---

## 4. Screens and Environments Not Open / Not Tested in Live Interaction

- **Physical Mobile WakeLock**: Untested on actual Android/iOS hardware (tested only in Chromium desktop preview environment).
- **Physical Printer Output**: The `window.print()` trigger and `@media print` styling rules were verified in the browser preview; physical ink printing to hardware was not executed.
- **Push Notification Background Delivery**: Service worker push notifications when the browser is entirely shut down require Firebase Cloud Messaging (Phase 6).
