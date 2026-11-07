# Architecture & Engineering Decisions Log: Focus Plan M3E

This log documents all technical, structural, and design decisions made during the development of Focus Plan M3E.

---

## Decision 1: Google Material 3 Expressive Dynamic Palette Engine
- **Decision**: Adopt `@material/material-color-utilities` to generate full tonal palettes at runtime from a seed color hex or image, applying tokens via CSS custom properties (`--md-sys-color-*`).
- **Rationale**: Guarantees authentic Material 3 color harmony across both light and dark modes, and enables user customization without brittle CSS overrides.
- **Alternatives Considered**: Static CSS color variables or third-party Tailwind color palettes. Rejected because they lack the perceptual luminance and tonal tonal container contrast required by M3.

---

## Decision 2: Iconography Standard
- **Decision**: Standardize exclusively on **Google Material Symbols Rounded**, loaded via Google Fonts. No emojis or Lucide icons in any UI component or label.
- **Rationale**: Ensures pixel-perfect alignment with M3 design principles, provides consistent font metrics, and complies with anti-slop guidelines.

---

## Decision 3: Typography Strategy
- **Decision**:
  - `Roboto Flex` for the timer countdown digits and headlines with tabular figures (`tabular-nums`) and variable axes.
  - `Plus Jakarta Sans` for body copy and general UI controls.
  - `Readex Pro` for native Arabic typography and line height balance.
- **Rationale**: Prevents horizontal jitter as numbers countdown and provides natural Arabic script aesthetics under RTL.

---

## Decision 4: Synthesized Audio with Web Audio API
- **Decision**: Synthesize both completion bell chimes (harmonic sine oscillators with exponential decay) and focus ambient sound (pink noise and alpha binaural waves) directly via the browser's native `AudioContext`.
- **Rationale**: Completely self-contained; zero network requests for `.mp3`/`.wav` audio files; 100% offline capable and functional inside PWA environments.

---

## Decision 5: Framework-Free Core Logic (`/src/lib/`)
- **Decision**: Keep countdown math, streak algorithms, badge evaluations, and coin transaction validation in pure TypeScript modules decoupled from React.
- **Rationale**: Enables lightning-fast automated unit testing with Vitest and allows direct 1:1 porting to native Android (Kotlin / Jetpack Compose) or Capacitor in future expansion phases.

---

## Decision 6: Spark-plan wallet and leaderboards are an honor system
- **Decision**: Without Cloud Functions, coins, focus minutes, and daily or weekly awards are written by the client. Firestore Security Rules can reject some impossible deltas, but they cannot prove that a session was actually completed. Leaderboards are an honor system and are not cheat-proof.
- **Rationale**: The Firebase Spark plan does not include Cloud Functions. A scheduled or trusted server writer would require the Blaze plan.
- **Source**: Firebase pricing and Cloud Functions requirements, https://firebase.google.com/pricing and https://firebase.google.com/docs/functions (recorded 2026-11-07).

---

## Decision 7: Direct esbuild range matches Vite 8.3.6
- **Decision**: The direct `esbuild` devDependency is `^0.28.2`.
- **Rationale**: `npm install` failed with `ERESOLVE` because `package.json` asked for `esbuild@^0.25.0` while the published Vite 8.3.6 peer dependency is `esbuild@^0.27.0 || ^0.28.0`. `0.28.2` is a published version and is already the esbuild copy nested under `tsx` in `bun.lock`.
- **Source**: `npm view vite@8.3.6 peerDependencies` and `npm view esbuild versions`, run on 2026-11-07.

---

## Decision 8: npm audit findings are dev-only and accepted for now
- **Decision**: Leave the audit findings unfixed. `npm audit` reports 13 vulnerability paths (11 moderate, 2 critical) collapsing to 3 advisories, all inside devDependencies: `@vitest/mocker` <=4.1.11 (moderate, GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8), `tinypool` <=2.1.1 (critical, GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr), and `minimatch` 7.0.0-11.0.0 (moderate, GHSA-g3hv-75wg-m249, via eslint). None ship to the browser bundle. Fixes require vitest 5 or eslint 9 downgrades/upgrades that are breaking; `npm audit fix --force` was not run.
- **Rationale**: Owner decision 2026-11-07: do not upgrade vitest; revisit when moving to milestone 3+ tooling.
- **Source**: `npm audit` run on 2026-11-07.

---

## Decision 9: TypeScript pinned to ~5.9 for ESLint compatibility
- **Decision**: `typescript` devDependency is `~5.9.3`, not 7.x. `typescript-eslint` (latest 8.72.x) peers `typescript >=4.8.4 <6.1.0`, so ESLint cannot run against TS 7. `tsc --noEmit`, Vitest, and the Vite build (esbuild) are unaffected.
- **Rationale**: Minimal ESLint was required for milestone 2a; TS 7 is brand new and the typescript-eslint toolchain does not support it yet.
- **Source**: `npm view typescript-eslint@latest peerDependencies`, 2026-11-07.

---

## Decision 10: Demo data is opt-in, never seeded
- **Decision**: New users start with zero tasks, goals, streak, coins, and session logs. Sample content loads only via the labeled "Load demo data" button in Settings (`demoDataLoaded` flag persisted). Friends screen rows remain labeled local demo.
- **Rationale**: Honest parity requirement — generated history must not masquerade as user data.

---

## Decision 11: Phone navigation uses a "More" sheet
- **Decision**: The mobile bottom bar shows Focus, Plan, Tests, Progress, and More. Friends, Store, and Settings open from the More bottom sheet. Desktop rail keeps all destinations.
- **Rationale**: Material navigation bars cap at 5 destinations; Store was unreachable on phone before.

---

## Decision 12: Catalog facts carry per-field source URLs or stay flagged
- **Decision**: `StandardizedTestDefinition` has `sourceUrls` (scoreScale/sections/dates) and `unverifiedFields`. Only URLs confirmed by fetching the official page on 2026-11-07 are filled (SAT, ACT scores page, IELTS, TOEFL scores). etec.gov.sa requires JavaScript and englishtest.duolingo.com returned non-HTML, so GAT/SAAT/STEP/Duolingo fields stay unverified and the UI shows "Verify on official site". KFUPM keeps only its `/important-dates` link; its section list is unverified. No test dates are prefilled anywhere.
- **Rationale**: Owner rule — never invent catalog facts; blank means verify on the official site.
