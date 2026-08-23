// Base Ten 5th (5.NBT) question generator.
//
// Contract (enforced by src/content/__tests__/topicContracts.test.js):
// generateQuestion(difficulty [0..1], allowedSubtopics | null) returns a
// question object — or null when the restriction can't be satisfied.
//
// Decimal values are handled as integer hundredths/thousandths internally so
// every answer is exact — never do float arithmetic on the displayed values.
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
  const sign = t < 0 ? '-' : '';
  const abs = Math.abs(t);
  const whole = Math.floor(abs / 1000);
  const frac = String(abs % 1000).padStart(3, '0').replace(/0+$/, '');
  return frac ? `${sign}${whole}.${frac}` : `${sign}${whole}`;
};

const fromHundredths = (h) => fromThousandths(h * 10);

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
  const base = Number(correctAnswer);
  while (options.size < 4) {
    options.add(Number.isNaN(base) ? `option ${bump}` : fromThousandths(Math.round(base * 1000) + bump * 1000));
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
/* decimal place value — places, digits, and 10× relationships         */
/* Formats:                                                            */
/*   "In the number <x>, which place is the digit <d> in?"             */
/*   "In the number <x>, what digit is in the <place> place?"          */
/*   "<A> is how many times as large as <B>?"                          */
/* ------------------------------------------------------------------ */
const PLACES = ['hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'];

// A 6-digit decimal like 347.916 with all-distinct, non-zero digits so a
// digit uniquely identifies its place.
const buildPlaceValueNumber = () => {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6);
  const text = `${digits[0]}${digits[1]}${digits[2]}.${digits[3]}${digits[4]}${digits[5]}`;
  return { digits, text };
};

const generateDecimalPlaceValueQuestion = (difficulty) => {
  const variant = difficulty < 0.35 ? randomInt(0, 1) : randomInt(1, 2);

  if (variant === 0) {
    const { digits, text } = buildPlaceValueNumber();
    const index = randomInt(0, 5);
    const correct = PLACES[index];
    return {
      question: `In the number ${text}, which place is the digit ${digits[index]} in?`,
      correctAnswer: correct,
      options: shuffle([
        correct,
        ...shuffle(PLACES.filter((p) => p !== correct)).slice(0, 3),
      ]),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'Places left of the point: ones, tens, hundreds. Right of the point: tenths, hundredths, thousandths.',
      ...baseFields('decimal place value', '5.NBT.A.3'),
    };
  }

  if (variant === 1) {
    const { digits, text } = buildPlaceValueNumber();
    const index = randomInt(0, 5);
    return {
      question: `In the number ${text}, what digit is in the ${PLACES[index]} place?`,
      correctAnswer: String(digits[index]),
      questionType: QUESTION_TYPES.NUMERIC,
      hint: 'Count places outward from the decimal point in the right direction.',
      ...baseFields('decimal place value', '5.NBT.A.3'),
    };
  }

  // 10× relationship (5.NBT.A.1): A = B shifted left by k places.
  const k = randomInt(1, 3);
  const factor = 10 ** k;
  const bThousandths = randomInt(2, 90) * 100; // e.g. 3.4
  const aThousandths = bThousandths * factor;
  return {
    question: `${fromThousandths(aThousandths)} is how many times as large as ${fromThousandths(bThousandths)}?`,
    correctAnswer: String(factor),
    options: buildOptions(factor, [10 ** (k + 1), 10 ** Math.max(k - 1, 0), factor * 2, factor + 10]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Count how many places the decimal point moved.',
    ...baseFields('decimal place value', '5.NBT.A.1'),
  };
};

/* ------------------------------------------------------------------ */
/* expanded form & number names — 5.NBT.A.3.a                          */
/* Reading and writing decimals three ways: base-ten numerals, number  */
/* names, and expanded form.                                           */
/* Formats:                                                            */
/*   "Which number is written as <expanded form>?"                     */
/*   "Which expanded form shows <decimal>?"                            */
/*   "How do you read <decimal>?"                                      */
/*   "Which number is \"<number name>\"?"                               */
/* ------------------------------------------------------------------ */
const ONES_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS_WORDS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const FRACTION_PLACES = ['tenth', 'hundredth', 'thousandth'];

const wholeToWords = (value) => {
  if (value < 20) return ONES_WORDS[value];
  if (value < 100) {
    const tens = TENS_WORDS[Math.floor(value / 10)];
    const ones = value % 10;
    return ones ? `${tens}-${ONES_WORDS[ones]}` : tens;
  }
  const hundreds = `${ONES_WORDS[Math.floor(value / 100)]} hundred`;
  const rest = value % 100;
  return rest ? `${hundreds} ${wholeToWords(rest)}` : hundreds;
};

// "347.916" → "three hundred forty-seven and nine hundred sixteen thousandths".
// The word "and" marks the decimal point, which is why the whole-number part
// never uses it.
const decimalToWords = (text) => {
  const [whole, frac = ''] = text.split('.');
  const wholeValue = Number(whole);
  if (!frac) return wholeToWords(wholeValue);
  const fracValue = Number(frac);
  const place = FRACTION_PLACES[frac.length - 1];
  const fracWords = `${wholeToWords(fracValue)} ${place}${fracValue === 1 ? '' : 's'}`;
  return wholeValue === 0 ? fracWords : `${wholeToWords(wholeValue)} and ${fracWords}`;
};

// "347.916" → "3 × 100 + 4 × 10 + 7 × 1 + 9 × (1/10) + 1 × (1/100) + 6 × (1/1000)"
const toExpandedForm = (text) => {
  const [whole, frac = ''] = text.split('.');
  const wholeTerms = whole
    .split('')
    .map((digit, index) => (digit === '0' ? null : `${digit} × ${10 ** (whole.length - 1 - index)}`))
    .filter(Boolean);
  const fracTerms = frac
    .split('')
    .map((digit, index) => (digit === '0' ? null : `${digit} × (1/${10 ** (index + 1)})`))
    .filter(Boolean);
  return [...wholeTerms, ...fracTerms].join(' + ');
};

// A decimal with all-distinct non-zero digits, so every expanded-form term is
// present and a digit names its place unambiguously.
const buildExpandableNumber = (wholeDigits, fracDigits) => {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, wholeDigits + fracDigits);
  const whole = digits.slice(0, wholeDigits).join('');
  const frac = digits.slice(wholeDigits).join('');
  return frac ? `${whole}.${frac}` : whole;
};

// Reject twins a student would never see written that way: a padded whole
// part (05.31) or a trailing zero in the fraction (6.770).
const isTidyDecimal = (text) => {
  const [whole, frac = ''] = text.split('.');
  if (whole.length > 1 && whole.startsWith('0')) return false;
  return !frac.endsWith('0');
};

// Swap two digits of a decimal to make a plausible-but-wrong twin.
const swapDigits = (text, seed) => {
  const positions = [...text].map((char, index) => (char === '.' ? null : index)).filter((i) => i !== null);
  const first = positions[seed % positions.length];
  const second = positions[(seed + 1 + (seed % (positions.length - 1))) % positions.length];
  if (first === second) return null;
  const characters = [...text];
  [characters[first], characters[second]] = [characters[second], characters[first]];
  const swapped = characters.join('');
  if (swapped === text || !isTidyDecimal(swapped)) return null;
  return swapped;
};

// Distinct digit-swapped twins of a decimal, for building distractors.
const twinsOf = (text) => [
  ...new Set([1, 2, 3, 4, 5, 6].map((seed) => swapDigits(text, seed)).filter(Boolean)),
].filter((twin) => twin !== text);

const generateExpandedFormQuestion = (difficulty) => {
  const fracDigits = difficulty < 0.4 ? 2 : 3;
  const wholeDigits = difficulty < 0.7 ? 2 : 3;
  const variant = randomInt(0, 3);

  if (variant === 0 || variant === 1) {
    const text = buildExpandableNumber(wholeDigits, fracDigits);
    const twins = twinsOf(text);

    if (variant === 0) {
      return {
        question: `Which number is written as ${toExpandedForm(text)}?`,
        correctAnswer: text,
        options: buildOptions(text, twins),
        questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
        hint: 'Each term names one place: × 10 is tens, × (1/10) is tenths, × (1/100) is hundredths.',
        ...baseFields('expanded form', '5.NBT.A.3'),
      };
    }

    const correct = toExpandedForm(text);
    return {
      question: `Which expanded form shows ${text}?`,
      correctAnswer: correct,
      options: buildOptions(correct, twins.map(toExpandedForm)),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'Write one term per digit, using the value of the place that digit sits in.',
      ...baseFields('expanded form', '5.NBT.A.3'),
    };
  }

  // Number-name variants. Zeros are allowed here — reading 0.407 as "four
  // hundred seven thousandths" is exactly the skill.
  const whole = randomInt(0, 1) === 0 ? 0 : randomInt(1, 10 ** wholeDigits - 1);
  let frac = String(randomInt(1, 10 ** fracDigits - 1)).padStart(fracDigits, '0');
  if (frac.endsWith('0')) frac = `${frac.slice(0, -1)}${randomInt(1, 9)}`; // no trailing zero
  const text = `${whole}.${frac}`;
  const correctWords = decimalToWords(text);

  // Distractors in teaching order: naming the wrong place is the misconception
  // worth confronting, so those come first; dropping a placeholder zero next;
  // then digit-swapped twins and scaled readings as guaranteed filler, because
  // a number like 0.03 has too few distinct digits to swap.
  const fracValue = Number(frac);
  const strippedFrac = frac.replace(/^0+/, '');
  const readAs = (value, placeIndex) =>
    `${whole === 0 ? '' : `${wholeToWords(whole)} and `}` +
    `${wholeToWords(value)} ${FRACTION_PLACES[placeIndex]}${value === 1 ? '' : 's'}`;

  const wordDistractors = [
    ...new Set([
      // same digits, wrong place name
      ...[0, 1, 2].filter((index) => index !== frac.length - 1).map((index) => readAs(fracValue, index)),
      // "0.407 → forty-seven thousandths": the placeholder zero got dropped
      strippedFrac && strippedFrac !== frac ? decimalToWords(`${whole}.${strippedFrac}`) : null,
      ...twinsOf(text).map(decimalToWords),
      ...[0, 1, 2].map((index) => readAs(fracValue * 10, index)),
    ].filter(Boolean)),
  ].filter((option) => option !== correctWords);

  if (variant === 2) {
    return {
      question: `How do you read ${text}?`,
      correctAnswer: correctWords,
      options: buildOptions(correctWords, wordDistractors),
      questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
      hint: 'Read the whole number, say "and" for the decimal point, then name the last place you reach.',
      ...baseFields('expanded form', '5.NBT.A.3'),
    };
  }

  return {
    question: `Which number is "${correctWords}"?`,
    correctAnswer: text,
    options: buildOptions(text, twinsOf(text)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'The last place named tells you how many digits go after the decimal point.',
    ...baseFields('expanded form', '5.NBT.A.3'),
  };
};

/* ------------------------------------------------------------------ */
/* powers of ten — shift the decimal point (5.NBT.A.2)                 */
/* Format: "What is <x> × <p>?" or "What is <x> ÷ <p>?" with p in      */
/* {10, 100, 1000}                                                     */
/* ------------------------------------------------------------------ */
const generatePowersOfTenQuestion = (difficulty) => {
  const k = difficulty < 0.4 ? 1 : randomInt(1, 3);
  const power = 10 ** k;
  const multiply = randomInt(0, 1) === 0;

  // Build from the smaller value up so division is always exact: the smaller
  // side has up to two decimal places (integer thousandths, multiple of 10).
  const smallThousandths = randomInt(2, 999) * 10; // e.g. 4.87
  const xThousandths = multiply ? smallThousandths : smallThousandths * power;
  const resultThousandths = multiply ? smallThousandths * power : smallThousandths;

  const x = fromThousandths(xThousandths);
  const correct = fromThousandths(resultThousandths);
  const wrongShift = multiply ? xThousandths / power : xThousandths * power;
  const distractors = [
    Number.isInteger(wrongShift) ? fromThousandths(wrongShift) : null,
    fromThousandths(multiply ? resultThousandths * 10 : Math.round(resultThousandths / 10)),
    fromThousandths(xThousandths),
  ].filter(Boolean);

  return {
    question: `What is ${x} ${multiply ? '×' : '÷'} ${power}?`,
    correctAnswer: correct,
    options: buildOptions(correct, distractors),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `${multiply ? 'Multiplying' : 'Dividing'} by ${power} moves the decimal point ${k} place${k > 1 ? 's' : ''} to the ${multiply ? 'right' : 'left'}.`,
    ...baseFields('powers of ten', '5.NBT.A.2'),
  };
};

/* ------------------------------------------------------------------ */
/* comparing decimals — to thousandths (5.NBT.A.3)                     */
/* Format: "Which symbol makes this true? <a> __ <b>"                  */
/* ------------------------------------------------------------------ */
const generateComparingDecimalsQuestion = (difficulty) => {
  let aThousandths;
  let bThousandths;

  if (difficulty < 0.4) {
    aThousandths = randomInt(1, 99) * 10;
    bThousandths = randomInt(1, 99) * 10;
  } else if (randomInt(0, 4) === 0) {
    // Same value written differently, e.g. 0.5 vs 0.50 → "=" is correct
    aThousandths = randomInt(1, 9) * 100;
    bThousandths = aThousandths;
  } else {
    // Tricky near-misses like 0.45 vs 0.405
    const base = randomInt(10, 98);
    aThousandths = base * 10;
    bThousandths = Math.floor(base / 10) * 100 + (base % 10);
  }

  const correct = aThousandths > bThousandths ? '>' : aThousandths < bThousandths ? '<' : '=';
  const a = fromThousandths(aThousandths);
  const b =
    aThousandths === bThousandths && randomInt(0, 1) === 0
      ? `${fromThousandths(bThousandths)}0` // show the trailing-zero twin (e.g. 0.50)
      : fromThousandths(bThousandths);

  return {
    question: `Which symbol makes this true? ${a} __ ${b}`,
    correctAnswer: correct,
    options: shuffle(['>', '<', '=']),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Line up the decimal points and compare place by place from the left.',
    ...baseFields('comparing decimals', '5.NBT.A.3'),
  };
};

/* ------------------------------------------------------------------ */
/* rounding decimals — to any place (5.NBT.A.4)                        */
/* Format: "Round <x> to the nearest <whole number|tenth|hundredth>."  */
/* ------------------------------------------------------------------ */
const generateRoundingDecimalsQuestion = (difficulty) => {
  const targets = difficulty < 0.4 ? ['whole number', 'tenth'] : ['whole number', 'tenth', 'hundredth'];
  const target = pick(targets);

  // x in thousandths with a non-zero thousandths digit so rounding matters.
  const xThousandths = randomInt(100, 8999) * 10 + randomInt(1, 9);
  const divisor = target === 'whole number' ? 1000 : target === 'tenth' ? 100 : 10;
  const roundedThousandths = Math.round(xThousandths / divisor) * divisor;

  const x = fromThousandths(xThousandths);
  const correct = fromThousandths(roundedThousandths);
  const down = Math.floor(xThousandths / divisor) * divisor;
  const up = down + divisor;
  const distractors = [
    fromThousandths(roundedThousandths === down ? up : down),
    fromThousandths(Math.round(xThousandths / (divisor * 10)) * divisor * 10),
    fromThousandths(xThousandths),
  ];

  return {
    question: `Round ${x} to the nearest ${target}.`,
    correctAnswer: correct,
    options: buildOptions(correct, distractors),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Look at the digit just to the right of the ${target === 'whole number' ? 'ones' : target + 's'} place: 5 or more rounds up.`,
    ...baseFields('rounding decimals', '5.NBT.A.4'),
  };
};

/* ------------------------------------------------------------------ */
/* multi-digit multiplication — standard algorithm fluency (5.NBT.B.5) */
/* Format: "What is <a> × <b>?"                                        */
/* ------------------------------------------------------------------ */
const generateMultiDigitMultiplicationQuestion = (difficulty) => {
  let a;
  let b;
  if (difficulty < 0.3) {
    a = randomInt(12, 99);
    b = randomInt(12, 99);
  } else if (difficulty < 0.7) {
    a = randomInt(100, 999);
    b = randomInt(12, 99);
  } else {
    a = randomInt(1000, 9999);
    b = randomInt(12, 99);
  }

  return {
    question: `What is ${a} × ${b}?`,
    correctAnswer: String(a * b),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `Break it apart: ${a} × ${b} = ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10}.`,
    ...baseFields('multi-digit multiplication', '5.NBT.B.5'),
  };
};

/* ------------------------------------------------------------------ */
/* division with two-digit divisors (5.NBT.B.6)                        */
/* Formats: "What is <n> ÷ <d>?"                                       */
/*          "What is the remainder when <n> is divided by <d>?"        */
/* ------------------------------------------------------------------ */
const generateTwoDigitDivisorQuestion = (difficulty) => {
  const divisor = randomInt(11, difficulty < 0.5 ? 25 : 99);
  const quotient = randomInt(3, Math.min(99, Math.floor(9999 / divisor)));

  if (difficulty < 0.75) {
    const dividend = divisor * quotient;
    return {
      question: `What is ${dividend} ÷ ${divisor}?`,
      correctAnswer: String(quotient),
      options: [],
      questionType: QUESTION_TYPES.NUMERIC,
      hint: `Ask: ${divisor} times what number makes ${dividend}? Try multiples of 10 first.`,
      ...baseFields('division with two-digit divisors', '5.NBT.B.6'),
    };
  }

  const remainder = randomInt(1, divisor - 1);
  const dividend = divisor * quotient + remainder;
  return {
    question: `What is the remainder when ${dividend} is divided by ${divisor}?`,
    correctAnswer: String(remainder),
    options: [],
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `Find the biggest multiple of ${divisor} that fits in ${dividend}, then see what is left over.`,
    ...baseFields('division with two-digit divisors', '5.NBT.B.6'),
  };
};

/* ------------------------------------------------------------------ */
/* decimal operations — +, −, ×, ÷ to hundredths (5.NBT.B.7)           */
/* Format: "What is <a> <op> <b>?"                                     */
/* ------------------------------------------------------------------ */

// Pick a non-integer decimal magnitude in hundredths.
// Range: 0.11–0.99 (hundredths) or 1.1–9.9 (tenths), never a whole number.
// Prevents "decimal operations" questions from rendering as "5 × 3" etc.
const pickHundredthsMagnitude = () => {
  if (randomInt(0, 1) === 0) return randomInt(11, 99); // 0.11 – 0.99
  let tenthsVal = randomInt(11, 99); // aiming for 1.1 – 9.9
  if (tenthsVal % 10 === 0) tenthsVal += 1; // avoid whole numbers like 20 → "2"
  return tenthsVal * 10;
};

const generateDecimalOperationsQuestion = (difficulty) => {
  const operation = difficulty < 0.35 ? pick(['+', '−']) : pick(['+', '−', '×', '÷']);

  let aH; // hundredths
  let bH;
  let resultH;
  let bText;
  let hint;

  if (operation === '+') {
    aH = randomInt(10, 999);
    bH = randomInt(10, 999);
    resultH = aH + bH;
    bText = fromHundredths(bH);
    hint = 'Line up the decimal points, then add place by place.';
  } else if (operation === '−') {
    bH = randomInt(10, 899);
    resultH = randomInt(10, 999 - bH);
    aH = bH + resultH;
    bText = fromHundredths(bH);
    hint = 'Line up the decimal points, then subtract place by place.';
  } else if (operation === '×') {
    aH = pickHundredthsMagnitude(); // e.g. 0.25 or 2.5, never a whole number
    const whole = randomInt(2, 9);
    bH = whole * 100;
    resultH = aH * whole;
    bText = String(whole);
    hint = 'Multiply as if there were no decimal point, then place it back.';
  } else {
    const whole = randomInt(2, 9);
    resultH = pickHundredthsMagnitude();
    aH = resultH * whole;
    bH = whole * 100;
    bText = String(whole);
    hint = 'Divide as usual — the decimal point in the answer lines up with the dividend.';
  }

  const correct = fromHundredths(resultH);
  const distractors = [
    fromHundredths(resultH * 10),
    Number.isInteger(resultH / 10) ? fromHundredths(resultH / 10) : fromHundredths(resultH + 1),
    fromHundredths(resultH + 100),
  ];

  return {
    question: `What is ${fromHundredths(aH)} ${operation} ${bText}?`,
    correctAnswer: correct,
    options: buildOptions(correct, distractors),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint,
    ...baseFields('decimal operations', '5.NBT.B.7'),
  };
};

/* ------------------------------------------------------------------ */

const GENERATORS_BY_SUBTOPIC = {
  'decimal place value': generateDecimalPlaceValueQuestion,
  'expanded form': generateExpandedFormQuestion,
  'powers of ten': generatePowersOfTenQuestion,
  'comparing decimals': generateComparingDecimalsQuestion,
  'rounding decimals': generateRoundingDecimalsQuestion,
  'multi-digit multiplication': generateMultiDigitMultiplicationQuestion,
  'division with two-digit divisors': generateTwoDigitDivisorQuestion,
  'decimal operations': generateDecimalOperationsQuestion,
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

const baseTenQuestions = { generateQuestion };

export default baseTenQuestions;
