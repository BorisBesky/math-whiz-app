// Measurement & Data 5th (5.MD) question generator.
//
// Contract (enforced by src/content/__tests__/topicContracts.test.js):
// generateQuestion(difficulty [0..1], allowedSubtopics | null) returns a
// question object — or null when the restriction can't be satisfied.
//
// Metric conversions are computed in integer thousandths so decimal results
// are exact. Line plots are described in words (counts of 1/4, 1/2, 3/4
// measurements) since questions are text-only.
//
// Question-text formats are deterministic per family so the topic tests can
// decode a question and independently verify its answer — keep the wording
// in sync with __tests__/questions.test.js if you change it.
import { QUESTION_TYPES } from '../../../constants/topics.js';
import manifest from './manifest.json';

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

// Format an integer count of thousandths as a trimmed decimal string.
const fromThousandths = (t) => {
  const whole = Math.floor(t / 1000);
  const frac = String(t % 1000).padStart(3, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : `${whole}`;
};

const buildOptions = (correctAnswer, candidateDistractors) => {
  const options = new Set([String(correctAnswer)]);
  for (const candidate of candidateDistractors) {
    if (options.size >= 4) break;
    const value = String(candidate);
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric < 0) continue;
    if (!options.has(value)) options.add(value);
  }
  let bump = 1;
  while (options.size < 4) {
    options.add(`${Number(correctAnswer) ? Number(correctAnswer) + bump * 10 : bump * 10}`);
    bump += 1;
  }
  return shuffle([...options]);
};

const baseFields = (subtopic, standard) => ({
  concept: manifest.name,
  grade: manifest.grade,
  subtopic,
  standard,
});

/* ------------------------------------------------------------------ */
/* unit conversions (5.MD.A.1)                                         */
/* Formats: "Convert <x> <from> to <to>." — customary answers are      */
/* whole numbers (NUMERIC); metric answers may be decimals (MC)        */
/* ------------------------------------------------------------------ */
const CUSTOMARY = [
  { from: 'feet', to: 'inches', factor: 12 },
  { from: 'yards', to: 'feet', factor: 3 },
  { from: 'pounds', to: 'ounces', factor: 16 },
  { from: 'gallons', to: 'quarts', factor: 4 },
  { from: 'quarts', to: 'pints', factor: 2 },
  { from: 'pints', to: 'cups', factor: 2 },
  { from: 'hours', to: 'minutes', factor: 60 },
  { from: 'minutes', to: 'seconds', factor: 60 },
];

const METRIC = [
  { from: 'centimeters', to: 'meters', factor: 100 },
  { from: 'meters', to: 'kilometers', factor: 1000 },
  { from: 'millimeters', to: 'centimeters', factor: 10 },
  { from: 'grams', to: 'kilograms', factor: 1000 },
  { from: 'milliliters', to: 'liters', factor: 1000 },
];

const generateUnitConversionsQuestion = (difficulty) => {
  // Customary: multiply small→large counts of whole units (both directions stay whole)
  if (difficulty < 0.5) {
    const unit = pick(CUSTOMARY);
    if (randomInt(0, 1) === 0) {
      const amount = randomInt(2, 12);
      return {
        question: `Convert ${amount} ${unit.from} to ${unit.to}.`,
        correctAnswer: String(amount * unit.factor),
        options: [],
        questionType: QUESTION_TYPES.NUMERIC,
        hint: `1 ${unit.from.replace(/s$/, '')} = ${unit.factor} ${unit.to}. Multiply by ${unit.factor}.`,
        ...baseFields('unit conversions', '5.MD.A.1'),
      };
    }
    const count = randomInt(2, 9);
    return {
      question: `Convert ${count * unit.factor} ${unit.to} to ${unit.from}.`,
      correctAnswer: String(count),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `${unit.factor} ${unit.to} make 1 ${unit.from.replace(/s$/, '')}. Divide by ${unit.factor}.`,
      ...baseFields('unit conversions', '5.MD.A.1'),
    };
  }

  // Metric with decimals (e.g. 5 cm = 0.05 m), exact in thousandths
  const unit = pick(METRIC);
  const small = randomInt(2, 999);
  const resultThousandths = Math.round((small * 1000) / unit.factor);
  if (resultThousandths * unit.factor !== small * 1000) {
    return generateUnitConversionsQuestion(difficulty); // guard: keep it exact (never trips for factors 10/100/1000)
  }
  const correct = fromThousandths(resultThousandths);
  return {
    question: `Convert ${small} ${unit.from} to ${unit.to}.`,
    correctAnswer: correct,
    options: buildOptions(correct, [
      fromThousandths(resultThousandths * 10),
      resultThousandths >= 10 ? fromThousandths(Math.round(resultThousandths / 10)) : fromThousandths(resultThousandths * 100),
      String(small * unit.factor),
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `1 ${unit.to.replace(/s$/, '')} = ${unit.factor} ${unit.from}, so divide by ${unit.factor} — the decimal point moves left.`,
    ...baseFields('unit conversions', '5.MD.A.1'),
  };
};

/* ------------------------------------------------------------------ */
/* line plots with fractional measurements (5.MD.B.2)                  */
/* Data sentence: "A line plot shows the lengths of some ribbons:      */
/* <c1> ribbons of 1/4 foot, <c2> ribbons of 1/2 foot, and <c3>        */
/* ribbons of 3/4 foot."                                               */
/* ------------------------------------------------------------------ */
const generateLinePlotsQuestion = (difficulty) => {
  // Distinct counts so "appears most often" has a single right answer.
  const counts = shuffle([randomInt(1, 3), randomInt(4, 5), randomInt(6, 8)]);
  const [c1, c2, c3] = counts;
  const data = `A line plot shows the lengths of some ribbons: ${c1} ribbons of 1/4 foot, ${c2} ribbons of 1/2 foot, and ${c3} ribbons of 3/4 foot.`;
  const variant = difficulty < 0.35 ? randomInt(0, 1) : randomInt(1, 2);

  if (variant === 0) {
    return {
      question: `${data} How many ribbons are on the line plot?`,
      correctAnswer: String(c1 + c2 + c3),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: 'Add up how many ribbons there are of each length.',
      ...baseFields('line plots', '5.MD.B.2'),
    };
  }

  if (variant === 1) {
    const lengths = ['1/4 foot', '1/2 foot', '3/4 foot'];
    const winner = lengths[counts.indexOf(Math.max(c1, c2, c3))];
    return {
      question: `${data} Which length appears most often?`,
      correctAnswer: winner,
      options: shuffle([...lengths, 'They all appear equally often']),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'Compare the three counts — the biggest count wins.',
      ...baseFields('line plots', '5.MD.B.2'),
    };
  }

  // Total length of the 1/2-foot ribbons (kept clean: c2 halves)
  const totalHalves = c2; // in half-feet
  const correct = totalHalves % 2 === 0 ? String(totalHalves / 2) : `${(totalHalves - 1) / 2 ? `${(totalHalves - 1) / 2} ` : ''}1/2`;
  return {
    question: `${data} What is the total length in feet of the 1/2-foot ribbons?`,
    correctAnswer: correct,
    options: buildOptions(correct, [
      String(c2),
      totalHalves % 2 === 0 ? `${totalHalves / 2} 1/2` : String((totalHalves + 1) / 2),
      String(c1 + c2 + c3),
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `${c2} ribbons × 1/2 foot each — every 2 ribbons make a whole foot.`,
    ...baseFields('line plots', '5.MD.B.2'),
  };
};

/* ------------------------------------------------------------------ */
/* volume concepts — unit cubes and units (5.MD.C.3, 5.MD.C.4)         */
/* Formats: "A rectangular prism is built from unit cubes: ..."        */
/*          "Which unit is best for measuring the volume of ...?"      */
/* ------------------------------------------------------------------ */
const generateVolumeConceptsQuestion = (difficulty) => {
  if (randomInt(0, 2) > 0) {
    const l = randomInt(2, 4 + Math.round(difficulty * 6));
    const w = randomInt(2, 5);
    const h = randomInt(2, 5);
    return {
      question: `A rectangular prism is built from unit cubes. It is ${l} cubes long, ${w} cubes wide, and ${h} layers tall. How many unit cubes does it use?`,
      correctAnswer: String(l * w * h),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `One layer has ${l} × ${w} cubes; there are ${h} layers.`,
      ...baseFields('volume concepts', '5.MD.C.4'),
    };
  }

  const scenarios = [
    { thing: 'a moving box', correct: 'cubic feet', wrong: ['square feet', 'feet', 'ounces'] },
    { thing: 'a juice carton', correct: 'cubic centimeters', wrong: ['centimeters', 'square centimeters', 'grams'] },
    { thing: 'a swimming pool', correct: 'cubic meters', wrong: ['meters', 'square meters', 'liters of paint'] },
  ];
  const scenario = pick(scenarios);
  return {
    question: `Which unit is best for measuring the volume of ${scenario.thing}?`,
    correctAnswer: scenario.correct,
    options: shuffle([scenario.correct, ...scenario.wrong]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Volume fills space in three dimensions, so it needs a CUBIC unit.',
    ...baseFields('volume concepts', '5.MD.C.3'),
  };
};

/* ------------------------------------------------------------------ */
/* volume of rectangular prisms — V = l × w × h (5.MD.C.5)             */
/* Formats: "... <l> <unit> long, <w> <unit> wide, and <h> <unit>      */
/* tall. What is its volume in cubic <unit>?"                          */
/*          "A box has a volume of <V> cubic <unit>. Its base area is  */
/* <B> square <unit>. How tall is the box in <unit>?"                  */
/* ------------------------------------------------------------------ */
const generatePrismVolumeQuestion = (difficulty) => {
  const unit = pick(['centimeters', 'inches', 'meters', 'feet']);
  const l = randomInt(2, 5 + Math.round(difficulty * 7));
  const w = randomInt(2, 5 + Math.round(difficulty * 5));
  const h = randomInt(2, 5 + Math.round(difficulty * 5));

  if (difficulty < 0.65) {
    return {
      question: `A rectangular prism is ${l} ${unit} long, ${w} ${unit} wide, and ${h} ${unit} tall. What is its volume in cubic ${unit}?`,
      correctAnswer: String(l * w * h),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `Volume = length × width × height = ${l} × ${w} × ${h}.`,
      ...baseFields('volume of rectangular prisms', '5.MD.C.5'),
    };
  }

  const base = l * w;
  return {
    question: `A box has a volume of ${base * h} cubic ${unit}. Its base area is ${base} square ${unit}. How tall is the box in ${unit}?`,
    correctAnswer: String(h),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `Volume = base area × height, so divide ${base * h} by ${base}.`,
    ...baseFields('volume of rectangular prisms', '5.MD.C.5'),
  };
};

/* ------------------------------------------------------------------ */
/* additive volume — two non-overlapping prisms (5.MD.C.5c)            */
/* Format: "A figure is made of two rectangular prisms. One is         */
/* <l1> × <w1> × <h1> units and the other is <l2> × <w2> × <h2> units. */
/* What is the total volume of the figure in cubic units?"             */
/* ------------------------------------------------------------------ */
const generateAdditiveVolumeQuestion = (difficulty) => {
  const top = 4 + Math.round(difficulty * 6);
  const dims1 = [randomInt(2, top), randomInt(2, 5), randomInt(2, 5)];
  const dims2 = [randomInt(2, top), randomInt(2, 5), randomInt(2, 5)];
  const volume = dims1[0] * dims1[1] * dims1[2] + dims2[0] * dims2[1] * dims2[2];

  return {
    question: `A figure is made of two rectangular prisms. One is ${dims1[0]} × ${dims1[1]} × ${dims1[2]} units and the other is ${dims2[0]} × ${dims2[1]} × ${dims2[2]} units. What is the total volume of the figure in cubic units?`,
    correctAnswer: String(volume),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: 'Find each prism\'s volume separately, then add them together.',
    ...baseFields('additive volume', '5.MD.C.5'),
  };
};

/* ------------------------------------------------------------------ */

const GENERATORS_BY_SUBTOPIC = {
  'unit conversions': generateUnitConversionsQuestion,
  'line plots': generateLinePlotsQuestion,
  'volume concepts': generateVolumeConceptsQuestion,
  'volume of rectangular prisms': generatePrismVolumeQuestion,
  'additive volume': generateAdditiveVolumeQuestion,
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

const measurementDataQuestions = { generateQuestion };

export default measurementDataQuestions;
