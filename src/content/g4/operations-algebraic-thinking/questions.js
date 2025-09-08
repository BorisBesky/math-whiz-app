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

const operationsAlgebraicThinkingQuestions = {
  generateQuestion,
  generateMultiplicativeComparisonQuestion,
  generatePrimeCompositeQuestion,
  generateFactorsQuestion,
  generateNumberPatternQuestion,
  generateSequenceCompletionQuestion,
  generatePatternRuleQuestion,
  generateTwoStepPatternQuestion,
};

export default operationsAlgebraicThinkingQuestions;
