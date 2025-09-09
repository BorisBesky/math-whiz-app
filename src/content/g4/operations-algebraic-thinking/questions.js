// Question generation for 4th Grade Operations & Algebraic Thinking topic

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

/**
 * Generates a random Operations & Algebraic Thinking question for 4th grade
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion() {
  // Array of all available question generators
  const questionTypes = [
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
  ];
  
  // Randomly select a question type
  const selectedGenerator = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  return selectedGenerator();
}

// Additional specialized question generators
export function generateMultiplicativeComparisonQuestion() {
  const base = getRandomInt(2, 8);
  const multiplier = getRandomInt(2, 6);
  const result = base * multiplier;

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

  return {
    question: scenario.question,
    correctAnswer: result.toString(),
    options: shuffleArray([
      result.toString(),
      (base + multiplier).toString(),
      (result + 5).toString(),
      (result - 3).toString(),
    ]),
    hint: scenario.hint,
    standard: "4.OA.A.1",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "multiplicative comparison",
  };
}

export function generatePrimeCompositeQuestion() {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22];
  const isPrime = Math.random() < 0.5;
  const testNumber = isPrime
    ? primes[getRandomInt(0, primes.length - 1)]
    : composites[getRandomInt(0, composites.length - 1)];

  return {
    question: `Is ${testNumber} a prime number or a composite number?`,
    correctAnswer: isPrime ? "Prime" : "Composite",
    options: shuffleArray(["Prime", "Composite"]),
    hint: isPrime
      ? "A prime number has exactly two factors: 1 and itself."
      : "A composite number has more than two factors.",
    standard: "4.OA.B.4",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "prime vs composite",
  };
}

export function generateFactorsQuestion() {
  const base = getRandomInt(6, 20);
  const factors = [];
  for (let i = 1; i <= base; i++) {
    if (base % i === 0) factors.push(i);
  }
  
  // Ensure we have enough factors to choose from
  if (factors.length < 3) {
    return generateFactorsQuestion(); // Retry with different number
  }
  
  const correctFactor = factors[getRandomInt(1, factors.length - 2)]; // Skip 1 and the number itself

  return {
    question: `Which of these is a factor of ${base}?`,
    correctAnswer: correctFactor.toString(),
    options: shuffleArray([
      correctFactor.toString(),
      (correctFactor + 1).toString(),
      (base + 1).toString(),
      (correctFactor + 3).toString(),
    ]),
    hint: `A factor of ${base} divides evenly into ${base} with no remainder.`,
    standard: "4.OA.B.4",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "factors",
  };
}

/**
 * Generates a number pattern recognition question
 */
export function generateNumberPatternQuestion() {
  const step = getRandomInt(2, 12);
  const startNum = getRandomInt(1, 20);
  const length = getRandomInt(4, 6);
  
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(startNum + (step * i));
  }
  
  const nextValue = startNum + (step * length);
  
  return {
    question: `Look at this number pattern: ${sequence.join(', ')}, ___. What number comes next?`,
    correctAnswer: nextValue.toString(),
    options: shuffleArray([
      nextValue.toString(),
      (nextValue + step).toString(),
      (nextValue - step).toString(),
      (nextValue + getRandomInt(1, 5)).toString(),
    ]),
    hint: `Look at the difference between each number. The pattern adds ${step} each time.`,
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
  };
}

/**
 * Generates a number sequence completion question with missing number
 */
export function generateSequenceCompletionQuestion() {
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
  
  return {
    question: `Find the missing number in this pattern: ${questionSequence.join(', ')}`,
    correctAnswer: missingValue.toString(),
    options: shuffleArray([
      missingValue.toString(),
      (missingValue + step).toString(),
      (missingValue - step).toString(),
      (missingValue + getRandomInt(2, 8)).toString(),
    ]),
    hint: `The pattern increases by ${step} each time. What number is missing?`,
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
  };
}

/**
 * Generates a pattern rule identification question
 */
export function generatePatternRuleQuestion() {
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
  const allRules = shuffleArray(rules.map(r => r.text));
  
  return {
    question: `Look at this pattern: ${sequence.join(', ')}. What is the rule?`,
    correctAnswer: correctRule,
    options: allRules,
    hint: `Look at how much each number increases from the previous one.`,
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
  };
}

/**
 * Generates a two-step number pattern question
 */
export function generateTwoStepPatternQuestion() {
  // More complex patterns for 4th grade
  const operations = [
    { name: "add then multiply", func: (n, i) => (n + 2) * (i + 1) },
    { name: "multiply then add", func: (n, i) => (n * 2) + i },
    { name: "square pattern", func: (n, i) => (i + 1) * (i + 1) },
  ];
  
  const operation = operations[getRandomInt(0, operations.length - 1)];
  const sequence = [];
  
  for (let i = 0; i < 4; i++) {
    if (operation.name === "square pattern") {
      sequence.push((i + 1) * (i + 1));
    } else {
      sequence.push(operation.func(i + 2, i));
    }
  }
  
  let nextValue;
  if (operation.name === "square pattern") {
    nextValue = 5 * 5; // Next square number
  } else {
    nextValue = operation.func(6, 4);
  }
  
  return {
    question: `Look at this pattern: ${sequence.join(', ')}, ___. What comes next?`,
    correctAnswer: nextValue.toString(),
    options: shuffleArray([
      nextValue.toString(),
      (nextValue + 1).toString(),
      (nextValue - 1).toString(),
      (nextValue + getRandomInt(2, 5)).toString(),
    ]),
    hint: operation.name === "square pattern" 
      ? "These are square numbers: 1×1, 2×2, 3×3, 4×4..." 
      : "Look carefully at how each number relates to its position in the sequence.",
    standard: "4.OA.C.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "number patterns",
  };
}

/**
 * Generates a long division question with remainder
 */
export function generateLongDivisionWithRemainderQuestion() {
  const divisor = getRandomInt(2, 9);
  const quotient = getRandomInt(3, 12);
  const remainder = getRandomInt(1, divisor - 1);
  const dividend = (quotient * divisor) + remainder;
  
  return {
    question: `What is ${dividend} ÷ ${divisor}?`,
    correctAnswer: `${quotient} remainder ${remainder}`,
    options: shuffleArray([
      `${quotient} remainder ${remainder}`,
      `${quotient + 1} remainder ${remainder}`,
      `${quotient} remainder ${remainder + 1}`,
      `${quotient - 1} remainder ${remainder}`,
    ]),
    hint: `How many times does ${divisor} go into ${dividend}? Don't forget the remainder!`,
    standard: "4.NBT.B.6",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "long division with remainder",
  };
}

/**
 * Generates a long division question without remainder
 */
export function generateLongDivisionNoRemainderQuestion() {
  const divisor = getRandomInt(2, 9);
  const quotient = getRandomInt(4, 15);
  const dividend = quotient * divisor;
  
  return {
    question: `What is ${dividend} ÷ ${divisor}?`,
    correctAnswer: quotient.toString(),
    options: shuffleArray([
      quotient.toString(),
      (quotient + 1).toString(),
      (quotient - 1).toString(),
      (quotient + getRandomInt(2, 4)).toString(),
    ]),
    hint: `Think: ${divisor} times what number equals ${dividend}?`,
    standard: "4.NBT.B.6",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "long division",
  };
}

/**
 * Generates a two-digit by one-digit multiplication question
 */
export function generateTwoDigitMultiplicationQuestion() {
  const twoDigit = getRandomInt(11, 99);
  const oneDigit = getRandomInt(2, 9);
  const result = twoDigit * oneDigit;
  
  return {
    question: `What is ${twoDigit} × ${oneDigit}?`,
    correctAnswer: result.toString(),
    options: shuffleArray([
      result.toString(),
      (result + getRandomInt(10, 50)).toString(),
      (result - getRandomInt(10, 30)).toString(),
      (result + oneDigit).toString(),
    ]),
    hint: `Break it down: multiply the ones place first, then the tens place. Don't forget to carry over!`,
    standard: "4.NBT.B.5",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "multi-digit multiplication",
  };
}

/**
 * Generates a word problem involving two-digit multiplication
 */
export function generateMultiplicationWordProblemQuestion() {
  const groups = getRandomInt(12, 48);
  const itemsPerGroup = getRandomInt(3, 8);
  const total = groups * itemsPerGroup;
  
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
  
  return {
    question: scenario.question,
    correctAnswer: total.toString(),
    options: shuffleArray([
      total.toString(),
      (groups + itemsPerGroup).toString(),
      (total - groups).toString(),
      (total + itemsPerGroup).toString(),
    ]),
    hint: `This is ${groups} groups of ${itemsPerGroup}. Multiply ${groups} × ${itemsPerGroup}.`,
    standard: "4.OA.A.2",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "multiplication word problems",
  };
}

/**
 * Generates a division word problem with remainder
 */
export function generateDivisionWordProblemQuestion() {
  const divisor = getRandomInt(3, 8);
  const quotient = getRandomInt(4, 12);
  const remainder = getRandomInt(1, divisor - 1);
  const dividend = (quotient * divisor) + remainder;
  
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
  
  return {
    question: scenario.question,
    correctAnswer: `${quotient} with ${remainder} left over`,
    options: shuffleArray([
      `${quotient} with ${remainder} left over`,
      `${quotient + 1} with ${remainder} left over`,
      `${quotient} with ${remainder + 1} left over`,
      `${quotient - 1} with ${remainder} left over`,
    ]),
    hint: `Divide ${dividend} by ${divisor}. How many complete groups can you make?`,
    standard: "4.OA.A.3",
    concept: "Operations & Algebraic Thinking",
    grade: "G4",
    subtopic: "division word problems",
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
