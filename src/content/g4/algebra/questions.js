// Algebra (G4 pre-algebra) question generator.
//
// Contract (enforced by src/content/__tests__/topicContracts.test.js):
// generateQuestion(difficulty [0..1], allowedSubtopics | null) returns a
// question object — or null when the restriction can't be satisfied.
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

const VARIABLE_LETTERS = ['n', 'k', 'm', 'p', 't', 'x', 'y'];

// 4 unique string options including the (numeric) correct answer. Negative
// candidate values are skipped; the fallback pads with larger numbers.
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
  const base = Number.isNaN(Number(correctAnswer)) ? 0 : Number(correctAnswer);
  while (options.size < 4) {
    options.add(String(base + 10 + bump));
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
/* variables — what a variable is; spotting it; writing an equation    */
/* ------------------------------------------------------------------ */
const generateVariablesQuestion = (difficulty) => {
  const letter = pick(VARIABLE_LETTERS);
  const variant = difficulty < 0.34 ? randomInt(0, 1) : randomInt(1, 2);

  if (variant === 0) {
    const phrasing = pick([
      `In math, what do we call a letter like ${letter} that stands for an unknown number?`,
      `A letter like ${letter} stands for a number we don't know yet. What is that letter called?`,
    ]);
    return {
      question: phrasing,
      correctAnswer: 'a variable',
      options: shuffle(['a variable', 'a digit', 'a sum', 'a remainder']),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'It can "vary" — it stands for different numbers in different problems.',
      ...baseFields('variables', '4.OA.A.3'),
    };
  }

  if (variant === 1) {
    const a = randomInt(2, 9);
    const b = randomInt(2, 20);
    const expression = pick([
      `${a} × ${letter} + ${b}`,
      `${letter} + ${a}`,
      `${a} × ${letter}`,
      `${letter} − ${a} + ${b}`,
    ]);
    return {
      question: `Which part of the expression ${expression} is the variable?`,
      correctAnswer: letter,
      options: shuffle([letter, String(a), String(a === b ? b + 1 : b), pick(['+', '×', '−'])]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'The variable is the letter that stands for an unknown number.',
      ...baseFields('variables', '4.OA.A.3'),
    };
  }

  // Write the equation for a short story (4.OA.A.3: a letter for the unknown)
  const name = pick(['Sam', 'Ava', 'Leo', 'Mia', 'Kai', 'Zoe']);
  const items = pick(['marbles', 'stickers', 'coins', 'shells', 'cards']);
  const more = randomInt(2, 30);
  const start = randomInt(3, 40);
  const total = start + more;
  const correctAnswer = `${letter} + ${more} = ${total}`;
  return {
    question: `${name} has some ${items}. We call that number ${letter}. After getting ${more} more, ${name} has ${total} ${items}. Which equation matches the story?`,
    correctAnswer,
    options: shuffle([
      correctAnswer,
      `${letter} − ${more} = ${total}`,
      `${letter} + ${total} = ${more}`,
      `${letter} × ${more} = ${total}`,
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `${name} started with ${letter}, gained ${more}, and ended with ${total}.`,
    ...baseFields('variables', '4.OA.A.3'),
  };
};

/* ------------------------------------------------------------------ */
/* evaluating expressions — substitute a value                         */
/* Format: "If <letter> = <v>, what is the value of <expr>?"           */
/* ------------------------------------------------------------------ */
const generateEvaluatingExpressionsQuestion = (difficulty) => {
  const letter = pick(VARIABLE_LETTERS);
  const value = randomInt(2, 4 + Math.round(difficulty * 8));

  let expression;
  let answer;
  if (difficulty < 0.3) {
    const a = randomInt(2, 20);
    expression = `${letter} + ${a}`;
    answer = value + a;
  } else if (difficulty < 0.55) {
    const a = randomInt(2, 9);
    expression = `${a} × ${letter}`;
    answer = a * value;
  } else if (difficulty < 0.8) {
    const a = randomInt(2, 9);
    const b = randomInt(1, 20);
    expression = `${a} × ${letter} + ${b}`;
    answer = a * value + b;
  } else {
    const a = randomInt(2, 9);
    const b = randomInt(1, Math.max(1, 2 * value));
    expression = `${a} × ${letter} − ${b}`;
    answer = a * value - b;
  }

  return {
    question: `If ${letter} = ${value}, what is the value of ${expression}?`,
    correctAnswer: String(answer),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `Replace ${letter} with ${value}, then do × before + or −.`,
    ...baseFields('evaluating expressions', '5.OA.A.2'),
  };
};

/* ------------------------------------------------------------------ */
/* one-step equations — solve for the letter                           */
/* Format: "Solve for <letter>: <equation>"                            */
/* ------------------------------------------------------------------ */
const generateOneStepEquationsQuestion = (difficulty) => {
  const letter = pick(VARIABLE_LETTERS);
  const limit = 10 + Math.round(difficulty * 40);

  const operations = difficulty < 0.35 ? ['add', 'subtract'] : ['add', 'subtract', 'multiply', 'divide'];
  const operation = pick(operations);

  let equation;
  let solution;
  let hint;
  if (operation === 'add') {
    solution = randomInt(1, limit);
    const a = randomInt(1, limit);
    equation = pick([`${letter} + ${a} = ${solution + a}`, `${a} + ${letter} = ${solution + a}`]);
    hint = `Undo the addition: subtract ${a} from both sides.`;
  } else if (operation === 'subtract') {
    const a = randomInt(1, limit);
    solution = randomInt(a, a + limit); // keep every intermediate value ≥ 0
    equation = `${letter} − ${a} = ${solution - a}`;
    hint = `Undo the subtraction: add ${a} to both sides.`;
  } else if (operation === 'multiply') {
    solution = randomInt(2, 12);
    const a = randomInt(2, 12);
    equation = pick([`${a} × ${letter} = ${a * solution}`, `${letter} × ${a} = ${a * solution}`]);
    hint = `Undo the multiplication: divide both sides by ${a}.`;
  } else {
    const a = randomInt(2, 12);
    const quotient = randomInt(2, 12);
    solution = a * quotient;
    equation = `${letter} ÷ ${a} = ${quotient}`;
    hint = `Undo the division: multiply both sides by ${a}.`;
  }

  // Alternate between numeric entry and multiple choice for variety
  if (randomInt(0, 1) === 0) {
    return {
      question: `Solve for ${letter}: ${equation}`,
      correctAnswer: String(solution),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint,
      ...baseFields('one-step equations', '4.OA.A.3'),
    };
  }
  return {
    question: `Solve for ${letter}: ${equation}`,
    correctAnswer: String(solution),
    options: buildOptions(solution, [solution + 1, Math.max(0, solution - 1), solution + 2, solution + 10]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint,
    ...baseFields('one-step equations', '4.OA.A.3'),
  };
};

/* ------------------------------------------------------------------ */
/* input output tables — apply (or reverse) a rule                     */
/* Format: "A number machine uses the rule: multiply by <a>[, then add */
/* <b>]. ..."                                                          */
/* ------------------------------------------------------------------ */
const generateInputOutputQuestion = (difficulty) => {
  const a = randomInt(2, 9);
  const b = difficulty < 0.3 ? 0 : randomInt(1, 15);
  const ruleText = b === 0 ? `multiply by ${a}` : `multiply by ${a}, then add ${b}`;

  if (difficulty < 0.7) {
    const input = randomInt(2, 12);
    const output = a * input + b;
    return {
      question: `A number machine uses the rule: ${ruleText}. If the input is ${input}, what is the output?`,
      correctAnswer: String(output),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `Start with ${input} and follow the rule one step at a time.`,
      ...baseFields('input output tables', '4.OA.C.5'),
    };
  }

  // Reverse: given the output, find the input (clean by construction)
  const input = randomInt(2, 12);
  const output = a * input + b;
  return {
    question: `A number machine uses the rule: ${ruleText}. If the output is ${output}, what was the input?`,
    correctAnswer: String(input),
    options: buildOptions(input, [input + 1, Math.max(2, input - 1), input + 2, output]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Work backwards: ${b > 0 ? `subtract ${b}, then divide by ${a}` : `divide by ${a}`}.`,
    ...baseFields('input output tables', '4.OA.C.5'),
  };
};

/* ------------------------------------------------------------------ */
/* growing patterns — extend a sequence or name its rule               */
/* Formats: "What number comes next in the pattern? a, b, c, d, __"    */
/*          "What number is missing from the pattern? a, b, __, d, e"  */
/*          "What is the rule for the pattern a, b, c, d?"             */
/* ------------------------------------------------------------------ */
const generateGrowingPatternsQuestion = (difficulty) => {
  const step = randomInt(2, 3 + Math.round(difficulty * 9));
  const start = randomInt(1, 20);
  const terms = [0, 1, 2, 3, 4].map((i) => start + i * step);
  const variant = difficulty < 0.4 ? 0 : randomInt(0, 2);

  if (variant === 0) {
    const shown = terms.slice(0, 4);
    return {
      question: `What number comes next in the pattern? ${shown.join(', ')}, __`,
      correctAnswer: String(terms[4]),
      questionType: QUESTION_TYPES.FILL_IN_THE_BLANKS,
      hint: `Find how much the pattern grows each time, then add it to ${shown[3]}.`,
      ...baseFields('growing patterns', '4.OA.C.5'),
    };
  }

  if (variant === 1) {
    return {
      question: `What number is missing from the pattern? ${terms[0]}, ${terms[1]}, __, ${terms[3]}, ${terms[4]}`,
      correctAnswer: String(terms[2]),
      questionType: QUESTION_TYPES.FILL_IN_THE_BLANKS,
      hint: `Each number is ${step} more than the one before it.`,
      ...baseFields('growing patterns', '4.OA.C.5'),
    };
  }

  const correctAnswer = `add ${step} each time`;
  return {
    question: `What is the rule for the pattern ${terms.slice(0, 4).join(', ')}?`,
    correctAnswer,
    options: shuffle([
      correctAnswer,
      `add ${step + 1} each time`,
      `multiply by ${step} each time`,
      `subtract ${step} each time`,
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Compare each number with the one before it.',
    ...baseFields('growing patterns', '4.OA.C.5'),
  };
};

/* ------------------------------------------------------------------ */

const GENERATORS_BY_SUBTOPIC = {
  variables: generateVariablesQuestion,
  'evaluating expressions': generateEvaluatingExpressionsQuestion,
  'one-step equations': generateOneStepEquationsQuestion,
  'input output tables': generateInputOutputQuestion,
  'growing patterns': generateGrowingPatternsQuestion,
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

export default { generateQuestion };
