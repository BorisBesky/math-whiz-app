/**
 * Auth helpers for Playwright tests.
 * With Firebase Emulators running, no rate-limit handling is needed.
 */

/**
 * Navigate to the app and wait for auth + UI to be ready
 */
export async function navigateAndWaitForAuth(page, url = '/') {
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-tutorial-id="topic-selection"]', {
    timeout: 30000,
  });
}

/**
 * Add a delay between tests if needed
 */
export async function delayBetweenTests(ms = 1000) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
