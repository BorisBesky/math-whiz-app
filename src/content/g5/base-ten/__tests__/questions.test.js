// Topic-specific tests for Base Ten 5th.
// The shared generator contract (shape, subtopic membership, MC answerability,
// allowedSubtopics, variety) already runs via
// src/content/__tests__/topicContracts.test.js — these tests decode the
// deterministic question formats and verify the MATH is right.
// jest/no-conditional-expect is disabled for this file. These tests decode a
// question's deterministic text format to pick which assertions apply, and
// every decoder chain ends in `else { throw new Error(...) }`. A question that
// matches no branch therefore fails loudly instead of silently skipping its
// assertions, so the vacuous-pass hole the rule guards against cannot happen
// here. Keep the terminating throw on any new branch you add.
/* eslint-disable jest/no-conditional-expect */

import { generateQuestion } from '../questions';
import { QUESTION_TYPES } from '../../../../constants/topics.js';

const DIFFICULTIES = [0, 0.25, 0.5, 0.75, 1];

const draw = (subtopic, count = 60) => {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const question = generateQuestion(DIFFICULTIES[i % DIFFICULTIES.length], [subtopic]);
    if (question) questions.push(question);
  }
  expect(questions.length).toBeGreaterThan(0);
  return questions;
};

// Parse a decimal string into integer thousandths (exact).
const toThousandths = (text) => {
  const [whole, frac = ''] = text.split('.');
  expect(frac.length).toBeLessThanOrEqual(3);
  return Number(whole) * 1000 + Number((frac + '000').slice(0, 3));
};

const PLACE_INDEX = { hundreds: 0, tens: 1, ones: 2, tenths: 3, hundredths: 4, thousandths: 5 };

describe('Base Ten 5th correctness', () => {
  test('decimal place value: digit/place/ratio facts hold', () => {
    for (const q of draw('decimal place value')) {
      let m;
      if ((m = q.question.match(/^In the number (\d{3})\.(\d{3}), which place is the digit (\d) in\?$/))) {
        const digits = (m[1] + m[2]).split('');
        expect(digits.indexOf(m[3])).toBe(PLACE_INDEX[q.correctAnswer]);
        expect(digits.lastIndexOf(m[3])).toBe(digits.indexOf(m[3])); // digit is unique
      } else if ((m = q.question.match(/^In the number (\d{3})\.(\d{3}), what digit is in the (\w+) place\?$/))) {
        const digits = (m[1] + m[2]).split('');
        expect(q.correctAnswer).toBe(digits[PLACE_INDEX[m[3]]]);
        expect(q.questionType).toBe(QUESTION_TYPES.NUMERIC);
      } else if ((m = q.question.match(/^([\d.]+) is how many times as large as ([\d.]+)\?$/))) {
        const a = toThousandths(m[1]);
        const b = toThousandths(m[2]);
        expect(a).toBe(b * Number(q.correctAnswer));
        expect([10, 100, 1000]).toContain(Number(q.correctAnswer));
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('powers of ten: decimal point shifts correctly', () => {
    for (const q of draw('powers of ten')) {
      const m = q.question.match(/^What is ([\d.]+) ([×÷]) (10|100|1000)\?$/);
      expect(m).not.toBeNull();
      const x = toThousandths(m[1]);
      const power = Number(m[3]);
      const result = toThousandths(q.correctAnswer);
      // Compare as integers in both directions so division stays exact.
      const [actual, expected] = m[2] === '×' ? [result, x * power] : [result * power, x];
      expect(actual).toBe(expected);
    }
  });

  test('comparing decimals: the symbol matches the numeric order', () => {
    for (const q of draw('comparing decimals')) {
      const m = q.question.match(/^Which symbol makes this true\? ([\d.]+) __ ([\d.]+)$/);
      expect(m).not.toBeNull();
      const a = toThousandths(m[1]);
      const b = toThousandths(m[2]);
      const expected = a > b ? '>' : a < b ? '<' : '=';
      expect(q.correctAnswer).toBe(expected);
    }
  });

  test('rounding decimals: answer is round-half-up to the target place', () => {
    const divisors = { 'whole number': 1000, tenth: 100, hundredth: 10 };
    for (const q of draw('rounding decimals')) {
      const m = q.question.match(/^Round ([\d.]+) to the nearest (whole number|tenth|hundredth)\.$/);
      expect(m).not.toBeNull();
      const x = toThousandths(m[1]);
      const divisor = divisors[m[2]];
      expect(toThousandths(q.correctAnswer)).toBe(Math.round(x / divisor) * divisor);
    }
  });

  test('multi-digit multiplication: product is exact', () => {
    for (const q of draw('multi-digit multiplication')) {
      const m = q.question.match(/^What is (\d+) × (\d+)\?$/);
      expect(m).not.toBeNull();
      expect(Number(q.correctAnswer)).toBe(Number(m[1]) * Number(m[2]));
    }
  });

  test('division with two-digit divisors: quotient/remainder are exact', () => {
    for (const q of draw('division with two-digit divisors')) {
      let m;
      if ((m = q.question.match(/^What is (\d+) ÷ (\d+)\?$/))) {
        expect(Number(m[1]) % Number(m[2])).toBe(0);
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) / Number(m[2]));
      } else if ((m = q.question.match(/^What is the remainder when (\d+) is divided by (\d+)\?$/))) {
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) % Number(m[2]));
        expect(Number(q.correctAnswer)).toBeGreaterThan(0);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
      const divisor = Number(q.question.match(/(\d+)\?$/)[1]);
      expect(divisor).toBeGreaterThanOrEqual(11);
      expect(divisor).toBeLessThanOrEqual(99);
    }
  });

  test('decimal operations: results are exact in hundredths', () => {
    for (const q of draw('decimal operations')) {
      const m = q.question.match(/^What is ([\d.]+) ([+−×÷]) ([\d.]+)\?$/);
      expect(m).not.toBeNull();
      const a = toThousandths(m[1]);
      const b = toThousandths(m[3]);
      const result = toThousandths(q.correctAnswer);
      // Each operator gets an exact integer identity; look it up rather than
      // branching, so every question is checked by an unconditional assertion.
      const EXACT = {
        '+': () => [result, a + b],
        '−': () => [result, a - b],
        '×': () => [result * 1000, a * b],
        '÷': () => [result * b, a * 1000],
      };
      expect(Object.keys(EXACT)).toContain(m[2]);
      const [actual, expected] = EXACT[m[2]]();
      expect(actual).toBe(expected);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });

  test('decimal operations × and ÷ always show at least one decimal operand', () => {
    // Regression: generateDecimalOperationsQuestion used
    // randomInt(11, 99) * 10, which sometimes produced multiples of 100
    // (e.g., 200, 500) that fromHundredths renders as bare integers,
    // yielding items like "What is 5 × 3?" — pure integer arithmetic tagged
    // as a decimal-operations question. Verify both operands, the answer,
    // and cover a large sample to catch the ~10% bug branch.
    const problems = [];
    for (let i = 0; i < 400; i++) {
      const q = generateQuestion(0.8, ['decimal operations']);
      if (!q) continue;
      const m = q.question.match(/^What is ([\d.]+) ([+−×÷]) ([\d.]+)\?$/);
      expect(m).not.toBeNull();
      const [, aText, op, bText] = m;
      if (op !== '×' && op !== '÷') continue;
      const hasDecimal = aText.includes('.') || bText.includes('.') || q.correctAnswer.includes('.');
      if (!hasDecimal) {
        problems.push(`"What is ${aText} ${op} ${bText}?" → ${q.correctAnswer}`);
      }
    }
    expect(problems).toEqual([]);
  });

  // --- expanded form & number names (5.NBT.A.3.a) --------------------
  // Independent decoders: words are parsed back into a number and expanded
  // forms are summed in exact thousandths, so the generator's own helpers
  // are never trusted.
  const ONES_VALUES = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  };
  const TENS_VALUES = {
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  const PLACE_DIGITS = { tenth: 1, tenths: 1, hundredth: 2, hundredths: 2, thousandth: 3, thousandths: 3 };

  const wordsToNumber = (text) => {
    let total = 0;
    for (const chunk of text.split(' ')) {
      if (chunk === 'hundred') {
        total *= 100;
      } else if (chunk.includes('-')) {
        const [tens, ones] = chunk.split('-');
        total += TENS_VALUES[tens] + ONES_VALUES[ones];
      } else if (chunk in TENS_VALUES) {
        total += TENS_VALUES[chunk];
      } else if (chunk in ONES_VALUES) {
        total += ONES_VALUES[chunk];
      } else {
        throw new Error(`unrecognized number word: ${chunk} (in "${text}")`);
      }
    }
    return total;
  };

  // "sixty-three and seven hundred eighty-four thousandths" → "63.784"
  const nameToDecimal = (text) => {
    const [first, second] = text.split(' and ');
    const fractionText = second === undefined ? first : second;
    const words = fractionText.split(' ');
    const places = PLACE_DIGITS[words[words.length - 1]];
    expect(places).toBeDefined();
    const fraction = wordsToNumber(words.slice(0, -1).join(' '));
    const whole = second === undefined ? 0 : wordsToNumber(first);
    return `${whole}.${String(fraction).padStart(places, '0')}`;
  };

  // "9 × 10 + 2 × 1 + 5 × (1/10)" → 92500 thousandths
  const expandedToThousandths = (text) =>
    text.split(' + ').reduce((sum, term) => {
      const m = term.match(/^(\d) × (?:(\d+)|\(1\/(\d+)\))$/);
      expect(m).not.toBeNull();
      const digit = Number(m[1]);
      return sum + (m[2] ? digit * Number(m[2]) * 1000 : (digit * 1000) / Number(m[3]));
    }, 0);

  test('expanded form: numerals, number names and expanded form all agree', () => {
    for (const q of draw('expanded form', 120)) {
      expect(q.questionType).toBe(QUESTION_TYPES.MULTIPLE_CHOICE);
      expect(q.options).toContain(q.correctAnswer);
      let m;
      if ((m = q.question.match(/^Which number is written as (.+)\?$/))) {
        expect(expandedToThousandths(m[1])).toBe(toThousandths(q.correctAnswer));
      } else if ((m = q.question.match(/^Which expanded form shows ([\d.]+)\?$/))) {
        expect(expandedToThousandths(q.correctAnswer)).toBe(toThousandths(m[1]));
      } else if ((m = q.question.match(/^How do you read ([\d.]+)\?$/))) {
        expect(nameToDecimal(q.correctAnswer)).toBe(m[1]);
      } else if ((m = q.question.match(/^Which number is "(.+)"\?$/))) {
        expect(nameToDecimal(m[1])).toBe(q.correctAnswer);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('expanded form: every option is a distinct, plausible answer', () => {
    for (const q of draw('expanded form', 120)) {
      expect(new Set(q.options).size).toBe(q.options.length);
      // No "option 1" filler leaking in from buildOptions.
      q.options.forEach((option) => expect(option).not.toMatch(/^option \d+$/));
      // Decimal options never carry a padded whole part or a trailing zero.
      q.options
        .filter((option) => /^\d+\.\d+$/.test(option))
        .forEach((option) => {
          expect(option).not.toMatch(/^0\d/);
          expect(option).not.toMatch(/0$/);
        });
    }
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'decimal place value',
      'expanded form',
      'powers of ten',
      'comparing decimals',
      'rounding decimals',
      'multi-digit multiplication',
      'division with two-digit divisors',
      'decimal operations',
    ]) {
      const questions = draw(subtopic, 20);
      questions.forEach((q) => expect(q.subtopic).toBe(subtopic));
    }
  });
});
