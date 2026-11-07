# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Contact the
repository owner through GitHub's private vulnerability reporting
("Report a vulnerability" on the Security tab) or by email if listed in
their profile.

## Scope

This app stores study data locally and, for signed-in users, in Firebase
Firestore under per-user paths guarded by Firestore Security Rules
(`firestore.rules`, tested in `tests/rules/`). Never commit Firebase
service-account keys, `.env.local` files, or any credentials — only the
public web config in `VITE_FIREBASE_*` variables is allowed.

## Known limits

- Group leaderboards, wallet deltas, and award claims are client-written
  within rule bounds — an honor system, not cheat-proof (see DECISIONS.md
  Decision 22). Do not rely on it for anything security-critical.
- No push notifications are sent while the app is closed.
