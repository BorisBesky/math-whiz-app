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

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const topicSelection = page.locator('[data-tutorial-id="topic-selection"]');
    if (await topicSelection.count() && await topicSelection.first().isVisible().catch(() => false)) {
      return;
    }

    const path = new URL(page.url()).pathname;
    if (path === '/login') {
      const continueAsGuestLink = page.getByRole('link', { name: /Continue as Guest/i });
      if (await continueAsGuestLink.count()) {
        await continueAsGuestLink.click();
        await page.waitForLoadState('domcontentloaded');
        continue;
      }
    }

    if (path === '/student-login') {
      const guestButton = page.getByRole('button', { name: /Start as Guest/i });
      if (await guestButton.count()) {
        await guestButton.click();
        await page.waitForLoadState('domcontentloaded');
        continue;
      }
    }

    await page.waitForTimeout(200);
  }

  await page.waitForSelector('[data-tutorial-id="topic-selection"]', { timeout: 1000 });
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
