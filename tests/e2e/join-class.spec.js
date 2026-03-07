import { test, expect } from '@playwright/test';

/**
 * E2E test: Full class join flow
 *
 * 1. Teacher signs up → creates a class → generates an invite code
 * 2. Student (not logged in) visits /join?code=... → sees "Sign in required"
 * 3. Student signs up via the join-page link → redirected back to /join → joins the class
 * 4. Teacher verifies student appears in the class roster
 *
 * Requires Firebase emulators + Netlify Dev:
 *   PLAYWRIGHT_USE_NETLIFY_DEV=true REACT_APP_USE_EMULATOR=true npx playwright test join-class
 */

const TEACHER_PASSWORD = 'Teacher123!';
const STUDENT_PASSWORD = 'Student123!';

function uniqueEmail(prefix) {
  return `e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

/** Wait for the teacher-login page form to be ready. */
async function waitForTeacherLoginPage(page) {
  await page.waitForLoadState('domcontentloaded');
  if (new URL(page.url()).pathname === '/login') {
    const teacherLink = page.getByRole('link', { name: /Teacher Sign In/i });
    if (await teacherLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await teacherLink.click();
      await page.waitForLoadState('domcontentloaded');
    }
  }
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 });
}

/**
 * Wait for the teacher portal to be fully ready with claims propagated.
 * If the "Forbidden" banner appears (stale Firestore token), reload to
 * pick up the refreshed token.
 */
async function waitForPortalReady(page) {
  // Use "Total Students" which is always visible in both desktop and mobile portal layouts
  const portalContent = page.locator('text=Total Students');
  await expect(portalContent.first()).toBeVisible({ timeout: 15000 });

  // Firestore queries may fail with a stale token right after sign-up/sign-in.
  // If the "Forbidden" banner appears, reload to force a fresh token.
  const forbidden = page.locator('text=Forbidden');
  if (await forbidden.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.reload();
    await expect(portalContent.first()).toBeVisible({ timeout: 15000 });
    await expect(forbidden).not.toBeVisible({ timeout: 10000 });
  }
}

/** Sign in an existing teacher and wait for portal to fully load with claims. */
async function signInTeacher(page, email, password) {
  await page.goto('/teacher-login');
  await waitForTeacherLoginPage(page);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/(teacher|portal)(\/|$)/, { timeout: 20000 });
  await waitForPortalReady(page);
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Class join flow (full E2E)', () => {
  test.describe.configure({ mode: 'serial' });

  // Skip on mobile viewports — the teacher portal uses a different nav layout
  // (dropdown selector) on small screens, and the join logic is identical.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'Teacher portal nav not supported on mobile viewports');
  });

  let teacherEmail;
  let studentEmail;
  let joinCode;
  const CLASS_NAME = `E2E Class ${Date.now()}`;

  // -----------------------------------------------------------------------
  // 1. Teacher signs up
  // -----------------------------------------------------------------------
  test('teacher signs up and reaches portal', async ({ page }) => {
    teacherEmail = uniqueEmail('teacher');

    await page.goto('/teacher-login?mode=signup');
    await waitForTeacherLoginPage(page);

    await page.fill('input[name="email"]', teacherEmail);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEACHER_PASSWORD);
    await page.click('button:has-text("Create Account")');

    await expect(page).toHaveURL(/\/(teacher|portal)(\/|$)/, { timeout: 20000 });
    await waitForPortalReady(page);
  });

  // -----------------------------------------------------------------------
  // 2. Teacher creates a class
  // -----------------------------------------------------------------------
  test('teacher creates a class', async ({ page }) => {
    test.skip(!teacherEmail, 'Requires teacher sign-up test');

    await signInTeacher(page, teacherEmail, TEACHER_PASSWORD);

    // Extra reload to ensure Firestore uses a fresh token for class creation.
    await page.reload();
    await waitForPortalReady(page);

    // Navigate to Classes tab
    const classesNav = page.locator('nav a, button').filter({ hasText: /^Classes$/ });
    await classesNav.first().click();
    await page.waitForTimeout(1000);

    // Click "New Class"
    await page.click('button:has-text("New Class")');

    // Fill class form
    await expect(page.locator('text=Create New Class')).toBeVisible({ timeout: 5000 });
    await page.fill('input#name', CLASS_NAME);
    await page.selectOption('select#gradeLevel', 'G3');

    // Submit
    await page.click('button:has-text("Create Class")');

    // Modal should close and class should appear in the list
    await expect(page.locator('text=Create New Class')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible({ timeout: 10000 });
  });

  // -----------------------------------------------------------------------
  // 3. Teacher generates an invite code
  // -----------------------------------------------------------------------
  test('teacher generates an invite code for the class', async ({ page }) => {
    test.skip(!teacherEmail, 'Requires teacher sign-up test');

    await signInTeacher(page, teacherEmail, TEACHER_PASSWORD);

    // Navigate to Classes tab
    const classesNav = page.locator('nav a, button').filter({ hasText: /^Classes$/ });
    await classesNav.first().click();
    await page.waitForTimeout(1000);

    // Open class detail panel via "View details" link
    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible({ timeout: 5000 });
    await page.click('text=View details');
    await expect(page.locator('text=Class Detail')).toBeVisible({ timeout: 10000 });

    // Click "Invite Students"
    await page.click('button:has-text("Invite Students")');
    await expect(page.locator('text=Invite Students').nth(1)).toBeVisible({ timeout: 5000 });

    // Wait for the join code to be generated
    const codeDisplay = page.locator('.font-mono.text-lg');
    await expect(codeDisplay).not.toHaveText('...', { timeout: 10000 });
    joinCode = await codeDisplay.textContent();
    joinCode = joinCode.trim();

    expect(joinCode).toBeTruthy();
    expect(joinCode.length).toBe(7);

    // Close modals
    await page.click('button:has-text("Done")');
  });

  // -----------------------------------------------------------------------
  // 4. Unauthenticated visitor sees "Sign in required" on join page
  // -----------------------------------------------------------------------
  test('unauthenticated user sees sign-in prompt on join page', async ({ browser }) => {
    test.skip(!joinCode, 'Requires invite code');

    // Use a fresh browser context (no auth cookies)
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`/join?code=${joinCode}`);
    await page.waitForLoadState('domcontentloaded');

    // Should show "Sign in required" (not the Join button)
    await expect(page.locator('text=Sign in required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Join Class")')).not.toBeVisible();

    // Should show "Sign In to Join" and "Create Account & Join" links
    await expect(page.locator('text=Sign In to Join')).toBeVisible();
    await expect(page.locator('text=Create Account & Join')).toBeVisible();

    await context.close();
  });

  // -----------------------------------------------------------------------
  // 5. Student signs up via join page link → redirected back → joins class
  // -----------------------------------------------------------------------
  test('student signs up through join page and successfully joins class', async ({ browser }) => {
    test.skip(!joinCode, 'Requires invite code');

    studentEmail = uniqueEmail('student');

    // Fresh browser context
    const context = await browser.newContext();
    const page = await context.newPage();

    // Visit join page
    await page.goto(`/join?code=${joinCode}`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Sign in required')).toBeVisible({ timeout: 10000 });

    // Click "Create Account & Join"
    await page.click('text=Create Account & Join');
    await page.waitForLoadState('domcontentloaded');

    // Should be on student-login with mode=signup and redirect param
    await expect(page).toHaveURL(/student-login.*mode=signup.*redirect/, { timeout: 10000 });

    // Should show the "Sign in to join your class" banner
    await expect(page.locator('text=Sign in to join your class')).toBeVisible({ timeout: 5000 });

    // Guest option should NOT be visible
    await expect(page.locator('button:has-text("Start as Guest")')).not.toBeVisible();

    // Fill sign-up form
    // First switch to sign-up mode if not already
    const signUpToggle = page.locator('button:has-text("Don\'t have an account? Sign up")');
    if (await signUpToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signUpToggle.click();
    }

    await page.fill('input#email', studentEmail);
    await page.fill('input#password', STUDENT_PASSWORD);
    await page.fill('input#confirmPassword', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect back to the join page with the code
    await expect(page).toHaveURL(/\/join\?code=/i, { timeout: 20000 });

    // Now should be authenticated — should show "Joining as" and the join button
    await expect(page.locator(`text=Joining as`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Join Class")')).toBeVisible();

    // Click "Join Class"
    await page.click('button:has-text("Join Class")');

    // Should show success
    await expect(page.locator('text=Joined! Redirecting')).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  // -----------------------------------------------------------------------
  // 6. Teacher verifies student appears in class roster
  // -----------------------------------------------------------------------
  test('teacher sees the new student in class roster', async ({ page }) => {
    test.skip(!teacherEmail || !studentEmail, 'Requires both teacher and student');

    await signInTeacher(page, teacherEmail, TEACHER_PASSWORD);

    // Navigate to Classes tab
    const classesNav = page.locator('nav a, button').filter({ hasText: /^Classes$/ });
    await classesNav.first().click();
    await page.waitForTimeout(1000);

    // Open class detail panel via "View details" link
    await expect(page.locator(`text=${CLASS_NAME}`)).toBeVisible({ timeout: 5000 });
    await page.click('text=View details');
    await expect(page.locator('text=Class Detail')).toBeVisible({ timeout: 10000 });

    // The roster should show 1 student (use exact match to avoid strict mode violation)
    await expect(page.getByText('1 student', { exact: true })).toBeVisible({ timeout: 10000 });

    // The student email should appear in the roster
    await expect(page.locator(`text=${studentEmail}`)).toBeVisible({ timeout: 5000 });
  });
});
