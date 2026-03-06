import { test, expect } from '@playwright/test';

/**
 * E2E tests for teacher authentication flows:
 * - New teacher sign-up → immediate portal access (no "student" flash)
 * - Existing teacher sign-in → portal access without "Forbidden" error
 *
 * Requires Firebase emulators + Netlify Dev (PLAYWRIGHT_USE_NETLIFY_DEV=true REACT_APP_USE_EMULATOR=true)
 */

const TEACHER_PASSWORD = 'Teacher123!';

/** Generate a unique teacher email to avoid collisions between test runs. */
function uniqueTeacherEmail() {
  return `e2e-teacher-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

/** Wait for the teacher-login page to be ready (email input visible). */
async function waitForTeacherLoginPage(page) {
  await page.waitForLoadState('domcontentloaded');

  // Handle edge case: unified /login route may redirect
  if (new URL(page.url()).pathname === '/login') {
    const teacherLink = page.getByRole('link', { name: /Teacher Sign In/i });
    if (await teacherLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await teacherLink.click();
      await page.waitForLoadState('domcontentloaded');
    }
  }

  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Teacher authentication', () => {
  test.describe.configure({ mode: 'serial' });

  let registeredEmail;

  // -----------------------------------------------------------------------
  // 1. New teacher sign-up → lands on portal with teacher role
  // -----------------------------------------------------------------------
  test('new teacher sign-up shows teacher role immediately and accesses portal', async ({ page }) => {
    registeredEmail = uniqueTeacherEmail();

    // Navigate to teacher sign-up page
    await page.goto('/teacher-login?mode=signup');
    await waitForTeacherLoginPage(page);

    // Verify we're on the sign-up variant
    await expect(page.getByRole('heading', { name: /Create Teacher Account/i })).toBeVisible();

    // Fill the sign-up form
    await page.fill('input[name="email"]', registeredEmail);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEACHER_PASSWORD);

    // Submit
    await page.click('button:has-text("Create Account")');

    // Should redirect to teacher portal area
    await expect(page).toHaveURL(/\/(teacher|portal)(\/|$)/, { timeout: 20000 });

    // The portal should render without "Forbidden" error
    const forbiddenBanner = page.locator('text=Forbidden');
    await expect(forbiddenBanner).not.toBeVisible({ timeout: 5000 });

    // Verify teacher-specific UI elements are visible (sidebar nav or heading)
    const workspaceHeading = page.locator('text=Workspace').or(page.locator('text=Overview'));
    await expect(workspaceHeading.first()).toBeVisible({ timeout: 10000 });

    // Verify user role is shown as teacher (not student)
    const roleIndicator = page.locator('text=Teacher').first();
    await expect(roleIndicator).toBeVisible({ timeout: 5000 });

    // Sign out for the next test
    const signOutButton = page.locator('button:has-text("Sign out")');
    if (await signOutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutButton.click();
      await page.waitForLoadState('domcontentloaded');
    }
  });

  // -----------------------------------------------------------------------
  // 2. Existing teacher sign-in → portal loads without Forbidden error
  // -----------------------------------------------------------------------
  test('existing teacher can sign in and access portal without Forbidden error', async ({ page }) => {
    // Use the account created in the previous test
    test.skip(!registeredEmail, 'Requires the sign-up test to run first');

    await page.goto('/teacher-login');
    await waitForTeacherLoginPage(page);

    // Verify we're on the sign-in variant
    await expect(page.getByRole('heading', { name: /Teacher Login/i })).toBeVisible();

    // Fill the sign-in form
    await page.fill('input[name="email"]', registeredEmail);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to teacher portal area
    await expect(page).toHaveURL(/\/(teacher|portal)(\/|$)/, { timeout: 20000 });

    // Portal should load without Forbidden error
    const forbiddenBanner = page.locator('text=Forbidden');
    await expect(forbiddenBanner).not.toBeVisible({ timeout: 5000 });

    // Verify portal content loads (Overview page with stats cards)
    const overviewSection = page.locator('text=Total Students').or(page.locator('text=Overview'));
    await expect(overviewSection.first()).toBeVisible({ timeout: 10000 });
  });

  // -----------------------------------------------------------------------
  // 3. Teacher portal navigation: Overview, Students, Classes tabs
  // -----------------------------------------------------------------------
  test('teacher can navigate portal tabs without errors', async ({ page }) => {
    test.skip(!registeredEmail, 'Requires the sign-up test to run first');

    // Sign in
    await page.goto('/teacher-login');
    await waitForTeacherLoginPage(page);
    await page.fill('input[name="email"]', registeredEmail);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(teacher|portal)(\/|$)/, { timeout: 20000 });

    // Verify no Forbidden error on initial load
    await expect(page.locator('text=Forbidden')).not.toBeVisible({ timeout: 5000 });

    // Navigate to Students tab
    const studentsNav = page.locator('text=Students').first();
    if (await studentsNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studentsNav.click();
      await page.waitForTimeout(1000);
      // Should not show Forbidden
      await expect(page.locator('text=Forbidden')).not.toBeVisible();
    }

    // Navigate to Classes tab
    const classesNav = page.locator('text=Classes').first();
    if (await classesNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await classesNav.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Forbidden')).not.toBeVisible();
    }

    // Navigate back to Overview
    const overviewNav = page.locator('text=Overview').first();
    if (await overviewNav.isVisible({ timeout: 3000 }).catch(() => false)) {
      await overviewNav.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Forbidden')).not.toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 4. Student login page rejects teacher credentials
  // -----------------------------------------------------------------------
  test('teacher account is rejected on student login page', async ({ page }) => {
    test.skip(!registeredEmail, 'Requires the sign-up test to run first');

    await page.goto('/student-login');
    await page.waitForLoadState('domcontentloaded');

    // The student login page should have an email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const hasEmailInput = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEmailInput) {
      await emailInput.fill(registeredEmail);
      await page.fill('input[type="password"], input[name="password"]', TEACHER_PASSWORD);

      // Submit the form
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In")');
      await submitBtn.click();

      // Should show an error about wrong role (not redirect to student area)
      const errorMessage = page.locator('text=/not registered as a student|appropriate login/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    }
  });
});
