import fs from 'fs';
import path from 'path';
import { generateFactFamilyQuestion, generateQuestion } from '../questions.js';

describe('G3 multiplication basic MC: distractors are always four unique options', () => {
  // The old generator picked a random offset in [1..5] for one distractor. If
  // that offset happened to equal m1 (m1 ∈ [2..5] at typical difficulties),
  // the "mAnswer + m1" and "m1 * (m2 + 1)" distractors collided and
  // generateUniqueOptions silently shipped a 3-option MC.
  it('every drawn basic-multiplication question has 4 unique options including the correct answer', () => {
    let seenBasic = 0;
    for (let i = 0; i < 500; i += 1) {
      const difficulty = (i % 5) / 4;
      const q = generateQuestion(difficulty, ['basic multiplication']);
      if (!q) continue;
      seenBasic += 1;
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
    expect(seenBasic).toBeGreaterThan(0);
  });
});

describe('G3 multiplication Explanation: covers every declared subtopic', () => {
  const explanationSrc = fs.readFileSync(
    path.join(__dirname, '..', 'Explanation.js'),
    'utf8'
  );

  it('includes a Fact Families section (division questions are asked under this subtopic)', () => {
    // The fact-families generator asks division questions (12 ÷ 4 = ?).
    // Without an explicit fact-families section students hit those cold.
    expect(explanationSrc).toMatch(/Fact Famil/i);
  });
});

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
