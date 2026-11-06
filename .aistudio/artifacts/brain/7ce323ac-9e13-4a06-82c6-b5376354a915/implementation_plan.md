# Focus Plan M3E — Material 3 Expressive Pomodoro & Study Tracker

Focus Plan M3E combines the core focus workflows of Pomofocus and Tomato with a standardized study tracker tailored for Saudi entrance exams (GAT, SAAT, STEP, KFUPM Early SAAT) and International exams (SAT, ACT, IELTS, TOEFL, Duolingo). The system is built on Google Material 3 Expressive (M3E) design specifications, bidirectional English/Arabic RTL architecture, and framework-free core logic.

## User Review & Critical Decisions

> [!IMPORTANT]
> All revisions requested have been codified into the project specification:
> - **Zero Emojis & Material Symbols Rounded**: All icons are rendered exclusively through Google Material Symbols Rounded font. No emojis in UI, navigation, buttons, cards, or labels.
> - **Typography Standards**: `Roboto Flex` with expressive variable axes and tabular figures (`tabular-nums`) for the timer digits and headlines. `Plus Jakarta Sans` for body copy and metadata. No Lucide icons. No JetBrains Mono.
> - **Color & Shape Scale**: Dynamic M3 tonal palette generated via `@material/material-color-utilities` from user-selected seed colors or uploaded images. Varied M3E shape scale (Extra-Small 4px, Small 8px, Medium 12px, Large 16px, Extra-Large 28px, Full) and connected button groups with asymmetrical inner/outer radii, avoiding uniform pill flattening.
> - **Strict Anti-Template Discipline**: No harsh gradients, no pure white (`#fff`) or pure black (`#000`), no glassmorphism or backdrop blurs, no bento card grids, no decorative pulsing dots, no em dashes in copy. Skeleton loaders for all async states.
> - **Export & Code Access**: Detailed GitHub push and ZIP download instructions documented in `DEPLOY.md` and `README.md`.

---

## 1. Overview & Core Concept

- **What It Does**: Focus Plan M3E delivers a Pomodoro workflow (Focus, Short Break, Long Break), structured task planning with minimum and maximum goals, standardized test section targets and countdowns, habit streak mechanics (requiring 3+ daily sessions), achievement badges, focus coins and store perks, and study group leaderboards.
- **Target Audience**: Students and test-takers preparing for standardized admission tests alongside deep work professionals needing structured cadences.
- **Key Value**: Merges distraction-free timer ergonomics with structured goal management—preventing burnout through dynamic M3 tonal palettes, flexible study cadences, and immediate visual feedback on goal progress.

---

## 2. User Experience & Visual Design

### Material 3 Expressive Design Architecture
- **Tonal Color Architecture**: Full CSS custom property tokens derived from `@material/material-color-utilities`:
  `--md-sys-color-primary`, `--md-sys-color-on-primary`, `--md-sys-color-primary-container`, `--md-sys-color-on-primary-container`,
  `--md-sys-color-surface`, `--md-sys-color-surface-dim`, `--md-sys-color-surface-bright`, `--md-sys-color-surface-container-lowest`,
  `--md-sys-color-surface-container-low`, `--md-sys-color-surface-container`, `--md-sys-color-surface-container-high`,
  `--md-sys-color-surface-container-highest`, `--md-sys-color-outline`, `--md-sys-color-outline-variant`.
- **Shape Scale & Connected Button Groups**:
  - Connected segmented controls for modes: outer corners rounded at 20px, inner joint borders flat with 0px radius.
  - Cards and dialogs using 24px and 28px radii; buttons using 12px to 20px depending on hierarchy.
- **Wavy Progress Indicator**: Custom SVG bezier wavy progress ring around the timer digits, with stroke and amplitude responding to timer completion.
- **Zero-Pill Discipline**: Metadata rendered as plain unboxed text with middle-dot separators (`·`). Interactive tabs use clean segmented backgrounds.

### Layout & Navigation Shell
- **Desktop & Tablet**: Navigation Rail docked to the start side (left in LTR, right in RTL) containing brand mark, destination icons (Focus, Plan, Tests, Progress, Friends, Store, Settings), theme mode switch, and language selector.
- **Phone (<768px)**: Floating bottom navigation bar with active tonal indicator pill and 48px touch targets adhering to thumb-zone ergonomics.
- **Footer**: Plain-language links to dedicated `/terms` (Terms of Service) and `/privacy` (Privacy Policy) pages covering Google OAuth, Firebase sync, and leaderboard privacy.

```
+--------------------------------------------------------------------------------------------------+
| Desktop Layout (Nav Rail + Content Canvas)                                                       |
| +----------+----------------------------------------------------+------------------------------+ |
| | [Focus]  | Active Task: Reading Comprehension · Goal: 4 pom   | Daily Target: 3/4 Sessions   | |
| | [Plan]   |                                                    | Current Streak: 5 Days       | |
| | [Tests]  |         [ Focus ] [ Short Break ] [ Long Break ]   |------------------------------| |
| | [Stats]  |                                                    | Tasks for Today              | |
| | [Friends]|                    [ 25 : 00 ]                     | [x] Vocabulary Practice      | |
| | [Store]  |             M3E Wavy Ring Progress                 | [ ] Section 2 Drills         | |
| |          |                                                    |------------------------------| |
| | [⚙ Settings]        [ Start Timer ]   [ Skip ]                | Test Countdown               | |
| | [Theme]  |                                                    | Saudi GAT in 18 days         | |
| | [Lang]   | Category: Standardized Tests · Target: 90+ Score   | Target: 90 · Math & Verbal   | |
| +----------+----------------------------------------------------+------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### Bilingual & Arabic RTL System
- Native `dir="ltr"` and `dir="rtl"` dynamic switching on `<html>` with persistent preference.
- All styles implemented with CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-start-start-radius`).
- Arabic font typography pairing with appropriate line heights for complete readability.

---

## 3. Phased Implementation Roadmap

### Phase 1: Foundation & Core Feature Suite
- **Phase 1a: Design System, Shell & Onboarding**
  - M3E color tokens and theme engine using `@material/material-color-utilities` supporting System/Light/Dark and seed colors.
  - Material Symbols Rounded setup and Roboto Flex + Plus Jakarta Sans typography.
  - Responsive shell: Desktop Nav Rail + Mobile Floating Bottom Bar.
  - Bilingual i18n engine (English and Arabic RTL) with language selector.
  - 3-step skippable onboarding modal (Theme selection, First study goal, Friend group overview).
  - Terms of Service (`/terms`) and Privacy Policy (`/privacy`) routes with plain-language disclosures.
  - Skeleton loaders for all asynchronous loading states.
- **Phase 1b: Core Focus Timer & Task System**
  - Framework-free timestamp-accurate timer engine (`/src/lib/timerEngine.ts`) immune to tab sleep.
  - Connected segmented mode selector (Focus, Short Break, Long Break).
  - Wavy SVG progress ring and morphing Start/Pause action.
  - Web Audio API synthesizer for ambient focus white noise and chime alarms (no external audio assets).
  - Task management: CRUD, estimates, notes, min/max goals, repeat cadences, reordering.
  - Keyboard shortcuts (Space, R, S, 1/2/3, N, ?) with help dialog.
  - Vitest test suite for timer calculations and state transitions.
  - PWA manifest and service worker configuration.
- **Phase 1c: Test Catalog, Streaks, Badges & Store**
  - Standardized test catalog (`/src/data/tests/`): Saudi GAT (Qudurat), SAAT (Tahsili), STEP, KFUPM Early SAAT, and International SAT, ACT, IELTS, TOEFL, Duolingo with section breakdown and editable target scores.
  - Streak engine with the 3+ daily completed pomodoro rule, timezone day rollover, and streak freezes.
  - Badges system and SVG awards for milestone days, hours, and goals.
  - Focus Coins ledger and Store interface (streak freeze, break multipliers, custom palettes).
  - Vitest unit tests for streak, goal percentage (handling 200%+ overachievement), and coin transactions.
  - Documentation suite: `README.md`, `CODEBASE.md`, and `FEATURE_PARITY.md`.

### Phase 2: Analytics & Reporting
- Telemetry dashboard with M3-themed charts (day, week, month, year, all-time).
- Heatmap calendar and task completion rates.
- Score loop: prompt for actual test scores after test date, compare to goal line, and suggest adjustments.
- Weekly report export in CSV and PDF formats (styled in app palette with full RTL layout support).

### Phase 3: Firebase Backend & Social Circles
- Firebase Auth (Google OAuth) with guest-to-cloud migration on first login.
- Cloud Firestore schemas, security rules, and unit test suites.
- Friend circles: create group, invite codes/links, shared group study task, and daily/weekly leaderboards.
- Opt-in public leaderboard with strict privacy controls.

### Phase 4: Google Workspace Integrations
- Google Tasks API two-way synchronization with conflict resolution.
- Google Calendar API study block scheduling and test date reminders.

### Phase 5: Gemini AI Study Intelligence
- Server-side Gemini integration via Firebase AI Logic / backend proxy.
- Test section planner, adaptive study schedule generator, and post-test gap analysis.

### Phase 6: Push Notifications & Deployment
- Web Push notifications via Firebase Cloud Messaging with service worker background delivery.
- Google Calendar event reminder fallback.
- Landing page with interactive live timer demo and feature showcase.
- Deployment verification and GitHub export guide.

---

## 4. Repository & Code Export Information

> [!NOTE]
> **How to Download as ZIP or Push to GitHub in Google AI Studio**:
> 1. **Download as ZIP**: In the AI Studio interface, click the **Settings / Project Options** menu (three dots or gear icon near the top right of the workspace) and select **Download Project as ZIP**. This downloads the complete project archive including all source code, configuration files, and documentation.
> 2. **Push to GitHub**: In the project toolbar, select the **Version Control / Git** icon or the **Export to GitHub** button. Authenticate your GitHub account and specify your repository name to create or sync with a remote repository.
> 3. **Manual Git Push**: Alternatively, you can initialize a git repository locally from the unzipped archive (`git init && git remote add origin <url> && git push -u origin main`).
