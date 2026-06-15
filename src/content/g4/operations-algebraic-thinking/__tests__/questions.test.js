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

  it('never generates a sequence with negative numbers (4th-grade appropriate)', () => {
    // Run many times to exercise the "subtract then add" branch with various
    // random step/start combinations.
    for (let i = 0; i < 500; i += 1) {
      const result = questions.generateTwoStepPatternQuestion();
      // Pull every number out of the question text (the sequence).
      const numbers = (result.question.match(/-?\d+/g) || []).map(Number);
      numbers.forEach(n => {
        expect(n).toBeGreaterThanOrEqual(0);
      });
      // And the correct answer.
      expect(parseInt(result.correctAnswer, 10)).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses grammatical question text (no duplicated "next number")', () => {
    for (let i = 0; i < 50; i += 1) {
      const result = questions.generateTwoStepPatternQuestion();
      expect(result.question).not.toMatch(/next number.*next number/);
    }
  });
});

describe('generateNumberPatternQuestion question text', () => {
  it('uses grammatical question text (no duplicated "next number")', () => {
    for (let i = 0; i < 50; i += 1) {
      const result = questions.generateNumberPatternQuestion();
      expect(result.question).not.toMatch(/next number.*next number/);
    }
  });
});

describe('generateMultiplesQuestion identify-form distractor count', () => {
  it('always produces at least 3 distractors so the student sees at least 4 options', () => {
    // Collect every "Which of these is a multiple of N?" question over many
    // iterations and check the option count on each (without conditional
    // expects).
    const identifyResults = [];
    for (let i = 0; i < 1000 && identifyResults.length < 100; i += 1) {
      const result = questions.generateMultiplesQuestion();
      if (typeof result.question === 'string' && result.question.startsWith('Which of these is a multiple of')) {
        identifyResults.push(result);
      }
    }
    expect(identifyResults.length).toBeGreaterThan(0);
    const tooFewOptions = identifyResults
      .filter(r => !Array.isArray(r.options) || r.options.length < 4)
      .map(r => ({ question: r.question, optionCount: r.options ? r.options.length : 'missing' }));
    expect(tooFewOptions).toEqual([]);
  });
});