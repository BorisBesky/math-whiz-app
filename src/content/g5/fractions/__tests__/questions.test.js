// Topic-specific tests for Fractions 5th.
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

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

// Parse "3 5/6" | "23/12" | "4" into { n, d } as an improper fraction.
const parseFraction = (text) => {
  let m;
  if ((m = text.match(/^(\d+) (\d+)\/(\d+)$/))) {
    return { n: Number(m[1]) * Number(m[3]) + Number(m[2]), d: Number(m[3]) };
  }
  if ((m = text.match(/^(\d+)\/(\d+)$/))) {
    return { n: Number(m[1]), d: Number(m[2]) };
  }
  if ((m = text.match(/^(\d+)$/))) {
    return { n: Number(m[1]), d: 1 };
  }
  throw new Error(`unparseable fraction: ${text}`);
};

describe('Fractions 5th correctness', () => {
  test('add and subtract unlike denominators: exact and simplified', () => {
    for (const q of draw('add and subtract unlike denominators')) {
      const m = q.question.match(/^What is (\d+)\/(\d+) ([+−]) (\d+)\/(\d+)\?$/);
      expect(m).not.toBeNull();
      const [, n1, d1, op, n2, d2] = m;
      expect(Number(d1)).not.toBe(Number(d2)); // unlike denominators
      const answer = parseFraction(q.correctAnswer);
      const expectedN =
        op === '+'
          ? Number(n1) * Number(d2) + Number(n2) * Number(d1)
          : Number(n1) * Number(d2) - Number(n2) * Number(d1);
      const expectedD = Number(d1) * Number(d2);
      // Cross-multiply to compare without requiring a particular form
      expect(answer.n * expectedD).toBe(expectedN * answer.d);
      expect(gcd(answer.n, answer.d)).toBe(1); // simplified
      expect(expectedN).toBeGreaterThan(0);
    }
  });

  test('mixed numbers: sums/differences are exact and in mixed form', () => {
    for (const q of draw('mixed numbers')) {
      const m = q.question.match(/^What is (\d+) (\d+)\/(\d+) ([+−]) (\d+) (\d+)\/(\d+)\?$/);
      expect(m).not.toBeNull();
      const [, w1, n1, d1, op, w2, n2, d2] = m.map((x) => x);
      const total1 = { n: Number(w1) * Number(d1) + Number(n1), d: Number(d1) };
      const total2 = { n: Number(w2) * Number(d2) + Number(n2), d: Number(d2) };
      const expectedN =
        op === '+'
          ? total1.n * total2.d + total2.n * total1.d
          : total1.n * total2.d - total2.n * total1.d;
      const expectedD = total1.d * total2.d;
      const answer = parseFraction(q.correctAnswer);
      expect(answer.n * expectedD).toBe(expectedN * answer.d);
      expect(expectedN).toBeGreaterThan(0);
      // Mixed form never hides an improper fraction part
      const mixedPart = q.correctAnswer.match(/^(\d+) (\d+)\/(\d+)$/);
      if (mixedPart) expect(Number(mixedPart[2])).toBeLessThan(Number(mixedPart[3]));
    }
  });

  test('fraction as division: all three variants are exact', () => {
    for (const q of draw('fraction as division')) {
      let m;
      if ((m = q.question.match(/^Which fraction equals (\d+) ÷ (\d+)\?$/))) {
        expect(q.correctAnswer).toBe(`${m[1]}/${m[2]}`);
      } else if ((m = q.question.match(/^(\d+) friends share (\d+) .+ equally\. How much does each friend get\?$/))) {
        expect(q.correctAnswer).toBe(`${m[2]}/${m[1]}`);
      } else if ((m = q.question.match(/^Between which two whole numbers is (\d+) ÷ (\d+)\?$/))) {
        const quotient = Math.floor(Number(m[1]) / Number(m[2]));
        expect(Number(m[1]) % Number(m[2])).toBeGreaterThan(0);
        expect(q.correctAnswer).toBe(`${quotient} and ${quotient + 1}`);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('multiplying fractions: products are exact and simplified', () => {
    for (const q of draw('multiplying fractions')) {
      let m;
      if ((m = q.question.match(/^What is (\d+)\/(\d+) of (\d+)\?$/))) {
        const [, a, b, N] = m.map(Number);
        expect(N % b).toBe(0);
        expect(Number(q.correctAnswer)).toBe((N / b) * a);
      } else if (
        (m = q.question.match(/^What is (\d+)\/(\d+) × (\d+)\/(\d+)\?$/)) ||
        (m = q.question.match(/^A rectangle is (\d+)\/(\d+) meter long and (\d+)\/(\d+) meter wide\. What is its area in square meters\?$/))
      ) {
        const [, a, b, c, d] = m.map(Number);
        const answer = parseFraction(q.correctAnswer);
        expect(answer.n * b * d).toBe(a * c * answer.d);
        expect(gcd(answer.n, answer.d)).toBe(1);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('multiplication as scaling: comparison matches the fraction vs 1', () => {
    for (const q of draw('multiplication as scaling')) {
      const m = q.question.match(/^Without multiplying, how does (\d+)\/(\d+) × (\d+) compare to (\d+)\?$/);
      expect(m).not.toBeNull();
      const [, a, b, N1, N2] = m.map(Number);
      expect(N1).toBe(N2);
      const expected = a < b ? `less than ${N1}` : a > b ? `greater than ${N1}` : `equal to ${N1}`;
      expect(q.correctAnswer).toBe(expected);
    }
  });

  test('dividing unit fractions: quotients are exact', () => {
    for (const q of draw('dividing unit fractions')) {
      let m;
      if ((m = q.question.match(/^What is 1\/(\d+) ÷ (\d+)\?$/))) {
        expect(q.correctAnswer).toBe(`1/${Number(m[1]) * Number(m[2])}`);
      } else if ((m = q.question.match(/^What is (\d+) ÷ 1\/(\d+)\?$/))) {
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) * Number(m[2]));
      } else if ((m = q.question.match(/^How many 1\/(\d+)-cup servings are in (\d+) cups of .+\?$/))) {
        expect(Number(q.correctAnswer)).toBe(Number(m[1]) * Number(m[2]));
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('fraction as division: sharing-story item names agree with the count', () => {
    // Regression: the story variant of "fraction as division" always used the
    // plural item name ("2 friends share 1 pizzas equally.") — grammatical
    // noise that undermines a language-heavy word problem. Ensure "1 X" uses
    // a singular X across every rendered story.
    for (const q of draw('fraction as division', 200)) {
      const m = q.question.match(
        /^(\d+) friends share (\d+) (.+) equally\. How much does each friend get\?$/
      );
      if (!m) continue; // other variants of the subtopic
      const count = Number(m[2]);
      const items = m[3];
      if (count === 1) {
        // Singular forms only. "pans of brownies" plural must become "pan of
        // brownies"; "watermelons" -> "watermelon", etc.
        expect(items).not.toMatch(/^pizzas$/);
        expect(items).not.toMatch(/^sandwiches$/);
        expect(items).not.toMatch(/^watermelons$/);
        expect(items).not.toMatch(/^pans of brownies$/);
      } else {
        // count >= 2 uses plural forms only.
        expect(items).not.toMatch(/^pizza$/);
        expect(items).not.toMatch(/^sandwich$/);
        expect(items).not.toMatch(/^watermelon$/);
        expect(items).not.toMatch(/^pan of brownies$/);
      }
    }
  });

  // --- benchmark estimation (5.NF.A.2) -------------------------------
  // Verified with exact integer arithmetic (cross-multiplication), never the
  // floating-point value the generator reasons about.
  const BENCHMARK_THIRDS = { '0': [0, 1], '1/2': [1, 2], '1': [1, 1], '1 1/2': [3, 2], '2': [2, 1] };

  // |a/b - c/d| as an exact fraction, returned as a comparable [num, den].
  const distanceTo = (numerator, denominator, [bn, bd]) => [
    Math.abs(numerator * bd - bn * denominator),
    denominator * bd,
  ];
  const lessThan = ([n1, d1], [n2, d2]) => n1 * d2 < n2 * d1;

  const closestBenchmark = (numerator, denominator, labels) => {
    const ranked = labels
      .map((label) => ({ label, distance: distanceTo(numerator, denominator, BENCHMARK_THIRDS[label]) }))
      .sort((a, b) => (lessThan(a.distance, b.distance) ? -1 : 1));
    return ranked[0].label;
  };

  test('benchmark estimation: the named benchmark really is the closest', () => {
    for (const q of draw('benchmark estimation', 150)) {
      expect(q.questionType).toBe(QUESTION_TYPES.MULTIPLE_CHOICE);
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);

      let m;
      if ((m = q.question.match(/^Which benchmark is (\d+)\/(\d+) closest to\?$/))) {
        const [, n, d] = m.map(Number);
        expect(q.correctAnswer).toBe(closestBenchmark(n, d, ['0', '1/2', '1']));
        expect(q.options.slice().sort()).toEqual(['0', '1', '1/2']);
      } else if ((m = q.question.match(/^Estimate (\d+)\/(\d+) \+ (\d+)\/(\d+)\. Which benchmark is the sum closest to\?$/))) {
        const [, n1, d1, n2, d2] = m.map(Number);
        // sum as one exact fraction
        const numerator = n1 * d2 + n2 * d1;
        const denominator = d1 * d2;
        expect(q.correctAnswer).toBe(
          closestBenchmark(numerator, denominator, ['0', '1/2', '1', '1 1/2', '2'])
        );
      } else if ((m = q.question.match(/^Without adding, is (\d+)\/(\d+) \+ (\d+)\/(\d+) greater than 1, less than 1, or equal to 1\?$/))) {
        const [, n1, d1, n2, d2] = m.map(Number);
        const numerator = n1 * d2 + n2 * d1;
        const denominator = d1 * d2;
        const expected =
          numerator === denominator ? 'equal to 1' : numerator > denominator ? 'greater than 1' : 'less than 1';
        expect(q.correctAnswer).toBe(expected);
        expect(q.options.slice().sort()).toEqual(['equal to 1', 'greater than 1', 'less than 1']);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('benchmark estimation: no question sits on the fence between benchmarks', () => {
    // A fraction exactly halfway between two benchmarks (like 1/4, or a sum
    // of 3/4) would have two equally right answers. The generator rejects
    // those draws; this locks that in.
    for (const q of draw('benchmark estimation', 150)) {
      let m;
      if ((m = q.question.match(/^Which benchmark is (\d+)\/(\d+) closest to\?$/))) {
        const [, n, d] = m.map(Number);
        expect(Math.abs(n / d - 0.25)).toBeGreaterThan(0.03);
        expect(Math.abs(n / d - 0.75)).toBeGreaterThan(0.03);
      } else if ((m = q.question.match(/^Estimate (\d+)\/(\d+) \+ (\d+)\/(\d+)\./))) {
        const [, n1, d1, n2, d2] = m.map(Number);
        const sum = n1 / d1 + n2 / d2;
        // the fences sit at 0.25, 0.75, 1.25, 1.75 — halfway between benchmarks
        const offset = (((sum - 0.25) % 0.5) + 0.5) % 0.5;
        expect(Math.min(offset, 0.5 - offset)).toBeGreaterThan(0.03);
      }
    }
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'add and subtract unlike denominators',
      'benchmark estimation',
      'mixed numbers',
      'fraction as division',
      'multiplying fractions',
      'multiplication as scaling',
      'dividing unit fractions',
    ]) {
      const questions = draw(subtopic, 20);
      questions.forEach((q) => expect(q.subtopic).toBe(subtopic));
    }
  });
});
