import {
  generateAreaQuestion,
  generateVolumeQuestion,
  generatePerimeterQuestion,
} from '../questions.js';

describe('G3 measurement-data: area distractors never collide with the correct area', () => {
  it('always produces 4 distinct options', () => {
    // The perimeter distractor 2*(l+w) equals the area l*w for (l,w) in
    // {(3,6), (4,4), (6,3)} — all within the generator's range. Run many
    // iterations to exercise those cases and verify the fix keeps the option
    // pool at 4 distinct values.
    for (let i = 0; i < 500; i += 1) {
      const q = generateAreaQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBe(4);
    }
  });

  it('never produces a negative or zero option', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateAreaQuestion();
      q.options.forEach((opt) => {
        const value = parseInt(opt, 10);
        expect(value).toBeGreaterThan(0);
      });
    }
  });
});

describe('G3 measurement-data: volume distractors never collide with the correct volume', () => {
  it('always produces 4 distinct options', () => {
    // The l+w+h distractor equals l*w*h for (3,2,1) etc. — both = 6.
    // Also l+w+h could equal volume-2. Run many iterations to exercise these.
    for (let i = 0; i < 500; i += 1) {
      const q = generateVolumeQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBe(4);
    }
  });
});

describe('G3 measurement-data: perimeter question sanity', () => {
  it('always produces 4 distinct options and matches the computed perimeter', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generatePerimeterQuestion();
      const match = q.question.match(/sides of length (\d+) inches and (\d+) inches/);
      expect(match).not.toBeNull();
      const [, s1, s2] = match.map(Number);
      const expected = `${2 * (s1 + s2)} inches`;
      expect(q.correctAnswer).toBe(expected);
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});
