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
  const oaType = getRandomInt(1, 3);
  let question;
  
  switch (oaType) {
    case 1: // Multiplicative comparisons (4.OA.1)
      const base = getRandomInt(2, 8);
      const multiplier_comp = getRandomInt(2, 6);
      const result = base * multiplier_comp;

      question = {
        question: `Sarah has ${base} stickers. Tom has ${multiplier_comp} times as many stickers as Sarah. How many stickers does Tom have?`,
        correctAnswer: result.toString(),
        options: shuffleArray([
          result.toString(),
          (base + multiplier_comp).toString(),
          (result + 5).toString(),
          (result - 3).toString(),
        ]),
        hint: `"${multiplier_comp} times as many" means multiply ${base} by ${multiplier_comp}.`,
        standard: "4.OA.A.1",
        concept: "Operations & Algebraic Thinking",
        grade: "G4",
        subtopic: "multiplicative comparison",
      };
      break;
      
    case 2: // Prime vs composite (4.OA.4)
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22];
      const isPrime = Math.random() < 0.5;
      const testNumber = isPrime
        ? primes[getRandomInt(0, primes.length - 1)]
        : composites[getRandomInt(0, composites.length - 1)];

      question = {
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
      break;
      
    case 3: // Factors and multiples
      const factorBase = getRandomInt(6, 20);
      const factors = [];
      for (let i = 1; i <= factorBase; i++) {
        if (factorBase % i === 0) factors.push(i);
      }
      const correctFactor = factors[getRandomInt(1, factors.length - 2)]; // Skip 1 and the number itself

      question = {
        question: `Which of these is a factor of ${factorBase}?`,
        correctAnswer: correctFactor.toString(),
        options: shuffleArray([
          correctFactor.toString(),
          (correctFactor + 1).toString(),
          (factorBase + 1).toString(),
          (correctFactor + 3).toString(),
        ]),
        hint: `A factor of ${factorBase} divides evenly into ${factorBase} with no remainder.`,
        standard: "4.OA.B.4",
        concept: "Operations & Algebraic Thinking",
        grade: "G4",
        subtopic: "factors",
      };
      break;
      
    default:
      // Fallback to multiplicative comparison
      const defBase = getRandomInt(2, 8);
      const defMultiplier = getRandomInt(2, 6);
      const defResult = defBase * defMultiplier;

      question = {
        question: `Sarah has ${defBase} stickers. Tom has ${defMultiplier} times as many stickers as Sarah. How many stickers does Tom have?`,
        correctAnswer: defResult.toString(),
        options: shuffleArray([
          defResult.toString(),
          (defBase + defMultiplier).toString(),
          (defResult + 5).toString(),
          (defResult - 3).toString(),
        ]),
        hint: `"${defMultiplier} times as many" means multiply ${defBase} by ${defMultiplier}.`,
        standard: "4.OA.A.1",
        concept: "Operations & Algebraic Thinking",
        grade: "G4",
        subtopic: "multiplicative comparison",
      };
      break;
  }
  
  return question;
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

const operationsAlgebraicThinkingQuestions = {
  generateQuestion,
  generateMultiplicativeComparisonQuestion,
  generatePrimeCompositeQuestion,
  generateFactorsQuestion,
};

export default operationsAlgebraicThinkingQuestions;
