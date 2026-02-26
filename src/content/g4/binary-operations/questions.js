// Question generation for 4th Grade Binary Operations topic
import { QUESTION_TYPES } from '../../../constants/shared-constants.js';

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
  // Keep numbers small for 4th graders (1-15 decimal range)
  const decimal = getRandomInt(1, 15);
  const binary = decimalToBinary(decimal);


  return {
    question: `What is the decimal (base-10) value of the binary number ${binary}?`,
    correctAnswer: decimal.toString(),
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `In binary, each position represents a power of 2. From right to left: 1, 2, 4, 8, 16... Add up the positions where you see a 1.`,
    standard: '4.NBT.A.1',
    concept: 'Binary Operations',
    subtopic: 'binary to decimal conversion'
  };
}

// Convert decimal to binary
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateDecimalToBinaryQuestion(difficulty = 0.5) {
  // Keep numbers small for 4th graders (1-15 decimal range)
  const decimal = getRandomInt(1, 15);
  const correctBinary = decimalToBinary(decimal);


  return {
    question: `What is the binary (base-2) representation of the decimal number ${decimal}?`,
    correctAnswer: correctBinary,
    questionType: QUESTION_TYPES.NUMERIC,
    hint: `To convert to binary, keep dividing by 2 and write down the remainders from bottom to top. Or think: what powers of 2 add up to ${decimal}?`,
    standard: '4.NBT.A.1',
    concept: 'Binary Operations',
    subtopic: 'decimal to binary conversion'
  };
}

// Binary addition problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryAdditionQuestion(difficulty = 0.5) {
  // Use small numbers to keep it manageable for 4th graders
  const num1 = getRandomInt(1, 7);  // 1-7 in decimal
  const num2 = getRandomInt(1, 7);  // 1-7 in decimal

  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);
  const correctSum = addBinary(binary1, binary2);

  // Generate wrong answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongNum1 = getRandomInt(1, 10);
    const wrongNum2 = getRandomInt(1, 10);
    const wrongSum = decimalToBinary(wrongNum1 + wrongNum2);
    if (wrongSum !== correctSum && !wrongAnswers.includes(wrongSum)) {
      wrongAnswers.push(wrongSum);
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
    subtopic: 'binary addition'
  };
}

// Binary subtraction problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinarySubtractionQuestion(difficulty = 0.5) {
  // Ensure num1 > num2 so result is non-negative (appropriate for 4th graders)
  const num1 = getRandomInt(4, 15);
  const num2 = getRandomInt(1, num1 - 1);

  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);
  const correctDifference = subtractBinary(binary1, binary2);

  // Generate wrong answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongVal = getRandomInt(0, 14);
    const wrongBin = decimalToBinary(wrongVal);
    if (wrongBin !== correctDifference && !wrongAnswers.includes(wrongBin)) {
      wrongAnswers.push(wrongBin);
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
    subtopic: 'binary subtraction'
  };
}

// Binary multiplication problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryMultiplicationQuestion(difficulty = 0.5) {
  // Keep products in 1-15 range for 4th graders
  let num1 = getRandomInt(1, 7);
  let num2 = getRandomInt(1, 3);

  // Ensure product doesn't exceed 15
  if (num1 * num2 > 15) {
    num1 = getRandomInt(1, 5);
    num2 = getRandomInt(1, 3);
  }

  const product = num1 * num2;
  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);
  const correctProduct = decimalToBinary(product);

  // Generate wrong answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongVal = getRandomInt(1, 15);
    const wrongBin = decimalToBinary(wrongVal);
    if (wrongBin !== correctProduct && !wrongAnswers.includes(wrongBin)) {
      wrongAnswers.push(wrongBin);
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
    subtopic: 'binary multiplication'
  };
}

// Binary division problem
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryDivisionQuestion(difficulty = 0.5) {
  // Generate clean division problems (no remainders) for 4th graders
  // Pick a divisor (2-4) and quotient (1-5), then compute dividend
  let divisor = getRandomInt(2, 4);
  let quotient = getRandomInt(1, 5);
  let dividend = divisor * quotient;

  // Ensure dividend is within range
  if (dividend > 15) {
    divisor = 2;
    quotient = getRandomInt(1, 7);
    dividend = divisor * quotient;
  }

  const binaryDividend = decimalToBinary(dividend);
  const binaryDivisor = decimalToBinary(divisor);
  const correctQuotient = decimalToBinary(quotient);

  // Generate wrong answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongVal = getRandomInt(1, 10);
    const wrongBin = decimalToBinary(wrongVal);
    if (wrongBin !== correctQuotient && !wrongAnswers.includes(wrongBin)) {
      wrongAnswers.push(wrongBin);
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
    subtopic: 'binary division'
  };
}

// Compare binary numbers
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryComparisonQuestion(difficulty = 0.5) {
  const num1 = getRandomInt(3, 12);
  let num2 = getRandomInt(3, 12);
  // Ensure num2 is different from num1
  while (num2 === num1) {
    num2 = getRandomInt(3, 12);
  }

  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(num2);

  let correctAnswer, wrongAnswers;

  if (num1 > num2) {
    correctAnswer = `${binary1} > ${binary2}`;
    wrongAnswers = [
      `${binary1} < ${binary2}`,
      `${binary1} = ${binary2}`,
    ];
  } else {
    correctAnswer = `${binary1} < ${binary2}`;
    wrongAnswers = [
      `${binary1} > ${binary2}`,
      `${binary1} = ${binary2}`,
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
    subtopic: 'comparing binary numbers'
  };
}

// Binary place value question
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryPlaceValueQuestion(difficulty = 0.5) {
  // Use numbers that clearly show place value (powers of 2)
  const powers = [1, 2, 4, 8]; // 2^0, 2^1, 2^2, 2^3
  const selectedPower = powers[getRandomInt(0, powers.length - 1)];
  const binary = decimalToBinary(selectedPower);

  const placeNames = {
    1: "ones place (2⁰)",
    2: "twos place (2¹)",
    4: "fours place (2²)",
    8: "eights place (2³)"
  };

  const correctAnswer = placeNames[selectedPower];
  const wrongAnswers = Object.values(placeNames).filter(name => name !== correctAnswer);

  return {
    question: `In the binary number ${binary}, the digit 1 is in which place value?`,
    correctAnswer: correctAnswer,
    options: shuffleArray([correctAnswer, ...wrongAnswers.slice(0, 3)]),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `In binary, place values from right to left are: 1 (2⁰), 2 (2¹), 4 (2²), 8 (2³), and so on. Each place is worth twice the place to its right!`,
    standard: '4.NBT.A.1',
    concept: 'Binary Operations',
    subtopic: 'place value in binary'
  };
}
