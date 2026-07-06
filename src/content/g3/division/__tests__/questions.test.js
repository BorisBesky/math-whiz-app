import { generateRemainderQuestion } from '../questions.js';

describe('G3 division: remainder question wording', () => {
  it('reads as a grammatical English sentence (no missing verb)', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = generateRemainderQuestion();
      // Previously: "What is the remainder when 17 ÷ 5?" — missing "divided by".
      expect(q.question).toMatch(/is divided by/);
      expect(q.question).not.toMatch(/when \d+ ÷ \d+\?/);
    }
  });

  it('always includes the correct answer in the options', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = generateRemainderQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('always produces 4 distinct options (no distractor collision when remainder+1 === divisor)', () => {
    // Bug: when remainder === divisor - 1 (common — ~1/3 of the time when
    // divisor=3), the naive distractors [remainder+1, remainder-1, divisor]
    // included `divisor` twice, causing generateUniqueOptions to silently
    // drop a duplicate and leave only 3 options.
    for (let i = 0; i < 500; i += 1) {
      const q = generateRemainderQuestion();
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBe(4);
    }
  });
});
