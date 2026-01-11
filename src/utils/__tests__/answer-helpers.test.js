
const { isNumericQuestion } = require('../answer-helpers');

describe('isNumericQuestion', () => {
  test('returns true for numeric question with options', () => {
    const question = {
      correctAnswer: '3.74',
      options: ['3.74', '3.75', '3.76']
    };
    expect(isNumericQuestion(question)).toBe(true);
  });

  test('returns false if options contain non-numeric', () => {
    const question = {
      correctAnswer: '3.74',
      options: ['3.74', 'apple', '3.76']
    };
    expect(isNumericQuestion(question)).toBe(false);
  });

  test('returns true for numeric question WITHOUT options (The Fix)', () => {
    const question = {
      correctAnswer: '3.74'
      // no options
    };
    expect(isNumericQuestion(question)).toBe(true);
  });
  
  test('returns true for negative numbers', () => {
    const question = {
      correctAnswer: '-5.2'
    };
    expect(isNumericQuestion(question)).toBe(true);
  });

  test('returns false for non-numeric answer without options', () => {
    const question = {
      correctAnswer: 'two'
    };
    expect(isNumericQuestion(question)).toBe(false);
  });

  test('returns false for "factors" subtopic even if numeric', () => {
    const question = {
      correctAnswer: '3',
      subtopic: 'factors',
      options: ['1', '2', '3']
    };
    expect(isNumericQuestion(question)).toBe(false);
  });

  test('returns false for null/undefined', () => {
    expect(isNumericQuestion(null)).toBe(false);
    expect(isNumericQuestion(undefined)).toBe(false);
  });
});
