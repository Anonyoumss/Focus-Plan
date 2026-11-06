# Feature Parity Matrix: Pomofocus & Tomato vs Focus Plan M3E

This document tracks feature parity between **Pomofocus**, **Tomato**, and **Focus Plan M3E**. In accordance with project instructions, **no feature is marked "Done" unless it has been fully implemented and verified via automated unit tests and interactive testing.**

---

## 1. Pomofocus Feature Parity

| Feature | Pomofocus Status | Focus Plan M3E Status | Verification & Implementation Details |
| :--- | :--- | :--- | :--- |
| **Focus / Short / Long Break Modes** | Supported | **Done** | Implemented with connected M3 segmented buttons in `TimerDisplay.tsx`. |
| **Custom Timer Durations** | Supported | **Done** | Configurable in `SettingsView.tsx` with instant store reactivity. |
| **Auto-Start Breaks & Pomodoros** | Supported | **Done** | Implemented in `timerConfig` and executed via `tickTimer` callbacks. |
| **Task Management (CRUD)** | Supported | **Done** | Add, edit, delete, mark done in `TaskList.tsx`. |
| **Estimated vs Actual Pomodoros** | Supported | **Done** | Tracked per task with automatic completion incrementation on timer finish. |
| **Clear Finished Tasks** | Supported | **Done** | Functional button in `TaskList.tsx` header. |
| **Alarm Sound & Volume** | Supported | **Done** | Synthesized harmonic bell chime via Web Audio API in `soundEngine.ts`. |
| **Tick / Ambient Sound** | Supported | **Done** | Pink noise and alpha binaural waves synthesized in `soundEngine.ts`. |
| **Document Title Countdown** | Supported | **Done** | Dynamic `(MM:SS) Mode · App` update in `timerEngine.ts`. |
| **Notification Support** | Supported | **Done** | Browser Web Notifications API supported in `timerEngine.ts`. |
| **Keyboard Shortcuts** | Supported | **Done** | Space, R, S, 1/2/3, N, ? handled globally in `Shell.tsx`. |
| **Data Export (JSON & CSV)** | Supported | **Done** | One-click export handlers in `SettingsView.tsx`. |
| **Google Login & Cloud Sync** | Supported | **Planned (Phase 3)** | Local storage active in Phase 1; Firebase Auth scheduled for Phase 3. |

---

## 2. Tomato Feature Parity & Material 3 Expressive

| Feature | Tomato Status | Focus Plan M3E Status | Verification & Implementation Details |
| :--- | :--- | :--- | :--- |
| **Material 3 Expressive Design** | Supported | **Done** | Full M3 token system derived via `@material/material-color-utilities`. |
| **Dynamic Color Seed Engine** | Supported | **Done** | Preset tonal swatches (Sage, Teal, Clay, Indigo, Crimson) in `theme.ts`. |
| **System / Light / Dark Theme** | Supported | **Done** | `prefers-color-scheme` listener with user override in `theme.ts`. |
| **Floating Bottom Navigation Bar** | Supported | **Done** | Mobile bottom bar with tonal indicator pill in `Shell.tsx`. |
| **Navigation Rail on Desktop** | Supported | **Done** | Left-docked (or right in RTL) 80px M3 nav rail in `Shell.tsx`. |
| **Wavy Circular Progress Ring** | Supported | **Done** | Custom SVG wavy progress path with animated amplitude in `TimerDisplay.tsx`. |
| **Screen Wake Lock** | Supported | **Done** | Native Screen Wake Lock API integration in `timerEngine.ts`. |
| **Roboto Flex Expressive Digits** | Supported | **Done** | Tabular figures loaded from Google Fonts for jitter-free countdowns. |
| **Total Focus Time Metrics** | Supported | **Done** | Daily, weekly, and all-time hours calculated in `ProgressView.tsx`. |
| **Weekly Consistency Grid** | Supported | **Done** | 7-day session distribution displayed in `ProgressView.tsx`. |

---

## 3. Advanced Study & Test Tracking (Focus Plan M3E Innovations)

| Feature | Origin / Category | Status | Verification & Implementation Details |
| :--- | :--- | :--- | :--- |
| **Saudi Standardized Test Catalog** | Focus Innovation | **Done** | Saudi GAT (Qudurat), SAAT (Tahsili), STEP, KFUPM Early SAAT in `catalog.ts`. |
| **Global Standardized Test Catalog** | Focus Innovation | **Done** | SAT, ACT, IELTS, TOEFL, Duolingo English Test with section scores in `catalog.ts`. |
| **Official Test Portal Verification Notice**| Focus Innovation | **Done** | Prominent warning notice and direct links to official exam authorities. |
| **Exam Countdown & Target Score** | Focus Innovation | **Done** | Dynamic days remaining and progress towards target score in `TestsView.tsx`. |
| **Real Score Logging & History** | Focus Innovation | **Done** | Interactive modal to record real trial scores in `TestsView.tsx`. |
| **Task Repetition Cadences** | Focus Innovation | **Done** | Daily, weekly, monthly cadence support with min/max goals in `TaskList.tsx`. |
| **3+ Sessions Daily Streak Rule** | Focus Innovation | **Done** | Verified via Vitest unit tests in `streakCalculator.test.ts`. |
| **Streak Freeze Protection** | Focus Innovation | **Done** | Verified via Vitest unit tests in `streakCalculator.test.ts`. |
| **Overachievement Goal (200%+)** | Focus Innovation | **Done** | Verified via Vitest unit tests in `streakCalculator.test.ts`. |
| **Focus Coins Economy & Store** | Focus Innovation | **Done** | Verified via Vitest unit tests in `coinsEngine.test.ts`. |
| **Study Circles & Group Codes** | Focus Innovation | **Done** | 6-character code sharing and weekly standings in `FriendsView.tsx`. |
| **Bilingual English & Arabic RTL** | Focus Innovation | **Done** | Full bidirectional switching on `<html>` with CSS logical properties. |
| **3-Step Skippable Onboarding** | Focus Innovation | **Done** | Animated first-run wizard in `OnboardingModal.tsx`. |
| **Plain-Language Terms & Privacy** | Focus Innovation | **Done** | Dedicated accessible pages in `/terms` and `/privacy`. |
| **Skeleton Loaders for Async Data** | Focus Innovation | **Done** | Configured in `SkeletonLoader.tsx`. |
| **Firebase Cloud Firestore Sync** | Cloud Backend | **Planned (Phase 3)** | Data model designed; implementation scheduled for Phase 3. |
| **Google Tasks Two-Way Sync** | Integration | **Planned (Phase 4)** | Scopes mapped; scheduled for Phase 4. |
| **Google Calendar Study Blocks** | Integration | **Planned (Phase 4)** | Scopes mapped; scheduled for Phase 4. |
| **Gemini AI Plan & Gap Analysis** | AI Intelligence | **Planned (Phase 5)** | Server-side Firebase AI Logic / proxy routes scheduled for Phase 5. |
