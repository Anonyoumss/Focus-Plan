# Next session: Part 2 — browser extension

Context ran out after Part 1 (Android). Remaining work, in order:

## Part 2: Manifest V3 extension in /extension

1. `/extension`: MV3, opt-in, local-first, domain-level only. Never page content, never full URLs/history, never sends to a server by default. User-configurable allowlist (study domains) + optional blocklist (distraction domains). Minimal permissions (tabs/activeTab, storage, alarms; host permissions optional). Off-task time during a running session -> gentle notification, never block.
2. App<->extension channel: choose `externally_connectable` with configurable origins vs manual export/import; document tradeoffs in docs/EXTENSION.md and implement. App gets a Focus insights card (on-task/off-task minutes per session and per week, stored in user data) + Settings section: connect/disconnect, edit allowlists, delete all extension data. App must work fully without the extension.
3. Update Terms + Privacy EN/AR re: extension data (stays on device unless synced). Firestore rules/tests only if new synced fields are added.
4. Firefox: webextension-polyfill if cheap. `.github/workflows/extension.yml`: Chrome zip + Firefox zip artifacts, attach to GitHub Release on `v*` tags. docs/EXTENSION.md: load-unpacked, Releases distribution, store publishing optional/unverified.
5. Tests: domain matching, session attribution (running/paused/off-task), messaging contract, mocked browser API. State what needs a real browser profile.
6. Final: update FEATURE_PARITY.md, docs/HANDOFF.md, docs/OVERNIGHT-REPORT.md; git status clean; commit locally, never push.

## Notes

- `eslint.config.js` already ignores `extension/**`.
- Playwright: `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers`; emulators need `JAVA_HOME=/home/nothingos/tools/jdk-21.0.13+9-jre`.
- Kill stale `vite --port=3000` before `npm run test:e2e:firebase`.
