// Topic-specific tests for Algebra.
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

describe('Algebra correctness', () => {
  test('evaluating expressions: substituted value computes to the stated answer', () => {
    for (const q of draw('evaluating expressions')) {
      const match = q.question.match(
        /^If ([a-z]) = (\d+), what is the value of (.+)\?$/
      );
      expect(match).not.toBeNull();
      const [, letter, valueText, expression] = match;
      const value = Number(valueText);

      // Grammar: "<l> + a" | "a × <l>" | "a × <l> + b" | "a × <l> − b"
      let expected;
      let m;
      if ((m = expression.match(/^([a-z]) \+ (\d+)$/))) {
        expected = value + Number(m[2]);
      } else if ((m = expression.match(/^(\d+) × ([a-z])$/))) {
        expected = Number(m[1]) * value;
      } else if ((m = expression.match(/^(\d+) × ([a-z]) \+ (\d+)$/))) {
        expected = Number(m[1]) * value + Number(m[3]);
      } else if ((m = expression.match(/^(\d+) × ([a-z]) − (\d+)$/))) {
        expected = Number(m[1]) * value - Number(m[3]);
      } else {
        throw new Error(`unrecognized expression: ${expression}`);
      }
      expect(expression).toContain(letter);
      expect(Number(q.correctAnswer)).toBe(expected);
      expect(expected).toBeGreaterThanOrEqual(0);
    }
  });

  test('one-step equations: the stated solution satisfies the equation', () => {
    for (const q of draw('one-step equations')) {
      const match = q.question.match(/^Solve for ([a-z]): (.+)$/);
      expect(match).not.toBeNull();
      const [, letter, equation] = match;
      const solution = Number(q.correctAnswer);

      const [left, right] = equation.split(' = ');
      const substituted = left.replace(letter, String(solution));
      let m;
      let leftValue;
      if ((m = substituted.match(/^(\d+) \+ (\d+)$/))) {
        leftValue = Number(m[1]) + Number(m[2]);
      } else if ((m = substituted.match(/^(\d+) − (\d+)$/))) {
        leftValue = Number(m[1]) - Number(m[2]);
      } else if ((m = substituted.match(/^(\d+) × (\d+)$/))) {
        leftValue = Number(m[1]) * Number(m[2]);
      } else if ((m = substituted.match(/^(\d+) ÷ (\d+)$/))) {
        leftValue = Number(m[1]) / Number(m[2]);
      } else {
        throw new Error(`unrecognized equation side: ${substituted}`);
      }
      expect(leftValue).toBe(Number(right));
      expect(solution).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(solution)).toBe(true);
    }
  });

  test('input output tables: rule applied to input/output is consistent', () => {
    for (const q of draw('input output tables')) {
      const rule = q.question.match(
        /rule: multiply by (\d+)(?:, then add (\d+))?\./
      );
      expect(rule).not.toBeNull();
      const a = Number(rule[1]);
      const b = Number(rule[2] || 0);

      const forward = q.question.match(/input is (\d+), what is the output\?$/);
      const backward = q.question.match(/output is (\d+), what was the input\?$/);
      if (forward) {
        expect(Number(q.correctAnswer)).toBe(a * Number(forward[1]) + b);
      } else if (backward) {
        expect(a * Number(q.correctAnswer) + b).toBe(Number(backward[1]));
      } else {
        throw new Error(`unrecognized machine question: ${q.question}`);
      }
    }
  });

  test('growing patterns: sequences are arithmetic and answers fit the rule', () => {
    for (const q of draw('growing patterns')) {
      if (q.question.startsWith('What number comes next')) {
        const terms = q.question.match(/\d+/g).map(Number);
        const step = terms[1] - terms[0];
        terms.slice(1).forEach((t, i) => expect(t - terms[i]).toBe(step));
        expect(Number(q.correctAnswer)).toBe(terms[terms.length - 1] + step);
      } else if (q.question.startsWith('What number is missing')) {
        const terms = q.question.match(/\d+/g).map(Number); // t0, t1, t3, t4
        const step = terms[1] - terms[0];
        expect(Number(q.correctAnswer)).toBe(terms[1] + step);
        expect(terms[2]).toBe(terms[1] + 2 * step);
      } else if (q.question.startsWith('What is the rule')) {
        const terms = q.question.match(/\d+/g).map(Number);
        const step = terms[1] - terms[0];
        expect(q.correctAnswer).toBe(`add ${step} each time`);
      } else {
        throw new Error(`unrecognized pattern question: ${q.question}`);
      }
    }
  });

  test('variables: story equations are internally consistent', () => {
    for (const q of draw('variables')) {
      if (!q.question.includes('Which equation matches the story')) continue;
      const [, more, total] = q.question.match(/getting (\d+) more.*has (\d+) /);
      expect(q.correctAnswer).toMatch(
        new RegExp(`^[a-z] \\+ ${more} = ${total}$`)
      );
    }
  });

  test('variables: "which part is the variable?" only offers tokens that appear in the expression', () => {
    // Regression: the old distractors included a second number `b` and an
    // operator picked at random from `+ × −`, even when neither appeared in
    // the shown expression. A "part of the expression" question that offers
    // parts NOT in the expression is confusing at best.
    let asked = 0;
    for (const q of draw('variables', 200)) {
      const match = q.question.match(/^Which part of the expression (.+) is the variable\?$/);
      if (!match) continue;
      asked += 1;
      const expression = match[1];
      const expressionTokens = new Set(
        expression.split(/\s+/).filter((t) => t.length > 0)
      );
      expect(expressionTokens.has(q.correctAnswer)).toBe(true);
      for (const opt of q.options) {
        expect(expressionTokens.has(opt)).toBe(true);
      }
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBe(4);
    }
    expect(asked).toBeGreaterThan(0);
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'variables',
      'evaluating expressions',
      'one-step equations',
      'input output tables',
      'growing patterns',
    ]) {
      const questions = draw(subtopic, 20);
      questions.forEach((q) => expect(q.subtopic).toBe(subtopic));
    }
  });
});
