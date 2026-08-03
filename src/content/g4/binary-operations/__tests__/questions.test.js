import {
  generateBinaryComparisonQuestion,
  generateQuestion,
} from '../questions.js';

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

describe('G4 binary-operations: every generated question tags itself with grade "G4"', () => {
  // Regression: the eight binary generators built their return objects by
  // hand and forgot the `grade` field. The Question Bank filters saved
  // questions by `q.grade !== filterGrade`, so a missing grade could silently
  // drop bank questions from a teacher's filtered view.
  it.each([0, 0.25, 0.5, 0.75, 1])(
    'difficulty %p questions include grade: "G4"',
    (difficulty) => {
      for (let i = 0; i < 40; i += 1) {
        const q = generateQuestion(difficulty, null);
        expect(q).toBeTruthy();
        expect(q.grade).toBe('G4');
      }
    }
  );
});
