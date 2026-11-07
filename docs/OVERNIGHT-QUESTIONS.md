# Overnight questions (owner asleep — choices made autonomously)

Format: question | choice made | why

1. AI features require sign-in? Guests have no Firebase ID token, so all
   /api/gemini/* calls return the offline estimate for them.
   CHOICE: yes, auth required on every AI endpoint (per stage instructions).
   WHY: safest option; AI is optional and the labeled offline estimate
   covers guests. Alternative would be an unauthenticated quota, which is
   an abuse vector.

2. Gemini free tier may train on prompts (verified in Google docs
   2026-11: Unpaid Services use content to improve products, human
   reviewers may read it). Paid tier does not.
   CHOICE: disclosed verbatim in Terms + Privacy; no sensitive data is
   sent by design (no names/emails/tasks/notes).
   WHY: honesty requirement; owner can later move to paid quota or
   Vertex AI for zero-retention.

3. Rate-limit persistence without Firestore admin SDK.
   CHOICE: JSON file counter (data/ai-usage.json), per uid per UTC day,
   default 30 calls/day, survives restarts.
   WHY: firebase-admin + service account is a large secret-bearing dep;
   file counter satisfies "survives restarts, not in-memory" on a single
   host. If the AI server ever runs multi-instance, move to Firestore.

4. `bun.lock` was added by AI Studio alongside package-lock.json.
   CHOICE: left in place; npm is the canonical installer here.
   WHY: removing it could break the owner's AI Studio flow; flag for
   owner to delete if unwanted.

5. Legal page bodies are still English-only (pre-existing gap; Arabic
   chrome only). Stage B item 8 moves bodies into i18n anyway.
   CHOICE: added the new AI sections in English now; full AR translation
   happens in stage B.
   WHY: avoids duplicating work; stage B explicitly owns this.

5. Spotlight mode default?
   CHOICE: OFF (opt-in via Settings > Focus & Motion).
   WHY: the scrim blocks pointer events on dimmed content; defaulting on
   would surprise users and could break flows that click while a timer
   runs. Easy to flip later.

6. Default app language source?
   CHOICE: navigator.languages, not IP geolocation.
   WHY: IP geo is unreliable (VPNs, shared networks, privacy cost) and
   first-run onboarding now asks explicitly anyway. Landing keeps a
   manual switch.

7. Perf "5-10s tabs" — could not reproduce as data-dependent.
   CHOICE: documented profiling result (warm Progress render ~19ms with
   2000 logs; the delay is first-load chunk+font latency) + skeleton-
   first reveal on Progress. No speculative rewrite.
   WHY: no-guessing rule; the e2e perf smoke guards regressions.
