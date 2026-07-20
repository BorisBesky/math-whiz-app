// Operations & Algebraic Thinking 5th (5.OA) question generator.
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

// 4 unique string options including the correct answer. Negative numeric
// candidates are skipped; the fallback pads with larger numbers.
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
/* order of operations — evaluate with parentheses and brackets        */
/* Formats: "What is the value of <expr>?" where <expr> is one of      */
/*   "a + b × c"            "(a + b) × c"                              */
/*   "a × (b − c) + d"      "[a + (b − c)] × d"                        */
/* ------------------------------------------------------------------ */
const generateOrderOfOperationsQuestion = (difficulty) => {
  let expression;
  let answer;
  let hint;

  if (difficulty < 0.3) {
    const a = randomInt(2, 20);
    const b = randomInt(2, 9);
    const c = randomInt(2, 9);
    expression = `${a} + ${b} × ${c}`;
    answer = a + b * c;
    hint = 'Multiply before you add — there are no parentheses to change the order.';
  } else if (difficulty < 0.55) {
    const a = randomInt(2, 15);
    const b = randomInt(2, 15);
    const c = randomInt(2, 9);
    expression = `(${a} + ${b}) × ${c}`;
    answer = (a + b) * c;
    hint = 'Do the work inside the parentheses first, then multiply.';
  } else if (difficulty < 0.8) {
    const b = randomInt(3, 15);
    const c = randomInt(1, b - 1);
    const a = randomInt(2, 9);
    const d = randomInt(1, 20);
    expression = `${a} × (${b} − ${c}) + ${d}`;
    answer = a * (b - c) + d;
    hint = 'Parentheses first, then multiply, then add.';
  } else {
    const b = randomInt(3, 12);
    const c = randomInt(1, b - 1);
    const a = randomInt(2, 15);
    const d = randomInt(2, 9);
    expression = `[${a} + (${b} − ${c})] × ${d}`;
    answer = (a + (b - c)) * d;
    hint = 'Work from the inside out: parentheses, then brackets, then multiply.';
  }

  return {
    question: `What is the value of ${expression}?`,
    correctAnswer: String(answer),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint,
    ...baseFields('order of operations', '5.OA.A.1'),
  };
};

/* ------------------------------------------------------------------ */
/* writing expressions — words to symbols (no evaluation needed)       */
/* Format: "Which expression means \"<words>\"?"                       */
/* ------------------------------------------------------------------ */
const generateWritingExpressionsQuestion = (difficulty) => {
  const a = randomInt(2, 9 + Math.round(difficulty * 11));
  let b = randomInt(2, 9 + Math.round(difficulty * 11));
  if (b === a) b += 1; // keep "subtract from" unambiguous (and its distractors distinct)
  const c = randomInt(2, 9);

  const templates = [
    {
      words: `add ${a} and ${b}, then multiply by ${c}`,
      correct: `${c} × (${a} + ${b})`,
      wrong: [`${a} + ${b} × ${c}`, `${c} × ${a} + ${b}`, `(${a} − ${b}) × ${c}`],
    },
    {
      words: `multiply ${a} by ${b}, then add ${c}`,
      correct: `${a} × ${b} + ${c}`,
      wrong: [`${a} × (${b} + ${c})`, `${a} + ${b} × ${c}`, `(${a} + ${b}) × ${c}`],
    },
    {
      words: `double the sum of ${a} and ${b}`,
      correct: `2 × (${a} + ${b})`,
      wrong: [`2 × ${a} + ${b}`, `(${a} + ${b}) ÷ 2`, `2 + ${a} + ${b}`],
    },
    {
      words: `subtract ${Math.min(a, b)} from ${Math.max(a, b)}, then multiply by ${c}`,
      correct: `${c} × (${Math.max(a, b)} − ${Math.min(a, b)})`,
      wrong: [
        `${c} × ${Math.max(a, b)} − ${Math.min(a, b)}`,
        `(${Math.min(a, b)} − ${Math.max(a, b)}) × ${c}`,
        `${Math.max(a, b)} − ${Math.min(a, b)} × ${c}`,
      ],
    },
  ];
  const template = pick(templates);

  return {
    question: `Which expression means "${template.words}"?`,
    correctAnswer: template.correct,
    options: shuffle([template.correct, ...template.wrong]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'The action that happens LAST goes on the outside; earlier steps go inside parentheses.',
    ...baseFields('writing expressions', '5.OA.A.2'),
  };
};

/* ------------------------------------------------------------------ */
/* interpreting expressions — compare without evaluating               */
/* Formats:                                                            */
/*   "Without calculating, <k> × (<a> + <b>) is how many times as      */
/*    large as <a> + <b>?"                                             */
/*   "Which expression is <k> times as large as <a> + <b>?"            */
/* ------------------------------------------------------------------ */
const generateInterpretingExpressionsQuestion = (difficulty) => {
  const k = randomInt(2, 9);
  // Big numbers on purpose — the point is NOT to calculate (5.OA.A.2).
  const a = randomInt(100, 900 + Math.round(difficulty * 9000));
  const b = randomInt(100, 900 + Math.round(difficulty * 9000));

  if (randomInt(0, 1) === 0) {
    return {
      question: `Without calculating, ${k} × (${a} + ${b}) is how many times as large as ${a} + ${b}?`,
      correctAnswer: String(k),
      options: buildOptions(k, [k + 1, k - 1, k * 2, a]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'You never need to add the big numbers — look at what the expression multiplies by.',
      ...baseFields('interpreting expressions', '5.OA.A.2'),
    };
  }

  const correct = `${k} × (${a} + ${b})`;
  return {
    question: `Which expression is ${k} times as large as ${a} + ${b}?`,
    correctAnswer: correct,
    options: shuffle([
      correct,
      `${k} + (${a} + ${b})`,
      `${k} × ${a} + ${b}`,
      `(${a} + ${b}) ÷ ${k}`,
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `"${k} times as large" means multiply the WHOLE sum by ${k} — parentheses keep the sum together.`,
    ...baseFields('interpreting expressions', '5.OA.A.2'),
  };
};

/* ------------------------------------------------------------------ */
/* prime factorization — numbers 2–50 as a product of primes (CA 2.1)  */
/* Formats:                                                            */
/*   "Which of these is the prime factorization of <n>?"               */
/*   "What is the missing prime factor? <n> = <known factors> × __"    */
/* ------------------------------------------------------------------ */
const primeFactors = (n) => {
  const factors = [];
  let rest = n;
  for (let p = 2; p * p <= rest; p++) {
    while (rest % p === 0) {
      factors.push(p);
      rest /= p;
    }
  }
  if (rest > 1) factors.push(rest);
  return factors;
};

// Composite numbers 2-50 with at least two prime factors.
const COMPOSITES = [];
for (let n = 4; n <= 50; n++) {
  if (primeFactors(n).length >= 2) COMPOSITES.push(n);
}

const generatePrimeFactorizationQuestion = (difficulty) => {
  const richer = COMPOSITES.filter((n) => primeFactors(n).length >= 3);
  const n = difficulty < 0.5 ? pick(COMPOSITES) : pick(richer);
  const factors = primeFactors(n);

  if (difficulty >= 0.6 && factors.length >= 2) {
    const known = factors.slice(0, factors.length - 1);
    const missing = factors[factors.length - 1];
    return {
      question: `What is the missing prime factor? ${n} = ${known.join(' × ')} × __`,
      correctAnswer: String(missing),
      questionType: QUESTION_TYPES.FILL_IN_THE_BLANKS,
      hint: `Multiply the known factors, then ask: ${n} ÷ ${known.reduce((x, y) => x * y, 1)} = ?`,
      ...baseFields('prime factorization', '5.OA.A.2.1'),
    };
  }

  const correct = factors.join(' × ');
  // Distractors: swap one prime, drop a factor, or use a non-prime split.
  // For two-prime composites the naive "n / factors[0]" split collides with
  // the correct answer (e.g., 6 = 2 × 3, and "2 × 3" is also the split). Use
  // a distinctly non-prime split there instead.
  const swapped = [...factors];
  swapped[0] = swapped[0] === 2 ? 3 : 2;
  const nonPrimeSplit = factors.length > 2
    ? (n % 2 === 0 ? `2 × ${n / 2}` : `${factors[0]} × ${n / factors[0]}`)
    : `${factors[0] * factors[1] === n ? 1 : factors[0]} × ${n}`;
  const distractors = [
    swapped.join(' × '),
    factors.length > 2 ? factors.slice(1).join(' × ') : `1 × ${n}`,
    nonPrimeSplit,
    // Always-safe padding distractor: the number itself, unfactored, which is
    // wrong for every composite by definition.
    `${n}`,
  ].filter((option) => option !== correct);

  const unique = Array.from(new Set(distractors));
  return {
    question: `Which of these is the prime factorization of ${n}?`,
    correctAnswer: correct,
    options: shuffle([correct, ...unique.slice(0, 3)]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Every factor must be prime, and the factors must multiply back to the number.',
    ...baseFields('prime factorization', '5.OA.A.2.1'),
  };
};

/* ------------------------------------------------------------------ */
/* numerical patterns — two rules, corresponding terms (5.OA.B.3)      */
/* Formats:                                                            */
/*   "... The <ord> term of Pattern A is <n>. What is the matching     */
/*    <ord> term of Pattern B?"                                        */
/*   "... Each term of Pattern B is how many times its matching term   */
/*    in Pattern A?"                                                   */
/*   "... Which ordered pair matches the <ord> terms (A, B)?"          */
/* ------------------------------------------------------------------ */
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

const generateNumericalPatternsQuestion = (difficulty) => {
  const a = randomInt(2, 6);
  const k = randomInt(2, 4);
  const b = a * k; // Pattern B's step is a clean multiple of Pattern A's
  const termsA = [0, 1, 2, 3, 4].map((i) => i * a);
  const termsB = [0, 1, 2, 3, 4].map((i) => i * b);
  const variant = difficulty < 0.35 ? 0 : randomInt(0, 2);

  if (variant === 0) {
    const index = randomInt(3, 4);
    return {
      question: `Pattern A starts at 0 and adds ${a} each time. Pattern B starts at 0 and adds ${b} each time. The ${ORDINALS[index]} term of Pattern A is ${termsA[index]}. What is the matching ${ORDINALS[index]} term of Pattern B?`,
      correctAnswer: String(termsB[index]),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `Each term of Pattern B is ${k} times the matching term of Pattern A — or keep adding ${b} from 0.`,
      ...baseFields('numerical patterns', '5.OA.B.3'),
    };
  }

  if (variant === 1) {
    return {
      question: `Pattern A starts at 0 and adds ${a} each time. Pattern B starts at 0 and adds ${b} each time. Each term of Pattern B is how many times its matching term in Pattern A?`,
      correctAnswer: String(k),
      options: buildOptions(k, [k + 1, k - 1, b, a]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: `Compare matching terms: ${termsA[1]} and ${termsB[1]}, or ${termsA[2]} and ${termsB[2]}.`,
      ...baseFields('numerical patterns', '5.OA.B.3'),
    };
  }

  const index = randomInt(1, 4);
  const correct = `(${termsA[index]}, ${termsB[index]})`;
  // Pick a nearby-but-distinct index for the "wrong term" distractors so the
  // options are always four unique strings — at index=4, clamping to `index`
  // itself collapsed the distractor into the correct answer.
  const shiftedIndex = index === 4 ? index - 1 : index + 1;
  const backIndex = index === 1 ? index + 1 : index - 1;
  return {
    question: `Pattern A is 0, ${termsA[1]}, ${termsA[2]}, ${termsA[3]}, ${termsA[4]}. Pattern B is 0, ${termsB[1]}, ${termsB[2]}, ${termsB[3]}, ${termsB[4]}. Which ordered pair matches the ${ORDINALS[index]} terms (A, B)?`,
    correctAnswer: correct,
    options: shuffle([
      correct,
      `(${termsB[index]}, ${termsA[index]})`,
      `(${termsA[index]}, ${termsB[shiftedIndex]})`,
      `(${termsA[backIndex]}, ${termsB[index]})`,
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'The first number comes from Pattern A, the second from Pattern B — same position in each.',
    ...baseFields('numerical patterns', '5.OA.B.3'),
  };
};

/* ------------------------------------------------------------------ */

const GENERATORS_BY_SUBTOPIC = {
  'order of operations': generateOrderOfOperationsQuestion,
  'writing expressions': generateWritingExpressionsQuestion,
  'interpreting expressions': generateInterpretingExpressionsQuestion,
  'prime factorization': generatePrimeFactorizationQuestion,
  'numerical patterns': generateNumericalPatternsQuestion,
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

const operationsAlgebraicThinkingQuestions = { generateQuestion };

export default operationsAlgebraicThinkingQuestions;
