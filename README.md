# Focus Plan M3E — Material 3 Expressive Pomodoro & Study Tracker

> A responsive, installable Progressive Web App (PWA) uniting the core focus ergonomics of **Pomofocus** and **Tomato** with a goal-driven study tracking engine tailored for Saudi entrance examinations (**GAT / Qudurat**, **SAAT / Tahsili**, **STEP**, **KFUPM Early SAAT**) and International tests (**SAT**, **ACT**, **IELTS**, **TOEFL**, **Duolingo**).

---

## Highlights & Key Capabilities

- **Material 3 Expressive Design**:
  - Dynamic color scheme generated at runtime using `@material/material-color-utilities` from seed colors or uploaded images.
  - Soft tonal surfaces adhering to Google M3 Expressive tokens (`--md-sys-color-*`).
  - Connected segmented controls for modes (`Focus | Short Break | Long Break`) with asymmetric shape scale radii.
  - Wavy SVG circular progress ring and spring-morphing Start/Pause button.
  - Expressive `Roboto Flex` tabular digits for zero-jitter countdowns, paired with `Plus Jakarta Sans` and `Readex Pro`.
  - Exclusively uses Google **Material Symbols Rounded** with **zero emojis** in UI controls.
- **Bilingual & Full Arabic RTL Support**:
  - Seamless instant toggle between English (LTR) and Arabic (العربية - RTL).
  - Designed with CSS logical properties (`margin-inline-start`, `padding-inline-end`, `text-start`).
- **Resilient Timestamp Timer Engine (`/src/lib/timerEngine.ts`)**:
  - Framework-free logic immune to browser tab throttling, mobile sleep, and page reloads.
  - Screen Wake Lock API keeping the screen active during sessions.
  - Web Audio API synthesizer generating harmonic bell chimes and ambient pink noise with zero external audio assets.
- **Goal-Driven Study Engine**:
  - Categories (Work, School, Extracurriculars, Study, Standardized Tests, Personal) with min/max session thresholds and cadences (daily, weekly, monthly).
  - Standardized test catalog with section score breakdowns, days remaining countdowns, and real score logging loop.
- **Streaks & Focus Coins Economy**:
  - 3+ completed Pomodoros daily required to maintain streak.
  - Streak freeze protection against missed days.
  - Overachievement goal calculation (e.g. 4 goal, 8 completed = 200%).
  - Focus coins earned through focus sessions and redeemable in the Rewards Store.
- **Study Circles & Leaderboards**:
  - Collaborative study groups with 6-character invite codes (`FOCUS7`).
  - Weekly standings with 1 point daily and 7 points weekly bonuses.
  - Opt-in public leaderboard.
- **Full Privacy & Legal Pages**:
  - Plain-language Terms of Service (`/terms`) and Privacy Policy (`/privacy`) linked in the footer.
  - Local-storage first with full JSON/CSV export and data purge capability.

---

## Project Structure & Architecture

```
/
├── index.html                   # HTML entry point with fonts & metadata
├── metadata.json                # AI Studio manifest
├── manifest.json                # PWA manifest
├── package.json                 # Dependencies & scripts
├── src/
│   ├── App.tsx                  # Root router & theme synchronization
│   ├── main.tsx                 # React entry mount
│   ├── index.css                # Tailwind v4 & M3 CSS custom properties
│   ├── design/
│   │   └── theme.ts             # @material/material-color-utilities dynamic engine
│   ├── i18n/
│   │   └── translations.ts      # English & Arabic bilingual dictionary
│   ├── lib/                     # Framework-free pure TypeScript core
│   │   ├── timerEngine.ts       # Timestamp-accurate timer calculations
│   │   ├── soundEngine.ts       # Web Audio API sound synthesizer
│   │   ├── streakCalculator.ts  # 3+ session streak logic & badges
│   │   ├── coinsEngine.ts       # Focus coins & store transactions
│   │   └── __tests__/           # Vitest unit test suites
│   ├── data/
│   │   └── tests/
│   │       └── catalog.ts       # Saudi & International test specifications
│   ├── store/
│   │   └── useAppStore.ts       # Central Zustand state store with persistence
│   └── components/
│       ├── layout/              # Responsive Nav Rail & Mobile Bottom Bar
│       ├── focus/               # Timer display, wavy ring, task list
│       ├── plan/                # Categories, repetition cadences
│       ├── tests/               # Exam benchmarks, countdowns, score log
│       ├── progress/            # Streaks, consistency row, badges shelf
│       ├── friends/             # Study circles, codes, leaderboards
│       ├── store/               # Focus coins store & inventory
│       ├── settings/            # Theme seeds, language, data export
│       ├── legal/               # Terms of Service & Privacy Policy
│       ├── onboarding/          # 3-step first-launch walkthrough
│       └── common/              # MaterialIcon, SkeletonLoader, Shortcuts
```

---

## How to Download as ZIP or Push to GitHub

### 1. Download as ZIP
In Google AI Studio:
1. Click the **Project Options** menu (gear or three dots icon in the top header).
2. Click **Download Project as ZIP**.
3. Extract the archive locally and run:
   ```bash
   npm install
   npm run dev
   ```

### 2. Export / Push to GitHub
1. In the project toolbar, select the **Git / Version Control** icon.
2. Authenticate your GitHub account and specify your desired repository name.
3. AI Studio pushes all commits and branches directly to your GitHub repository.
4. Alternatively, initialize locally from your downloaded ZIP:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Focus Plan M3E"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Run Vitest unit tests
npx vitest run

# Build for production
npm run build
```

---

## Contributing & PRs

Contributions, feature suggestions, and pull requests are warmly welcomed! Please read `CONTRIBUTING.md` and check `FEATURE_PARITY.md` for current roadmap items.

## License & Credits

- Inspired by **Pomofocus** (by bermarte) and **Tomato** (by nsh07).
- UI governed by Google **Material 3 Expressive** guidelines.
- Licensed under the Apache-2.0 / MIT License.
