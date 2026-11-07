import { defineConfig } from 'vitest/config';

// Rules unit tests run against the Firestore emulator and are invoked via
// `npm run test:rules` (firebase emulators:exec). They are excluded from the
// default `npm test` unit run.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
