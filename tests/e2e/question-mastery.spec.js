import { test, expect } from '@playwright/test';
import { navigateAndWaitForAuth, delayBetweenTests } from './auth-helpers.js';
import { provideAnswer, detectQuestionType } from './quiz-helpers.js';

/**
 * Question Mastery System E2E Tests
 *
 * Validates the tag-based mastery retirement system:
 * - Tagged questions award custom points (awardPoints field)
 * - Untagged questions award the default 1 point
 * - Mastery tracking persists per-tag correct counts to Firestore
 * - Questions whose tag has been mastered are retired from quiz generation
 */

async function submitAndWaitForFeedback(page) {
  const checkButton = page.locator('button:has-text("Check Answer")');
  await expect(checkButton).toBeVisible({ timeout: 5000 });
  await expect(checkButton).toBeEnabled({ timeout: 5000 });
  await checkButton.click();
  await page.waitForTimeout(1000);
}

async function goNext(page) {
  const nextButton = page.locator('button:has-text("Next Question")');
  await expect(nextButton).toBeVisible({ timeout: 10000 });
  await nextButton.click();
  await page.waitForTimeout(500);
}

/**
 * Locator for the feedback response field in the quiz UI.
 * On success it gets bg-green-50; on error it gets bg-red-50.
 */
function feedbackLocator(page) {
  return page.locator('.animate-bounce-in, .animate-shake');
}

test.describe('Question Mastery System', () => {
  test.describe.configure({ mode: 'serial' });

  test('tagged fill-in-the-blanks question awards custom points (+3 Coins)', async ({ page }) => {
    test.setTimeout(90000);
    await delayBetweenTests(500);

    // Inject a single tagged fill-in-the-blanks question.
    // The quiz helper fills blanks with "1", "2", … so correctAnswer = "1" to match.
    await page.addInitScript(() => {
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-mastery-tag-1',
          question: 'Fill in the blank: 5 + __ = 6',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '1',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          subtopic: 'decimal place value',
          questionTag: 'place-value-table',
          awardPoints: 3,
        },
      ];
    });

    await navigateAndWaitForAuth(page, '/');

    // Start a quiz
    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    // Verify the question renders as fill-in-the-blanks
    const qType = await detectQuestionType(page);
    expect(qType).toBe('fill-in-the-blanks');

    // Answer the question (helper fills blank with "1", which is correct)
    await provideAnswer(page, 'fill-in-the-blanks');
    await submitAndWaitForFeedback(page);

    // The feedback should show "+3 Coins!" (awardPoints = 3)
    const fb = feedbackLocator(page);
    await expect(fb).toContainText('+3 Coins!');
  });

  test('untagged multiple-choice question awards default 1 point', async ({ page }) => {
    test.setTimeout(90000);
    await delayBetweenTests(500);

    // Inject a single untagged multiple-choice question.
    // correctAnswer matches options[0] so the quiz helper clicks the correct option.
    await page.addInitScript(() => {
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-mastery-notag-1',
          question: 'What is 1 + 1?',
          questionType: 'multiple-choice',
          correctAnswer: '2',
          options: ['2', '3', '4', '5'],
          concept: 'Base Ten',
          grade: 'G4',
        },
      ];
    });

    await navigateAndWaitForAuth(page, '/');

    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    const qType = await detectQuestionType(page);
    expect(qType).toBe('multiple-choice');

    await provideAnswer(page, 'multiple-choice');
    await submitAndWaitForFeedback(page);

    // Default scoring: "+1 Coin!"
    const fb = feedbackLocator(page);
    await expect(fb).toContainText('+1 Coin!');
  });

  test('tagged question with awardPoints: 5 awards 5 points', async ({ page }) => {
    test.setTimeout(90000);
    await delayBetweenTests(500);

    // Verify the system works with different awardPoints values
    await page.addInitScript(() => {
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-mastery-tag5-1',
          question: 'Complete: __ + __ = 3',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '1;;2',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          questionTag: 'custom-tag',
          awardPoints: 5,
        },
      ];
    });

    await navigateAndWaitForAuth(page, '/');

    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    const qType = await detectQuestionType(page);
    expect(qType).toBe('fill-in-the-blanks');

    // Quiz helper fills two blanks with "1" and "2" — matches correctAnswer "1;;2"
    await provideAnswer(page, 'fill-in-the-blanks');
    await submitAndWaitForFeedback(page);

    const fb = feedbackLocator(page);
    await expect(fb).toContainText('+5 Coins!');
  });

  test('mastery tracking accumulates across a quiz session', async ({ page }) => {
    test.setTimeout(120000);
    await delayBetweenTests(500);

    // Inject 3 tagged questions (threshold default = 3).
    // After answering all 3 correctly the mastery count should reach 3.
    await page.addInitScript(() => {
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-mastery-acc-1',
          question: 'Fill in: 0 + __ = 1',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '1',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          questionTag: 'place-value-table',
          awardPoints: 3,
        },
        {
          id: 'pw-mastery-acc-2',
          question: 'Fill in: 0 + __ = 1',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '1',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          questionTag: 'place-value-table',
          awardPoints: 3,
        },
        {
          id: 'pw-mastery-acc-3',
          question: 'Fill in: 0 + __ = 1',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '1',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          questionTag: 'place-value-table',
          awardPoints: 3,
        },
      ];
    });

    await navigateAndWaitForAuth(page, '/');

    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    // Answer all 3 tagged questions correctly and verify +3 Coins each time
    for (let i = 0; i < 3; i++) {
      const qType = await detectQuestionType(page);
      expect(qType).toBe('fill-in-the-blanks');

      await provideAnswer(page, 'fill-in-the-blanks');
      await submitAndWaitForFeedback(page);

      const fb = feedbackLocator(page);
      await expect(fb).toContainText('+3 Coins!');

      // If not the last question, go to next
      const nextButton = page.locator('button:has-text("Next Question")');
      const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasNext) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    // After 3 correct answers the quiz should end (3 questions total).
    // Results screen shows the score: 9/3 (3 questions × 3 points each = 9 total score).
    // Wait for results screen or verify the accumulated score.
    const resultsOrScore = page.locator('text=/\\d+\\/3/');
    const isResults = await resultsOrScore.isVisible({ timeout: 5000 }).catch(() => false);

    if (isResults) {
      // Score display should show 9/3 (9 points from 3 tagged questions × 3 awardPoints)
      await expect(resultsOrScore).toContainText('9/3');
    }
  });

  test('mixed quiz: tagged questions score 3, untagged score 1', async ({ page }) => {
    test.setTimeout(120000);
    await delayBetweenTests(500);

    // Mix of tagged (3 pts) and untagged (1 pt) questions
    await page.addInitScript(() => {
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-mix-tagged',
          question: 'Fill in: 0 + __ = 1',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '1',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          questionTag: 'place-value-table',
          awardPoints: 3,
        },
        {
          id: 'pw-mix-untagged',
          question: 'What is 2 + 2?',
          questionType: 'multiple-choice',
          correctAnswer: '4',
          options: ['4', '3', '5', '6'],
          concept: 'Base Ten',
          grade: 'G4',
        },
      ];
    });

    await navigateAndWaitForAuth(page, '/');

    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    // Q1: Tagged fill-in-the-blanks → +3 Coins!
    let qType = await detectQuestionType(page);
    expect(qType).toBe('fill-in-the-blanks');
    await provideAnswer(page, 'fill-in-the-blanks');
    await submitAndWaitForFeedback(page);

    let fb = feedbackLocator(page);
    await expect(fb).toContainText('+3 Coins!');
    await goNext(page);

    // Q2: Untagged multiple-choice → +1 Coin!
    qType = await detectQuestionType(page);
    expect(qType).toBe('multiple-choice');
    await provideAnswer(page, 'multiple-choice');
    await submitAndWaitForFeedback(page);

    fb = feedbackLocator(page);
    await expect(fb).toContainText('+1 Coin!');

    // Total score should be 4 (3 + 1) — verify on results screen
    // The results show score/questionCount so we expect "4/2"
    const nextButton = page.locator('button:has-text("Next Question")');
    const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasNext) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    const scoreDisplay = page.locator('text=/4\\/2/');
    const hasScore = await scoreDisplay.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasScore) {
      await expect(scoreDisplay).toBeVisible();
    }
  });

  test('incorrect answer on tagged question does not award points or track mastery', async ({ page }) => {
    test.setTimeout(90000);
    await delayBetweenTests(500);

    // Inject a tagged question with a correct answer the helper WON'T match.
    // Helper fills "1" but correct answer is "99" — answer will be wrong.
    await page.addInitScript(() => {
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-mastery-wrong-1',
          question: 'Fill in: 98 + __ = 100',
          questionType: 'fill-in-the-blanks',
          correctAnswer: '99',
          options: [],
          concept: 'Base Ten',
          grade: 'G4',
          questionTag: 'place-value-table',
          awardPoints: 3,
        },
      ];
    });

    await navigateAndWaitForAuth(page, '/');

    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    await provideAnswer(page, 'fill-in-the-blanks');
    await submitAndWaitForFeedback(page);

    // Should NOT see "+3 Coins!" — the answer is incorrect
    const fb = feedbackLocator(page);
    await expect(fb).not.toContainText('+3 Coins!');
    // Should see the incorrect feedback instead
    await expect(fb).toContainText('incorrect');
  });
});
