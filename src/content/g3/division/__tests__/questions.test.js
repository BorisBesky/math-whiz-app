import { generateFactFamilyQuestion, generateRemainderQuestion } from '../questions.js';

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

describe('G3 division: fact family question factors', () => {
  it('never uses two equal factors (fact family collapses when factor1 === factor2)', () => {
    // When factor1 === factor2 (say 4 × 4 = 16), the "cross" blank forms
    // "4 × __ = 16" and "__ × 4 = 16" have the same visible expression and
    // no longer test the fact-family relationship. The multiplication
    // version already excludes this — division must too.
    const violations = [];
    for (let i = 0; i < 500; i += 1) {
      const q = generateFactFamilyQuestion();
      // Extract the two factors that appear in the "If a × b = product" prefix,
      // or in the "a × __ = product" / "__ × b = product" blank forms.
      const dot = q.question.match(/If (\d+) × (\d+) = /);
      const blankRight = q.question.match(/^(\d+) × __ = /);
      const blankLeft = q.question.match(/^__ × (\d+) = /);
      if (dot) {
        if (dot[1] === dot[2]) violations.push(q.question);
      } else if (blankRight) {
        // For the blank forms, we can't see factor2 directly. Read the
        // product and infer: factor2 must not equal factor1 (i.e., the
        // hidden number).
        const shown = Number(blankRight[1]);
        const product = Number(q.question.match(/= (\d+)/)[1]);
        if (product / shown === shown) violations.push(q.question);
      } else if (blankLeft) {
        const shown = Number(blankLeft[1]);
        const product = Number(q.question.match(/= (\d+)/)[1]);
        if (product / shown === shown) violations.push(q.question);
      }
    }
    expect(violations).toEqual([]);
  });

  it('always ships 4 distinct options including the correct answer', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateFactFamilyQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});
