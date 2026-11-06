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
