// Question generation for 4th Grade Fractions topic

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
  const nfType = getRandomInt(1, 3);
  let question;
  
  switch (nfType) {
    case 1: // Equivalent fractions with different denominators (4.NF.1)
      const baseNum = getRandomInt(1, 4);
      const baseDen = getRandomInt(baseNum + 1, 8);
      const scale = getRandomInt(2, 5);
      const equivNum = baseNum * scale;
      const equivDen = baseDen * scale;

      question = {
        question: `Which fraction is equivalent to ${baseNum}/${baseDen}?`,
        correctAnswer: `${equivNum}/${equivDen}`,
        options: shuffleArray([
          `${equivNum}/${equivDen}`,
          `${baseNum + 1}/${baseDen}`,
          `${baseNum}/${baseDen + 1}`,
          `${equivNum + 1}/${equivDen}`,
        ]),
        hint: "Multiply both the numerator and denominator by the same number to find equivalent fractions.",
        standard: "4.NF.A.1",
        concept: "Fractions 4th",
        grade: "G4",
        subtopic: "equivalent fractions",
      };
      break;
      
    case 2: // Add fractions with like denominators (4.NF.3a)
      const likeDen = getRandomInt(3, 8);
      const num1 = getRandomInt(1, likeDen - 2);
      const num2 = getRandomInt(1, likeDen - num1 - 1);
      const sum = num1 + num2;
      const simplifiedSum = simplifyFraction(sum, likeDen);

      question = {
        question: `What is ${num1}/${likeDen} + ${num2}/${likeDen}?`,
        correctAnswer: simplifiedSum,
        options: shuffleArray([
          simplifiedSum,
          `${sum}/${likeDen + 1}`,
          `${sum + 1}/${likeDen}`,
          `${num1 + num2}/${likeDen + likeDen}`,
        ]),
        hint: "When denominators are the same, add the numerators and keep the denominator.",
        standard: "4.NF.B.3.a",
        concept: "Fractions 4th",
        grade: "G4",
        subtopic: "addition like denominators",
      };
      break;
      
    case 3: // Compare fractions (4.NF.2)
      const frac1Num = getRandomInt(1, 5);
      const frac1Den = getRandomInt(frac1Num + 1, 8);
      const frac2Num = getRandomInt(1, 5);
      const frac2Den = getRandomInt(frac2Num + 1, 8);

      // Convert to decimals for comparison
      const decimal1 = frac1Num / frac1Den;
      const decimal2 = frac2Num / frac2Den;
      const comparison =
        decimal1 > decimal2 ? ">" : decimal1 < decimal2 ? "<" : "=";

      question = {
        question: `Compare the fractions: ${frac1Num}/${frac1Den} ___ ${frac2Num}/${frac2Den}`,
        correctAnswer: comparison,
        options: shuffleArray(["<", ">", "="]),
        hint: "Find a common denominator to compare fractions, or think about which is closer to 1/2 or 1.",
        standard: "4.NF.A.2",
        concept: "Fractions 4th",
        grade: "G4",
        subtopic: "comparison",
      };
      break;
      
    default:
      // Fallback to equivalent fractions
      const defBaseNum = getRandomInt(1, 4);
      const defBaseDen = getRandomInt(defBaseNum + 1, 8);
      const defScale = getRandomInt(2, 5);
      const defEquivNum = defBaseNum * defScale;
      const defEquivDen = defBaseDen * defScale;

      question = {
        question: `Which fraction is equivalent to ${defBaseNum}/${defBaseDen}?`,
        correctAnswer: `${defEquivNum}/${defEquivDen}`,
        options: shuffleArray([
          `${defEquivNum}/${defEquivDen}`,
          `${defBaseNum + 1}/${defBaseDen}`,
          `${defBaseNum}/${defBaseDen + 1}`,
          `${defEquivNum + 1}/${defEquivDen}`,
        ]),
        hint: "Multiply both the numerator and denominator by the same number to find equivalent fractions.",
        standard: "4.NF.A.1",
        concept: "Fractions 4th",
        grade: "G4",
        subtopic: "equivalent fractions",
      };
      break;
  }
  
  return question;
}

// Additional specialized question generators
export function generateEquivalentFractionsQuestion() {
  const numerator = getRandomInt(1, 5);
  const denominator = getRandomInt(numerator + 1, 10);
  const multiplier = getRandomInt(2, 6);
  
  const equivNum = numerator * multiplier;
  const equivDen = denominator * multiplier;

  return {
    question: `Which fraction is equivalent to ${numerator}/${denominator}?`,
    correctAnswer: `${equivNum}/${equivDen}`,
    options: shuffleArray([
      `${equivNum}/${equivDen}`,
      `${numerator + 1}/${denominator}`,
      `${numerator}/${denominator + 1}`,
      `${equivNum + 1}/${equivDen}`,
    ]),
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

  return {
    question: `What is ${num1}/${denominator} + ${num2}/${denominator}?`,
    correctAnswer: simplifiedAnswer,
    options: shuffleArray([
      simplifiedAnswer,
      `${sum}/${denominator + 1}`,
      `${sum + 1}/${denominator}`,
      `${num1 + num2}/${denominator * 2}`,
    ]),
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

  return {
    question: `What is ${num1}/${denominator} - ${num2}/${denominator}?`,
    correctAnswer: simplifiedAnswer,
    options: shuffleArray([
      simplifiedAnswer,
      `${difference}/${denominator + 1}`,
      `${difference + 1}/${denominator}`,
      `${num1 - num2}/${denominator * 2}`,
    ]),
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

  return {
    question: `Compare these fractions: ${frac1Num}/${frac1Den} ___ ${frac2Num}/${frac2Den}`,
    correctAnswer,
    options: shuffleArray([correctAnswer, correctAnswer === ">" ? "<" : ">", "="]),
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
    
    return {
      question: `Write ${numerator}/100 as a decimal.`,
      correctAnswer: decimal,
      options: shuffleArray([
        decimal,
        (numerator / 10).toFixed(1),
        (numerator / 1000).toFixed(3),
        (numerator).toString(),
      ]),
      hint: "Hundredths are written as two decimal places after the decimal point.",
      standard: "4.NF.C.6",
      concept: "Fractions 4th",
      grade: "G4",
      subtopic: "decimal notation",
    };
  } else {
    const numerator = getRandomInt(1, 9);
    const decimal = (numerator / 10).toFixed(1);
    
    return {
      question: `Write ${numerator}/10 as a decimal.`,
      correctAnswer: decimal,
      options: shuffleArray([
        decimal,
        (numerator / 100).toFixed(2),
        (numerator).toString(),
        `0.${numerator}${numerator}`,
      ]),
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
