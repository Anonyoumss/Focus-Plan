import { defineConfig } from '@playwright/test';

// Live-site smoke tests — NOT part of the normal `npx playwright test` run.
// Usage: LIVE_URL=https://anonyoumss.github.io/Focus-Plan/ npx playwright test -c playwright.live.config.ts
export default defineConfig({
  testDir: './e2e-live',
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: 'list',
});
