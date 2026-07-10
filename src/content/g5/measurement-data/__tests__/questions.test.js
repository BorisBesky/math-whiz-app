// Topic-specific tests for Measurement & Data 5th.
// The shared generator contract (shape, subtopic membership, MC answerability,
// allowedSubtopics, variety) already runs via
// src/content/__tests__/topicContracts.test.js — these tests decode the
// deterministic question formats and verify the MATH is right.
import { generateQuestion } from '../questions';

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

// factor to go from the FIRST-named unit to the SECOND (multiply), keyed "from>to"
const FACTORS = {
  'feet>inches': 12,
  'yards>feet': 3,
  'pounds>ounces': 16,
  'gallons>quarts': 4,
  'quarts>pints': 2,
  'pints>cups': 2,
  'hours>minutes': 60,
  'minutes>seconds': 60,
  'meters>centimeters': 100,
  'kilometers>meters': 1000,
  'centimeters>millimeters': 10,
  'kilograms>grams': 1000,
  'liters>milliliters': 1000,
};

const toNumber = (text) => {
  const [whole, frac = ''] = text.split('.');
  return Number(whole) + (frac ? Number(frac) / 10 ** frac.length : 0);
};

describe('Measurement & Data 5th correctness', () => {
  test('unit conversions: conversions are exact in both directions', () => {
    for (const q of draw('unit conversions')) {
      const m = q.question.match(/^Convert ([\d.]+) (\w+(?: \w+)?) to (\w+(?: \w+)?)\.$/);
      expect(m).not.toBeNull();
      const amount = toNumber(m[1]);
      const answer = toNumber(String(q.correctAnswer));
      const bigToSmall = FACTORS[`${m[2]}>${m[3]}`];
      const smallToBig = FACTORS[`${m[3]}>${m[2]}`];
      if (bigToSmall) {
        expect(answer).toBeCloseTo(amount * bigToSmall, 6);
      } else if (smallToBig) {
        expect(answer).toBeCloseTo(amount / smallToBig, 6);
      } else {
        throw new Error(`unknown unit pair: ${m[2]} -> ${m[3]}`);
      }
    }
  });

  test('line plots: counts, mode, and totals come from the data sentence', () => {
    for (const q of draw('line plots')) {
      const m = q.question.match(
        /^A line plot shows the lengths of some ribbons: (\d+) ribbons of 1\/4 foot, (\d+) ribbons of 1\/2 foot, and (\d+) ribbons of 3\/4 foot\. (.+)$/
      );
      expect(m).not.toBeNull();
      const c1 = Number(m[1]);
      const c2 = Number(m[2]);
      const c3 = Number(m[3]);
      const ask = m[4];

      if (ask === 'How many ribbons are on the line plot?') {
        expect(Number(q.correctAnswer)).toBe(c1 + c2 + c3);
      } else if (ask === 'Which length appears most often?') {
        const winner = [
          ['1/4 foot', c1],
          ['1/2 foot', c2],
          ['3/4 foot', c3],
        ].sort((x, y) => y[1] - x[1])[0][0];
        expect(new Set([c1, c2, c3]).size).toBe(3); // counts are distinct
        expect(q.correctAnswer).toBe(winner);
      } else if (ask === 'What is the total length in feet of the 1/2-foot ribbons?') {
        const expected = c2 % 2 === 0 ? String(c2 / 2) : c2 === 1 ? '1/2' : `${(c2 - 1) / 2} 1/2`;
        expect(q.correctAnswer).toBe(expected);
      } else {
        throw new Error(`unrecognized ask: ${ask}`);
      }
    }
  });

  test('volume concepts: cube counts multiply out; units are cubic', () => {
    for (const q of draw('volume concepts')) {
      let m;
      if (
        (m = q.question.match(
          /^A rectangular prism is built from unit cubes\. It is (\d+) cubes long, (\d+) cubes wide, and (\d+) layers tall\. How many unit cubes does it use\?$/
        ))
      ) {
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) * Number(m[2]) * Number(m[3]));
      } else if (q.question.match(/^Which unit is best for measuring the volume of .+\?$/)) {
        expect(q.correctAnswer).toMatch(/^cubic /);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('volume of rectangular prisms: V = l×w×h and height recovery', () => {
    for (const q of draw('volume of rectangular prisms')) {
      let m;
      if (
        (m = q.question.match(
          /^A rectangular prism is (\d+) (\w+) long, (\d+) \w+ wide, and (\d+) \w+ tall\. What is its volume in cubic \w+\?$/
        ))
      ) {
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) * Number(m[3]) * Number(m[4]));
      } else if (
        (m = q.question.match(
          /^A box has a volume of (\d+) cubic \w+\. Its base area is (\d+) square \w+\. How tall is the box in \w+\?$/
        ))
      ) {
        expect(Number(m[1]) % Number(m[2])).toBe(0);
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) / Number(m[2]));
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('additive volume: total is the sum of the two prisms', () => {
    for (const q of draw('additive volume')) {
      const m = q.question.match(
        /^A figure is made of two rectangular prisms\. One is (\d+) × (\d+) × (\d+) units and the other is (\d+) × (\d+) × (\d+) units\. What is the total volume of the figure in cubic units\?$/
      );
      expect(m).not.toBeNull();
      const [, a, b, c, d, e, f] = m.map(Number);
      expect(Number(q.correctAnswer)).toBe(a * b * c + d * e * f);
    }
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'unit conversions',
      'line plots',
      'volume concepts',
      'volume of rectangular prisms',
      'additive volume',
    ]) {
      const questions = draw(subtopic, 20);
      questions.forEach((q) => expect(q.subtopic).toBe(subtopic));
    }
  });
});
