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

  it('never ships two options that state the same logical comparison', () => {
    // Regression: for num1>num2 the wrongs used to include both `binary1 <
    // binary2` and `binary2 > binary1` — two syntactic forms of the same
    // (wrong-direction) claim. That made the MC degenerate: two options meant
    // the same thing, only one was scored correct. Every option must state a
    // distinct claim.
    // Normalize each `A op B` option to a canonical (op, {A,B}) form and check
    // that no two options collapse to the same canonical.
    const canonicalize = (opt) => {
      const m = opt.match(/^(\S+)\s*(>|<|=)\s*(\S+)$/);
      if (!m) return opt;
      const [, left, op, right] = m;
      // "A > B" and "B < A" are the same claim; canonicalize by rewriting
      // the "<" form as ">" with operands swapped.
      if (op === '<') return `${right} > ${left}`;
      if (op === '=') {
        const [a, b] = [left, right].sort();
        return `${a} = ${b}`;
      }
      return `${left} > ${right}`;
    };
    for (let i = 0; i < 200; i += 1) {
      const q = generateBinaryComparisonQuestion(0.5);
      const canon = q.options.map(canonicalize);
      expect(new Set(canon).size).toBe(canon.length);
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
