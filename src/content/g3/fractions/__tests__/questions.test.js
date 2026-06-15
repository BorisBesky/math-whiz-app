import {
  generateEquivalentFractionsQuestion,
  generateFractionAdditionQuestion,
  generateFractionSubtractionQuestion,
  generateFractionSimplificationQuestion,
} from '../questions.js';

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
});
