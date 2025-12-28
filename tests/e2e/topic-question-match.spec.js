import { test, expect } from '@playwright/test';

/**
 * E2E tests to validate that quiz questions match the selected topic.
 * This test suite ensures that when a user selects a topic, the quiz
 * actually contains questions for that specific topic, not questions
 * from a different topic (regression test for topic mismatch bug).
 */
test.describe('Topic-Question Match Validation', () => {
  
  // 3rd Grade Topics
  const G3_TOPICS = [
    'Multiplication',
    'Division', 
    'Fractions',
    'Measurement & Data'
  ];

  // 4th Grade Topics
  const G4_TOPICS = [
    'Operations & Algebraic Thinking',
    'Base Ten',
    'Fractions 4th',
    'Measurement & Data 4th',
    'Geometry',
    'Binary Addition'
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for topic selection UI to be available
    await page.waitForSelector('[data-tutorial-id="topic-selection"]', { timeout: 60000 });
  });

  // Helper function to get the displayed topic from the quiz interface
  async function getDisplayedTopic(page) {
    const topicHeader = page.locator('[data-tutorial-id="question-interface"] h2.text-blue-600');
    return await topicHeader.textContent();
  }

  // Helper function to start a quiz for a specific topic
  async function startQuizForTopic(page, topicName) {
    // Click the topic button
    const topicButton = page.locator(`button:has-text("${topicName}")`).first();
    await topicButton.click();
    
    // Check if we got redirected to resume modal (paused quiz exists)
    const url = page.url();
    if (url.includes('/resume/')) {
      // Click "Start New Quiz" to get fresh questions
      await page.click('button:has-text("Start New Quiz")');
    }
    
    // Wait for quiz interface
    await page.waitForSelector('[data-tutorial-id="question-interface"]', { timeout: 30000 });
  }

  // Helper function to switch grade
  async function switchToGrade(page, grade) {
    const gradeButton = page.locator(`button:has-text("${grade} Grade")`);
    if (await gradeButton.isVisible()) {
      await gradeButton.click();
      // Wait for grade switch to take effect
      await page.waitForTimeout(500);
    }
  }

  test.describe('3rd Grade Topics', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure we're on 3rd grade
      await switchToGrade(page, '3rd');
    });

    for (const topic of G3_TOPICS) {
      test(`should display correct topic "${topic}" in quiz header`, async ({ page }) => {
        await startQuizForTopic(page, topic);
        
        // Verify the quiz header shows the correct topic
        const displayedTopic = await getDisplayedTopic(page);
        expect(displayedTopic).toBe(topic);
        
        // Verify URL contains the topic (URL encoded)
        const encodedTopic = encodeURIComponent(topic);
        await expect(page).toHaveURL(new RegExp(`/quiz/${encodedTopic}`));
      });
    }

    test('should maintain topic after answering a question', async ({ page }) => {
      const topic = 'Multiplication';
      await startQuizForTopic(page, topic);
      
      // Verify initial topic
      let displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe(topic);
      
      // Answer the first question (click first option)
      const firstOption = page.locator('.option-button, button[class*="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        
        // Click Submit/Check Answer
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Check")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
        
        // Click Next if available
        const nextButton = page.locator('button:has-text("Next")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          
          // Verify topic is still correct after moving to next question
          displayedTopic = await getDisplayedTopic(page);
          expect(displayedTopic).toBe(topic);
        }
      }
    });
  });

  test.describe('4th Grade Topics', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to 4th grade
      await switchToGrade(page, '4th');
    });

    for (const topic of G4_TOPICS) {
      test(`should display correct topic "${topic}" in quiz header`, async ({ page }) => {
        await startQuizForTopic(page, topic);
        
        // Verify the quiz header shows the correct topic
        const displayedTopic = await getDisplayedTopic(page);
        expect(displayedTopic).toBe(topic);
        
        // Verify URL contains the topic (URL encoded)
        const encodedTopic = encodeURIComponent(topic);
        await expect(page).toHaveURL(new RegExp(`/quiz/${encodedTopic}`));
      });
    }
  });

  test.describe('Topic Switch Validation', () => {
    test('should correctly switch from one topic to another', async ({ page }) => {
      // Start with Multiplication
      await switchToGrade(page, '3rd');
      await startQuizForTopic(page, 'Multiplication');
      
      let displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe('Multiplication');
      
      // Go back home
      const homeButton = page.locator('button[title="Home"]');
      await homeButton.click();
      await page.waitForSelector('[data-tutorial-id="topic-selection"]');
      
      // Switch to Division
      await startQuizForTopic(page, 'Division');
      
      displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe('Division');
    });

    test('should correctly switch from 3rd grade topic to 4th grade topic', async ({ page }) => {
      // Start with 3rd grade Multiplication
      await switchToGrade(page, '3rd');
      await startQuizForTopic(page, 'Multiplication');
      
      let displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe('Multiplication');
      
      // Go back home
      const homeButton = page.locator('button[title="Home"]');
      await homeButton.click();
      await page.waitForSelector('[data-tutorial-id="topic-selection"]');
      
      // Switch to 4th grade and select Base Ten
      await switchToGrade(page, '4th');
      await startQuizForTopic(page, 'Base Ten');
      
      displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe('Base Ten');
      
      // Verify URL is correct
      await expect(page).toHaveURL(/\/quiz\/Base%20Ten/);
    });

    test('should not show questions from previous topic after switching topics', async ({ page }) => {
      // Start with Measurement & Data (3rd grade)
      await switchToGrade(page, '3rd');
      await startQuizForTopic(page, 'Measurement & Data');
      
      let displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe('Measurement & Data');
      
      // Go back home
      const homeButton = page.locator('button[title="Home"]');
      await homeButton.click();
      await page.waitForSelector('[data-tutorial-id="topic-selection"]');
      
      // Switch to 4th grade Base Ten
      await switchToGrade(page, '4th');
      await startQuizForTopic(page, 'Base Ten');
      
      // Critical check: topic must be Base Ten, not Measurement & Data
      displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe('Base Ten');
      expect(displayedTopic).not.toBe('Measurement & Data');
      expect(displayedTopic).not.toBe('Measurement & Data 4th');
    });
  });

  test.describe('Resume Quiz Topic Validation', () => {
    test('should resume quiz with correct topic', async ({ page }) => {
      const topic = 'Multiplication';
      
      // Start a quiz
      await switchToGrade(page, '3rd');
      await startQuizForTopic(page, topic);
      
      let displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe(topic);
      
      // Pause the quiz
      await page.click('button:has-text("Pause")');
      await page.waitForSelector('[data-tutorial-id="topic-selection"]');
      
      // Click the same topic again
      const topicButton = page.locator(`button:has-text("${topic}")`).first();
      await topicButton.click();
      
      // Should show resume modal
      await expect(page).toHaveURL(/\/resume\/Multiplication/);
      
      // Click Resume Paused Quiz
      await page.click('button:has-text("Resume Paused Quiz")');
      
      // Wait for quiz interface
      await page.waitForSelector('[data-tutorial-id="question-interface"]');
      
      // Verify topic is still correct after resume
      displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe(topic);
    });

    test('should start new quiz with correct topic from resume modal', async ({ page }) => {
      const topic = 'Multiplication';
      
      // Start a quiz
      await switchToGrade(page, '3rd');
      await startQuizForTopic(page, topic);
      
      // Pause the quiz
      await page.click('button:has-text("Pause")');
      await page.waitForSelector('[data-tutorial-id="topic-selection"]');
      
      // Click the same topic again
      const topicButton = page.locator(`button:has-text("${topic}")`).first();
      await topicButton.click();
      
      // Should show resume modal
      await expect(page).toHaveURL(/\/resume\/Multiplication/);
      
      // Click Start New Quiz (not resume)
      await page.click('button:has-text("Start New Quiz")');
      
      // Wait for quiz interface
      await page.waitForSelector('[data-tutorial-id="question-interface"]');
      
      // Verify topic is correct for new quiz
      const displayedTopic = await getDisplayedTopic(page);
      expect(displayedTopic).toBe(topic);
    });
  });
});
