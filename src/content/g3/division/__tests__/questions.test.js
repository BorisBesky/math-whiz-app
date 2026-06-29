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
});
