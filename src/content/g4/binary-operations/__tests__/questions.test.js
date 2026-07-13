import { generateBinaryComparisonQuestion } from '../questions.js';

describe('G4 binary-operations: comparison question always ships four unique options', () => {
  // Previously shuffleArray([correct, ...twoWrongs]) shipped a 3-option MC —
  // every other MC in the topic ships four options.
  it('draws four unique options and includes the correct answer', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateBinaryComparisonQuestion(0.5);
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });
});
