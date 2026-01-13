// Question generation for 4th Grade Fractions topic
import { QUESTION_TYPES } from '../../../constants/shared-constants.js';
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
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'equivalent fractions': { generator: generateEquivalentFractionsQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'addition': { generator: generateFractionAdditionQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    'subtraction': { generator: generateFractionSubtractionQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    'comparison': { generator: generateFractionComparisonQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    'decimal notation': { generator: generateDecimalNotationQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
    'multiplication': { generator: generateFractionMultiplicationQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    'mixed numbers': { generator: generateMixedNumbersQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
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
    questionType: 'multiple-choice',
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
    questionType: 'multiple-choice',
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
  let denominator = getRandomInt(minDenom, maxDenom);
  let denominator2 = getRandomInt(minDenom, maxDenom);
  // Ensure numerators are less than denominators
  let num1 = getRandomInt(2, denominator - 1);
  let num2 = getRandomInt(2, denominator2 - 1);

  let difference = num1 * denominator2 - num2 * denominator;
  if (difference <= 0) {
    [num1, num2] = [num2, num1];
    [denominator, denominator2] = [denominator2, denominator];
    difference *= -1;
  }
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
    questionType: 'multiple-choice',
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
    questionType: 'multiple-choice',
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
    
    return {
      question: `Write ${numerator}/100 as a decimal.`,
      correctAnswer: decimal,
      questionType: QUESTION_TYPES.NUMERIC,
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
    
    return {
      question: `Write ${numerator}/10 as a decimal.`,
      correctAnswer: decimal,
      questionType: QUESTION_TYPES.NUMERIC,
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

/**
 * Generates a fraction multiplication question (multiplying fraction by whole number)
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateFractionMultiplicationQuestion(difficulty = 0.5) {
  // Scale values by difficulty
  const maxDenom = 6 + Math.floor(difficulty * 6);
  const denominator = getRandomInt(2, maxDenom);
  const numerator = getRandomInt(1, denominator - 1);
  const wholeNumber = getRandomInt(2, 4 + Math.floor(difficulty * 4));
  
  const resultNumerator = numerator * wholeNumber;
  const simplifiedResult = simplifyFraction(resultNumerator, denominator);
  
  const potentialDistractors = [
    simplifyFraction(numerator + wholeNumber, denominator),
    simplifyFraction(resultNumerator + 1, denominator),
    simplifyFraction(resultNumerator, denominator + 1),
  ];

  return {
    question: `What is ${wholeNumber} × ${numerator}/${denominator}?`,
    correctAnswer: simplifiedResult,
    options: shuffle(generateUniqueOptions(simplifiedResult, potentialDistractors)),
    questionType: 'multiple-choice',
    hint: "To multiply a fraction by a whole number, multiply the numerator by the whole number and keep the same denominator.",
    standard: "4.NF.B.4.a",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "multiplication",
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a mixed numbers question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateMixedNumbersQuestion(difficulty = 0.5) {
  const questionTypes = ['toImproper', 'toMixed', 'addMixed'];
  const questionType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  if (questionType === 'toImproper') {
    // Convert mixed number to improper fraction
    const wholeNumber = getRandomInt(1, 3 + Math.floor(difficulty * 3));
    const denominator = getRandomInt(2, 6 + Math.floor(difficulty * 4));
    const numerator = getRandomInt(1, denominator - 1);
    
    const improperNumerator = wholeNumber * denominator + numerator;
    const correctAnswer = `${improperNumerator}/${denominator}`;
    
    const potentialDistractors = [
      `${improperNumerator + 1}/${denominator}`,
      `${wholeNumber + numerator}/${denominator}`,
      `${improperNumerator}/${denominator + 1}`,
    ];
    
    return {
      question: `Convert ${wholeNumber} ${numerator}/${denominator} to an improper fraction.`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
      questionType: 'multiple-choice',
      hint: "Multiply the whole number by the denominator, then add the numerator. Put the result over the same denominator.",
      standard: "4.NF.B.3.b",
      concept: "Fractions 4th",
      grade: "G4",
      subtopic: "mixed numbers",
      difficultyRange: { min: 0.5, max: 1.0 },
      suggestedDifficulty: difficulty,
    };
  } else if (questionType === 'toMixed') {
    // Convert improper fraction to mixed number
    const denominator = getRandomInt(2, 6 + Math.floor(difficulty * 4));
    const wholeNumber = getRandomInt(1, 3 + Math.floor(difficulty * 3));
    const remainder = getRandomInt(1, denominator - 1);
    const improperNumerator = wholeNumber * denominator + remainder;
    
    const correctAnswer = `${wholeNumber} ${remainder}/${denominator}`;
    
    const potentialDistractors = [
      `${wholeNumber + 1} ${remainder}/${denominator}`,
      `${wholeNumber} ${remainder + 1}/${denominator}`,
      `${wholeNumber - 1} ${remainder}/${denominator}`,
    ];
    
    return {
      question: `Convert ${improperNumerator}/${denominator} to a mixed number.`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
      questionType: 'multiple-choice',
      hint: "Divide the numerator by the denominator. The quotient is the whole number, and the remainder becomes the new numerator.",
      standard: "4.NF.B.3.b",
      concept: "Fractions 4th",
      grade: "G4",
      subtopic: "mixed numbers",
      difficultyRange: { min: 0.5, max: 1.0 },
      suggestedDifficulty: difficulty,
    };
  } else {
    // Add two mixed numbers with same denominator
    const denominator = getRandomInt(3, 6 + Math.floor(difficulty * 3));
    const whole1 = getRandomInt(1, 3);
    const num1 = getRandomInt(1, denominator - 1);
    const whole2 = getRandomInt(1, 3);
    const num2 = getRandomInt(1, denominator - 1);
    
    let resultWhole = whole1 + whole2;
    let resultNum = num1 + num2;
    
    // Handle carrying
    if (resultNum >= denominator) {
      resultWhole += 1;
      resultNum -= denominator;
    }
    
    const correctAnswer = resultNum === 0 
      ? `${resultWhole}` 
      : `${resultWhole} ${resultNum}/${denominator}`;
    
    const potentialDistractors = [
      `${resultWhole + 1} ${resultNum}/${denominator}`,
      `${resultWhole} ${resultNum + 1}/${denominator}`,
      `${whole1 + whole2} ${num1 + num2}/${denominator}`,
    ];
    
    return {
      question: `What is ${whole1} ${num1}/${denominator} + ${whole2} ${num2}/${denominator}?`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
      questionType: 'multiple-choice',
      hint: "Add the whole numbers together. Then add the fractions. If the fraction sum is greater than 1, carry over to the whole number.",
      standard: "4.NF.B.3.c",
      concept: "Fractions 4th",
      grade: "G4",
      subtopic: "mixed numbers",
      difficultyRange: { min: 0.5, max: 1.0 },
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
  generateFractionMultiplicationQuestion,
  generateMixedNumbersQuestion,
  simplifyFraction,
  gcd,
};

export default fractionsQuestions;
