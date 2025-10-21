// Question generation for 4th Grade Fractions topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Greatest Common Divisor function
function gcd(a, b) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Simplify fraction function
function simplifyFraction(numerator, denominator) {
    if (denominator === 0) return 'undefined';
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  const simplifiedNum = numerator / divisor;
  const simplifiedDen = denominator / divisor;
  
  // Return as string format
  if (simplifiedDen === 1) {
    return simplifiedNum.toString();
  }
  return `${simplifiedNum}/${simplifiedDen}`;
}

/**
 * Generates a random Fractions question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5) {
  // Define question types with minimum and maximum difficulty thresholds
  const questionTypes = [
    { generator: generateEquivalentFractionsQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    { generator: generateFractionAdditionQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    { generator: generateFractionSubtractionQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    { generator: generateFractionComparisonQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    { generator: generateDecimalNotationQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
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
 * Generates an equivalent fractions question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateEquivalentFractionsQuestion(difficulty = 0.5) {
  // Scale numerator/denominator ranges and multiplier by difficulty
  const maxNumerator = Math.max(3, Math.min(8, 3 + Math.floor(difficulty * 5)));
  const numerator = getRandomInt(1, maxNumerator);
  const denominator = getRandomInt(numerator + 1, 10 + Math.floor(difficulty * 5));
  const multiplier = getRandomInt(2, 4 + Math.floor(difficulty * 4));
  
  const equivNum = numerator * multiplier;
  const equivDen = denominator * multiplier;
  const correctAnswer = `${equivNum}/${equivDen}`;
  const potentialDistractors = [
      `${numerator + 1}/${denominator}`,
      `${numerator}/${denominator + 1}`,
      `${equivNum + 1}/${equivDen}`,
  ];

  return {
    question: `Which fraction is equivalent to ${numerator}/${denominator}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: "To find equivalent fractions, multiply both the numerator and denominator by the same number.",
    standard: "4.NF.A.1",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "equivalent fractions",
    difficultyRange: { min: 0.0, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a fraction addition question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateFractionAdditionQuestion(difficulty = 0.5) {
  // Scale denominator range by difficulty
  const minDenom = 4 + Math.floor(difficulty * 2);
  const maxDenom = 8 + Math.floor(difficulty * 8);
  const denominator = getRandomInt(minDenom, maxDenom);
  const denominator2 = getRandomInt(minDenom, maxDenom);
  const common_denominator = denominator * denominator2;
  const num1 = getRandomInt(1, Math.floor(denominator / 2));
  const num2 = getRandomInt(1, Math.floor(denominator2 / 2));

  const sum = num1 * denominator2 + num2 * denominator;
  const simplifiedAnswer = simplifyFraction(sum, common_denominator);
  const potentialDistractors = [
      `${sum}/${common_denominator + 1}`,
      `${sum + 1}/${common_denominator}`,
      `${num1 + num2}/${common_denominator * 2}`,
  ];

  return {
    question: `What is ${num1}/${denominator} + ${num2}/${denominator2}?`,
    correctAnswer: simplifiedAnswer,
    options: shuffle(generateUniqueOptions(simplifiedAnswer, potentialDistractors)),
    hint: "To add fractions with different denominators, you first need to find a common denominator! When adding fractions with the same denominator, add the numerators and keep the denominator the same.",
    standard: "4.NF.B.3.a",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "addition",
    difficultyRange: { min: 0.3, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a fraction subtraction question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateFractionSubtractionQuestion(difficulty = 0.5) {
  // Scale denominator range by difficulty
  const minDenom = 4 + Math.floor(difficulty * 2);
  const maxDenom = 8 + Math.floor(difficulty * 10);
  const denominator = getRandomInt(minDenom, maxDenom);
  const denominator2 = getRandomInt(minDenom, maxDenom);
  // Ensure numerators are less than denominators
  const num1 = getRandomInt(2, denominator - 1);
  const num2 = getRandomInt(2, denominator2 - 1);

  const difference = num1 * denominator2 - num2 * denominator;
  const simplifiedAnswer = simplifyFraction(difference, denominator * denominator2);
  const potentialDistractors = [
    simplifyFraction(Math.abs(num1 - num2), Math.abs(denominator - denominator2)),
    simplifyFraction(difference + 1, denominator * denominator2),
    simplifyFraction(difference, denominator * denominator2 + 1),
  ];

  return {
    question: `What is ${num1}/${denominator} - ${num2}/${denominator2}?`,
    correctAnswer: simplifiedAnswer,
    options: shuffle(generateUniqueOptions(simplifiedAnswer, potentialDistractors)),
    hint: "When subtracting fractions with the same denominator, subtract the numerators and keep the denominator the same.",
    standard: "4.NF.B.3.a",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "subtraction",
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a fraction comparison question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateFractionComparisonQuestion(difficulty = 0.5) {
  // Scale numerator and denominator ranges by difficulty
  const maxNum = Math.min(10, 4 + Math.floor(difficulty * 6));
  let num1 = getRandomInt(1, maxNum);
  const den1 = getRandomInt(num1 + 1, 10 + Math.floor(difficulty * 5));
  let num2 = getRandomInt(1, maxNum);
  const den2 = getRandomInt(num2 + 1, 10 + Math.floor(difficulty * 5));

  // Ensure fractions are different
  if (num1 / den1 === num2 / den2) {
    num2 = num1 + 1 <= maxNum ? num1 + 1 : num1 - 1;
  }

  const decimal1 = num1 / den1;
  const decimal2 = num2 / den2;
  const correctAnswer = decimal1 > decimal2 ? ">" : "<";
  const potentialDistractors = [correctAnswer === ">" ? "<" : ">", "="];

  return {
    question: `Compare these fractions: ${num1}/${den1} ___ ${num2}/${den2}`,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: "Convert to common denominators, or think about which fraction is closer to 0, 1/2, or 1.",
    standard: "4.NF.A.2",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "comparison",
    difficultyRange: { min: 0.5, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a decimal notation question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateDecimalNotationQuestion(difficulty = 0.5) {
  // At higher difficulty, prefer hundredths over tenths
  const isHundredths = difficulty > 0.5 ? Math.random() < 0.7 : Math.random() < 0.4;
  
  if (isHundredths) {
    // Scale numerator range by difficulty
    const maxNum = Math.floor(20 + difficulty * 79);
    const numerator = getRandomInt(1, maxNum);
    const decimal = (numerator / 100).toFixed(2);
    const potentialDistractors = [
        (numerator / 10).toFixed(1),
        (numerator / 1000).toFixed(3),
        (numerator).toString(),
    ];
    
    return {
      question: `Write ${numerator}/100 as a decimal.`,
      correctAnswer: decimal,
      options: shuffle(generateUniqueOptions(decimal, potentialDistractors)),
      hint: "Hundredths are written as two decimal places after the decimal point.",
      standard: "4.NF.C.6",
      concept: "Fractions 4th",
      grade: "G4",
      subtopic: "decimal notation",
      difficultyRange: { min: 0.6, max: 1.0 },
      suggestedDifficulty: difficulty,
    };
  } else {
    const numerator = getRandomInt(1, 9);
    const decimal = (numerator / 10).toFixed(1);
    const potentialDistractors = [
        (numerator / 100).toFixed(2),
        (numerator).toString(),
        `0.${numerator}${numerator}`,
    ];
    
    return {
      question: `Write ${numerator}/10 as a decimal.`,
      correctAnswer: decimal,
      options: shuffle(generateUniqueOptions(decimal, potentialDistractors)),
      hint: "Tenths are written as one decimal place after the decimal point.",
      standard: "4.NF.C.6",
      concept: "Fractions 4th",
      grade: "G4",
      subtopic: "decimal notation",
      difficultyRange: { min: 0.6, max: 1.0 },
      suggestedDifficulty: difficulty,
    };
  }
}

const fractionsQuestions = {
  generateQuestion,
  generateEquivalentFractionsQuestion,
  generateFractionAdditionQuestion,
  generateFractionSubtractionQuestion,
  generateFractionComparisonQuestion,
  generateDecimalNotationQuestion,
  simplifyFraction,
  gcd,
};

export default fractionsQuestions;
