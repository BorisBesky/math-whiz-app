// Topic-specific tests for Operations & Algebraic Thinking 5th.
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

const isPrime = (n) => {
  if (n < 2) return false;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
  return true;
};

describe('Operations & Algebraic Thinking 5th correctness', () => {
  test('order of operations: expression evaluates to the stated answer', () => {
    for (const q of draw('order of operations')) {
      const match = q.question.match(/^What is the value of (.+)\?$/);
      expect(match).not.toBeNull();
      const expression = match[1];

      // Grammar: "a + b × c" | "(a + b) × c" | "a × (b − c) + d" | "[a + (b − c)] × d"
      let expected;
      let m;
      if ((m = expression.match(/^(\d+) \+ (\d+) × (\d+)$/))) {
        expected = Number(m[1]) + Number(m[2]) * Number(m[3]);
      } else if ((m = expression.match(/^\((\d+) \+ (\d+)\) × (\d+)$/))) {
        expected = (Number(m[1]) + Number(m[2])) * Number(m[3]);
      } else if ((m = expression.match(/^(\d+) × \((\d+) − (\d+)\) \+ (\d+)$/))) {
        expected = Number(m[1]) * (Number(m[2]) - Number(m[3])) + Number(m[4]);
      } else if ((m = expression.match(/^\[(\d+) \+ \((\d+) − (\d+)\)\] × (\d+)$/))) {
        expected = (Number(m[1]) + (Number(m[2]) - Number(m[3]))) * Number(m[4]);
      } else {
        throw new Error(`unrecognized expression: ${expression}`);
      }
      expect(Number(q.correctAnswer)).toBe(expected);
      expect(expected).toBeGreaterThanOrEqual(0);
    }
  });

  test('writing expressions: correct option encodes the verbal steps', () => {
    for (const q of draw('writing expressions')) {
      const words = q.question.match(/^Which expression means "(.+)"\?$/)[1];
      const answer = q.correctAnswer;
      let m;
      if ((m = words.match(/^add (\d+) and (\d+), then multiply by (\d+)$/))) {
        expect(answer).toBe(`${m[3]} × (${m[1]} + ${m[2]})`);
      } else if ((m = words.match(/^multiply (\d+) by (\d+), then add (\d+)$/))) {
        expect(answer).toBe(`${m[1]} × ${m[2]} + ${m[3]}`);
      } else if ((m = words.match(/^double the sum of (\d+) and (\d+)$/))) {
        expect(answer).toBe(`2 × (${m[1]} + ${m[2]})`);
      } else if ((m = words.match(/^subtract (\d+) from (\d+), then multiply by (\d+)$/))) {
        expect(answer).toBe(`${m[3]} × (${m[2]} − ${m[1]})`);
        expect(Number(m[2])).toBeGreaterThan(Number(m[1]));
      } else {
        throw new Error(`unrecognized words: ${words}`);
      }
    }
  });

  test('interpreting expressions: the multiplier is the answer', () => {
    for (const q of draw('interpreting expressions')) {
      let m;
      if (
        (m = q.question.match(
          /^Without calculating, (\d+) × \((\d+) \+ (\d+)\) is how many times as large as (\d+) \+ (\d+)\?$/
        ))
      ) {
        expect(q.correctAnswer).toBe(m[1]);
        expect(m[2]).toBe(m[4]);
        expect(m[3]).toBe(m[5]);
      } else if (
        (m = q.question.match(/^Which expression is (\d+) times as large as (\d+) \+ (\d+)\?$/))
      ) {
        expect(q.correctAnswer).toBe(`${m[1]} × (${m[2]} + ${m[3]})`);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('prime factorization: factors are prime and multiply back to n', () => {
    for (const q of draw('prime factorization')) {
      let m;
      if ((m = q.question.match(/^Which of these is the prime factorization of (\d+)\?$/))) {
        const n = Number(m[1]);
        const factors = q.correctAnswer.split(' × ').map(Number);
        factors.forEach((f) => expect(isPrime(f)).toBe(true));
        expect(factors.reduce((x, y) => x * y, 1)).toBe(n);
        expect(n).toBeGreaterThanOrEqual(2);
        expect(n).toBeLessThanOrEqual(50);
      } else if ((m = q.question.match(/^What is the missing prime factor\? (\d+) = (.+) × __$/))) {
        const n = Number(m[1]);
        const known = m[2].split(' × ').map(Number);
        const missing = Number(q.correctAnswer);
        expect(isPrime(missing)).toBe(true);
        known.forEach((f) => expect(isPrime(f)).toBe(true));
        expect(known.reduce((x, y) => x * y, 1) * missing).toBe(n);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('numerical patterns: terms follow the stated rules', () => {
    const ordinals = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4 };
    for (const q of draw('numerical patterns')) {
      let m;
      if (
        (m = q.question.match(
          /^Pattern A starts at 0 and adds (\d+) each time\. Pattern B starts at 0 and adds (\d+) each time\. The (\w+) term of Pattern A is (\d+)\. What is the matching \w+ term of Pattern B\?$/
        ))
      ) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        const index = ordinals[m[3]];
        expect(Number(m[4])).toBe(index * a);
        expect(Number(q.correctAnswer)).toBe(index * b);
      } else if (
        (m = q.question.match(
          /^Pattern A starts at 0 and adds (\d+) each time\. Pattern B starts at 0 and adds (\d+) each time\. Each term of Pattern B is how many times its matching term in Pattern A\?$/
        ))
      ) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        expect(b % a).toBe(0);
        expect(Number(q.correctAnswer)).toBe(b / a);
      } else if (
        (m = q.question.match(
          /^Pattern A is ([\d, ]+)\. Pattern B is ([\d, ]+)\. Which ordered pair matches the (\w+) terms \(A, B\)\?$/
        ))
      ) {
        const termsA = m[1].split(', ').map(Number);
        const termsB = m[2].split(', ').map(Number);
        const index = ordinals[m[3]];
        expect(q.correctAnswer).toBe(`(${termsA[index]}, ${termsB[index]})`);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('prime factorization MC always ships four unique options', () => {
    // The two-prime-composite branch (e.g. n=6) used to collapse to a
    // 3-option MC because its non-prime split ("2 × 3") equaled the correct
    // answer and dropped out after the collision filter.
    for (const q of draw('prime factorization', 200)) {
      if (q.questionType !== 'multiple-choice') continue;
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  test('numerical patterns ordered-pair MC never duplicates the correct option', () => {
    // At index=4 the old distractor `(termsA[4], termsB[Math.min(index+1, 4)])`
    // collapsed onto `(termsA[4], termsB[4])` — the correct answer.
    for (const q of draw('numerical patterns', 300)) {
      if (!/Which ordered pair/.test(q.question)) continue;
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'order of operations',
      'writing expressions',
      'interpreting expressions',
      'prime factorization',
      'numerical patterns',
    ]) {
      const questions = draw(subtopic, 20);
      questions.forEach((q) => expect(q.subtopic).toBe(subtopic));
    }
  });
});
