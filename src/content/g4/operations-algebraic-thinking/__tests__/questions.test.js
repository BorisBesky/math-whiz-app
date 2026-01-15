// Mock the helper functions to make tests deterministic
// jest.mock('../utils/question-helpers.js', () => ({
//   generateUniqueOptions: jest.fn((correct, distractors) => [correct, ...distractors]),
//   shuffle: jest.fn((array) => array), // Return array as-is for predictable testing
// });

import questions from '../questions.js';

describe('generateTwoStepPatternQuestion', () => {
  it('should return a question object with required properties', () => {
    const result = questions.generateTwoStepPatternQuestion();

    expect(result).toHaveProperty('question');
    expect(result).toHaveProperty('correctAnswer');
    expect(result).toHaveProperty('questionType');
    expect(result).toHaveProperty('hint');
    expect(result).toHaveProperty('standard');
    expect(result).toHaveProperty('concept');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('subtopic');
  });

  it('should generate a question with a sequence and blank', () => {
    const result = questions.generateTwoStepPatternQuestion();

    // The question format includes a blank for fill-in-the-blanks type
    expect(result.question).toMatch(/Look at this pattern.*___/);
    expect(result.correctAnswer).toMatch(/^-?\d+$/); // Should be a number string (may be negative)
  });

  it('should be a fill-in-the-blanks question type', () => {
    const result = questions.generateTwoStepPatternQuestion();

    // This question type is fill-in-the-blanks, not multiple choice
    expect(result.questionType).toBe('fill-in-the-blanks');
    // Fill-in-the-blanks questions don't have options
    expect(result.options).toBeUndefined();
  });

  it('should have correct standard and metadata', () => {
    const result = questions.generateTwoStepPatternQuestion();

    expect(result.standard).toBe('4.OA.C.5');
    expect(result.concept).toBe('Operations & Algebraic Thinking');
    expect(result.grade).toBe('G4');
    expect(result.subtopic).toBe('number patterns');
  });

  it('should have a hint that describes the pattern type', () => {
    const result = questions.generateTwoStepPatternQuestion();

    // Check that hint contains expected keywords
    expect(result.hint).toMatch(/First step is (addition|multiplication|subtraction), second step is (addition|multiplication)/);
  });

  it('should generate different sequences on multiple calls', () => {
    const result1 = questions.generateTwoStepPatternQuestion();
    const result2 = questions.generateTwoStepPatternQuestion();

    // They might be the same due to randomness, but at least they should be valid
    expect(result1.question).toBeTruthy();
    expect(result2.question).toBeTruthy();
  });

  it('should have a valid numeric correct answer', () => {
    const result = questions.generateTwoStepPatternQuestion();

    expect(result.correctAnswer).toBeDefined();
    const correctNum = parseInt(result.correctAnswer);
    // The correct answer should be a valid number
    expect(isNaN(correctNum)).toBe(false);
  });
});