// Geometry 5th (5.G) question generator.
//
// Contract (enforced by src/content/__tests__/topicContracts.test.js):
// generateQuestion(difficulty [0..1], allowedSubtopics | null) returns a
// question object — or null when the restriction can't be satisfied.
//
// All coordinate questions live in the first quadrant. Each one includes a
// labeled coordinate-grid SVG so students can read the x- and y-values.
//
// Question-text formats are deterministic per family so the topic tests can
// decode a question and independently verify its answer — keep the wording
// in sync with __tests__/questions.test.js if you change it. The shape
// definition/hierarchy banks are mirrored in the test file.
import { QUESTION_TYPES } from '../../../constants/topics.js';
import manifest from './manifest.json';
import { createCoordinateGridImage } from './coordinate-grid';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick = (items) => items[randomInt(0, items.length - 1)];

const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const baseFields = (subtopic, standard) => ({
  concept: manifest.name,
  grade: manifest.grade,
  subtopic,
  standard,
});

const questionImage = (points) => [{
  type: 'question',
  data: createCoordinateGridImage({ points }),
  description: 'Coordinate grid with numbered x- and y-axes',
}];

/* ------------------------------------------------------------------ */
/* coordinate plane — ordered pairs and axes (5.G.A.1)                 */
/* Formats:                                                            */
/*   "Start at the origin. Move <x> units right, then <y> units up.    */
/*    Which ordered pair names this point?"                            */
/*   "Point P is at (<x>, <y>). How many units is P from the           */
/*    <y-axis|x-axis>?"                                                */
/* ------------------------------------------------------------------ */
const generateCoordinatePlaneQuestion = (difficulty) => {
  const maxCoordinate = 6 + Math.round(difficulty * 6);
  const x = randomInt(1, maxCoordinate);
  let y = randomInt(1, maxCoordinate);
  if (y === x) y = y === maxCoordinate ? y - 1 : y + 1; // keep (x, y) vs (y, x) distractors distinct

  if (randomInt(0, 1) === 0) {
    const correct = `(${x}, ${y})`;
    return {
      question: `Start at the origin. Move ${x} units right, then ${y} units up. Which ordered pair names this point?`,
      correctAnswer: correct,
      options: shuffle([correct, `(${y}, ${x})`, `(${x}, 0)`, `(0, ${y})`]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'The first number is the trip along the x-axis (right); the second is the trip up.',
      images: questionImage([{ x, y, label: 'P' }]),
      ...baseFields('coordinate plane', '5.G.A.1'),
    };
  }

  const askYAxis = randomInt(0, 1) === 0;
  return {
    question: `Point P is at (${x}, ${y}). How many units is P from the ${askYAxis ? 'y-axis' : 'x-axis'}?`,
    correctAnswer: String(askYAxis ? x : y),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: askYAxis
      ? 'Distance from the y-axis is the sideways trip — the FIRST coordinate.'
      : 'Distance from the x-axis is the trip up — the SECOND coordinate.',
    images: questionImage([{ x, y, label: 'P' }]),
    ...baseFields('coordinate plane', '5.G.A.1'),
  };
};

/* ------------------------------------------------------------------ */
/* distances on a grid — real-world points (5.G.A.2)                   */
/* Formats:                                                            */
/*   "On a city map, the <placeA> is at (<a>, <b>) and the <placeB> is */
/*    at (<c>, <d>). How many blocks apart are they?" (points share a  */
/*    coordinate, so the distance is along one street)                 */
/*   "Which of these points lies on the x-axis?"                       */
/* ------------------------------------------------------------------ */
const PLACES = ['library', 'school', 'park', 'pool', 'bakery', 'fire station'];

const generateGridDistancesQuestion = (difficulty) => {
  if (randomInt(0, 2) > 0) {
    const [placeA, placeB] = shuffle(PLACES).slice(0, 2);
    const shared = randomInt(1, 9);
    const p1 = randomInt(0, 9);
    const maxCoordinate = 9 + Math.round(difficulty * 3);
    let p2 = randomInt(0, maxCoordinate);
    if (p2 === p1) p2 = p2 === maxCoordinate ? p2 - 1 : p2 + 1;
    const vertical = randomInt(0, 1) === 0; // shared x → distance is vertical
    const a = vertical ? [shared, p1] : [p1, shared];
    const b = vertical ? [shared, p2] : [p2, shared];
    return {
      question: `On a city map, the ${placeA} is at (${a[0]}, ${a[1]}) and the ${placeB} is at (${b[0]}, ${b[1]}). How many blocks apart are they?`,
      correctAnswer: String(Math.abs(p2 - p1)),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: 'The points share one coordinate, so just find the difference of the other one.',
      images: questionImage([
        { x: a[0], y: a[1], label: placeA },
        { x: b[0], y: b[1], label: placeB },
      ]),
      ...baseFields('distances on a grid', '5.G.A.2'),
    };
  }

  const k = randomInt(1, 12);
  const onX = randomInt(0, 1) === 0;
  const correct = onX ? `(${k}, 0)` : `(0, ${k})`;
  const offAxisCoordinate = k === 1 ? 2 : 1;
  const options = shuffle([
    correct,
    onX ? `(0, ${k})` : `(${k}, 0)`,
    `(${k}, ${k})`,
    onX ? `(${k}, ${offAxisCoordinate})` : `(${offAxisCoordinate}, ${k})`,
  ]);
  const points = options.map((option) => {
    const [, x, y] = option.match(/^\((\d+), (\d+)\)$/);
    return { x: Number(x), y: Number(y), label: option };
  });

  return {
    question: `Which of these points lies on the ${onX ? 'x-axis' : 'y-axis'}?`,
    correctAnswer: correct,
    options,
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: onX
      ? 'On the x-axis you have moved up 0 units — the second coordinate is 0.'
      : 'On the y-axis you have moved right 0 units — the first coordinate is 0.',
    images: questionImage(points),
    ...baseFields('distances on a grid', '5.G.A.2'),
  };
};

/* ------------------------------------------------------------------ */
/* classifying shapes — definition → name (5.G.B.4)                    */
/* Format: "Which shape is <description>?"                             */
/* The bank is mirrored in __tests__/questions.test.js.                */
/* ------------------------------------------------------------------ */
export const SHAPE_DEFINITIONS = [
  { description: 'a quadrilateral with exactly one pair of parallel sides', name: 'trapezoid' },
  { description: 'a quadrilateral with two pairs of parallel sides', name: 'parallelogram' },
  { description: 'a parallelogram with four right angles', name: 'rectangle' },
  { description: 'a parallelogram with four equal sides', name: 'rhombus' },
  { description: 'a rectangle with four equal sides', name: 'square' },
  { description: 'a triangle with all three sides equal', name: 'equilateral triangle' },
  { description: 'a triangle with no equal sides', name: 'scalene triangle' },
  { description: 'a triangle with one right angle', name: 'right triangle' },
];

const generateClassifyingShapesQuestion = () => {
  const entry = pick(SHAPE_DEFINITIONS);
  const others = shuffle(
    SHAPE_DEFINITIONS.filter((other) => other.name !== entry.name).map((other) => other.name)
  ).slice(0, 3);
  return {
    question: `Which shape is ${entry.description}?`,
    correctAnswer: entry.name,
    options: shuffle([entry.name, ...others]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Check the properties one by one: parallel sides, equal sides, right angles.',
    ...baseFields('classifying shapes', '5.G.B.4'),
  };
};

/* ------------------------------------------------------------------ */
/* shape hierarchy — categories include subcategories (5.G.B.3)        */
/* Formats: "True or false: <statement>"                               */
/*   "All <parent> have <property>. Every <child> is a <parent>. What  */
/*    must be true about every <child>?"                               */
/* Banks are mirrored in __tests__/questions.test.js.                  */
/* ------------------------------------------------------------------ */
export const HIERARCHY_STATEMENTS = [
  { statement: 'Every square is a rectangle.', truth: true },
  { statement: 'Every rectangle is a square.', truth: false },
  { statement: 'Every square is a rhombus.', truth: true },
  { statement: 'Every rhombus is a square.', truth: false },
  { statement: 'Every rectangle is a parallelogram.', truth: true },
  { statement: 'Every parallelogram is a rectangle.', truth: false },
  { statement: 'Every rhombus is a parallelogram.', truth: true },
  { statement: 'Every parallelogram is a rhombus.', truth: false },
  { statement: 'Every square is a parallelogram.', truth: true },
  { statement: 'Every trapezoid is a parallelogram.', truth: false },
  { statement: 'Every parallelogram is a quadrilateral.', truth: true },
  { statement: 'Every quadrilateral is a parallelogram.', truth: false },
];

export const INHERITANCE_FACTS = [
  {
    parent: 'rectangles',
    property: 'four right angles',
    children: ['square'],
  },
  {
    parent: 'parallelograms',
    property: 'two pairs of parallel sides',
    children: ['rectangle', 'rhombus', 'square'],
  },
  {
    parent: 'rhombuses',
    property: 'four equal sides',
    children: ['square'],
  },
];

const ALL_PROPERTIES = INHERITANCE_FACTS.map((fact) => `It has ${fact.property}.`).concat([
  'It has exactly one pair of parallel sides.',
]);

const generateShapeHierarchyQuestion = (difficulty) => {
  if (difficulty < 0.5) {
    const entry = pick(HIERARCHY_STATEMENTS);
    return {
      question: `True or false: ${entry.statement}`,
      correctAnswer: entry.truth ? 'True' : 'False',
      options: shuffle(['True', 'False']),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'A category\'s properties pass DOWN to its subcategories — but not back up.',
      ...baseFields('shape hierarchy', '5.G.B.3'),
    };
  }

  const fact = pick(INHERITANCE_FACTS);
  const child = pick(fact.children);
  const correct = `It has ${fact.property}.`;
  return {
    question: `All ${fact.parent} have ${fact.property}. Every ${child} is one of the ${fact.parent}. What must be true about every ${child}?`,
    correctAnswer: correct,
    options: shuffle([
      correct,
      ...shuffle(ALL_PROPERTIES.filter((property) => property !== correct)).slice(0, 3),
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Whatever is true for the whole category is true for every shape inside it.',
    ...baseFields('shape hierarchy', '5.G.B.3'),
  };
};

/* ------------------------------------------------------------------ */

const GENERATORS_BY_SUBTOPIC = {
  'coordinate plane': generateCoordinatePlaneQuestion,
  'distances on a grid': generateGridDistancesQuestion,
  'classifying shapes': generateClassifyingShapesQuestion,
  'shape hierarchy': generateShapeHierarchyQuestion,
};

export const generateQuestion = (difficulty, allowedSubtopics = null) => {
  const candidates = manifest.subtopics.filter(
    (subtopic) =>
      GENERATORS_BY_SUBTOPIC[subtopic] &&
      (!allowedSubtopics || allowedSubtopics.includes(subtopic))
  );
  if (candidates.length === 0) return null;

  const subtopic = candidates[randomInt(0, candidates.length - 1)];
  return GENERATORS_BY_SUBTOPIC[subtopic](difficulty);
};

const geometryQuestions = { generateQuestion };

export default geometryQuestions;
