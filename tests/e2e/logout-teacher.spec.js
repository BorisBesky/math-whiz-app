import { test, expect } from '@playwright/test';

test.describe('Teacher logout redirect', () => {
  test('newly registered teacher should be redirected to /login after logout', async ({ page }) => {
    const email = `e2e-teacher-${Date.now()}@example.com`;
    const password = 'Teacher123!';

    // Navigate to the teacher signup page
    await page.goto('/teacher-login?mode=signup');
    await page.waitForLoadState('domcontentloaded');

    // Fallback for unified login route: navigate to teacher signup explicitly
    if (new URL(page.url()).pathname === '/login') {
      await page.getByRole('button', { name: /Sign Up/i }).click();
      await page.getByRole('link', { name: /Sign Up as Teacher/i }).click();
      await page.waitForLoadState('domcontentloaded');
    }

    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 });

    // Fill in sign up form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    // Click Create Account
    await page.click('button:has-text("Create Account")');

    // Confirm we are in teacher area (route + stable layout control)
    await expect(page).toHaveURL(/\/(teacher|portal)(\/|$)/, { timeout: 15000 });

    // Click Sign out
    const signOutButton = page.locator('button:has-text("Sign out")');
    await expect(signOutButton).toBeVisible({ timeout: 10000 });
    await signOutButton.click();

    // Expect to be redirected back to unified login page and show login UI
    await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Math Whiz' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: /Student Sign In/i })).toBeVisible({ timeout: 15000 });
  });
});
