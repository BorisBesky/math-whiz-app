// Question generation for 4th Grade Binary Operations topic
import { QUESTION_TYPES } from '../../../constants/topics.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Convert decimal to binary
function decimalToBinary(decimal) {
  return decimal.toString(2);
}

// Convert binary string to decimal
function binaryToDecimal(binary) {
  return parseInt(binary, 2);
}

// Add two binary strings and return the result as binary
function addBinary(bin1, bin2) {
  const decimal1 = binaryToDecimal(bin1);
  const decimal2 = binaryToDecimal(bin2);
  const sum = decimal1 + decimal2;
  return decimalToBinary(sum);
}

// Subtract two binary strings (bin1 - bin2), assumes bin1 >= bin2
function subtractBinary(bin1, bin2) {
  const decimal1 = binaryToDecimal(bin1);
  const decimal2 = binaryToDecimal(bin2);
  const difference = decimal1 - decimal2;
  return decimalToBinary(difference);
}


/**
 * Generates a random Binary Operations question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'binary to decimal conversion': { generator: generateBinaryToDecimalQuestion, minDifficulty: 0.0, maxDifficulty: 0.6 },
    'decimal to binary conversion': { generator: generateDecimalToBinaryQuestion, minDifficulty: 0.3, maxDifficulty: 0.8 },
    'binary addition': { generator: generateBinaryAdditionQuestion, minDifficulty: 0.4, maxDifficulty: 0.9 },
    'binary subtraction': { generator: generateBinarySubtractionQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    'binary multiplication': { generator: generateBinaryMultiplicationQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
    'binary division': { generator: generateBinaryDivisionQuestion, minDifficulty: 0.7, maxDifficulty: 1.0 },
    'place value in binary': { generator: generateBinaryPlaceValueQuestion, minDifficulty: 0.2, maxDifficulty: 0.7 },
    'comparing binary numbers': { generator: generateBinaryComparisonQuestion, minDifficulty: 0.4, maxDifficulty: 0.9 },
  };

  // Normalize subtopic names for comparison
  const normalize = (str) => str.toLowerCase().trim();

  // If allowed subtopics are specified, filter to only those generators
  let questionTypes;
  if (allowedSubtopics && allowedSubtopics.length > 0) {
    const normalizedAllowed = allowedSubtopics.map(normalize);
    questionTypes = Object.entries(subtopicToGenerator)
      .filter(([subtopic]) => normalizedAllowed.includes(normalize(subtopic)))
      .map(([_, config]) => config);
  } else {
    // Default: all question types
    questionTypes = Object.values(subtopicToGenerator);
  }

  // Filter available questions based on difficulty
  const available = questionTypes.filter(
    q => difficulty >= q.minDifficulty && difficulty <= q.maxDifficulty
  );

  // If no questions available for this difficulty, use all question types (relax difficulty constraint)
  const candidates = available.length > 0 ? available : questionTypes;

  // If still no valid question types, return null
  if (candidates.length === 0) {
    console.warn('[generateQuestion] No valid question types found for allowed subtopics:', allowedSubtopics);
    return null;
  }
  // Randomly select from available types
  const selected = candidates[getRandomInt(0, candidates.length - 1)];
  return selected.generator(difficulty);
}

// Convert binary to decimal
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryToDecimalQuestion(difficulty = 0.5) {
  // Scale the decimal range with difficulty so the adaptive engine can actually
  // stretch stronger students on this subtopic. The old code hard-coded
  // getRandomInt(1, 15) regardless of `difficulty`, so easy and hard quizzes
  // both showed the same 4-bit numbers.
  const maxDecimal = difficulty < 0.35 ? 7 : difficulty < 0.7 ? 15 : 31;
  const decimal = getRandomInt(1, maxDecimal);
  const binary = decimalToBinary(decimal);


  return {
    question: `What is the decimal (base-10) value of the binary number ${binary}?`,
    correctAnswer: decimal.toString(),
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `In binary, each position represents a power of 2. From right to left: 1, 2, 4, 8, 16... Add up the positions where you see a 1.`,
    standard: '4.NBT.A.1',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'binary to decimal conversion'
  };
}

// Convert decimal to binary
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateDecimalToBinaryQuestion(difficulty = 0.5) {
  // Scale the decimal range with difficulty — same reasoning as the sibling
  // binary→decimal generator above.
  const maxDecimal = difficulty < 0.35 ? 7 : difficulty < 0.7 ? 15 : 31;
  const decimal = getRandomInt(1, maxDecimal);
  const correctBinary = decimalToBinary(decimal);


  return {
    question: `What is the binary (base-2) representation of the decimal number ${decimal}?`,
    correctAnswer: correctBinary,
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `To convert to binary, keep dividing by 2 and write down the remainders from bottom to top. Or think: what powers of 2 add up to ${decimal}?`,
    standard: '4.NBT.A.1',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'decimal to binary conversion'
  };
}

// Binary addition problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryAdditionQuestion(difficulty = 0.5) {
  // Scale the operand range with difficulty so the adaptive engine can
  // actually stretch stronger students. The old code hard-coded (1,7) at
  // every difficulty, so easy and hard quizzes showed the same bit widths.
  const maxOperand = difficulty < 0.6 ? 7 : difficulty < 0.85 ? 10 : 15;
  const num1 = getRandomInt(1, maxOperand);
  const num2 = getRandomInt(1, maxOperand);

  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);
  const correctSum = addBinary(binary1, binary2);

  // Generate wrong answers. Draw from a larger range than the operand range
  // so plausible near-sum distractors are available; the attempts guard
  // keeps a future narrowing of the pool from spinning forever.
  const wrongPoolMax = Math.max(maxOperand * 2 + 2, 20);
  const wrongAnswers = [];
  let attempts = 0;
  while (wrongAnswers.length < 3 && attempts < 50) {
    attempts++;
    const wrongNum1 = getRandomInt(1, wrongPoolMax);
    const wrongNum2 = getRandomInt(1, wrongPoolMax);
    const wrongSum = decimalToBinary(wrongNum1 + wrongNum2);
    if (wrongSum !== correctSum && !wrongAnswers.includes(wrongSum)) {
      wrongAnswers.push(wrongSum);
    }
  }
  // Deterministic fallback — plausible near-sum values the student can
  // reasonably mis-add to. Guarantees four distinct options even if the
  // random draws keep colliding.
  const correctDecimalSum = num1 + num2;
  for (const delta of [1, -1, 2, -2, 3]) {
    if (wrongAnswers.length >= 3) break;
    const value = correctDecimalSum + delta;
    if (value < 1) continue;
    const bin = decimalToBinary(value);
    if (bin !== correctSum && !wrongAnswers.includes(bin)) {
      wrongAnswers.push(bin);
    }
  }

  return {
    question: `Add these binary numbers: ${binary1} + ${binary2} = ?`,
    correctAnswer: correctSum,
    options: shuffleArray([correctSum, ...wrongAnswers]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Remember binary addition rules: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (which means write 0 and carry 1). You can also convert to decimal, add, then convert back!`,
    standard: '4.OA.A.3',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'binary addition'
  };
}

// Binary subtraction problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinarySubtractionQuestion(difficulty = 0.5) {
  // Scale minuend ceiling with difficulty — the old code used (4,15) at
  // every difficulty, so stronger students never saw wider bit patterns.
  // Ensure num1 > num2 so result is non-negative (appropriate for 4th graders).
  const maxMinuend = difficulty < 0.65 ? 10 : difficulty < 0.9 ? 15 : 31;
  const num1 = getRandomInt(4, maxMinuend);
  const num2 = getRandomInt(1, num1 - 1);

  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);
  const correctDifference = subtractBinary(binary1, binary2);

  // Generate wrong answers. Attempt cap guards against a future narrowing
  // of the pool (e.g. tiny num1) that would otherwise exhaust the draws.
  const wrongPoolMax = Math.max(num1, 14);
  const wrongAnswers = [];
  let attempts = 0;
  while (wrongAnswers.length < 3 && attempts < 50) {
    attempts++;
    const wrongVal = getRandomInt(0, wrongPoolMax);
    const wrongBin = decimalToBinary(wrongVal);
    if (wrongBin !== correctDifference && !wrongAnswers.includes(wrongBin)) {
      wrongAnswers.push(wrongBin);
    }
  }
  // Deterministic fallback — common off-by-one errors around the real
  // difference. Ensures four distinct options regardless of draws.
  const correctDecimalDiff = num1 - num2;
  for (const delta of [1, -1, 2, -2, 3]) {
    if (wrongAnswers.length >= 3) break;
    const value = correctDecimalDiff + delta;
    if (value < 0) continue;
    const bin = decimalToBinary(value);
    if (bin !== correctDifference && !wrongAnswers.includes(bin)) {
      wrongAnswers.push(bin);
    }
  }

  return {
    question: `Subtract these binary numbers: ${binary1} - ${binary2} = ?`,
    correctAnswer: correctDifference,
    options: shuffleArray([correctDifference, ...wrongAnswers]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `You can convert both numbers to decimal, subtract, then convert back to binary! Or use binary borrowing: when you need to subtract 1 from 0, borrow from the next column (just like in decimal).`,
    standard: '4.NBT.B.4',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'binary subtraction'
  };
}

// Binary multiplication problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryMultiplicationQuestion(difficulty = 0.5) {
  // Keep products in a difficulty-scaled range. Compute num2's ceiling from
  // num1 so the product never exceeds productMax — the old roll-and-reroll
  // guard only fired when num1 happened to be 6 or 7 and otherwise capped
  // at the same ceiling, which was close to dead code.
  const productMax = difficulty < 0.8 ? 15 : difficulty < 0.95 ? 24 : 31;
  const num1Max = Math.min(7, productMax);
  const num1 = getRandomInt(1, num1Max);
  const num2 = getRandomInt(1, Math.max(1, Math.floor(productMax / num1)));

  const product = num1 * num2;
  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);
  const correctProduct = decimalToBinary(product);

  // Generate wrong answers from a range that comfortably exceeds the
  // product ceiling so plausible distractors exist; attempts guard added
  // for defense in depth.
  const wrongPoolMax = Math.max(productMax, 15);
  const wrongAnswers = [];
  let attempts = 0;
  while (wrongAnswers.length < 3 && attempts < 50) {
    attempts++;
    const wrongVal = getRandomInt(1, wrongPoolMax);
    const wrongBin = decimalToBinary(wrongVal);
    if (wrongBin !== correctProduct && !wrongAnswers.includes(wrongBin)) {
      wrongAnswers.push(wrongBin);
    }
  }
  // Deterministic fallback — common slip-ups: num1+num2 (added instead of
  // multiplied) and product +/-1. Guarantees four distinct options.
  const fallbackCandidates = [num1 + num2, product + 1, product - 1, product + 2];
  for (const value of fallbackCandidates) {
    if (wrongAnswers.length >= 3) break;
    if (value < 1) continue;
    const bin = decimalToBinary(value);
    if (bin !== correctProduct && !wrongAnswers.includes(bin)) {
      wrongAnswers.push(bin);
    }
  }

  return {
    question: `Multiply these binary numbers: ${binary1} × ${binary2} = ?`,
    correctAnswer: correctProduct,
    options: shuffleArray([correctProduct, ...wrongAnswers]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Try converting to decimal first: ${binary1} = ${num1} and ${binary2} = ${num2}. Multiply in decimal, then convert back to binary!`,
    standard: '4.NBT.B.5',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'binary multiplication'
  };
}

// Binary division problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryDivisionQuestion(difficulty = 0.5) {
  // Generate clean division problems (no remainders) for 4th graders.
  // Compute the quotient's ceiling from the chosen divisor and a scaled
  // dividend ceiling, so the product never exceeds dividendMax up front —
  // the old roll-and-reroll guard still allowed the first path to produce
  // a dividend of 20 (4*5) and only reliably capped on the second roll.
  const dividendMax = difficulty < 0.85 ? 15 : difficulty < 0.95 ? 24 : 31;
  const divisor = getRandomInt(2, 4);
  const quotient = getRandomInt(1, Math.max(1, Math.floor(dividendMax / divisor)));
  const dividend = divisor * quotient;

  const binaryDividend = decimalToBinary(dividend);
  const binaryDivisor = decimalToBinary(divisor);
  const correctQuotient = decimalToBinary(quotient);

  // Generate wrong answers. Pool exceeds the quotient ceiling comfortably;
  // attempts guard added for defense in depth.
  const quotientMax = Math.max(10, Math.ceil(dividendMax / 2));
  const wrongAnswers = [];
  let attempts = 0;
  while (wrongAnswers.length < 3 && attempts < 50) {
    attempts++;
    const wrongVal = getRandomInt(1, quotientMax);
    const wrongBin = decimalToBinary(wrongVal);
    if (wrongBin !== correctQuotient && !wrongAnswers.includes(wrongBin)) {
      wrongAnswers.push(wrongBin);
    }
  }
  // Deterministic fallback — plausible slips: off-by-one around the real
  // quotient, and the dividend itself (forgot to divide). Guarantees four
  // distinct options.
  const fallbackCandidates = [quotient + 1, Math.max(1, quotient - 1), quotient + 2, dividend];
  for (const value of fallbackCandidates) {
    if (wrongAnswers.length >= 3) break;
    if (value < 1) continue;
    const bin = decimalToBinary(value);
    if (bin !== correctQuotient && !wrongAnswers.includes(bin)) {
      wrongAnswers.push(bin);
    }
  }

  return {
    question: `Divide these binary numbers: ${binaryDividend} ÷ ${binaryDivisor} = ?`,
    correctAnswer: correctQuotient,
    options: shuffleArray([correctQuotient, ...wrongAnswers]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Convert to decimal first: ${binaryDividend} = ${dividend} and ${binaryDivisor} = ${divisor}. Divide in decimal, then convert back to binary!`,
    standard: '4.NBT.B.6',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'binary division'
  };
}

// Compare binary numbers
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryComparisonQuestion(difficulty = 0.5) {
  // Scale the comparison range with difficulty — the old code used (3,12)
  // at every difficulty, so stronger students never had to compare wider
  // bit patterns.
  const maxVal = difficulty < 0.6 ? 7 : difficulty < 0.85 ? 15 : 31;
  const minVal = Math.min(3, maxVal - 1);
  const num1 = getRandomInt(minVal, maxVal);
  let num2 = getRandomInt(minVal, maxVal);
  // Ensure num2 is different from num1
  let numAttempts = 0;
  while (num2 === num1 && numAttempts++ < 50) {
    num2 = getRandomInt(minVal, maxVal);
  }
  if (num2 === num1) {
    // Guaranteed-distinct fallback when the pool is small.
    num2 = num1 === maxVal ? minVal : num1 + 1;
  }

  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);

  let correctAnswer, wrongAnswers;

  // Comparing two distinct positive integers yields only three distinct claims
  // (greater, less, equal). The former reversed-operand distractor was the same
  // claim as the wrong-direction one written the other way — a student saw two
  // options that meant the same thing and one was arbitrarily "correct". Use
  // "Cannot be determined" as a clearly-wrong fourth so all four options are
  // semantically distinct.
  if (num1 > num2) {
    correctAnswer = `${binary1} > ${binary2}`;
    wrongAnswers = [
      `${binary1} < ${binary2}`,
      `${binary1} = ${binary2}`,
      `Cannot be determined`,
    ];
  } else {
    correctAnswer = `${binary1} < ${binary2}`;
    wrongAnswers = [
      `${binary1} > ${binary2}`,
      `${binary1} = ${binary2}`,
      `Cannot be determined`,
    ];
  }

  return {
    question: `Which comparison is correct?`,
    correctAnswer: correctAnswer,
    options: shuffleArray([correctAnswer, ...wrongAnswers]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `You can compare binary numbers by converting them to decimal first, or by comparing from left to right just like decimal numbers!`,
    standard: '4.NBT.A.2',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'comparing binary numbers'
  };
}

// Binary place value question
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryPlaceValueQuestion(difficulty = 0.5) {
  // Use numbers that clearly show place value (powers of 2). Scale which
  // powers are drawn so stronger students see higher place-value positions.
  // The old code hard-coded [1,2,4,8] regardless of difficulty.
  const allPowers = [1, 2, 4, 8, 16, 32];
  const powerCount = difficulty < 0.4 ? 3 : difficulty < 0.7 ? 4 : difficulty < 0.9 ? 5 : 6;
  const powers = allPowers.slice(0, powerCount);
  const selectedPower = powers[getRandomInt(0, powers.length - 1)];
  const binary = decimalToBinary(selectedPower);

  const placeNames = {
    1: "ones place (2⁰)",
    2: "twos place (2¹)",
    4: "fours place (2²)",
    8: "eights place (2³)",
    16: "sixteens place (2⁴)",
    32: "thirty-twos place (2⁵)",
  };

  const correctAnswer = placeNames[selectedPower];
  // Draw distractors from the full set of other place names, then shuffle
  // before slicing so students see varied distractors at higher difficulty
  // (not just the three smallest places every time).
  const wrongAnswers = shuffleArray(
    Object.values(placeNames).filter((name) => name !== correctAnswer)
  );

  return {
    question: `In the binary number ${binary}, the digit 1 is in which place value?`,
    correctAnswer: correctAnswer,
    options: shuffleArray([correctAnswer, ...wrongAnswers.slice(0, 3)]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `In binary, place values from right to left are: 1 (2⁰), 2 (2¹), 4 (2²), 8 (2³), and so on. Each place is worth twice the place to its right!`,
    standard: '4.NBT.A.1',
    concept: 'Binary Operations',
    grade: 'G4',
    subtopic: 'place value in binary'
  };
}
