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
  it('always returns MULTIPLE_CHOICE with all three comparison symbols as options', () => {
    // Regression: the option pool was `["<", ">"]`, which after deduping the
    // correct answer left students with a 2-option coin-flip. Including "="
    // as a distractor turns the question into a genuine 3-way pick (and
    // students who mistakenly think the two fractions are equal now see that
    // choice offered explicitly, so the wrong answer is discoverable).
    for (let i = 0; i < 300; i += 1) {
      const q = generateFractionComparisonQuestion(Math.random());
      expect(q.questionType).toBe(QUESTION_TYPES.MULTIPLE_CHOICE);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toEqual(expect.arrayContaining(['<', '>', '=']));
      expect(q.options.length).toBe(3);
      expect(new Set(q.options).size).toBe(3);
      expect(['<', '>']).toContain(q.correctAnswer);
    }
  });

  it('never produces a whole-number "fraction" (numerator === denominator) in either branch', () => {
    // Regression: the same-numerator branch's "fall back to comp_den1 - 1"
    // when both initial denominators collided could land on comp_num when
    // comp_num === maxDen - 1 and both draws returned maxDen. That produced
    // malformed comparisons like "7/8 ___ 7/7" where the second operand is
    // the whole number 1 written as a fraction — the student is told the
    // question is a fraction comparison, but one side is really an integer.
    // Fix: cap comp_num so the denominator range always holds ≥2 distinct
    // values greater than comp_num, and re-roll to one of those.
    const bothBranchForms = [
      /(\d+)\/(\d+) ___ (\d+)\/(\d+)/,
    ];
    let seenHighDifficulty = 0;
    for (let i = 0; i < 2000; i += 1) {
      const difficulty = i % 2 === 0 ? 0 : Math.random();
      const q = generateFractionComparisonQuestion(difficulty);
      const match = bothBranchForms[0].exec(q.question);
      expect(match).not.toBeNull();
      const [, n1, d1, n2, d2] = match.map(Number);
      // Every operand must be a proper fraction (numerator < denominator).
      expect(n1).toBeLessThan(d1);
      expect(n2).toBeLessThan(d2);
      if (difficulty > 0) seenHighDifficulty += 1;
    }
    expect(seenHighDifficulty).toBeGreaterThan(0);
  });

  it('same-numerator branch produces two genuinely different fractions', () => {
    // The two fractions must be unequal — same-numerator comparisons rely on
    // the denominators differing so a true "<" or ">" answer exists.
    for (let i = 0; i < 500; i += 1) {
      const q = generateFractionComparisonQuestion(Math.random());
      const match = /(\d+)\/(\d+) ___ (\d+)\/(\d+)/.exec(q.question);
      if (!match) continue;
      const [, n1, d1, n2, d2] = match.map(Number);
      // Cross-multiplied comparison: the two fractions must not be equal.
      expect(n1 * d2).not.toBe(n2 * d1);
    }
  });
});

describe('generateFractionAdditionQuestion: distractor pool never collapses to 3-option MC', () => {
  // Regression: the "add both tops AND bottoms", "kept first numerator", and
  // "product of numerators" candidates all silently reduced to the same value
  // for common small denominators (e.g. num1=num2=1 with d=3 or d=4). After
  // dedup the pool held only 2 unique distractors, so generateUniqueOptions
  // shipped a 3-option MC. The pool was widened with additional misconception
  // candidates that stay distinct.
  it('every drawn addition question ships 4 unique options including the correct answer', () => {
    for (let i = 0; i < 800; i += 1) {
      const q = generateFractionAdditionQuestion(Math.random());
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
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

describe('generateFractionSubtractionQuestion: never emits a bare-integer distractor', () => {
  // Regression: the "subtract straight across" distractor used
  // getSimplifiedFraction(diff, denominator - denominator + 1) — always
  // simplifies to a bare integer like "2", which stands out next to fraction
  // options and doesn't reflect a real student misconception. The distractor
  // should still read as a fraction (or as "0" for a genuinely zero result).
  it('non-zero distractors keep a fractional form', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateFractionSubtractionQuestion(Math.random());
      const wrongs = q.options.filter((o) => o !== q.correctAnswer);
      for (const opt of wrongs) {
        // Simplified 0 is allowed. Anything else must contain a "/".
        if (opt === '0') continue;
        expect(opt).toMatch(/\//);
      }
    }
  });
});
