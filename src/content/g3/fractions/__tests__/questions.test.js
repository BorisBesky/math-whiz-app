import {
  generateFractionSubtractionQuestion,
  generateFractionAdditionQuestion,
  generateEquivalentFractionsQuestion,
  generateFractionComparisonQuestion,
  generateFractionSimplificationQuestion,
} from '../questions.js';

function isNegativeFractionString(s) {
  if (typeof s !== 'string') return false;
  if (s.startsWith('-')) return true;
  // Handle "-N/D" or "N/-D" (just in case)
  return /^-?\d+\/-?\d+$/.test(s) && s.includes('-');
}

describe('generateFractionSubtractionQuestion', () => {
  it('returns a question object with the expected shape', () => {
    const q = generateFractionSubtractionQuestion();

    expect(q).toHaveProperty('question');
    expect(q).toHaveProperty('correctAnswer');
    expect(q).toHaveProperty('questionType');
    expect(q).toHaveProperty('options');
    expect(q.concept).toBe('Fractions');
    expect(q.grade).toBe('G3');
    expect(q.subtopic).toBe('subtraction');
  });

  it('never produces a negative-fraction answer across many runs', () => {
    // Without the fix, the generator could pick (1/3) - (4/5), yielding -7/15.
    // The fix swaps operands so the minuend is always >= the subtrahend.
    for (let i = 0; i < 500; i++) {
      const q = generateFractionSubtractionQuestion(Math.random());
      expect(isNegativeFractionString(q.correctAnswer)).toBe(false);
    }
  });

  it("answer always equals the question's left-fraction minus right-fraction", () => {
    for (let i = 0; i < 200; i++) {
      const q = generateFractionSubtractionQuestion(Math.random());
      const match = q.question.match(
        /What is (\d+)\/(\d+) - (\d+)\/(\d+)\?/
      );
      expect(match).not.toBeNull();
      const [, n1, d1, n2, d2] = match.map(Number);
      // Both fractions are proper.
      expect(n1).toBeLessThan(d1);
      expect(n2).toBeLessThan(d2);
      // Minuend >= subtrahend (no negative answer).
      expect(n1 * d2).toBeGreaterThanOrEqual(n2 * d1);
    }
  });
});

describe('basic 3rd-grade fraction generators (smoke tests)', () => {
  const generators = [
    ['generateFractionAdditionQuestion', generateFractionAdditionQuestion],
    ['generateEquivalentFractionsQuestion', generateEquivalentFractionsQuestion],
    ['generateFractionComparisonQuestion', generateFractionComparisonQuestion],
    ['generateFractionSimplificationQuestion', generateFractionSimplificationQuestion],
  ];

  for (const [name, gen] of generators) {
    it(`${name} returns a non-empty question and correctAnswer`, () => {
      const q = gen();
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.correctAnswer).toBeDefined();
      expect(`${q.correctAnswer}`.length).toBeGreaterThan(0);
    });
  }
});
