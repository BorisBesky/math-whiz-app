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
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion() {
  const nfType = getRandomInt(1, 5);
  
  switch (nfType) {
    case 1:
        return generateEquivalentFractionsQuestion();
    case 2:
        return generateFractionAdditionQuestion();
    case 3:
        return generateFractionSubtractionQuestion();
    case 4:
        return generateFractionComparisonQuestion();
    case 5:
        return generateDecimalNotationQuestion();
    default:
      return generateEquivalentFractionsQuestion();
  }
}

// Additional specialized question generators
export function generateEquivalentFractionsQuestion() {
  const numerator = getRandomInt(1, 5);
  const denominator = getRandomInt(numerator + 1, 10);
  const multiplier = getRandomInt(2, 6);
  
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
  };
}

export function generateFractionAdditionQuestion() {
  const denominator = getRandomInt(4, 12);
  const num1 = getRandomInt(1, Math.floor(denominator / 2));
  const num2 = getRandomInt(1, denominator - num1 - 1);
  
  const sum = num1 + num2;
  const simplifiedAnswer = simplifyFraction(sum, denominator);
  const potentialDistractors = [
      `${sum}/${denominator + 1}`,
      `${sum + 1}/${denominator}`,
      `${num1 + num2}/${denominator * 2}`,
  ];

  return {
    question: `What is ${num1}/${denominator} + ${num2}/${denominator}?`,
    correctAnswer: simplifiedAnswer,
    options: shuffle(generateUniqueOptions(simplifiedAnswer, potentialDistractors)),
    hint: "When adding fractions with the same denominator, add the numerators and keep the denominator the same.",
    standard: "4.NF.B.3.a",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "addition",
  };
}

export function generateFractionSubtractionQuestion() {
  const denominator = getRandomInt(4, 12);
  const num1 = getRandomInt(3, denominator - 1);
  const num2 = getRandomInt(1, num1 - 1);
  
  const difference = num1 - num2;
  const simplifiedAnswer = simplifyFraction(difference, denominator);
  const potentialDistractors = [
      `${difference}/${denominator + 1}`,
      `${difference + 1}/${denominator}`,
      `${num1 - num2}/${denominator * 2}`,
  ];

  return {
    question: `What is ${num1}/${denominator} - ${num2}/${denominator}?`,
    correctAnswer: simplifiedAnswer,
    options: shuffle(generateUniqueOptions(simplifiedAnswer, potentialDistractors)),
    hint: "When subtracting fractions with the same denominator, subtract the numerators and keep the denominator the same.",
    standard: "4.NF.B.3.a",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "subtraction",
  };
}

export function generateFractionComparisonQuestion() {
  const frac1Num = getRandomInt(1, 6);
  const frac1Den = getRandomInt(frac1Num + 1, 10);
  const frac2Num = getRandomInt(1, 6);
  const frac2Den = getRandomInt(frac2Num + 1, 10);

  // Ensure fractions are different
  if (frac1Num / frac1Den === frac2Num / frac2Den) {
    return generateFractionComparisonQuestion();
  }

  const decimal1 = frac1Num / frac1Den;
  const decimal2 = frac2Num / frac2Den;
  const correctAnswer = decimal1 > decimal2 ? ">" : "<";
  const potentialDistractors = [correctAnswer === ">" ? "<" : ">", "="];

  return {
    question: `Compare these fractions: ${frac1Num}/${frac1Den} ___ ${frac2Num}/${frac2Den}`,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: "Convert to common denominators, or think about which fraction is closer to 0, 1/2, or 1.",
    standard: "4.NF.A.2",
    concept: "Fractions 4th",
    grade: "G4",
    subtopic: "comparison",
  };
}

export function generateDecimalNotationQuestion() {
  // Generate tenths and hundredths (4.NF.6)
  const isHundredths = Math.random() < 0.5;
  
  if (isHundredths) {
    const numerator = getRandomInt(1, 99);
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
