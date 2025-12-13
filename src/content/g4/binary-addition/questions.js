// Question generation for 4th Grade Binary Addition topic

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

/**
 * Generates a random Binary Addition question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'binary to decimal conversion': { generator: generateBinaryToDecimalQuestion, minDifficulty: 0.0, maxDifficulty: 0.6 },
    'decimal to binary conversion': { generator: generateDecimalToBinaryQuestion, minDifficulty: 0.3, maxDifficulty: 0.8 },
    'binary addition': { generator: generateBinaryAdditionQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
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
  
  // Generate wrong answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    let wrong = getRandomInt(1, 20);
    if (wrong !== decimal && !wrongAnswers.includes(wrong)) {
      wrongAnswers.push(wrong);
    }
  }
  
  return {
    question: `What is the decimal (base-10) value of the binary number ${binary}?`,
    correctAnswer: decimal.toString(),
    options: shuffleArray([decimal.toString(), ...wrongAnswers.map(String)]),
    hint: `In binary, each position represents a power of 2. From right to left: 1, 2, 4, 8, 16... Add up the positions where you see a 1.`,
    standard: '4.NBT.A.1',
    concept: 'Binary Addition',
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
  
  // Generate wrong binary answers
  const wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongDecimal = getRandomInt(1, 20);
    const wrongBinary = decimalToBinary(wrongDecimal);
    if (wrongBinary !== correctBinary && !wrongAnswers.includes(wrongBinary)) {
      wrongAnswers.push(wrongBinary);
    }
  }
  
  return {
    question: `What is the binary (base-2) representation of the decimal number ${decimal}?`,
    correctAnswer: correctBinary,
    options: shuffleArray([correctBinary, ...wrongAnswers]),
    hint: `To convert to binary, keep dividing by 2 and write down the remainders from bottom to top. Or think: what powers of 2 add up to ${decimal}?`,
    standard: '4.NBT.A.1',
    concept: 'Binary Addition',
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
    hint: `Remember binary addition rules: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (which means write 0 and carry 1). You can also convert to decimal, add, then convert back!`,
    standard: '4.OA.A.3',
    concept: 'Binary Addition',
    subtopic: 'binary addition'
  };
}

// Compare binary numbers
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateBinaryComparisonQuestion(difficulty = 0.5) {
  const num1 = getRandomInt(3, 12);
  const num2 = getRandomInt(3, 12);
  
  // Make sure they're different
  const actualNum2 = num1 === num2 ? num2 + 1 : num2;
  
  const binary1 = decimalToBinary(num1);
  const binary2 = decimalToBinary(actualNum2);
  
  let correctAnswer, wrongAnswers;
  
  if (num1 > actualNum2) {
    correctAnswer = `${binary1} > ${binary2}`;
    wrongAnswers = [
      `${binary1} < ${binary2}`,
      `${binary1} = ${binary2}`,
      `Cannot compare binary numbers`
    ];
  } else {
    correctAnswer = `${binary1} < ${binary2}`;
    wrongAnswers = [
      `${binary1} > ${binary2}`,
      `${binary1} = ${binary2}`,
      `Cannot compare binary numbers`
    ];
  }
  
  return {
    question: `Which comparison is correct?`,
    correctAnswer: correctAnswer,
    options: shuffleArray([correctAnswer, ...wrongAnswers]),
    hint: `You can compare binary numbers by converting them to decimal first, or by comparing from left to right just like decimal numbers!`,
    standard: '4.NBT.A.2',
    concept: 'Binary Addition',
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
    hint: `In binary, place values from right to left are: 1 (2⁰), 2 (2¹), 4 (2²), 8 (2³), and so on. Each place is worth twice the place to its right!`,
    standard: '4.NBT.A.1',
    concept: 'Binary Addition',
    subtopic: 'place value in binary'
  };
}
