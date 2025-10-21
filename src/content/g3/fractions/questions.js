// Question generation for 3rd Grade Fractions topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSimplifiedFraction(num, den) {
  if (den === 0) return 'undefined';
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(Math.abs(num), Math.abs(den));
  const simplifiedNum = num / divisor;
  const simplifiedDen = den / divisor;
  return simplifiedDen === 1 ? simplifiedNum.toString() : `${simplifiedNum}/${simplifiedDen}`;
}

export function generateQuestion(difficulty = 0.5) {
  const fractionQuestionType = getRandomInt(1, 1 + Math.floor(4 * difficulty));

  switch (fractionQuestionType) {
    case 1: // Equivalent Fractions
      return generateEquivalentFractionsQuestion(difficulty);
    case 2: // Fraction Addition
      return generateFractionAdditionQuestion(difficulty);
    case 3: // Fraction Subtraction
      return generateFractionSubtractionQuestion(difficulty);
    case 4: // Fraction Comparison
      return generateFractionComparisonQuestion(difficulty);
    case 5: // Fraction Simplification
      return generateFractionSimplificationQuestion(difficulty);
    default:
      return generateEquivalentFractionsQuestion(difficulty);
  }
}

export function generateEquivalentFractionsQuestion(difficulty = 0.5) {
  const minNum = 1 + Math.floor(4 * difficulty);
  const maxNum = 5 + Math.floor(5 * difficulty);
  const f_num_eq = getRandomInt(minNum, maxNum);
  const f_den_eq = getRandomInt(f_num_eq + 1, 9);
  const minMultiplier = 1 + Math.floor(3 * difficulty);
  const maxMultiplier = 6 + Math.floor(4 * difficulty);
  const multiplier = getRandomInt(minMultiplier, maxMultiplier);
  const eq_num = f_num_eq * multiplier;
  const eq_den = f_den_eq * multiplier;
  const correctAnswer = `${eq_num}/${eq_den}`;
  const potentialDistractors = [
    `${f_num_eq + 1}/${f_den_eq}`,
    `${f_num_eq}/${f_den_eq + 1}`,
    `${eq_num}/${eq_den + multiplier}`,
  ];

  return {
    question: `Which fraction is equivalent to ${f_num_eq}/${f_den_eq}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: "Equivalent fractions have the same value. Multiply the top and bottom by the same number.",
    standard: "3.NF.A.3.b",
    concept: "Fractions",
    grade: "G3",
    subtopic: "equivalent fractions",
  };
}

export function generateFractionComparisonQuestion(difficulty = 0.5) {
  const comp_type = getRandomInt(1, 2);
  if (comp_type === 1) {
    // Same denominator
    const comp_den = getRandomInt(3, 12);
    let comp_num1 = getRandomInt(1, comp_den - 1);
    let comp_num2 = getRandomInt(1, comp_den - 1);
    // Ensure they are not equal
    if (comp_num1 === comp_num2) {
      comp_num2 = comp_num1 + 1 <= comp_den - 1 ? comp_num1 + 1 : comp_num1 - 1;
    }

    const correctAnswer = comp_num1 > comp_num2 ? ">" : "<";

    return {
      question: `Which symbol makes this true? ${comp_num1}/${comp_den} ___ ${comp_num2}/${comp_den}`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, ["<", ">"])),
      hint: "If the bottom numbers are the same, the fraction with the bigger top number is greater.",
      standard: "3.NF.A.3.d",
      concept: "Fractions",
      grade: "G3",
      subtopic: "comparison",
    };
  } else {
    // Same numerator
    const minDen = 2 + Math.floor(5 * difficulty);
    const maxDen = 8 + Math.floor(7 * difficulty);
    const comp_num = getRandomInt(minDen, maxDen - 1);
    let comp_den1 = getRandomInt(comp_num + 1, maxDen);
    let comp_den2 = getRandomInt(comp_num + 1, maxDen);
    if (comp_den1 === comp_den2) {
      comp_den2 = comp_den1 + 1 <= maxDen ? comp_den1 + 1 : comp_den1 - 1;
    }
    const correctAnswer = comp_den1 < comp_den2 ? ">" : "<";

    return {
      question: `Which symbol makes this true? ${comp_num}/${comp_den1} ___ ${comp_num}/${comp_den2}`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, ["<", ">"])),
      hint: "If the top numbers are the same, the fraction with the smaller bottom number is bigger (think of bigger pizza slices!).",
      standard: "3.NF.A.3.d",
      concept: "Fractions",
      grade: "G3",
      subtopic: "comparison",
    };
  }
}

export function generateFractionAdditionQuestion(difficulty = 0.5) {
  const add_den1 = getRandomInt(2, 5);
  let add_den2 = getRandomInt(2, 6);
  while (add_den1 === add_den2) {
    add_den2 = getRandomInt(2, 6);
  }
  const add_num1 = getRandomInt(1, add_den1 - 1 > 0 ? add_den1 - 1 : 1);
  const add_num2 = getRandomInt(1, add_den2 - 1 > 0 ? add_den2 - 1 : 1);
  const common_add_den = add_den1 * add_den2;
  const add_sum_num = add_num1 * add_den2 + add_num2 * add_den1;
  const add_answer = getSimplifiedFraction(add_sum_num, common_add_den);
  const potentialDistractors = [
    getSimplifiedFraction(add_num1 + add_num2, add_den1 + add_den2),
    getSimplifiedFraction(add_sum_num + 1, common_add_den),
    getSimplifiedFraction(add_sum_num, common_add_den + 1),
  ];

  return {
    question: `What is ${add_num1}/${add_den1} + ${add_num2}/${add_den2}?`,
    correctAnswer: add_answer,
    options: shuffle(generateUniqueOptions(add_answer, potentialDistractors)),
    hint: "To add fractions with different denominators, you first need to find a common denominator!",
    standard: "4.NF.B.3",
    concept: "Fractions",
    grade: "G3",
    subtopic: "addition",
  };
}

export function generateFractionSubtractionQuestion(difficulty = 0.5) {
  const maxDen = 6 + Math.floor(4 * difficulty);
  const minDen = 2 + Math.floor(2 * difficulty);
  let den1 = getRandomInt(minDen, maxDen);
  let den2 = getRandomInt(minDen, maxDen);
  if (den1 === den2) {
    den2 = den1 + 1 <= maxDen ? den1 + 1 : den1 - 1;
  }
  let num1 = getRandomInt(1, den1 - 1);
  let num2 = getRandomInt(1, den2 - 1);

  const common_den = den1 * den2;
  const diff_num = num1 * den2 - num2 * den1;
  const answer = getSimplifiedFraction(diff_num, common_den);
  const potentialDistractors = [
    getSimplifiedFraction(Math.abs(num1 - num2), Math.abs(den1 - den2)),
    getSimplifiedFraction(diff_num + 1, common_den),
    getSimplifiedFraction(diff_num, common_den + 1),
  ];

  return {
    question: `What is ${num1}/${den1} - ${num2}/${den2}?`,
    correctAnswer: answer,
    options: shuffle(generateUniqueOptions(answer, potentialDistractors)),
    hint: "Find a common denominator before subtracting the fractions. Make sure your answer is simplified!",
    standard: "4.NF.B.3",
    concept: "Fractions",
    grade: "G3",
    subtopic: "subtraction",
  };
}

export function generateFractionSimplificationQuestion(difficulty = 0.5) {
  const multiplier = getRandomInt(3, 4 + Math.floor(6 * difficulty));
  const num = getRandomInt(1, 5);
  const den = getRandomInt(num + 1, 11);
  const starting_num = num * multiplier;
  const starting_den = den * multiplier;
  const simplified_fraction = getSimplifiedFraction(starting_num, starting_den);
  const potentialDistractors = [
    `${num}/${den + getRandomInt(1, 3)}`,
    `${Math.abs(num - getRandomInt(1, 3))}/${den}`,
    getSimplifiedFraction(Math.floor(starting_num / 2), Math.floor(starting_den / 2)),
  ];

  return {
    question: `Simplify the fraction ${starting_num}/${starting_den}`,
    correctAnswer: simplified_fraction,
    options: shuffle(generateUniqueOptions(simplified_fraction, potentialDistractors)),
    hint: "To simplify a fraction, find the largest number that can divide both the top and bottom numbers evenly.",
    standard: "4.NF.A.1",
    concept: "Fractions",
    grade: "G3",
    subtopic: "simplification",
  };
}

const fractionsQuestions = {
  generateQuestion,
  generateEquivalentFractionsQuestion,
  generateFractionComparisonQuestion,
  generateFractionAdditionQuestion,
  generateFractionSubtractionQuestion,
  generateFractionSimplificationQuestion,
};

export default fractionsQuestions;
