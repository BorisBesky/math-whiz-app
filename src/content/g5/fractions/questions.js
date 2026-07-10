// Fractions 5th (5.NF) question generator.
//
// Contract (enforced by src/content/__tests__/topicContracts.test.js):
// generateQuestion(difficulty [0..1], allowedSubtopics | null) returns a
// question object — or null when the restriction can't be satisfied.
//
// Fraction answers are strings in simplest form: "3/4", "23/12", or a mixed
// number "3 5/6". Whole-number answers use plain digits.
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

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

// Simplified "n/d" (improper allowed), or "w" when it divides evenly.
const formatFraction = (numerator, denominator) => {
  const g = gcd(numerator, denominator);
  const n = numerator / g;
  const d = denominator / g;
  return d === 1 ? String(n) : `${n}/${d}`;
};

// Simplified mixed number: "3 5/6", "3", or "5/6".
const formatMixed = (numerator, denominator) => {
  const g = gcd(numerator, denominator);
  const n = numerator / g;
  const d = denominator / g;
  if (d === 1) return String(n);
  const whole = Math.floor(n / d);
  const rest = n % d;
  return whole === 0 ? `${rest}/${d}` : `${whole} ${rest}/${d}`;
};

const buildOptions = (correctAnswer, candidateDistractors) => {
  const options = new Set([String(correctAnswer)]);
  for (const candidate of candidateDistractors) {
    if (options.size >= 4) break;
    const value = String(candidate);
    if (!options.has(value)) options.add(value);
  }
  let bump = 2;
  while (options.size < 4) {
    options.add(`${bump}/${bump + 7}`);
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

const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12];

// Two different denominators, harder pairs are non-multiples (need a real LCD).
const pickDenominators = (difficulty) => {
  let d1 = pick(DENOMINATORS);
  let d2 = pick(DENOMINATORS.filter((d) => d !== d1));
  if (difficulty >= 0.6 && d2 % d1 === 0) [d1, d2] = [d2, d1]; // avoid the easy "one is the LCD" case
  return [d1, d2];
};

/* ------------------------------------------------------------------ */
/* add and subtract unlike denominators (5.NF.A.1)                     */
/* Format: "What is <a>/<b> + <c>/<d>?" (or −); answer simplified,     */
/* improper allowed (the standard itself answers 23/12)                */
/* ------------------------------------------------------------------ */
const generateUnlikeDenominatorsQuestion = (difficulty) => {
  const [d1, d2] = pickDenominators(difficulty);
  const n1 = randomInt(1, d1 - 1);
  const n2 = randomInt(1, d2 - 1);
  const add = randomInt(0, 1) === 0 || n1 * d2 <= n2 * d1;

  const numerator = add ? n1 * d2 + n2 * d1 : n1 * d2 - n2 * d1;
  if (!add && numerator === 0) return generateUnlikeDenominatorsQuestion(difficulty);
  const denominator = d1 * d2;
  const correct = formatFraction(numerator, denominator);

  const distractors = [
    // Classic error: add tops and bottoms straight across
    formatFraction(add ? n1 + n2 : Math.abs(n1 - n2) || 1, d1 + d2),
    // Forgot to convert one fraction
    formatFraction(add ? n1 + n2 * d1 : Math.abs(n1 - n2 * d1) || 1, d1 * d2),
    formatFraction(numerator + d1, denominator),
  ].filter((option) => option !== correct);

  return {
    question: `What is ${n1}/${d1} ${add ? '+' : '−'} ${n2}/${d2}?`,
    correctAnswer: correct,
    options: buildOptions(correct, distractors),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Rewrite both fractions with denominator ${denominator / gcd(d1, d2)} (a common multiple of ${d1} and ${d2}), then ${add ? 'add' : 'subtract'} the numerators.`,
    ...baseFields('add and subtract unlike denominators', '5.NF.A.1'),
  };
};

/* ------------------------------------------------------------------ */
/* mixed numbers — add/subtract with unlike denominators (5.NF.A.1)    */
/* Format: "What is <w> <n>/<d> + <w2> <n2>/<d2>?" (or −)              */
/* ------------------------------------------------------------------ */
const generateMixedNumbersQuestion = (difficulty) => {
  const [d1, d2] = pickDenominators(difficulty);
  const w1 = randomInt(1, 5);
  const w2 = randomInt(1, 5);
  const n1 = randomInt(1, d1 - 1);
  const n2 = randomInt(1, d2 - 1);

  // Work in the common denominator d1*d2 as improper fractions.
  const total1 = (w1 * d1 + n1) * d2;
  const total2 = (w2 * d2 + n2) * d1;
  const denominator = d1 * d2;
  const add = randomInt(0, 1) === 0 || total1 <= total2;

  const numerator = add ? total1 + total2 : total1 - total2;
  if (!add && numerator === 0) return generateMixedNumbersQuestion(difficulty);
  const correct = formatMixed(numerator, denominator);

  const distractors = [
    formatMixed(add ? numerator + denominator : Math.max(numerator - denominator, 1), denominator), // whole part off by one
    formatMixed(add ? numerator + d1 : Math.max(numerator - d1, 1), denominator),
    `${add ? w1 + w2 : Math.abs(w1 - w2)} ${add ? n1 + n2 : Math.abs(n1 - n2) || 1}/${d1 + d2}`, // straight-across error, left unsimplified
  ].filter((option) => option !== correct);

  return {
    question: `What is ${w1} ${n1}/${d1} ${add ? '+' : '−'} ${w2} ${n2}/${d2}?`,
    correctAnswer: correct,
    options: buildOptions(correct, distractors),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Turn both mixed numbers into fractions over ${denominator}, ${add ? 'add' : 'subtract'}, then convert back.`,
    ...baseFields('mixed numbers', '5.NF.A.1'),
  };
};

/* ------------------------------------------------------------------ */
/* fraction as division (5.NF.B.3)                                     */
/* Formats: "Which fraction equals <a> ÷ <b>?"                         */
/*   "<n> friends share <m> <items> equally. How much ... each ...?"   */
/*   "Between which two whole numbers is <a> ÷ <b>?"                   */
/* ------------------------------------------------------------------ */
const generateFractionAsDivisionQuestion = (difficulty) => {
  const variant = difficulty < 0.35 ? 0 : randomInt(0, 2);

  if (variant === 0) {
    let a = randomInt(1, 11);
    let b = randomInt(2, 12);
    while (gcd(a, b) !== 1) {
      a = randomInt(1, 11);
      b = randomInt(2, 12);
    }
    const correct = `${a}/${b}`;
    return {
      question: `Which fraction equals ${a} ÷ ${b}?`,
      correctAnswer: correct,
      options: buildOptions(correct, [`${b}/${a}`, `${a}/${b + 1}`, `${a + 1}/${b}`]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'The number being divided goes on top: a ÷ b = a/b.',
      ...baseFields('fraction as division', '5.NF.B.3'),
    };
  }

  if (variant === 1) {
    const items = pick(['pizzas', 'sandwiches', 'watermelons', 'pans of brownies']);
    let m = randomInt(1, 7);
    let n = randomInt(2, 8);
    while (gcd(m, n) !== 1 || m >= n) {
      m = randomInt(1, 7);
      n = randomInt(2, 8);
    }
    const correct = `${m}/${n}`;
    return {
      question: `${n} friends share ${m} ${items} equally. How much does each friend get?`,
      correctAnswer: correct,
      options: buildOptions(correct, [`${n}/${m}`, `1/${n}`, `1/${m + n}`]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: `Sharing ${m} among ${n} means ${m} ÷ ${n} — the fraction ${m}/${n}.`,
      ...baseFields('fraction as division', '5.NF.B.3'),
    };
  }

  const b = randomInt(2, 9);
  const q = randomInt(1, 9);
  const r = randomInt(1, b - 1);
  const a = b * q + r;
  const correct = `${q} and ${q + 1}`;
  return {
    question: `Between which two whole numbers is ${a} ÷ ${b}?`,
    correctAnswer: correct,
    options: buildOptions(correct, [
      `${q + 1} and ${q + 2}`,
      `${Math.max(q - 1, 0)} and ${q}`,
      `${q} and ${q + 2}`,
    ]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `${b} × ${q} = ${b * q} and ${b} × ${q + 1} = ${b * (q + 1)} — where does ${a} fall?`,
    ...baseFields('fraction as division', '5.NF.B.3'),
  };
};

/* ------------------------------------------------------------------ */
/* multiplying fractions (5.NF.B.4)                                    */
/* Formats: "What is <a>/<b> × <c>/<d>?"                               */
/*   "What is <a>/<b> of <N>?" (N divisible by b)                      */
/*   "A rectangle is <a>/<b> meter long and <c>/<d> meter wide. What   */
/*    is its area in square meters?"                                   */
/* ------------------------------------------------------------------ */
const generateMultiplyingFractionsQuestion = (difficulty) => {
  const variant = difficulty < 0.35 ? 1 : randomInt(0, 2);

  if (variant === 1) {
    const b = pick([2, 3, 4, 5, 6, 8]);
    const a = randomInt(1, b - 1);
    const N = b * randomInt(2, 9);
    return {
      question: `What is ${a}/${b} of ${N}?`,
      correctAnswer: String((N / b) * a),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `Divide ${N} by ${b} to find one ${b}th, then multiply by ${a}.`,
      ...baseFields('multiplying fractions', '5.NF.B.4'),
    };
  }

  const b = pick([2, 3, 4, 5, 6]);
  const d = pick([2, 3, 4, 5, 6]);
  const a = randomInt(1, b - 1);
  const c = randomInt(1, d - 1);
  const correct = formatFraction(a * c, b * d);
  const distractors = [
    formatFraction(a + c, b + d),
    formatFraction(a * d, b * c),
    formatFraction(a * c + 1, b * d),
  ].filter((option) => option !== correct);

  if (variant === 0) {
    return {
      question: `What is ${a}/${b} × ${c}/${d}?`,
      correctAnswer: correct,
      options: buildOptions(correct, distractors),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'Multiply the tops together and the bottoms together, then simplify.',
      ...baseFields('multiplying fractions', '5.NF.B.4'),
    };
  }

  return {
    question: `A rectangle is ${a}/${b} meter long and ${c}/${d} meter wide. What is its area in square meters?`,
    correctAnswer: correct,
    options: buildOptions(correct, distractors),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Area = length × width — multiply the fractions.',
    ...baseFields('multiplying fractions', '5.NF.B.4'),
  };
};

/* ------------------------------------------------------------------ */
/* multiplication as scaling (5.NF.B.5) — no computing needed          */
/* Format: "Without multiplying, how does <a>/<b> × <N> compare        */
/*          to <N>?"                                                   */
/* ------------------------------------------------------------------ */
const generateScalingQuestion = (difficulty) => {
  const N = randomInt(2, 20) * pick([1, 10]);
  const kind = randomInt(0, 2); // 0: <1, 1: >1, 2: =1
  let a;
  let b;
  if (kind === 0) {
    b = pick([2, 3, 4, 5, 6, 8]);
    a = randomInt(1, b - 1);
  } else if (kind === 1) {
    b = pick([2, 3, 4, 5]);
    a = b + randomInt(1, b); // improper, ≤ 2
  } else {
    b = pick([2, 3, 4, 5, 6, 8]);
    a = b;
  }

  const correct =
    kind === 0 ? `less than ${N}` : kind === 1 ? `greater than ${N}` : `equal to ${N}`;
  return {
    question: `Without multiplying, how does ${a}/${b} × ${N} compare to ${N}?`,
    correctAnswer: correct,
    options: shuffle([`less than ${N}`, `greater than ${N}`, `equal to ${N}`]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Compare ${a}/${b} to 1: a fraction less than 1 shrinks the number, greater than 1 grows it.`,
    ...baseFields('multiplication as scaling', '5.NF.B.5'),
  };
};

/* ------------------------------------------------------------------ */
/* dividing unit fractions (5.NF.B.7)                                  */
/* Formats: "What is 1/<b> ÷ <n>?"                                     */
/*          "What is <n> ÷ 1/<b>?"                                     */
/*          "How many 1/<b>-cup servings are in <n> cups of <food>?"   */
/* ------------------------------------------------------------------ */
const generateDividingUnitFractionsQuestion = (difficulty) => {
  const b = pick([2, 3, 4, 5, 6, 8]);
  const n = randomInt(2, difficulty < 0.5 ? 6 : 12);
  const variant = randomInt(0, 2);

  if (variant === 0) {
    return {
      question: `What is 1/${b} ÷ ${n}?`,
      correctAnswer: `1/${b * n}`,
      options: buildOptions(`1/${b * n}`, [`${n}/${b}`, `1/${b + n}`, `${b * n}`]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: `Splitting 1/${b} into ${n} equal parts makes pieces ${n} times smaller.`,
      ...baseFields('dividing unit fractions', '5.NF.B.7'),
    };
  }

  if (variant === 1) {
    return {
      question: `What is ${n} ÷ 1/${b}?`,
      correctAnswer: String(n * b),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `Each whole holds ${b} pieces of size 1/${b} — so ${n} wholes hold ${n} × ${b}.`,
      ...baseFields('dividing unit fractions', '5.NF.B.7'),
    };
  }

  const food = pick(['raisins', 'flour', 'rice', 'trail mix', 'oats']);
  return {
    question: `How many 1/${b}-cup servings are in ${n} cups of ${food}?`,
    correctAnswer: String(n * b),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `Every cup gives ${b} servings, and there are ${n} cups.`,
    ...baseFields('dividing unit fractions', '5.NF.B.7'),
  };
};

/* ------------------------------------------------------------------ */

const GENERATORS_BY_SUBTOPIC = {
  'add and subtract unlike denominators': generateUnlikeDenominatorsQuestion,
  'mixed numbers': generateMixedNumbersQuestion,
  'fraction as division': generateFractionAsDivisionQuestion,
  'multiplying fractions': generateMultiplyingFractionsQuestion,
  'multiplication as scaling': generateScalingQuestion,
  'dividing unit fractions': generateDividingUnitFractionsQuestion,
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
