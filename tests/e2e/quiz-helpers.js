/**
 * Quiz helpers for E2E tests
 * Provides utilities to detect question types and provide answers
 */

/**
 * Detect the current question type based on visible UI elements
 * @param {Page} page - Playwright page object
 * @returns {Promise<string>} Question type: 'multiple-choice', 'numeric', 'drawing', 'write-in', 'drawing-with-text', 'fill-in-the-blanks', or 'unknown'
 */
export async function detectQuestionType(page) {
  // Check for drawing canvas (DrawingCanvas component)
  const hasDrawingCanvas = await page.locator('canvas').isVisible({ timeout: 1000 }).catch(() => false);

  // Check for write-in textarea
  const hasWriteInTextarea = await page.locator('textarea[aria-label="Written answer input"]').isVisible({ timeout: 1000 }).catch(() => false);

  // Check for fill-in-the-blanks inputs (inline inputs within question text)
  const fillInInputs = page.locator('input[placeholder="?"]');
  const fillInCount = await fillInInputs.count().catch(() => 0);
  const hasFillInBlanks = fillInCount > 0;

  // Check for number pad
  const hasNumberPad = await page.locator('button:has-text("+/−")').isVisible({ timeout: 1000 }).catch(() => false);

  // Check for multiple choice options (grid of buttons with answer options)
  // Multiple choice options are in a grid with specific styling
  const mcOptions = page.locator('.grid button:not(:has-text("Check")):not(:has-text("Next")):not(:has-text("Hint")):not(:has-text("Sketch")):not(:has-text("Learn"))');
  const mcCount = await mcOptions.count().catch(() => 0);
  const hasMultipleChoice = mcCount >= 2;

  // Determine question type based on what's visible
  if (hasDrawingCanvas && hasWriteInTextarea) {
    return 'drawing-with-text';
  } else if (hasDrawingCanvas) {
    return 'drawing';
  } else if (hasWriteInTextarea) {
    return 'write-in';
  } else if (hasFillInBlanks) {
    return 'fill-in-the-blanks';
  } else if (hasNumberPad) {
    return 'numeric';
  } else if (hasMultipleChoice) {
    return 'multiple-choice';
  }

  return 'unknown';
}

/**
 * Provide an answer for the current question based on its type
 * @param {Page} page - Playwright page object
 * @param {string} questionType - The detected question type
 * @returns {Promise<boolean>} Whether an answer was successfully provided
 */
export async function provideAnswer(page, questionType) {
  switch (questionType) {
    case 'multiple-choice':
      return await answerMultipleChoice(page);
    case 'numeric':
      return await answerNumeric(page);
    case 'drawing':
      return await answerDrawing(page);
    case 'write-in':
      return await answerWriteIn(page);
    case 'drawing-with-text':
      return await answerDrawingWithText(page);
    case 'fill-in-the-blanks':
      return await answerFillInBlanks(page);
    default:
      // Try multiple choice as fallback
      return await answerMultipleChoice(page);
  }
}

/**
 * Answer a multiple choice question by clicking the first option
 */
async function answerMultipleChoice(page) {
  try {
    // Find the multiple choice option buttons (in a grid, excluding action buttons)
    const optionButtons = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2 button');
    const count = await optionButtons.count();

    if (count > 0) {
      // Click the first option
      await optionButtons.first().click();
      await page.waitForTimeout(300);
      return true;
    }

    // Fallback: try finding buttons that look like answer options
    const fallbackOptions = page.locator('button').filter({
      hasNotText: /Check|Next|Hint|Sketch|Learn|Pause|Submit|Show|Hide/i
    });
    const fallbackCount = await fallbackOptions.count();

    if (fallbackCount > 0) {
      await fallbackOptions.first().click();
      await page.waitForTimeout(300);
      return true;
    }

    return false;
  } catch (error) {
    console.log('Error answering multiple choice:', error.message);
    return false;
  }
}

/**
 * Answer a numeric question using the number pad
 */
async function answerNumeric(page) {
  try {
    // Click number buttons to enter "42" as a test answer
    const button4 = page.locator('button:has-text("4")').first();
    const button2 = page.locator('button:has-text("2")').first();

    if (await button4.isVisible({ timeout: 1000 })) {
      await button4.click();
      await page.waitForTimeout(100);
    }

    if (await button2.isVisible({ timeout: 1000 })) {
      await button2.click();
      await page.waitForTimeout(100);
    }

    return true;
  } catch (error) {
    console.log('Error answering numeric:', error.message);
    return false;
  }
}

/**
 * Answer a drawing question by drawing on the canvas
 */
async function answerDrawing(page) {
  try {
    const canvas = page.locator('canvas').first();

    if (await canvas.isVisible({ timeout: 1000 })) {
      const box = await canvas.boundingBox();

      if (box) {
        // Draw a simple line on the canvas
        const startX = box.x + box.width * 0.2;
        const startY = box.y + box.height * 0.5;
        const endX = box.x + box.width * 0.8;
        const endY = box.y + box.height * 0.5;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);

        return true;
      }
    }

    return false;
  } catch (error) {
    console.log('Error answering drawing:', error.message);
    return false;
  }
}

/**
 * Answer a write-in question by typing in the textarea
 */
async function answerWriteIn(page) {
  try {
    const textarea = page.locator('textarea[aria-label="Written answer input"]');

    if (await textarea.isVisible({ timeout: 1000 })) {
      await textarea.fill('My answer is 42');
      await page.waitForTimeout(300);
      return true;
    }

    return false;
  } catch (error) {
    console.log('Error answering write-in:', error.message);
    return false;
  }
}

/**
 * Answer a drawing-with-text question by drawing and typing
 */
async function answerDrawingWithText(page) {
  try {
    // First draw on canvas
    await answerDrawing(page);

    // Then fill in the text
    const textarea = page.locator('textarea[aria-label="Written answer input"]');

    if (await textarea.isVisible({ timeout: 1000 })) {
      await textarea.fill('This is my explanation');
      await page.waitForTimeout(300);
    }

    return true;
  } catch (error) {
    console.log('Error answering drawing-with-text:', error.message);
    return false;
  }
}

/**
 * Answer a fill-in-the-blanks question by filling all input fields
 */
async function answerFillInBlanks(page) {
  try {
    const inputs = page.locator('input[placeholder="?"]');
    const count = await inputs.count();

    if (count > 0) {
      // Fill each blank with a number (1, 2, 3, etc.)
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible({ timeout: 500 })) {
          await input.fill(String(i + 1));
          await page.waitForTimeout(100);
        }
      }
      return true;
    }

    return false;
  } catch (error) {
    console.log('Error answering fill-in-the-blanks:', error.message);
    return false;
  }
}

/**
 * Complete one question in the quiz (detect type, answer, and submit)
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} Whether the question was successfully completed
 */
export async function completeOneQuestion(page) {
  try {
    // Wait a bit for the question to fully render
    await page.waitForTimeout(500);

    // Detect question type
    const questionType = await detectQuestionType(page);
    console.log(`Detected question type: ${questionType}`);

    // Provide an answer
    const answered = await provideAnswer(page, questionType);

    if (!answered) {
      console.log('Failed to provide answer');
      return false;
    }

    // Wait for the Check Answer button to become enabled
    await page.waitForTimeout(500);

    // Click Check Answer
    const checkButton = page.locator('button:has-text("Check Answer")');
    const isEnabled = await checkButton.isEnabled({ timeout: 2000 }).catch(() => false);

    if (isEnabled) {
      await checkButton.click();
      await page.waitForTimeout(1000);

      // Click Next Question to proceed
      const nextButton = page.locator('button:has-text("Next Question")');
      const nextVisible = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (nextVisible) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.log('Error completing question:', error.message);
    return false;
  }
}

/**
 * Check if we've reached the results screen
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
export async function isOnResultsScreen(page) {
  // Look for results indicators
  const resultsIndicators = [
    'text=/Perfect Score|Excellent Work|Good Job|Nice try/i',
    'text=/\\d+%/',
    'button:has-text("Try Again")',
    'button:has-text("Choose New Topic")'
  ];

  for (const indicator of resultsIndicators) {
    const isVisible = await page.locator(indicator).isVisible({ timeout: 500 }).catch(() => false);
    if (isVisible) {
      return true;
    }
  }

  return false;
}

/**
 * Complete the entire quiz until reaching results
 * @param {Page} page - Playwright page object
 * @param {number} maxQuestions - Maximum questions to attempt (default 10)
 * @returns {Promise<boolean>} Whether results screen was reached
 */
export async function completeQuizUntilResults(page, maxQuestions = 10) {
  for (let i = 0; i < maxQuestions; i++) {
    // Check if we're already on results
    if (await isOnResultsScreen(page)) {
      return true;
    }

    // Try to complete one question
    const completed = await completeOneQuestion(page);

    if (!completed) {
      // If we couldn't complete a question, check if we're on results
      if (await isOnResultsScreen(page)) {
        return true;
      }
      // Otherwise, we're stuck
      return false;
    }
  }

  // Check one more time after loop
  return await isOnResultsScreen(page);
}
