import {
  generateRoundingQuestion,
  generateAdditionWordProblemQuestion,
  generateMultiDigitArithmeticQuestion,
  generatePlaceValueQuestion,
} from '../questions.js';

describe('G4 base-ten: rounding never shows negative multiple-choice options', () => {
  it('does not emit negative-number distractors at any difficulty', () => {
    // At high difficulty the number could still be relatively small (e.g.
    // 11,234) while the selected place could be "millions" (divisor
    // 1,000,000). The old code would emit `rounded - divisor` = -1,000,000
    // as a distractor. Run many iterations across the difficulty band.
    const difficulties = [0.0, 0.3, 0.5, 0.8, 1.0];
    for (const d of difficulties) {
      for (let i = 0; i < 300; i += 1) {
        const q = generateRoundingQuestion(d);
        for (const opt of q.options) {
          const value = parseInt(opt, 10);
          expect(value).toBeGreaterThan(0);
        }
      }
    }
  });

  it('correct answer is always in options and options are distinct', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateRoundingQuestion(1.0);
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe('G4 base-ten: addition word problem — library scenario mentions the correct item types', () => {
  it('the "how many altogether" closing sentence uses the item types that appear in the setup', () => {
    // The old scenario hardcoded "How many books and magazines do they have
    // altogether?" even when the collection types were e.g. ["novels",
    // "textbooks"] — nonsense because there are no magazines in the setup.
    const libraryQuestions = [];
    for (let i = 0; i < 500; i += 1) {
      const q = generateAdditionWordProblemQuestion(0.5);
      const setupMatch = q.question.match(/Library has [\d,]+ ([\w' ]+?) and [\d,]+ ([\w' ]+?)\./);
      if (setupMatch) {
        libraryQuestions.push({ question: q.question, type1: setupMatch[1], type2: setupMatch[2] });
      }
    }
    expect(libraryQuestions.length).toBeGreaterThan(0);
    // Any library question whose setup does NOT use magazines must not fall
    // back to the old "books and magazines" closing sentence.
    const nonMagazine = libraryQuestions.filter(
      ({ type1, type2 }) => type1 !== 'fiction books' || type2 !== 'magazines'
    );
    const mismatchedClosings = nonMagazine.filter(({ question }) =>
      /How many books and magazines do they have altogether\?/.test(question)
    );
    expect(mismatchedClosings).toEqual([]);
    // The closing sentence should mention the actual types for every library
    // question.
    const closingMismatches = libraryQuestions.filter(({ question, type1, type2 }) => {
      const closeRegex = new RegExp(`How many ${type1} and ${type2} do they have altogether\\?`);
      return !closeRegex.test(question);
    });
    expect(closingMismatches).toEqual([]);
  });
});

describe('G4 base-ten: place-value question renders large numbers with commas', () => {
  // Regression: `generatePlaceValueQuestion` interpolated `${number}` raw, so
  // a 7-digit number rendered as "1234567" — every other generator in this
  // file uses `addCommas()` for readability. A 3rd/4th grader shouldn't have
  // to count digits by hand to answer a place-value question.
  it('any 4+ digit number in the question text uses comma separators', () => {
    const difficulties = [0.3, 0.5, 0.7, 1.0];
    // Collect violations instead of asserting inside the loop, so the test
    // cannot quietly pass by never drawing a 4-digit number.
    const badlyGrouped = [];
    let longNumbersSeen = 0;
    for (const d of difficulties) {
      for (let i = 0; i < 100; i += 1) {
        const q = generatePlaceValueQuestion(d);
        const numMatch = q.question.match(/In the number ([\d,]+),/);
        expect(numMatch).not.toBeNull();
        const numStr = numMatch[1];
        const digitCount = numStr.replace(/,/g, '').length;
        if (digitCount < 4) continue;
        longNumbersSeen += 1;
        // Commas must be present and grouped in threes from the right.
        if (!/^\d{1,3}(,\d{3})+$/.test(numStr)) badlyGrouped.push(numStr);
      }
    }
    expect(badlyGrouped).toEqual([]);
    expect(longNumbersSeen).toBeGreaterThan(0);
  });
});

describe('G4 base-ten: multi-digit arithmetic never emits non-positive options', () => {
  // Regression: `generateMultiDigitArithmeticQuestion` built distractors as
  // `answer + 100`, `answer - 100`, ... without a positivity filter, so a
  // subtraction whose result is small (e.g. 1000 − 999 = 1) could ship "-99"
  // as one of the choices. Every option must be a positive number.
  it('every option parses as a positive integer', () => {
    const difficulties = [0.4, 0.5, 0.7, 1.0];
    for (const d of difficulties) {
      for (let i = 0; i < 400; i += 1) {
        // Force a small-difference subtraction path by letting the generator
        // run its own subtractions randomly.
        const q = generateMultiDigitArithmeticQuestion(d, 'subtraction');
        for (const opt of q.options) {
          const value = Number(opt);
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThan(0);
        }
        expect(q.options).toContain(q.correctAnswer);
      }
    }
  });
});
