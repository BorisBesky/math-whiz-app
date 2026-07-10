// Topic-specific tests for Geometry 5th.
// The shared generator contract (shape, subtopic membership, MC answerability,
// allowedSubtopics, variety) already runs via
// src/content/__tests__/topicContracts.test.js — these tests decode the
// deterministic question formats and verify the answers against the same
// definition/hierarchy banks the generator exports.
import {
  generateQuestion,
  SHAPE_DEFINITIONS,
  HIERARCHY_STATEMENTS,
  INHERITANCE_FACTS,
} from '../questions';

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

describe('Geometry 5th correctness', () => {
  test('coordinate plane: ordered pairs and axis distances are right', () => {
    for (const q of draw('coordinate plane')) {
      let m;
      if (
        (m = q.question.match(
          /^Start at the origin\. Move (\d+) units right, then (\d+) units up\. Which ordered pair names this point\?$/
        ))
      ) {
        expect(q.correctAnswer).toBe(`(${m[1]}, ${m[2]})`);
        expect(m[1]).not.toBe(m[2]); // (x, y) and (y, x) options stay distinct
      } else if (
        (m = q.question.match(/^Point P is at \((\d+), (\d+)\)\. How many units is P from the ([xy])-axis\?$/))
      ) {
        // Distance from the y-axis is x; from the x-axis is y.
        expect(q.correctAnswer).toBe(m[3] === 'y' ? m[1] : m[2]);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('distances on a grid: shared-coordinate distances and axis points', () => {
    for (const q of draw('distances on a grid')) {
      let m;
      if (
        (m = q.question.match(
          /^On a city map, the [\w ]+ is at \((\d+), (\d+)\) and the [\w ]+ is at \((\d+), (\d+)\)\. How many blocks apart are they\?$/
        ))
      ) {
        const [x1, y1, x2, y2] = [m[1], m[2], m[3], m[4]].map(Number);
        expect(x1 === x2 || y1 === y2).toBe(true); // one street apart
        const expected = x1 === x2 ? Math.abs(y2 - y1) : Math.abs(x2 - x1);
        expect(Number(q.correctAnswer)).toBe(expected);
        expect(expected).toBeGreaterThan(0);
      } else if ((m = q.question.match(/^Which of these points lies on the ([xy])-axis\?$/))) {
        const pair = q.correctAnswer.match(/^\((\d+), (\d+)\)$/);
        expect(pair).not.toBeNull();
        if (m[1] === 'x') expect(pair[2]).toBe('0');
        else expect(pair[1]).toBe('0');
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('classifying shapes: names match the exported definition bank', () => {
    const byDescription = new Map(
      SHAPE_DEFINITIONS.map((entry) => [entry.description, entry.name])
    );
    for (const q of draw('classifying shapes')) {
      const m = q.question.match(/^Which shape is (.+)\?$/);
      expect(m).not.toBeNull();
      expect(byDescription.has(m[1])).toBe(true);
      expect(q.correctAnswer).toBe(byDescription.get(m[1]));
    }
  });

  test('shape hierarchy: truths match the bank; properties inherit', () => {
    const byStatement = new Map(
      HIERARCHY_STATEMENTS.map((entry) => [entry.statement, entry.truth])
    );
    for (const q of draw('shape hierarchy')) {
      let m;
      if ((m = q.question.match(/^True or false: (.+)$/))) {
        expect(byStatement.has(m[1])).toBe(true);
        expect(q.correctAnswer).toBe(byStatement.get(m[1]) ? 'True' : 'False');
      } else if (
        (m = q.question.match(
          /^All ([\w ]+) have ([\w ]+)\. Every ([\w ]+) is one of the [\w ]+\. What must be true about every [\w ]+\?$/
        ))
      ) {
        const fact = INHERITANCE_FACTS.find((f) => f.parent === m[1]);
        expect(fact).toBeDefined();
        expect(fact.property).toBe(m[2]);
        expect(fact.children).toContain(m[3]);
        expect(q.correctAnswer).toBe(`It has ${fact.property}.`);
      } else {
        throw new Error(`unrecognized question: ${q.question}`);
      }
    }
  });

  test('hierarchy statement bank is itself consistent', () => {
    // Spot-check the mathematical truth of the bank so a typo can't teach
    // the wrong fact: inclusive definitions per CCSS 5.G.B.3.
    const truths = Object.fromEntries(
      HIERARCHY_STATEMENTS.map(({ statement, truth }) => [statement, truth])
    );
    expect(truths['Every square is a rectangle.']).toBe(true);
    expect(truths['Every rectangle is a square.']).toBe(false);
    expect(truths['Every rhombus is a parallelogram.']).toBe(true);
    expect(truths['Every trapezoid is a parallelogram.']).toBe(false);
  });

  test('every subtopic can be exclusively restricted', () => {
    for (const subtopic of [
      'coordinate plane',
      'distances on a grid',
      'classifying shapes',
      'shape hierarchy',
    ]) {
      const questions = draw(subtopic, 20);
      questions.forEach((q) => expect(q.subtopic).toBe(subtopic));
    }
  });
});
