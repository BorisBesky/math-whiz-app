// Topic-specific tests for Base Ten 5th.
// The shared generator contract (shape, subtopic membership, MC answerability,
// allowedSubtopics, variety) already runs via
// src/content/__tests__/topicContracts.test.js — these tests decode the
// deterministic question formats and verify the MATH is right.
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
      if (m[2] === '×') {
        expect(result).toBe(x * power);
      } else {
        expect(result * power).toBe(x);
      }
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
      if (m[2] === '+') expect(result).toBe(a + b);
      else if (m[2] === '−') expect(result).toBe(a - b);
      else if (m[2] === '×') expect(result * 1000).toBe(a * b);
      else expect(result * b).toBe(a * 1000);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'decimal place value',
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
