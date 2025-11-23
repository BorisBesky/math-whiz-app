import { test, expect } from '@playwright/test';

test.describe('Teacher logout redirect', () => {
  test('newly registered teacher should be redirected to /login after logout', async ({ page }) => {
    const email = `e2e-teacher-${Date.now()}@example.com`;
    const password = 'Teacher123!';

    // Navigate to the teacher signup page
    await page.goto('/teacher-login?mode=signup');
    await page.waitForLoadState('networkidle');

    // Fill in sign up form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    // Click Create Account
    await page.click('button:has-text("Create Account")');

    // Wait for navigation to teacher portal (or to the portal layout overview)
    await page.waitForSelector('text=Overview', { timeout: 15000 });

    // Confirm we are on a teacher page
    await expect(page.locator('text=Overview')).toBeVisible();

    // Click Sign out
    const signOutButton = page.locator('button:has-text("Sign out")');
    await signOutButton.click();

    // Expect to be redirected back to unified login page
    await page.waitForURL('**/login', { timeout: 15000 });
    await expect(page.locator('text=Welcome to Math Whiz')).toBeVisible();
  });
});
