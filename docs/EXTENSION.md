# Focus Plan Companion (browser extension)

MV3 extension in `/extension`. Opt-in, local-first focus tracking: while a
Focus Plan timer session is running, it records **which kind of site** you are
on — study (allowlist), distraction (blocklist), or other — as domain-level
minutes. It never reads page content, never stores full URLs or history, and
never sends anything to a server.

## Privacy model

- Permissions: `tabs` (active-tab URL only, to get the domain), `storage`,
  `alarms` (30 s accrual tick), `notifications` (gentle off-task nudge,
  throttled to once per 5 min, never blocks sites).
- No content scripts, no `host_permissions`, no remote code.
- Data lives in `chrome.storage.local`. The web app can pull an aggregated
  snapshot (on/off/other minutes per session and per day, top domains) over a
  local messaging channel — it is **not** added to Firebase/Firestore; it stays
  in the app's local storage like everything else guest-side.

## App ↔ extension channel (design choice)

Chosen: `chrome.runtime.onMessageExternal` (`externally_connectable`).

- The manifest pins a `key`, so the extension ID is stable:
  `hppldplcookimjhlkmanllinfjnbnjff`.
- `externally_connectable.matches` is `*://*://*` wide **on purpose**: the real
  gate is the extension's own `trustedOrigins` list (editable in its options
  page). Any other origin gets `{ok:false}` for everything except `ping`.
- Default trusted origins: localhost dev servers only. For the hosted app the
  user adds their Pages/Vercel origin once in the extension options — a
  deliberate one-time step so random websites cannot pull data.
- Message types: `ping`, `session` (running/paused/end), `pull`, `pushLists`,
  `setEnabled`, `deleteData`, `export`, `import`.

Tradeoff vs manual export/import: messaging gives live session attribution and
one-click connect; the cost is the trusted-origins bootstrap step above.
Manual JSON export/import is still built into the options page and is the only
channel on Firefox (see below).

## Firefox

`externally_connectable` is Chrome-only, so the Firefox build
(`manifest.firefox.json`, packaged as `focus-plan-companion-firefox.zip`)
tracks locally and the user moves data via **Export/Import JSON** in the
options page. `webextension-polyfill` was skipped: the code already uses
callback-style `chrome.*` APIs that work in both browsers, so the dependency
would add build complexity for no gain.

## Install

### Load unpacked (development)

1. Build the zip locally or copy `extension/`:
   - Chrome: rename `manifest.chrome.json` → `manifest.json` (or use the CI zip).
   - Firefox: `manifest.firefox.json` → `manifest.json`.
2. Chrome: `chrome://extensions` → Developer mode → Load unpacked → select the
   folder. Firefox: `about:debugging` → This Firefox → Load Temporary Add-on →
   select `manifest.json`.
3. Open the extension's options page, add your study/distraction domains, and
   (for the hosted app) add your app origin to trusted origins.
4. In the app: Settings → Browser extension → Connect.

### From GitHub Releases

`.github/workflows/extension.yml` builds `focus-plan-companion-chrome.zip` and
`focus-plan-companion-firefox.zip` on every `v*` tag and attaches them to the
release (also uploaded as workflow artifacts on main pushes).

- Chrome: unzip, then Load unpacked (Chrome Web Store is not used).
- Firefox: unzip and use `about:debugging` (temporary) — permanent install
  needs signing via AMO or `xpinstall.signatures.required=false` in
  Firefox Developer/Nightly. Store publishing is optional and unverified here;
  no fee assumptions are made.

## What the app shows

- Progress → **Focus insights** card: on-task / off-task / other minutes for
  the last 7 days and the 5 most recent sessions with top domains.
- Settings → **Browser extension**: connect/disconnect, tracking toggle,
  allowlist/blocklist editing (pushed to the extension), refresh, delete all
  extension data.
- The app is fully functional with the extension absent; the card shows a
  connect prompt instead.

## Testing status

Unit-tested (`src/lib/extension/core.test.ts`, 12 tests): domain
normalization/matching, running/paused/off-task attribution, nudge cooldown,
list reclassification, delete-data, snapshot shape. The message handler is a
thin `chrome.*` wrapper over the same pure reducer.

**Not tested without a real browser profile:** actual `chrome.tabs` events,
`onMessageExternal` delivery, notification display, and the options page UI.
These need a manual smoke test in Chrome and Firefox.
