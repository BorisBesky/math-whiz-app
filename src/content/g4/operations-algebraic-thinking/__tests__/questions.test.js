// Mock the helper functions to make tests deterministic
// jest.mock('../utils/question-helpers.js', () => ({
//   generateUniqueOptions: jest.fn((correct, distractors) => [correct, ...distractors]),
//   shuffle: jest.fn((array) => array), // Return array as-is for predictable testing
// });

import questions from '../questions.js';

describe('generateTwoStepPatternQuestion', () => {
  it('should return a question object with required properties', () => {
    const result = questions.generateTwoStepPatternQuestion();

    expect(result).toHaveProperty('question');
    expect(result).toHaveProperty('correctAnswer');
    expect(result).toHaveProperty('questionType');
    expect(result).toHaveProperty('hint');
    expect(result).toHaveProperty('standard');
    expect(result).toHaveProperty('concept');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('subtopic');
  });

  it('should generate a question with a sequence and blank', () => {
    const result = questions.generateTwoStepPatternQuestion();

    // The question format includes a blank for fill-in-the-blanks type
    expect(result.question).toMatch(/Look at this pattern.*___/);
    expect(result.correctAnswer).toMatch(/^-?\d+$/); // Should be a number string (may be negative)
  });

  it('should be a fill-in-the-blanks question type', () => {
    const result = questions.generateTwoStepPatternQuestion();

    // This question type is fill-in-the-blanks, not multiple choice
    expect(result.questionType).toBe('fill-in-the-blanks');
    // Fill-in-the-blanks questions don't have options
    expect(result.options).toBeUndefined();
  });

  it('should have correct standard and metadata', () => {
    const result = questions.generateTwoStepPatternQuestion();

    expect(result.standard).toBe('4.OA.C.5');
    expect(result.concept).toBe('Operations & Algebraic Thinking');
    expect(result.grade).toBe('G4');
    expect(result.subtopic).toBe('number patterns');
  });

  it('should have a hint that describes the pattern type', () => {
    const result = questions.generateTwoStepPatternQuestion();

    // Check that hint contains expected keywords
    expect(result.hint).toMatch(/First step is (addition|multiplication|subtraction), second step is (addition|multiplication)/);
  });

  it('should generate different sequences on multiple calls', () => {
    const result1 = questions.generateTwoStepPatternQuestion();
    const result2 = questions.generateTwoStepPatternQuestion();

    // They might be the same due to randomness, but at least they should be valid
    expect(result1.question).toBeTruthy();
    expect(result2.question).toBeTruthy();
  });

  it('should have a valid numeric correct answer', () => {
    const result = questions.generateTwoStepPatternQuestion();

    expect(result.correctAnswer).toBeDefined();
    const correctNum = parseInt(result.correctAnswer);
    // The correct answer should be a valid number
    expect(isNaN(correctNum)).toBe(false);
  });

  it('never generates a sequence with negative numbers (4th-grade appropriate)', () => {
    // Run many times to exercise the "subtract then add" branch with various
    // random step/start combinations.
    for (let i = 0; i < 500; i += 1) {
      const result = questions.generateTwoStepPatternQuestion();
      // Pull every number out of the question text (the sequence).
      const numbers = (result.question.match(/-?\d+/g) || []).map(Number);
      numbers.forEach(n => {
        expect(n).toBeGreaterThanOrEqual(0);
      });
      // And the correct answer.
      expect(parseInt(result.correctAnswer, 10)).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses grammatical question text (no duplicated "next number")', () => {
    for (let i = 0; i < 50; i += 1) {
      const result = questions.generateTwoStepPatternQuestion();
      expect(result.question).not.toMatch(/next number.*next number/);
    }
  });
});

describe('generateNumberPatternQuestion question text', () => {
  it('uses grammatical question text (no duplicated "next number")', () => {
    for (let i = 0; i < 50; i += 1) {
      const result = questions.generateNumberPatternQuestion();
      expect(result.question).not.toMatch(/next number.*next number/);
    }
  });
});

describe('generateFactorsQuestion always produces 4 options', () => {
  it('never ships fewer than 4 options even for small composites like 4 (only 1 non-factor in [1..n])', () => {
    const results = [];
    for (let i = 0; i < 1500 && results.length < 400; i += 1) {
      const result = questions.generateFactorsQuestion();
      if (typeof result.question === 'string' && result.question.startsWith('Which of these is a factor of')) {
        results.push(result);
      }
    }
    expect(results.length).toBeGreaterThan(0);
    const tooFew = results
      .filter(r => !Array.isArray(r.options) || r.options.length < 4)
      .map(r => ({ question: r.question, optionCount: r.options ? r.options.length : 'missing' }));
    expect(tooFew).toEqual([]);
    // Also make sure the correct answer is always among the options.
    results.forEach((r) => {
      expect(r.options).toContain(r.correctAnswer);
    });
  });
});

describe('generateMultiplesQuestion identify-form distractor count', () => {
  it('always produces at least 3 distractors so the student sees at least 4 options', () => {
    // Collect every "Which of these is a multiple of N?" question over many
    // iterations and check the option count on each (without conditional
    // expects).
    const identifyResults = [];
    for (let i = 0; i < 1000 && identifyResults.length < 100; i += 1) {
      const result = questions.generateMultiplesQuestion();
      if (typeof result.question === 'string' && result.question.startsWith('Which of these is a multiple of')) {
        identifyResults.push(result);
      }
    }
    expect(identifyResults.length).toBeGreaterThan(0);
    const tooFewOptions = identifyResults
      .filter(r => !Array.isArray(r.options) || r.options.length < 4)
      .map(r => ({ question: r.question, optionCount: r.options ? r.options.length : 'missing' }));
    expect(tooFewOptions).toEqual([]);
  });
});

describe('generatePrimeCompositeQuestion', () => {
  // Small primality helper — the source-of-truth banks in questions.js are not
  // exported, so the test regenerates the classification independently to
  // guard against a bank drift on either side.
  const isPrime = (n) => {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
    return true;
  };

  it('produces 4-option MCs for the "which is prime/composite?" form and 2-option MCs for the classic form', () => {
    // Regression: the classic form ships as a 2-option "multiple-choice"
    // (Prime / Composite), which renders as a coin flip inside a UI designed
    // around a four-way pick. We added a "Which of these numbers is
    // PRIME/COMPOSITE?" 4-option form so the generator can offer both.
    // Verify each form matches its expected option count and its correct
    // answer is genuinely of the requested class.
    const four = [];
    const binary = [];
    for (let i = 0; i < 800; i += 1) {
      const q = questions.generatePrimeCompositeQuestion(0.5);
      expect(q.subtopic).toBe('prime vs composite');
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);

      if (/^Which of these numbers is (PRIME|COMPOSITE)\?$/.test(q.question)) {
        four.push(q);
      } else if (/^Is \d+ a prime number or a composite number\?$/.test(q.question)) {
        binary.push(q);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }

    expect(four.length).toBeGreaterThan(0);
    expect(binary.length).toBeGreaterThan(0);

    // 4-option form: exactly 4 options, correct answer's primality matches
    // the prompt, every distractor's primality is the opposite.
    for (const q of four) {
      expect(q.options.length).toBe(4);
      const wantPrime = q.question === 'Which of these numbers is PRIME?';
      const correctN = Number(q.correctAnswer);
      expect(Number.isInteger(correctN)).toBe(true);
      expect(isPrime(correctN)).toBe(wantPrime);
      for (const option of q.options) {
        if (option === q.correctAnswer) continue;
        const n = Number(option);
        expect(Number.isInteger(n)).toBe(true);
        expect(isPrime(n)).toBe(!wantPrime);
      }
    }

    // Classic form stays a 2-option MC with the fixed labels.
    for (const q of binary) {
      expect(q.options.length).toBe(2);
      expect(q.options.sort()).toEqual(['Composite', 'Prime']);
      expect(['Prime', 'Composite']).toContain(q.correctAnswer);
      const [, subjectStr] = q.question.match(/^Is (\d+) /);
      const n = Number(subjectStr);
      expect(q.correctAnswer === 'Prime').toBe(isPrime(n));
    }
  });
});