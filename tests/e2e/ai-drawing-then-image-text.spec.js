import { test, expect } from '@playwright/test';
import { navigateAndWaitForAuth, delayBetweenTests } from './auth-helpers.js';
import { provideAnswer } from './quiz-helpers.js';

async function submitCurrentQuestion(page) {
  const checkButton = page.locator('button:has-text("Check Answer")');
  await expect(checkButton).toBeVisible({ timeout: 5000 });
  await expect(checkButton).toBeEnabled({ timeout: 5000 });
  await checkButton.click();
  await expect(page.locator('button:has-text("Next Question")')).toBeVisible({ timeout: 10000 });
}

async function goNext(page) {
  const nextButton = page.locator('button:has-text("Next Question")');
  await expect(nextButton).toBeVisible({ timeout: 10000 });
  await nextButton.click();
  await page.waitForTimeout(400);
}

test.describe('AI Validation Sequence', () => {
  test.beforeEach(async ({ page }) => {
    await delayBetweenTests(500);

    await page.addInitScript(() => {
      const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5nK3sAAAAASUVORK5CYII=';
      window.__PW_MOCK_QUIZ_QUESTIONS = [
        {
          id: 'pw-drawing-1',
          question: 'Draw a simple shape to answer this prompt.',
          questionType: 'drawing',
          expectedAnswer: 'A valid drawing response',
          concept: 'Playwright',
        },
        {
          id: 'pw-writein-image-2',
          question: 'Look at the image and describe what you notice.',
          questionType: 'write-in',
          expectedAnswer: 'A written description of the image',
          concept: 'Playwright',
          images: [
            {
              type: 'question',
              data: tinyPng,
              description: 'Tiny test image'
            }
          ]
        }
      ];
    });

    const validationCalls = [];
    page.__validationCalls = validationCalls;

    await page.route('**/.netlify/functions/validate-drawing', async (route) => {
      const request = route.request();
      const body = request.postDataJSON();
      validationCalls.push(body);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isCorrect: true,
          feedback: `Mocked validation for ${body.questionType}`,
          imageUrl: 'https://example.com/mock.png'
        })
      });
    });
  });

  test('submits drawing first, then image+text write-in submission', async ({ page }) => {
    test.setTimeout(90000);

    await navigateAndWaitForAuth(page, '/');

    const firstTopic = page.locator('[data-tutorial-id="topic-selection"] button').first();
    await expect(firstTopic).toBeVisible({ timeout: 10000 });
    await firstTopic.click();
    await expect(page.locator('[data-tutorial-id="question-interface"]')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

    const drawingAnswered = await provideAnswer(page, 'drawing');
    expect(drawingAnswered).toBe(true);
    await submitCurrentQuestion(page);
    await goNext(page);

    await expect(page.locator('textarea[aria-label="Written answer input"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-tutorial-id="question-interface"] img').first()).toBeVisible({ timeout: 5000 });

    const writeInAnswered = await provideAnswer(page, 'write-in');
    expect(writeInAnswered).toBe(true);
    await submitCurrentQuestion(page);

    const calls = page.__validationCalls || [];
    expect(calls.length).toBeGreaterThanOrEqual(2);

    const firstDrawingCall = calls[0];
    const firstWriteInImageCall = calls[1];

    expect(firstDrawingCall).toBeTruthy();
    expect(firstDrawingCall.questionType).toBe('drawing');
    expect(firstDrawingCall.drawingImageBase64).toBeTruthy();

    expect(firstWriteInImageCall).toBeTruthy();
    expect(firstWriteInImageCall.questionType).toBe('write-in');
    expect(firstWriteInImageCall.userWrittenAnswer).toBeTruthy();
    expect(firstWriteInImageCall.drawingImageBase64).toBeNull();
  });
});
