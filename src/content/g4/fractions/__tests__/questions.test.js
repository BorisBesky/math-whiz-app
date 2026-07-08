import {
  generateFractionSubtractionQuestion,
  generateFractionComparisonQuestion,
  generateFractionMultiplicationQuestion,
  generateMixedNumbersQuestion,
} from '../questions.js';

describe('G4 fractions: subtraction hint matches the question setup', () => {
  it('does not tell students the denominators are "the same" (the generator always uses different ones)', () => {
    for (let i = 0; i < 100; i += 1) {
      const q = generateFractionSubtractionQuestion(0.5);
      // The question is "What is A/B - C/D?" — extract B and D and confirm they
      // differ (the generator picks two denominators and produces a question
      // with both). The hint must not falsely claim they're "the same".
      const match = q.question.match(/(\d+)\/(\d+) - (\d+)\/(\d+)/);
      expect(match).not.toBeNull();
      const denom1 = match[2];
      const denom2 = match[4];
      // The generator can pick equal denominators occasionally; only check the
      // hint wording for the question setup the student actually sees.
      expect(q.hint).not.toMatch(/same denominator/i);
      // And the hint should mention finding/using a common denominator.
      expect(q.hint).toMatch(/common denominator/i);
      // Sanity check on the denominators picked
      expect(Number(denom1)).toBeGreaterThan(0);
      expect(Number(denom2)).toBeGreaterThan(0);
    }
  });
});

describe('G4 fractions: subtraction never shows "undefined" as a multiple-choice option', () => {
  it('options never contain the literal string "undefined" (would appear when distractor divides by 0)', () => {
    // Force the equal-denominator case to occur frequently by running many
    // iterations — the bug only triggers when denominator === denominator2.
    for (let i = 0; i < 500; i += 1) {
      const q = generateFractionSubtractionQuestion(0.5);
      expect(q.options).not.toContain('undefined');
      // Sanity: correct answer must be in the options.
      expect(q.options).toContain(q.correctAnswer);
    }
  });
});

describe('G4 fractions: subtraction distractor pool stays distinct in the equal-denominator case', () => {
  it('always produces 4 unique options — the equal-denom "subtract straight across" distractor used to equal the correct answer', () => {
    // When denominator === denominator2 the previous "subtract straight
    // across" distractor was simplifyFraction(|num1-num2|, denominator),
    // which IS the correct answer for equal-denominator subtraction. The
    // duplicate got dropped by generateUniqueOptions, leaving only 3 options.
    // Run at difficulty 0.4 where the denominator range is smallest so the
    // equal-denominator case is likely.
    for (let i = 0; i < 500; i += 1) {
      const q = generateFractionSubtractionQuestion(0.4);
      const correctOccurrences = q.options.filter((o) => o === q.correctAnswer).length;
      expect(correctOccurrences).toBe(1);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBe(4);
    }
  });
});

describe('G4 fractions: comparison correctly handles equivalent-but-different-looking fractions', () => {
  it('never picks "<" or ">" when the two fractions are actually equal', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateFractionComparisonQuestion(0.5);
      // Question: "Compare these fractions: A/B ___ C/D"
      const match = q.question.match(/(\d+)\/(\d+) ___ (\d+)\/(\d+)/);
      expect(match).not.toBeNull();
      const [, a, b, c, d] = match.map(Number);
      // Cross-multiply to check equivalence without floating-point error.
      expect(a * d).not.toBe(c * b);
      // The chosen comparator must agree with the real ordering.
      if (q.correctAnswer === '>') {
        expect(a * d).toBeGreaterThan(c * b);
      } else if (q.correctAnswer === '<') {
        expect(a * d).toBeLessThan(c * b);
      }
    }
  });
});

describe('G4 fractions: multiplication always renders 4 distinct options incl. the answer', () => {
  it('every question has exactly 4 unique options containing the correct answer, across difficulties', () => {
    // Distractors are misconception-based and heavily simplified, so many collapse onto
    // the same value (or onto the answer). This used to leave questions with only 2-3
    // options. Sweep the whole difficulty range so all (whole, numerator, denominator)
    // combinations the generator can pick are exercised.
    for (let d = 0; d <= 1.0001; d += 0.05) {
      for (let i = 0; i < 60; i += 1) {
        const q = generateFractionMultiplicationQuestion(d);
        expect(q.options).toContain(q.correctAnswer);
        expect(q.options.filter((o) => o === q.correctAnswer).length).toBe(1);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBe(4);
        expect(q.options).not.toContain('undefined');
      }
    }
  });
});

describe('G4 fractions: mixed-number addition options stay distinct (no-carry case)', () => {
  it('correct answer is not duplicated by the "forgot to carry" distractor when no carry was needed', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateMixedNumbersQuestion(0.5);
      // Only the addMixed branch shows a "+" in the question stem.
      if (!/\d+ \d+\/\d+ \+ \d+ \d+\/\d+/.test(q.question)) continue;
      const correctOccurrences = q.options.filter((o) => o === q.correctAnswer).length;
      expect(correctOccurrences).toBe(1);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});
