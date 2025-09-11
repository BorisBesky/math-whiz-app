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
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion() {
  // Array of all available question generators
  const questionTypes = [
    generateBinaryToDecimalQuestion,
    generateDecimalToBinaryQuestion,
    generateBinaryAdditionQuestion,
    generateBinaryComparisonQuestion,
    generateBinaryPlaceValueQuestion,
  ];
  
  // Randomly select a question type
  const selectedGenerator = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  return selectedGenerator();
}

// Convert binary to decimal
export function generateBinaryToDecimalQuestion() {
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
export function generateDecimalToBinaryQuestion() {
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
export function generateBinaryAdditionQuestion() {
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
export function generateBinaryComparisonQuestion() {
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
export function generateBinaryPlaceValueQuestion() {
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
