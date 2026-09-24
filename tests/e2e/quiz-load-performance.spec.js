import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { navigateAndWaitForAuth } from './auth-helpers';

/**
 * Real-browser quiz-load timing for EVERY enabled topic in EVERY enabled
 * grade. Topics come from the committed content manifest, so a new topic or
 * grade is timed automatically.
 *
 * Measures what a student feels: from tapping a topic on the home screen to
 * the quiz interface rendering its first question (auth, history read, bank
 * fetch, code-split topic chunk, and generation all included).
 *
 * The Jest suite src/__tests__/quiz-load-performance.test.js covers the same
 * path under simulated slow/hanging/offline networks; this spec catches
 * regressions that only show up in the real bundle (chunk loading, render
 * work, effects that loop).
 *
 * Budget override: QUIZ_LOAD_BUDGET_MS=4000 npx playwright test quiz-load-performance
 */
const QUIZ_LOAD_BUDGET_MS = Number(process.env.QUIZ_LOAD_BUDGET_MS) || 5000;

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'content', 'content-manifest.generated.json'),
    'utf8'
  )
);

const CASES = manifest.grades
  .filter((grade) => grade.enabled)
  .flatMap((grade) =>
    grade.topics
      .filter((topic) => topic.enabled)
      .map((topic) => ({
        gradeLabel: grade.label,
        gradeShort: grade.shortLabel,
        topicName: topic.name,
      }))
  );

const timings = [];

test.describe('Quiz load performance — every grade and topic', () => {
  test.afterAll(() => {
    if (timings.length === 0) return;
    const width = Math.max(...timings.map((t) => t.label.length));
    // eslint-disable-next-line no-console
    console.log(
      ['Quiz load (topic tap → first question), ms:']
        .concat(timings.map((t) => `${t.label.padEnd(width)}  ${t.ms}`))
        .join('\n')
    );
  });

  for (const { gradeLabel, gradeShort, topicName } of CASES) {
    test(`${gradeLabel} / ${topicName} opens within ${QUIZ_LOAD_BUDGET_MS} ms`, async ({ page }, testInfo) => {
      await navigateAndWaitForAuth(page, '/');

      // Right after guest sign-in the profile load can reset the selected
      // grade, undoing an early click — re-apply until it sticks. This is
      // setup, so it happens before the load timer starts.
      const gradeHeading = page.getByText(`Pick a topic to practice ${gradeShort} Grade`);
      await expect(async () => {
        await page.getByRole('button', { name: gradeLabel, exact: true }).click();
        await expect(gradeHeading).toBeVisible({ timeout: 1000 });
        await page.waitForTimeout(500);
        await expect(gradeHeading).toBeVisible({ timeout: 100 });
      }).toPass({ timeout: 20000 });

      // Exact match: `has-text("Algebra")` would also hit "Operations & Algebraic Thinking".
      const topicButton = page
        .locator('button')
        .filter({ has: page.getByText(topicName, { exact: true }) })
        .first();
      await expect(topicButton).toBeVisible({ timeout: 10000 });
      // Wait for the slide-up animation / grade re-render so click retries
      // aren't counted as load time.
      await topicButton.click({ trial: true });

      const questionInterface = page.locator('[data-tutorial-id="question-interface"]');
      const start = Date.now();
      await topicButton.click();
      if (page.url().includes('/resume/')) {
        await page.click('button:has-text("Start New Quiz")');
      }
      // Wait past the budget so a slow load reports its real time instead of
      // a bare timeout; the assertion below enforces the budget.
      await expect(questionInterface).toBeVisible({ timeout: QUIZ_LOAD_BUDGET_MS * 3 });
      await expect(questionInterface.locator('h2')).toHaveText(topicName);
      const elapsedMs = Date.now() - start;

      timings.push({ label: `${gradeLabel} / ${topicName}`, ms: elapsedMs });
      testInfo.annotations.push({ type: 'quiz-load-ms', description: String(elapsedMs) });
      expect(elapsedMs).toBeLessThan(QUIZ_LOAD_BUDGET_MS);
    });
  }
});
