import {
  generateBinaryAdditionQuestion,
  generateBinaryComparisonQuestion,
  generateBinaryDivisionQuestion,
  generateBinaryMultiplicationQuestion,
  generateBinaryPlaceValueQuestion,
  generateBinarySubtractionQuestion,
  generateQuestion,
} from '../questions.js';

// Decode an operand/operand-string like "1101" back to its decimal value.
const bin2dec = (s) => parseInt(s, 2);

// A generator "scales with difficulty" if its mean (or max) operand size
// grows with the difficulty argument. We assert on both so a mean-crossing
// coincidence doesn't fail flakily.
const sampleBinaryStats = (generator, difficulty, extract, n = 400) => {
  const sizes = [];
  for (let i = 0; i < n; i += 1) {
    const q = generator(difficulty);
    sizes.push(extract(q));
  }
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const max = Math.max(...sizes);
  return { mean, max };
};

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

describe('G4 binary-operations: operand ranges scale with difficulty', () => {
  // Regression: five of the eight binary generators ignored the `difficulty`
  // argument entirely (addition, subtraction, multiplication, division,
  // comparison) and one (place-value) always drew from the smallest four
  // powers of 2. The adaptive engine couldn't stretch stronger students on
  // binary subtopics; easy and hard quizzes used identical bit widths.
  // These tests assert that peak operand size grows with difficulty for
  // every affected generator — a precise mean threshold would be flaky
  // across RNG seeds, so we check "hard max > easy max" with a healthy
  // margin and a 400-sample batch.
  it('binary addition widens the summand range at higher difficulty', () => {
    const easy = sampleBinaryStats(generateBinaryAdditionQuestion, 0.2, (q) => {
      const m = q.question.match(/Add these binary numbers: (\S+) \+ (\S+) =/);
      return Math.max(bin2dec(m[1]), bin2dec(m[2]));
    });
    const hard = sampleBinaryStats(generateBinaryAdditionQuestion, 0.95, (q) => {
      const m = q.question.match(/Add these binary numbers: (\S+) \+ (\S+) =/);
      return Math.max(bin2dec(m[1]), bin2dec(m[2]));
    });
    expect(hard.max).toBeGreaterThan(easy.max);
  });

  it('binary subtraction widens the minuend range at higher difficulty', () => {
    const easy = sampleBinaryStats(generateBinarySubtractionQuestion, 0.5, (q) => {
      const m = q.question.match(/Subtract these binary numbers: (\S+) - (\S+) =/);
      return bin2dec(m[1]);
    });
    const hard = sampleBinaryStats(generateBinarySubtractionQuestion, 0.95, (q) => {
      const m = q.question.match(/Subtract these binary numbers: (\S+) - (\S+) =/);
      return bin2dec(m[1]);
    });
    expect(hard.max).toBeGreaterThan(easy.max);
  });

  it('binary multiplication widens the product range at higher difficulty', () => {
    const extractProduct = (q) => bin2dec(q.correctAnswer);
    const easy = sampleBinaryStats(generateBinaryMultiplicationQuestion, 0.6, extractProduct);
    const hard = sampleBinaryStats(generateBinaryMultiplicationQuestion, 1.0, extractProduct);
    expect(hard.max).toBeGreaterThan(easy.max);
  });

  it('binary multiplication keeps the product within its difficulty ceiling', () => {
    // After the dead-code guard was replaced with a computed cap, every
    // product must fit under the difficulty's own ceiling — no reroll
    // required. Catches a future regression that bumps the num1 range
    // without bumping productMax.
    for (const [difficulty, ceiling] of [[0.6, 15], [0.9, 24], [1.0, 31]]) {
      for (let i = 0; i < 200; i += 1) {
        const q = generateBinaryMultiplicationQuestion(difficulty);
        expect(bin2dec(q.correctAnswer)).toBeLessThanOrEqual(ceiling);
      }
    }
  });

  it('binary division widens the dividend range at higher difficulty', () => {
    const extractDividend = (q) => {
      const m = q.question.match(/Divide these binary numbers: (\S+) ÷/);
      return bin2dec(m[1]);
    };
    const easy = sampleBinaryStats(generateBinaryDivisionQuestion, 0.7, extractDividend);
    const hard = sampleBinaryStats(generateBinaryDivisionQuestion, 1.0, extractDividend);
    expect(hard.max).toBeGreaterThan(easy.max);
  });

  it('binary division keeps the dividend within its difficulty ceiling', () => {
    for (const [difficulty, ceiling] of [[0.75, 15], [0.9, 24], [1.0, 31]]) {
      for (let i = 0; i < 200; i += 1) {
        const q = generateBinaryDivisionQuestion(difficulty);
        const m = q.question.match(/Divide these binary numbers: (\S+) ÷/);
        expect(bin2dec(m[1])).toBeLessThanOrEqual(ceiling);
      }
    }
  });

  it('binary comparison widens the operand range at higher difficulty', () => {
    const extractMax = (q) => {
      const m = q.correctAnswer.match(/^(\S+)\s*[<>]\s*(\S+)$/);
      return Math.max(bin2dec(m[1]), bin2dec(m[2]));
    };
    const easy = sampleBinaryStats(generateBinaryComparisonQuestion, 0.4, extractMax);
    const hard = sampleBinaryStats(generateBinaryComparisonQuestion, 0.95, extractMax);
    expect(hard.max).toBeGreaterThan(easy.max);
  });

  it('place-value includes higher powers of two at higher difficulty', () => {
    const extractPower = (q) => bin2dec(q.question.match(/binary number (\S+),/)[1]);
    const easy = sampleBinaryStats(generateBinaryPlaceValueQuestion, 0.2, extractPower);
    const hard = sampleBinaryStats(generateBinaryPlaceValueQuestion, 1.0, extractPower);
    // Easiest band draws from {1,2,4}; hardest band includes 16 and 32.
    expect(easy.max).toBeLessThanOrEqual(4);
    expect(hard.max).toBeGreaterThanOrEqual(16);
  });
});

describe('G4 binary-operations: every MC generator ships four distinct options', () => {
  // Regression guard: after refactoring the distractor loops to add
  // attempt caps and deterministic fallbacks, every multiple-choice
  // generator must still produce exactly four unique options across the
  // full difficulty range.
  const mcGenerators = {
    'binary addition': generateBinaryAdditionQuestion,
    'binary subtraction': generateBinarySubtractionQuestion,
    'binary multiplication': generateBinaryMultiplicationQuestion,
    'binary division': generateBinaryDivisionQuestion,
    'binary comparison': generateBinaryComparisonQuestion,
    'binary place-value': generateBinaryPlaceValueQuestion,
  };
  for (const [name, generator] of Object.entries(mcGenerators)) {
    for (const difficulty of [0.0, 0.5, 1.0]) {
      it(`${name} at difficulty ${difficulty} ships 4 unique options`, () => {
        for (let i = 0; i < 100; i += 1) {
          const q = generator(difficulty);
          expect(q.options.length).toBe(4);
          expect(new Set(q.options).size).toBe(4);
          expect(q.options).toContain(q.correctAnswer);
        }
      });
    }
  }
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
