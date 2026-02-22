import { test, expect } from '@playwright/test';
import { navigateAndWaitForAuth, delayBetweenTests } from './auth-helpers';

const getActiveTopicFromUrl = (url) => {
  const match = url.match(/\/quiz\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

test.describe('Routing Stability', () => {
  
  test.beforeEach(async ({ page }) => {
    // Use auth helper to handle Firebase Auth rate limiting
    await navigateAndWaitForAuth(page, '/', {
      timeout: 60000,
      maxRetries: 5,
      initialDelay: 2000,
    });
    
    // Add a small delay between tests to avoid rate limiting
    await delayBetweenTests(500);
  });

  test('should navigate to quiz and back to home without issues', async ({ page }) => {
    // 1. Start a quiz
    const topicButton = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await topicButton.click();
    
    // Wait for quiz URL
    await expect(page).toHaveURL(/\/quiz\/[^/]+/);
    await page.waitForSelector('[data-tutorial-id="question-interface"]');

    // 2. Click Home button
    const homeButton = page.locator('button[title="Home"]');
    await homeButton.click();

    // 3. Verify back at topic selection
    // The URL might be just the base URL or /app/ depending on deployment, 
    // but it should NOT contain /quiz/
    await expect(page).not.toHaveURL(/\/quiz\//);
    await expect(page.locator('[data-tutorial-id="topic-selection"]')).toBeVisible();
  });

  test('should handle sketch route navigation correctly', async ({ page }) => {
    // 1. Start a quiz
    const topicButton = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await topicButton.click();
    await expect(page).toHaveURL(/\/quiz\/[^/]+/);
    const topic = getActiveTopicFromUrl(page.url());
    if (!topic) throw new Error('Could not determine active topic from quiz URL');
    await page.waitForSelector('[data-tutorial-id="question-interface"]');

    // 2. Open Sketch (navigates to /quiz/<topic>/sketch)
    await page.click('button:has-text("Sketch")');
    await expect(page).toHaveURL(new RegExp(`/quiz/${topic}/sketch`));
    await expect(page.locator('.sketch-overlay')).toBeVisible();

    // 3. Close Sketch (navigates back to /quiz/Multiplication)
    // Note: The close button selector might need adjustment based on actual implementation
    // Looking at sketch-overlay.spec.js, it uses '.sketch-control-btn.close-btn'
    await page.click('.sketch-control-btn.close-btn');
    
    // Should return to quiz URL
    await expect(page).toHaveURL(new RegExp(`/quiz/${topic}`));
    await expect(page.locator('.sketch-overlay')).not.toBeVisible();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible();
  });

  test('should resume quiz without infinite loops', async ({ page }) => {
    // 1. Start a quiz
    const topicButton = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await topicButton.click();
    await expect(page).toHaveURL(/\/quiz\/[^/]+/);
    const topic = getActiveTopicFromUrl(page.url());
    if (!topic) throw new Error('Could not determine active topic from quiz URL');
    await page.waitForSelector('[data-tutorial-id="question-interface"]');

    // 2. Pause and go home (Pause button usually navigates home)
    await page.click('button:has-text("Pause")');
    await expect(page).not.toHaveURL(/\/quiz\//);

    // 3. Click topic again to trigger resume modal
    await page.locator('[data-tutorial-id="topic-selection"] button').first().click();
    
    // 4. Check for Resume Modal (it navigates to /resume/<topic>)
    await expect(page).toHaveURL(new RegExp(`/resume/${topic}`));
    
    // 5. Click Resume
    await page.click('button:has-text("Resume Paused Quiz")');
    
    // 6. Verify back in quiz
    await expect(page).toHaveURL(new RegExp(`/quiz/${topic}`));
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible();
  });
});
