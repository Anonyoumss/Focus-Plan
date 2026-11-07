# HANDOFF — Focus Plan M3E

## State (verified 2026-11-08, milestone 3 complete)

- Repo: Anonyoumss/Focus-Plan, branch main. Milestone 3 committed locally; do not push unless asked.
- Stack: React 19 + Vite 8 + TS ~5.9 + Zustand + Tailwind v4 + Vitest 3.2.7 + Playwright 1.65 + ESLint flat config + `motion` + `animejs` + `@material/web` + `firebase` 13.1.0.
- Milestones 2a (honesty), 2b (build), and 3 (Firebase, emulator-first) are done and verified. Next: milestone 4 (social/store) or 5 (study tools) per owner.

## Verified command results (post-3)

- `npm run lint` (`tsc --noEmit`): pass. `npx eslint .`: 0 errors, 0 warnings.
- `npm test`: 5 files, 22 tests pass. `vitest.config.ts` excludes `e2e/`.
- `npm run build`: pass (~750 kB JS chunk warning only).
- `npx playwright test`: 15/15 pass; `e2e/firebase-emulators.spec.ts` self-skips without Firebase env.
- `npm run test:rules`: 14/14 Firestore rules tests pass (Auth not needed; project `demo-focus-plan-test`).
- `npm run test:e2e:firebase`: 1/1 pass — real Google sign-in popup against the Auth emulator, migration dialog, task sync, reload persistence, sign-out wipe.
- `npm audit`: dev-only advisories (vitest/eslint chains + firebase-tools deps). Accepted per owner; DECISIONS.md Decisions 8 and 16. Do NOT run `npm audit fix --force`.

## Emulator prerequisites (already installed on this machine)

- `firebase-tools` 15.35.0 is a devDependency (`npx firebase`). It requires **Java 21+**; Java 17 fails with "firebase-tools no longer supports Java version before 21".
- Java 21.0.13 (Temurin JRE) is installed user-local at `~/tools/jdk-21.0.13+9-jre` — no sudo. To use it, prefix commands:
  `JAVA_HOME=~/tools/jdk-21.0.13+9-jre PATH=~/tools/jdk-21.0.13+9-jre/bin:$PATH`
  or add that `bin` dir to PATH permanently in `~/.bashrc`.
- First emulator run downloads `cloud-firestore-emulator-v1.22.0.jar` into `~/.cache/firebase/emulators` (~few hundred MB).
- Emulator ports (firebase.json): Auth 9099, Firestore 8080, UI 4000. Demo project IDs: `demo-focus-plan-test` (rules tests), `demo-focus-plan-m3e` (app e2e).

## Firebase console setup (only needed for a REAL project — everything above works without it)

1. console.firebase.google.com → Add project → name it (e.g. `focus-plan`), Spark plan (free). No need to enable Analytics.
2. Project settings → Your apps → `</>` Web → register app (any nickname). Copy the config values.
3. Authentication → Sign-in method → enable **Google** provider (support email required).
4. Authentication → Settings → Authorized domains: add `localhost` and `anonyoumss.github.io` (GitHub Pages). Firebase auth domains also allow `*.firebaseapp.com` by default.
5. Create `firestore.rules` content in Firestore → Rules tab (paste `firestore.rules` from repo) and publish. Create the Firestore database itself (production mode, closest region).
6. Put the web config in `.env.local` (gitignored) using the names in `.env.example`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Leave `VITE_USE_EMULATORS=false` (or unset) for the real project; set `true` only for local emulator work.
7. Optional but recommended before real users: Firebase App Check (reCAPTCHA) — currently a documented placeholder, see DECISIONS.md.

## What changed in 3

- `src/lib/firebase/`: `client.ts` (lazy init gated on env vars, emulator connect, offline persistence), `auth.ts` (Google popup sign-in/out, `subscribeAuth`), `sync.ts` (Firestore layout `users/{uid}/{tasks,sessionLogs,testGoals,templates,settings/main,meta/migration}`, pull/push, idempotent setDoc writes, `isMigrationComplete`), `cloudSync.ts` (800ms debounced push with signature diffing).
- Store: `user`, `authStatus`, `cloudSyncEnabled`, `migrationChoice`, `syncError` state; `signIn`, `signOutAccount`, `resolveMigration`; `handleAuthUser` runs the migration check on every auth event; `wipeUserData` clears local data on sign-out.
- UI: Settings "Account & Synchronization" section (signed-in email, sign-in/sign-out buttons, cloud-not-configured state), `MigrationDialog` ("Merge your data": import / use cloud / decide later), EN+AR strings.
- Legal: Terms/Privacy describe Google sign-in + Firestore sync only; no social features claimed.
- Rules: `firestore.rules` (per-user isolation, shape/size validation, append-only logs, ledger-gated wallet), `tests/rules/firestore.rules.test.ts` (14 tests), `vitest.rules.config.ts`, `firebase.json`, `.firebaserc`.
- E2E: `e2e/firebase-emulators.spec.ts` + `npm run test:e2e:firebase`.

## Known gaps / cautions

- Rules cannot prove sessions happened or cap awards per day without Cloud Functions (Blaze) — honor system, DECISIONS.md Decision 17.
- Last-write-wins per document; offline edits while signed in can be overwritten by the cloud pull on next sign-in. No conflict UI yet.
- "Decide later" re-prompts on every sign-in by design; "import"/"cloud" write `meta/migration` and never re-prompt.
- Wallet/ledger collections exist in rules but no client writes them yet (milestone 4).
- Functional Playwright flows are EN-only; AR/RTL coverage is screenshots + overflow assertions.
- Catalog unverified defaults accepted by owner as flagged.
- `docs/original-brief.md` and `docs/ai-studio-plan.md` are in repo (owner-added, commit 5888cee).
- TypeScript ~5.9 (typescript-eslint constraint).
- GitHub Pages `/Focus-Plan/` base path and manifest `start_url` base-path handling is milestone 6 work (owner flagged).

## Commands

- Dev: `npm run dev` (port 3000). Unit: `npm test`. Lint: `npm run lint && npm run lint:eslint`. Build: `npm run build`. E2E: `npx playwright test` (Chromium installed).
- Rules tests: `JAVA_HOME=~/tools/jdk-21.0.13+9-jre PATH=~/tools/jdk-21.0.13+9-jre/bin:$PATH npm run test:rules`.
- Emulator app e2e: same env prefix + `npm run test:e2e:firebase`.
- Emulators manually: `npm run firebase:emulators` (auth 9099, firestore 8080, UI http://127.0.0.1:4000).
