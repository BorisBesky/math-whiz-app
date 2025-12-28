import { defineConfig, devices } from '@playwright/test';

/**
 * Root Playwright config.
 *
 * We keep E2E specs under `tests/e2e` and avoid picking up non-E2E files
 * in `tests/` (some of which are Jest-style and not runnable by Playwright).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['**/*.spec.js', '**/*.spec.ts'],

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
