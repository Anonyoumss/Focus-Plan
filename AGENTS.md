# Focus Plan M3E: agent rules

## Product
A responsive, installable PWA that merges Pomofocus (https://pomofocus.io/app, reference repo https://github.com/bermarte/pomofocus) and Tomato (https://github.com/nsh07/Tomato), plus a goal-driven study layer: categories, tasks with min/max goals and repeat cadences, test goals with per-section target scores (Saudi GAT, SAAT, STEP, KFUPM Early SAAT, SAT, ACT, IELTS, TOEFL, Duolingo, custom), score loop, streaks (3+ pomodoros per day), badges, focus coins and store, friend groups, leaderboards. English and Arabic with full RTL. Must stay portable to Capacitor and later native Android.

## Working rules
1. Do not ask me UX or emotional-tone questions. Design is decided (below).
2. Before changing anything, read the repo, README.md, CODEBASE.md, FEATURE_PARITY.md and DECISIONS.md. Never rebuild what exists. Extend it.
3. Work in small steps. At the start of a task, give a short plan (max 10 lines). Then implement. Prefer small diffs over rewrites. Do not reformat unrelated files.
4. Never mark anything Done in FEATURE_PARITY.md unless you ran it. Use three labels: Verified in browser, Unit tested only, Compiled only. State what you did not test.
5. Verify UI work for real: run the dev server, drive it with Playwright (headless), and save screenshots. Check English LTR and Arabic RTL, light and dark, phone (360px) and desktop (1280px).
6. Business logic (timer, streaks, goal percent, points, coins, scheduling) lives in framework-free TypeScript under src/lib with Vitest tests. No React or DOM imports there.
7. Never commit secrets. Use .env.local and keep .env.example up to date. Firebase web config is public, but keep it in env variables anyway.
8. Run lint, typecheck, unit tests and build before saying a task is finished, and report the results honestly, including failures.
9. If something is ambiguous, choose the Google or Material option, write it in DECISIONS.md, and continue. Ask me only for things you cannot decide (credentials, billing plan, repo name).
10. Stay on the free tiers. Firebase Spark plan only unless I say otherwise. If a feature needs Blaze (Cloud Functions, scheduled jobs), tell me and implement a Spark-plan fallback (for example settle daily and weekly point awards when a member opens the app, with transaction-based duplicate protection).

## Design: Material 3 Expressive for the web (primary, non-negotiable)
- Sources: https://m3.material.io, https://m3.material.io/develop/web, https://github.com/Ivorisnoob/Material-3-Expressive-Guide-For-you-AI. If you find a Jetpack Compose guide, take only the design philosophy and map it to web equivalents.
- Use @material/web, @material/material-color-utilities (seed to tonal palette), Material Symbols Rounded, Roboto Flex (tabular figures and expressive axes for the timer and headlines), Plus Jakarta Sans for body only, an Arabic-capable font (Readex Pro or similar) for Arabic.
- Full M3 token set as CSS custom properties: color roles, type scale, shape scale (varied radii, not uniform), tonal elevation, state layers, motion tokens.
- Expressive traits: shape-morphing Start/Pause, wavy progress ring, connected button groups (check m3.material.io for correct inner corners and pressed morph), spring motion.
- Motion libraries: motion.dev for springs and layout, anime.js for SVG morphing and landing timelines. Kokonut UI and Bklit UI only as optional fallbacks and never override M3 tokens. Respect prefers-reduced-motion.
- Light and dark follow prefers-color-scheme (System, Light, Dark override). Update the theme-color meta. Browsers do not expose the Chrome theme to pages; never claim to.

## Anti-template rules (all UI and copy)
No harsh or multi-stop gradients (including chart area fills). No Lucide icons. No pure white or pure black backgrounds. No rainbow or multi-color decoration (chart and category colors come from M3 tonal roles). No heavy shadows. No three-feature-card rows, no bento grids, no three-tier pricing. No emojis in UI. No glassmorphism or backdrop blur. No em dashes in headings or marketing copy. No Inter, Geist or Space Grotesk. No colored left accent stripes. No fake testimonials, avatars or fake terminals. No "It's not X, it's Y" copy. No decorative checkmark bullets. No purple-on-black, radial orbs, dot grids, sparkle icons, animated bouncing arrows, neon colors, pastel badge washes. No hover or movement animation on everything. Skeleton loaders for async data, never bare spinners. Charts must not rely on color alone. Footer links to real Terms and Privacy pages that describe only what is true today.

## Accessibility and quality
WCAG AA contrast, keyboard navigation, screen reader labels, 48px touch targets, logical CSS properties (start/end) for RTL, mirrored directional icons, Lighthouse 90+.

## Integrations (later phases)
- Firebase: Auth (Google), Firestore, Security Rules with emulator unit tests, App Check. Coins, points and streaks are never client-writable.
- Google Tasks API (scope https://www.googleapis.com/auth/tasks) and Google Calendar API (narrowest scope, ideally a dedicated Focus calendar), both opt-in with incremental consent. Docs: https://developers.google.com/tasks and https://developers.google.com/calendar. Sensitive scopes: in Testing mode only listed test users can connect.
- Gemini only through Firebase AI Logic (https://firebase.google.com/docs/ai-logic) or a server function. Never put an API key in client code. Output is AI suggested, editable, schema validated, and never invents exam dates.
- Reminders: FCM web push where possible, Google Calendar event reminders as a free fallback.
