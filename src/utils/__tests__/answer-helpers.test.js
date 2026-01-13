
const { isNumericQuestion, normalizeNumericAnswer, normalizeMathExpression, validateFillInAnswers } = require('../answer-helpers');

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

describe('normalizeNumericAnswer', () => {
  test('removes commas from numbers', () => {
    expect(normalizeNumericAnswer('4,700')).toBe('4700');
    expect(normalizeNumericAnswer('1,234,567')).toBe('1234567');
  });

  test('normalizes decimals', () => {
    expect(normalizeNumericAnswer('4700.0')).toBe('4700');
    expect(normalizeNumericAnswer('3.14000')).toBe('3.14');
  });

  test('handles negative numbers', () => {
    expect(normalizeNumericAnswer('-4,700')).toBe('-4700');
    expect(normalizeNumericAnswer('-4700.0')).toBe('-4700');
  });

  test('removes leading zeros', () => {
    expect(normalizeNumericAnswer('007')).toBe('7');
    expect(normalizeNumericAnswer('000')).toBe('0');
  });

  test('handles empty and invalid input', () => {
    expect(normalizeNumericAnswer('')).toBe('');
    expect(normalizeNumericAnswer(null)).toBe('');
    expect(normalizeNumericAnswer('abc')).toBe('abc');
  });

  test('preserves decimal precision', () => {
    expect(normalizeNumericAnswer('3.14159')).toBe('3.14159');
  });
});

describe('normalizeMathExpression', () => {
  test('standardizes multiplication symbols', () => {
    expect(normalizeMathExpression('63 × 9 = 567')).toBe('63 x 9 = 567');
    expect(normalizeMathExpression('63 * 9 = 567')).toBe('63 x 9 = 567');
    expect(normalizeMathExpression('63x9=567')).toBe('63 x 9 = 567');
  });

  test('standardizes division symbols', () => {
    expect(normalizeMathExpression('42 ÷ 6 = 7')).toBe('42 / 6 = 7');
    expect(normalizeMathExpression('42/6=7')).toBe('42 / 6 = 7');
  });

  test('normalizes whitespace around operators', () => {
    expect(normalizeMathExpression('63×9=567')).toBe('63 x 9 = 567');
    expect(normalizeMathExpression('63  ×  9  =  567')).toBe('63 x 9 = 567');
  });

  test('handles empty and invalid input', () => {
    expect(normalizeMathExpression('')).toBe('');
    expect(normalizeMathExpression(null)).toBe('');
    expect(normalizeMathExpression('   ')).toBe('');
  });

  test('preserves other characters', () => {
    expect(normalizeMathExpression('2,141 x 4 = 8,564')).toBe('2,141 x 4 = 8,564');
  });
});

describe('validateFillInAnswers', () => {
  test('validates numeric answers with normalization', () => {
    const userAnswers = ['4,700', '4700.0', '007'];
    const correctAnswers = ['4700', '4700', '7'];
    const inputTypes = ['numeric', 'numeric', 'numeric'];
    
    const result = validateFillInAnswers(userAnswers, correctAnswers, inputTypes);
    expect(result.allCorrect).toBe(true);
    expect(result.results).toEqual([true, true, true]);
  });

  test('validates mixed numeric and text answers', () => {
    const userAnswers = ['4,700', '63 × 9 = 567'];
    const correctAnswers = ['4700', '63 x 9 = 567'];
    const inputTypes = ['numeric', 'letters'];
    
    const result = validateFillInAnswers(userAnswers, correctAnswers, inputTypes);
    expect(result.allCorrect).toBe(true);
    expect(result.results).toEqual([true, true]);
  });

  test('normalizes mathematical symbols in text answers', () => {
    const userAnswers = ['63 x 9 = 567', '2,141 × 4 = 8,564'];
    const correctAnswers = ['63 × 9 = 567', '2,141 x 4 = 8,564'];
    const inputTypes = ['letters', 'letters'];
    
    const result = validateFillInAnswers(userAnswers, correctAnswers, inputTypes);
    expect(result.allCorrect).toBe(true);
    expect(result.results).toEqual([true, true]);
  });

  test('case-insensitive for non-numeric answers', () => {
    const userAnswers = ['HELLO', 'WORLD'];
    const correctAnswers = ['hello', 'World'];
    const inputTypes = ['letters', 'letters'];
    
    const result = validateFillInAnswers(userAnswers, correctAnswers, inputTypes);
    expect(result.allCorrect).toBe(true);
    expect(result.results).toEqual([true, true]);
  });

  test('handles mismatched lengths', () => {
    const userAnswers = ['answer'];
    const correctAnswers = ['answer1', 'answer2'];
    
    const result = validateFillInAnswers(userAnswers, correctAnswers);
    expect(result.allCorrect).toBe(false);
    expect(result.results).toEqual([]);
  });

  test('handles empty inputTypes', () => {
    const userAnswers = ['HELLO'];
    const correctAnswers = ['hello'];
    
    const result = validateFillInAnswers(userAnswers, correctAnswers);
    expect(result.allCorrect).toBe(true);
    expect(result.results).toEqual([true]);
  });
});
