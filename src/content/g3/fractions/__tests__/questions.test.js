import {
  generateEquivalentFractionsQuestion,
  generateFractionAdditionQuestion,
  generateFractionComparisonQuestion,
  generateFractionSubtractionQuestion,
  generateFractionSimplificationQuestion,
} from '../questions.js';
import { QUESTION_TYPES } from '../../../../constants/shared-constants.js';

describe('G3 fractions: addition and subtraction only use LIKE denominators', () => {
  // Adding/subtracting fractions with UNLIKE denominators is 5.NF.A.1, not
  // 3rd grade. The G3 addition/subtraction generators must present the same
  // denominator on both operands, matching what the Explanation teaches.
  it('addition operands always share a denominator', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateFractionAdditionQuestion(Math.random());
      const match = q.question.match(/^What is (\d+)\/(\d+) \+ (\d+)\/(\d+)\?$/);
      expect(match).not.toBeNull();
      const [, , den1, , den2] = match;
      expect(den1).toBe(den2);
    }
  });

  it('subtraction operands always share a denominator and never produce a negative answer', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateFractionSubtractionQuestion(Math.random());
      const match = q.question.match(/^What is (\d+)\/(\d+) - (\d+)\/(\d+)\?$/);
      expect(match).not.toBeNull();
      const [, num1, den1, num2, den2] = match;
      expect(den1).toBe(den2);
      expect(Number(num1)).toBeGreaterThanOrEqual(Number(num2));
    }
  });
});

describe('G3 fractions: CCSS standards are 3rd-grade', () => {
  it('addition uses a 3.NF.* standard, not 4.NF.*', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = generateFractionAdditionQuestion();
      expect(q.grade).toBe('G3');
      expect(q.standard).toMatch(/^3\.NF/);
    }
  });

  it('subtraction uses a 3.NF.* standard, not 4.NF.*', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = generateFractionSubtractionQuestion();
      expect(q.grade).toBe('G3');
      expect(q.standard).toMatch(/^3\.NF/);
    }
  });

  it('simplification uses a 3.NF.* standard, not 4.NF.*', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = generateFractionSimplificationQuestion();
      expect(q.grade).toBe('G3');
      expect(q.standard).toMatch(/^3\.NF/);
    }
  });
});

describe('generateEquivalentFractionsQuestion: never picks the original fraction as the correct answer', () => {
  it('the correct answer is always a different fraction than the one in the question', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateEquivalentFractionsQuestion(0);
      // Question is "Which fraction is equivalent to N/D?"
      const match = q.question.match(/equivalent to (\d+)\/(\d+)\?/);
      expect(match).not.toBeNull();
      const original = `${match[1]}/${match[2]}`;
      expect(q.correctAnswer).not.toBe(original);
    }
  });

  it('never produces a whole-number "fraction" like 10/10 at high difficulty', () => {
    // At difficulty=1 the old code would allow f_num_eq = 10 with the
    // denominator forced to 10, producing "Which fraction is equivalent to
    // 10/10?" — a degenerate whole number written as a fraction.
    for (let i = 0; i < 500; i += 1) {
      const q = generateEquivalentFractionsQuestion(1);
      const match = q.question.match(/equivalent to (\d+)\/(\d+)\?/);
      expect(match).not.toBeNull();
      const [, num, den] = match.map(Number);
      expect(num).toBeLessThan(den);
    }
  });
});

describe('generateFractionComparisonQuestion: consistent multiple-choice across both branches', () => {
  it('always returns MULTIPLE_CHOICE with both < and > as options', () => {
    for (let i = 0; i < 100; i += 1) {
      const q = generateFractionComparisonQuestion();
      expect(q.questionType).toBe(QUESTION_TYPES.MULTIPLE_CHOICE);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toEqual(expect.arrayContaining(['<', '>']));
      expect(['<', '>']).toContain(q.correctAnswer);
    }
  });
});

describe('generateFractionSimplificationQuestion: avoids degenerate / colliding distractors', () => {
  it('does not emit "0/N" distractors and does not include the correct answer as a distractor', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateFractionSimplificationQuestion();
      for (const opt of q.options) {
        // "0/anything" looks malformed to a student. The simplified form of 0
        // is just "0" (no slash), which is allowed.
        expect(opt).not.toMatch(/^0\/\d+$/);
      }
      // Options are unique and the correct answer appears exactly once.
      const correctOccurrences = q.options.filter((o) => o === q.correctAnswer).length;
      expect(correctOccurrences).toBe(1);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});
