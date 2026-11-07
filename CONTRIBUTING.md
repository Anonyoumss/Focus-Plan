# Contributing

PRs, improvements and suggestions are welcome.

## Ground rules

- Read `AGENTS.md` first — it defines the design system (Material 3
  Expressive), the anti-template rules, and the honesty requirements for
  `FEATURE_PARITY.md`.
- Business logic stays framework-free in `src/lib` with Vitest tests.
- English and Arabic must both work; check RTL for any UI change.
- **Test catalog corrections must cite an official source URL** (exam
  body page). Claims without a source will be rejected — see the
  "Test catalog correction" issue template.
- Stay on free tiers (Firebase Spark). No Cloud Functions without
  discussion.

## Workflow

1. Fork, branch, implement in small diffs.
2. Run `npm run lint && npm run lint:eslint && npm test && npm run build`.
3. For UI changes, verify in a real browser (Playwright specs live in
   `e2e/`; emulator specs need Java 21 — see README).
4. Update `FEATURE_PARITY.md` honestly: "Verified in browser", "Unit
   tested only", or "Compiled only".
5. Open a PR using the template.

## Dev setup

See README.md — `npm install`, `npm run dev` on port 3000.
