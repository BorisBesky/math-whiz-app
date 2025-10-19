// Question generation for 4th Grade Operations & Algebraic Thinking topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random Operations & Algebraic Thinking question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5) {
  // Define question types with minimum and maximum difficulty thresholds
  const questionTypes = [
    { generator: generateNumberPatternQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    { generator: generateSequenceCompletionQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    { generator: generateMultiplicativeComparisonQuestion, minDifficulty: 0.2, maxDifficulty: 1.0 },
    { generator: generateTwoDigitMultiplicationQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    { generator: generateFactorsQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    { generator: generateLongDivisionNoRemainderQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    { generator: generatePrimeCompositeQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    { generator: generateMultiplicationWordProblemQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    { generator: generatePatternRuleQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    { generator: generateDivisionWordProblemQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    { generator: generateTwoStepPatternQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
    { generator: generateLongDivisionWithRemainderQuestion, minDifficulty: 0.7, maxDifficulty: 1.0 },
  ];
  
  // Filter available questions based on difficulty
  const available = questionTypes.filter(
    q => difficulty >= q.minDifficulty && difficulty <= q.maxDifficulty
  );
  
  // Randomly select from available types
  const selected = available[getRandomInt(0, available.length - 1)];
  return selected.generator(difficulty);
}

// Additional specialized question generators
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateMultiplicativeComparisonQuestion(difficulty = 0.5) {
  const base = getRandomInt(2, 8);
  const multiplier = getRandomInt(2, 6);
  const result = base * multiplier;
  const correctAnswer = result.toString();

  const scenarios = [
    {
      question: `Sarah has ${base} stickers. Tom has ${multiplier} times as many stickers as Sarah. How many stickers does Tom have?`,
      hint: `"${multiplier} times as many" means multiply ${base} by ${multiplier}.`,
    },
    {
      question: `A small box holds ${base} marbles. A large box holds ${multiplier} times as many marbles. How many marbles are in the large box?`,
      hint: `"${multiplier} times as many" means multiply ${base} by ${multiplier}.`,
    },
    {
      question: `Lisa collected ${base} shells. Maya collected ${multiplier} times as many shells as Lisa. How many shells did Maya collect?`,
      hint: `"${multiplier} times as many" means multiply ${base} by ${multiplier}.`,
    },
  ];

  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  const potentialDistractors = [
    (base + multiplier).toString(),
    (result + 5).toString(),
    (result - 3).toString(),
  ];

  return {
    question: scenario.question,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: scenario.hint,
    standard: "4.OA.A.1",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "multiplicative comparison",
    difficultyRange: { min: 0.2, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generatePrimeCompositeQuestion(difficulty = 0.5) {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22];
  const isPrime = Math.random() < 0.5;
  const testNumber = isPrime
    ? primes[getRandomInt(0, primes.length - 1)]
    : composites[getRandomInt(0, composites.length - 1)];
  const correctAnswer = isPrime ? "Prime" : "Composite";

  return {
    question: `Is ${testNumber} a prime number or a composite number?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, ["Prime", "Composite", "Both"], 3)),
    hint: isPrime
      ? "A prime number has exactly two factors: 1 and itself."
      : "A composite number has more than two factors.",
    standard: "4.OA.B.4",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "prime vs composite",
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

const primeNumbersSet = new Set([7, 11, 13, 17, 19]);

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateFactorsQuestion(difficulty = 0.5) {
  let base;
  let factors = [];
  let attempts = 0;
  const maxAttempts = 14; // Prevent infinite loop

  do {
    base = getRandomInt(6, 20);
    while (primeNumbersSet.has(base)) {
      attempts++;
      if (attempts >= maxAttempts) break; // safeguard against infinite loop
      base = getRandomInt(6, 20);
    }
    attempts = 0; // reset attempts for factor finding
    factors = [];
    for (let i = 1; i <= base; i++) {
      if (base % i === 0) factors.push(i);
    }
    attempts++;
  } while (factors.length < 3 && attempts < maxAttempts);

  // If still not enough factors after max attempts, use a known composite number
  // safeguard against infinite loop, since no primes are selected, shouldn't happen
  if (factors.length < 3) {
    base = 12; // 12 has factors: 1,2,3,4,6,12
    factors = [1,2,3,4,6,12];
  }
  
  const correctFactor = factors[getRandomInt(1, factors.length - 2)]; // Skip 1 and the number itself
  const correctAnswer = correctFactor.toString();
  const getNonFactors = (factors, n) => {
    const nonFactors = [];
    console.log('getting nonfactors for factors:', factors);
    for (let i = 2; nonFactors.length < n; i++) {
      if (!factors.includes(i) && !nonFactors.includes(i)) {
        nonFactors.push(i);
      }
    }
    return nonFactors;
  };
  const potentialDistractors = getNonFactors(factors, 3).map(n => n.toString());

  return {
    question: `Which of these is a factor of ${base}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `A factor of ${base} divides evenly into ${base} with no remainder.`,
    standard: "4.OA.B.4",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "factors",
    difficultyRange: { min: 0.3, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a number pattern recognition question
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateNumberPatternQuestion(difficulty = 0.5) {
  const step = getRandomInt(2, 12);
  const startNum = getRandomInt(1, 20);
  const length = getRandomInt(4, 6);
  
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(startNum + (step * i));
  }
  
  const nextValue = startNum + (step * length);
  const correctAnswer = nextValue.toString();
  const potentialDistractors = [
    (nextValue + step).toString(),
    (nextValue - step).toString(),
    (nextValue + getRandomInt(1, 5)).toString(),
  ];
  
  return {
    question: `Look at this number pattern: ${sequence.join(', ')}, ___. What number comes next?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Look at the difference between each number. The pattern adds ${step} each time.`,
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
    difficultyRange: { min: 0.0, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a number sequence completion question with missing number
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateSequenceCompletionQuestion(difficulty = 0.5) {
  const step = getRandomInt(3, 15);
  const startNum = getRandomInt(5, 25);
  const length = getRandomInt(5, 7);
  
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(startNum + (step * i));
  }
  
  // Remove one number from the middle for the question
  const missingIndex = getRandomInt(2, length - 2);
  const missingValue = sequence[missingIndex];
  const questionSequence = [...sequence];
  questionSequence[missingIndex] = "___";
  const correctAnswer = missingValue.toString();
  const potentialDistractors = [
    (missingValue + step).toString(),
    (missingValue - step).toString(),
    (missingValue + getRandomInt(2, 8)).toString(),
  ];
  
  return {
    question: `Find the missing number in this pattern: ${questionSequence.join(', ')}`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `The pattern increases by ${step} each time. What number is missing?`,
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
    difficultyRange: { min: 0.0, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a pattern rule identification question
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generatePatternRuleQuestion(difficulty = 0.5) {
  const step = getRandomInt(3, 10);
  const startNum = getRandomInt(2, 15);
  const sequence = [];
  
  for (let i = 0; i < 5; i++) {
    sequence.push(startNum + (step * i));
  }
  
  const rules = [
    { text: `Start at ${startNum}, add ${step} each time`, correct: true },
    { text: `Start at ${startNum}, add ${step + 1} each time`, correct: false },
    { text: `Start at ${startNum}, multiply by ${step} each time`, correct: false },
    { text: `Start at ${startNum}, add ${step - 1} each time`, correct: false },
  ];
  
  const correctRule = rules.find(r => r.correct).text;
  const allRules = rules.map(r => r.text);
  
  return {
    question: `Look at this pattern: ${sequence.join(', ')}. What is the rule?`,
    correctAnswer: correctRule,
    options: shuffle(generateUniqueOptions(correctRule, allRules)),
    hint: `Look at how much each number increases from the previous one.`,
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
    difficultyRange: { min: 0.5, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a two-step number pattern question
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateTwoStepPatternQuestion(difficulty = 0.5) {
  // More complex patterns for 4th grade
  const step1 = getRandomInt(2, 9);
  const step2 = getRandomInt(2, 9);
  const startNum = getRandomInt(2, 10);

  const operations = [
    { name: "add then multiply", func1: (n) => (n + step1), func2: (n) => n * step2 },
    { name: "multiply then add", func1: (n) => (n * step1), func2: (n) => n + step2 },
    { name: "subtract then add", func1: (n) => (n - step1), func2: (n) => n + step2 },
  ];
  
  const operation = operations[getRandomInt(0, operations.length - 1)];
  const sequence = [];
  sequence.push(startNum);
  for (let i = 1; i < 4; i+=2) {
      sequence.push(operation.func1(sequence[i - 1]));
      if (operation.func2) {
        sequence.push(operation.func2(sequence[i]));
      }
  }
  
  let nextValue;

  nextValue = operation.func1(sequence[sequence.length - 1]);

  const correctAnswer = nextValue.toString();
  const potentialDistractors = [
      (nextValue + 1).toString(),
      (nextValue - 1).toString(),
      (nextValue + getRandomInt(2, 5)).toString(),
  ];

  return {
    question: `Look at this pattern: ${sequence.join(', ')}, ___. What comes next?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: operation.name === "add then multiply" 
      ? "Look carefully at how each number relates to its position in the sequence. First step is addition, second step is multiplication."
      : operation.name === "subtract then add"
      ? "Look carefully at how each number relates to its position in the sequence. First step is subtraction, second step is addition."
      : operation.name === "multiply then add"
      ? "Look carefully at how each number relates to its position in the sequence. First step is multiplication, second step is addition."
      : "Unknown pattern, contact support.",
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
    difficultyRange: { min: 0.6, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a long division question with remainder
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateLongDivisionWithRemainderQuestion(difficulty = 0.5) {
  const divisor = getRandomInt(2, 9);
  const quotient = getRandomInt(3, 12);
  const remainder = getRandomInt(1, divisor - 1);
  const dividend = (quotient * divisor) + remainder;
  const correctAnswer = `${quotient} remainder ${remainder}`;
  const potentialDistractors = [
      `${quotient + 1} remainder ${remainder}`,
      `${quotient} remainder ${remainder + 1}`,
      `${quotient - 1} remainder ${remainder}`,
  ];

  return {
    question: `What is ${dividend} ÷ ${divisor}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `How many times does ${divisor} go into ${dividend}? Don't forget the remainder!`,
    standard: "4.NBT.B.6",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "long division with remainder",
    difficultyRange: { min: 0.7, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a long division question without remainder
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateLongDivisionNoRemainderQuestion(difficulty = 0.5) {
  const divisor = getRandomInt(2, 9);
  const quotient = getRandomInt(4, 15);
  const dividend = quotient * divisor;
  const correctAnswer = quotient.toString();
  const potentialDistractors = [
      (quotient + 1).toString(),
      (quotient - 1).toString(),
      (quotient + getRandomInt(2, 4)).toString(),
  ];

  return {
    question: `What is ${dividend} ÷ ${divisor}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Think: ${divisor} times what number equals ${dividend}?`,
    standard: "4.NBT.B.6",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "long division",
    difficultyRange: { min: 0.3, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a two-digit by one-digit multiplication question
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateTwoDigitMultiplicationQuestion(difficulty = 0.5) {
  const twoDigit = getRandomInt(11, 99);
  const oneDigit = getRandomInt(2, 9);
  const result = twoDigit * oneDigit;
  const correctAnswer = result.toString();
  const potentialDistractors = [
      (result + getRandomInt(10, 50)).toString(),
      (result - getRandomInt(10, 30)).toString(),
      (result + oneDigit).toString(),
  ];

  return {
    question: `What is ${twoDigit} × ${oneDigit}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Break it down: multiply the ones place first, then the tens place. Don't forget to carry over!`,
    standard: "4.NBT.B.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "multi-digit multiplication",
    difficultyRange: { min: 0.3, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a word problem involving two-digit multiplication
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateMultiplicationWordProblemQuestion(difficulty = 0.5) {
  const groups = getRandomInt(12, 48);
  const itemsPerGroup = getRandomInt(3, 8);
  const total = groups * itemsPerGroup;
  const correctAnswer = total.toString();
  
  const scenarios = [
    {
      question: `There are ${groups} boxes with ${itemsPerGroup} pencils in each box. How many pencils are there in total?`,
      context: "pencils and boxes",
    },
    {
      question: `A theater has ${groups} rows with ${itemsPerGroup} seats in each row. How many seats are there altogether?`,
      context: "theater seats",
    },
    {
      question: `Sarah collects ${groups} sticker sheets with ${itemsPerGroup} stickers on each sheet. How many stickers does she have?`,
      context: "stickers",
    },
    {
      question: `A library has ${groups} shelves with ${itemsPerGroup} books on each shelf. How many books are there in total?`,
      context: "library books",
    },
  ];
  
  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  const potentialDistractors = [
      (groups + itemsPerGroup).toString(),
      (total - groups).toString(),
      (total + itemsPerGroup).toString(),
  ];

  return {
    question: scenario.question,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `This is ${groups} groups of ${itemsPerGroup}. Multiply ${groups} × ${itemsPerGroup}.`,
    standard: "4.OA.A.2",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "multiplication word problems",
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a division word problem with remainder
 */
/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateDivisionWordProblemQuestion(difficulty = 0.5) {
  const divisor = getRandomInt(3, 8);
  const quotient = getRandomInt(4, 12);
  const remainder = getRandomInt(1, divisor - 1);
  const dividend = (quotient * divisor) + remainder;
  const correctAnswer = `${quotient} with ${remainder} left over`;
  
  const scenarios = [
    {
      question: `${dividend} students are divided equally into ${divisor} groups. How many students are in each group, and how many students are left over?`,
      unit: "students",
    },
    {
      question: `There are ${dividend} cookies to be shared equally among ${divisor} children. How many cookies does each child get, and how many cookies are left over?`,
      unit: "cookies",
    },
    {
      question: `A teacher has ${dividend} stickers to give equally to ${divisor} students. How many stickers does each student get, and how many stickers are left over?`,
      unit: "stickers",
    },
  ];
  
  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  const potentialDistractors = [
      `${quotient + 1} with ${remainder} left over`,
      `${quotient} with ${remainder + 1} left over`,
      `${quotient - 1} with ${remainder} left over`,
  ];

  return {
    question: scenario.question,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Divide ${dividend} by ${divisor}. How many complete groups can you make?`,
    standard: "4.OA.A.3",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "division word problems",
    difficultyRange: { min: 0.5, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

const operationsAlgebraicThinkingQuestions = {
  generateQuestion,
  generateMultiplicativeComparisonQuestion,
  generatePrimeCompositeQuestion,
  generateFactorsQuestion,
  generateNumberPatternQuestion,
  generateSequenceCompletionQuestion,
  generatePatternRuleQuestion,
  generateTwoStepPatternQuestion,
  generateLongDivisionWithRemainderQuestion,
  generateLongDivisionNoRemainderQuestion,
  generateTwoDigitMultiplicationQuestion,
  generateMultiplicationWordProblemQuestion,
  generateDivisionWordProblemQuestion,
};

export default operationsAlgebraicThinkingQuestions;
