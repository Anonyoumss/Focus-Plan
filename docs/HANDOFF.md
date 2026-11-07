# HANDOFF — Focus Plan M3E

## State (verified 2026-11-08, milestone 4 complete)

- Repo: Anonyoumss/Focus-Plan, branch main. Milestone 4 committed locally; do not push unless asked.
- Stack: React 19 + Vite 8 + TS ~5.9 + Zustand + Tailwind v4 + Vitest 3.2.7 + Playwright 1.65 + ESLint flat config + `motion` + `animejs` + `@material/web` + `firebase` 13.1.0.
- Milestones 2a (honesty), 2b (build), 3 (Firebase emulator-first), and 4 (social/store backend) are done and verified. Next: milestone 5 (study tools) or 6 (publish) per owner.

## Verified command results (post-4)

- `npm run lint` (`tsc --noEmit`): pass. `npx eslint .`: 0 errors, 0 warnings.
- `npm test`: 7 files, 39 tests pass. `vitest.config.ts` excludes `e2e/`.
- `npm run build`: pass (~750 kB JS chunk warning only).
- `npx playwright test`: 15/15 pass; both emulator specs self-skip without Firebase env.
- `npm run test:rules`: 31/31 Firestore rules tests pass (project `demo-focus-plan-test`).
- `npm run test:e2e:firebase`: 2/2 pass — milestone 3 sign-in/migrate/sync/sign-out flow, plus `e2e/groups-emulator.spec.ts` two-user flow (create group, join by invite link and by code, shared 25-min session on leaderboard, hidden public-profile fields, rule-enforced store purchase).
- `npm audit`: dev-only advisories (vitest/eslint chains + firebase-tools deps). Accepted per owner; DECISIONS.md Decisions 8 and 16. Do NOT run `npm audit fix --force`.

## Emulator prerequisites (already installed on this machine)

- `firebase-tools` 15.35.0 is a devDependency (`npx firebase`). It requires **Java 21+**; Java 17 fails with "firebase-tools no longer supports Java version before 21".
- Java 21.0.13 (Temurin JRE) is installed user-local at `~/tools/jdk-21.0.13+9-jre` — no sudo. Prefix commands:
  `JAVA_HOME=~/tools/jdk-21.0.13+9-jre PATH=~/tools/jdk-21.0.13+9-jre/bin:$PATH`
- First emulator run downloads `cloud-firestore-emulator-v1.22.0.jar` into `~/.cache/firebase/emulators`.
- Emulator ports (firebase.json): Auth 9099, Firestore 8080, UI 4000. Demo project IDs: `demo-focus-plan-test` (rules tests), `demo-focus-plan-m3e` (app e2e).

## Firebase console setup (only needed for a REAL project — everything above works without it)

1. console.firebase.google.com → Add project → name it (e.g. `focus-plan`), Spark plan (free). No need to enable Analytics.
2. Project settings → Your apps → `</>` Web → register app (any nickname). Copy the config values.
3. Authentication → Sign-in method → enable **Google** provider (support email required).
4. Authentication → Settings → Authorized domains: add `localhost` and `anonyoumss.github.io` (GitHub Pages). Firebase auth domains also allow `*.firebaseapp.com` by default.
5. Firestore → create database (production mode, closest region) → Rules tab: paste `firestore.rules` from repo and publish. The rules now cover groups, profiles, public board, awards, and wallet — publish the current file, not an older copy.
6. Put the web config in `.env.local` (gitignored) using the names in `.env.example`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Leave `VITE_USE_EMULATORS=false` (or unset) for the real project; set `true` only for local emulator work.
7. Optional but recommended before real users: Firebase App Check (reCAPTCHA) — documented placeholder, see DECISIONS.md.

## What changed in 4

- `src/lib/groupStats.ts`: pure period keys (`dayKey`, ISO `weekKey`), award walk-back windows (7 days / 4 weeks), `rankLeaderboard` (minutes → focus points → streak), `minutesByMember`, `recentDayKeys`.
- `src/lib/firebase/groups.ts`: groups, members, tasks, sessions, invite codes, memberships, wallet/ledger transactions (`creditWallet`, `spendCoins`, `reconcileWallet`), lazy group awards (`claimGroupAwards`), private/public profiles, public board.
- `src/lib/firebase/emulatorHook.ts`: `window.__fpEmu` test hook installed only when `VITE_USE_EMULATORS=true`; never in production.
- Store (`useAppStore.ts`): `activeGroupId`/`groupFocusTaskId` persisted; `purchaseItem` is async and runs `spendCoins` when signed in; pomodoro completion mirrors earned coins/FP via `creditWallet` and logs group minutes via `logGroupSession`; `adoptWalletAndClaimAwards` runs on sign-in/migration (wallet reconcile + award claims + FP refresh).
- UI: `FriendsView` rewritten as real groups (create/join/leave, roster, shared tasks, day/week leaderboard, alias + public opt-in, public board); `InvitePage` resolves codes and joins for real; guests see a sign-in prompt (demo data removed).
- Rules: groups/members/tasks/sessions/inviteCodes/memberships, `users/{uid}/groupAwards`, `profile/main` (owner-only), `public/profile` + `publicLeaderboard` (field whitelists), wallet focus-point deltas and replay protection.
- Sync conflict fix (step 0): `src/lib/syncMerge.ts` per-record `updatedAt` + tombstones; deletes sync; offline edits survive pulls.
- Legal: Terms/Privacy cover groups, member-visible data, public-board opt-in/opt-out, honor-system limits.
- E2E: `e2e/groups-emulator.spec.ts` (two users, full flow) added to `npm run test:e2e:firebase`.

## Known gaps / cautions

- Leaderboards, awards, and wallet deltas are an honor system: rules bound what clients can write but cannot prove a pomodoro happened (Decision 22; extends Decision 17). Terms/Privacy say so.
- Firestore rules cannot see same-batch writes: any rule guarded by `exists()`/`get()` on a doc written in the same batch fails. `createGroup` therefore commits membership docs first, then the task (Decision 19). Keep this in mind for future multi-doc writes.
- Group awards walk back only 7 days / 4 weeks; older unclaimed periods are forfeited (Decision 20).
- Public board stats (`weeklyMinutes`, `streak`) refresh when the member saves profile settings, not continuously.
- Last-write-wins per document for user data sync; per-record `updatedAt` merge (step 0) protects offline edits, but there is no conflict UI.
- "Decide later" re-prompts migration on every sign-in by design.
- Functional Playwright flows are EN-only; AR/RTL coverage is screenshots + overflow assertions.
- Catalog unverified defaults accepted by owner as flagged.
- `docs/original-brief.md` and `docs/ai-studio-plan.md` are in repo (owner-added, commit 5888cee).
- TypeScript ~5.9 (typescript-eslint constraint).
- GitHub Pages `/Focus-Plan/` base path and manifest `start_url` base-path handling is milestone 6 work (owner flagged).

## Commands

- Dev: `npm run dev` (port 3000). Unit: `npm test`. Lint: `npm run lint && npm run lint:eslint`. Build: `npm run build`. E2E: `npx playwright test` (Chromium installed).
- Rules tests: `JAVA_HOME=~/tools/jdk-21.0.13+9-jre PATH=~/tools/jdk-21.0.13+9-jre/bin:$PATH npm run test:rules`.
- Emulator app e2e: same env prefix + `npm run test:e2e:firebase` (runs both emulator specs).
- Emulators manually: `npm run firebase:emulators` (auth 9099, firestore 8080, UI http://127.0.0.1:4000).
## Post-M5 hardening pass

- New specs: `e2e/m6-hardening.spec.ts` (score loop e2e incl. custom sections, month/older report periods, CSV BOM+Arabic, PDF via page.pdf + pdftotext, reminders via injected clock, Arabic functional settings/sections), `e2e/m6-sounds.spec.ts` (AudioContext spy), `e2e/templates-emulator.spec.ts` (cloud template round-trip; added to `npm run test:e2e:firebase`).
- Bugs found and fixed: templates were never pushed to Firestore (`taskTemplates` vs `templates` key mismatch in the persist slice); tick sound settings ignored persisted values; `isQuietHour` test expectations corrected; score-loop modal gained aria-label and post-test-date prompt.
- Reports now export CSV with UTF-8 BOM for Excel/Arabic; PDF verified by content extraction, not just screenshots.
- Still untested: real Notification permission prompt UX in a headed browser, audible output (spied engine calls instead), PDF visual RTL inspection by eye (content verified via pdftotext; screenshots saved under docs/screenshots/report-print-*.png).
