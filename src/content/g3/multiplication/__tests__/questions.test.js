import { generateFactFamilyQuestion } from '../questions.js';

describe('G3 multiplication: fact family never asks a trivially identical commutative question', () => {
  it('never asks "If A x A = X, what is A x A?"', () => {
    let commutativeSeen = 0;
    for (let i = 0; i < 400; i += 1) {
      const q = generateFactFamilyQuestion();
      // Only the commutative branch has × on BOTH sides of the comma — the
      // inverse branches use ÷ on the right side.
      const commutativeMatch = q.question.match(
        /^If (\d+) × (\d+) = \d+, what is (\d+) × (\d+)\?$/
      );
      if (!commutativeMatch) continue;
      commutativeSeen += 1;
      const [, a, b, c, d] = commutativeMatch;
      // The two factors must differ (or the question is the trivial
      // "If 4×4=16, what is 4×4?").
      expect(a).not.toBe(b);
      expect(c).not.toBe(d);
      // The commutative branch always asks for the swap, so {a,b} == {c,d}.
      expect(new Set([a, b])).toEqual(new Set([c, d]));
      [a, b, c, d].forEach((n) => {
        expect(Number(n)).toBeGreaterThanOrEqual(2);
        expect(Number(n)).toBeLessThanOrEqual(9);
      });
    }
    // The generator picks the commutative branch ~1/3 of the time, so we
    // should have hit it many times in 400 iterations.
    expect(commutativeSeen).toBeGreaterThan(0);
  });
});
