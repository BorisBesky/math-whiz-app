import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Math Whiz App E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['**/*.spec.js', '**/*.spec.ts'], // Explicit pattern to avoid Jest files
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /* Reduce parallelism to avoid Firebase Auth rate limiting */
  /* Use fewer workers to reduce concurrent auth requests */
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  timeout: 60000,

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    /* Will use port 8888 if PLAYWRIGHT_USE_NETLIFY_DEV=true, otherwise 3000 */
    baseURL: process.env.PLAYWRIGHT_USE_NETLIFY_DEV === 'true' 
      ? 'http://localhost:8888' 
      : 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Increase timeout to allow for Firebase Auth retries */
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: (() => {
    // Allow using netlify dev via environment variable: PLAYWRIGHT_USE_NETLIFY_DEV=true
    const useNetlifyDev = process.env.PLAYWRIGHT_USE_NETLIFY_DEV === 'true';
    const useEmulator = process.env.REACT_APP_USE_EMULATOR === 'true' || process.env.CI;
    const command = useNetlifyDev
      ? 'npm run dev'
      : (useEmulator ? 'REACT_APP_USE_EMULATOR=true npm start' : 'npm start');
    const url = useNetlifyDev ? 'http://localhost:8888' : 'http://localhost:3000';
    
    return {
      command,
      url,
      reuseExistingServer: !process.env.CI && !useEmulator,
      timeout: 180 * 1000, // Increased timeout for server startup (3 minutes)
      stdout: 'pipe', // Show stdout to help debug startup issues
      stderr: 'pipe', // Show stderr to help debug startup issues
    };
  })(),
});
