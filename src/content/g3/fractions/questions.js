// Question generation for 3rd Grade Fractions topic

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

function getSimplifiedFraction(num, den) {
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
      return generateEquivalentFractionsQuestion();
    case 2: // Fraction Addition
      return generateFractionAdditionQuestion();
    case 3: // Fraction Subtraction
      return generateFractionSubtractionQuestion();
    case 4: // Fraction Comparison
      return generateFractionComparisonQuestion();
    case 5: // Fraction Simplification
      return generateFractionSimplificationQuestion();
    default:
      return generateEquivalentFractionsQuestion();
  }
}

export function generateEquivalentFractionsQuestion() {
  const f_num_eq = getRandomInt(1, 8);
  const f_den_eq = getRandomInt(f_num_eq + 1, 9);
  const multiplier = getRandomInt(2, 4);
  const eq_num = f_num_eq * multiplier;
  const eq_den = f_den_eq * multiplier;

  return {
    question: `Which fraction is equivalent to ${f_num_eq}/${f_den_eq}?`,
    correctAnswer: `${eq_num}/${eq_den}`,
    options: shuffleArray([
      `${eq_num}/${eq_den}`,
      `${f_num_eq + 1}/${f_den_eq}`,
      `${f_num_eq}/${f_den_eq + 1}`,
      `${eq_num}/${eq_den + multiplier}`,
    ]),
    hint: "Equivalent fractions have the same value. Multiply the top and bottom by the same number.",
    standard: "3.NF.A.3.b",
    concept: "Fractions",
    grade: "G3",
    subtopic: "equivalent fractions",
  };
}

export function generateFractionComparisonQuestion() {
  const comp_type = getRandomInt(1, 2);
  if (comp_type === 1) {
    // Same denominator
    const comp_den = getRandomInt(3, 12);
    let comp_num1 = getRandomInt(1, comp_den - 1);
    let comp_num2 = getRandomInt(1, comp_den - 1);
    while (comp_num1 === comp_num2) {
      comp_num2 = getRandomInt(1, comp_den - 1);
    }

    return {
      question: `Which symbol makes this true? ${comp_num1}/${comp_den} ___ ${comp_num2}/${comp_den}`,
      correctAnswer: comp_num1 > comp_num2 ? ">" : "<",
      options: shuffleArray(["<", ">", "="]),
      hint: "If the bottom numbers are the same, the fraction with the bigger top number is greater.",
      standard: "3.NF.A.3.d",
      concept: "Fractions",
      grade: "G3",
      subtopic: "comparison",
    };
  } else {
    // Same numerator
    const comp_num = getRandomInt(1, 10);
    let comp_den1 = getRandomInt(comp_num + 1, 15);
    let comp_den2 = getRandomInt(comp_num + 1, 15);
    while (comp_den1 === comp_den2) {
      comp_den2 = getRandomInt(comp_num + 1, 15);
    }

    return {
      question: `Which symbol makes this true? ${comp_num}/${comp_den1} ___ ${comp_num}/${comp_den2}`,
      correctAnswer: comp_den1 < comp_den2 ? ">" : "<",
      options: shuffleArray(["<", ">", "="]),
      hint: "If the top numbers are the same, the fraction with the smaller bottom number is bigger (think of bigger pizza slices!).",
      standard: "3.NF.A.3.d",
      concept: "Fractions",
      grade: "G3",
      subtopic: "comparison",
    };
  }
}

export function generateFractionAdditionQuestion() {
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

  return {
    question: `What is ${add_num1}/${add_den1} + ${add_num2}/${add_den2}?`,
    correctAnswer: add_answer,
    options: shuffleArray([
      add_answer,
      getSimplifiedFraction(add_num1 + add_num2, add_den1 + add_den2),
      getSimplifiedFraction(add_sum_num + 1, common_add_den),
      getSimplifiedFraction(add_sum_num, common_add_den + 1),
    ]),
    hint: "To add fractions with different denominators, you first need to find a common denominator!",
    standard: "4.NF.B.3",
    concept: "Fractions",
    grade: "G3",
    subtopic: "addition",
  };
}

export function generateFractionSubtractionQuestion() {
  let sub_den1 = getRandomInt(2, 6);
  let sub_den2 = getRandomInt(2, 6);
  let sub_num1 = getRandomInt(1, sub_den1 - 1 > 0 ? sub_den1 - 1 : 1);
  let sub_num2 = getRandomInt(1, sub_den2 - 1 > 0 ? sub_den2 - 1 : 1);

  while (sub_num1 * sub_den2 <= sub_num2 * sub_den1 || sub_den1 === sub_den2) {
    sub_den1 = getRandomInt(2, 6);
    sub_den2 = getRandomInt(2, 6);
    sub_num1 = getRandomInt(1, sub_den1 - 1 > 0 ? sub_den1 - 1 : 1);
    sub_num2 = getRandomInt(1, sub_den2 - 1 > 0 ? sub_den2 - 1 : 1);
  }

  const common_sub_den = sub_den1 * sub_den2;
  const sub_diff_num = sub_num1 * sub_den2 - sub_num2 * sub_den1;
  const sub_answer = getSimplifiedFraction(sub_diff_num, common_sub_den);

  return {
    question: `What is ${sub_num1}/${sub_den1} - ${sub_num2}/${sub_den2}?`,
    correctAnswer: sub_answer,
    options: shuffleArray([
      sub_answer,
      getSimplifiedFraction(Math.abs(sub_num1 - sub_num2), Math.abs(sub_den1 - sub_den2)),
      getSimplifiedFraction(sub_diff_num + 1, common_sub_den),
      getSimplifiedFraction(sub_diff_num, common_sub_den + 1),
    ]),
    hint: "Find a common denominator before subtracting the fractions. Make sure your answer is simplified!",
    standard: "4.NF.B.3",
    concept: "Fractions",
    grade: "G3",
    subtopic: "subtraction",
  };
}

export function generateFractionSimplificationQuestion() {
  const simp_multiplier = getRandomInt(3, 9);
  const simp_num = getRandomInt(1, 5);
  const simp_den = getRandomInt(simp_num + 1, 11);
  const starting_num = simp_num * simp_multiplier;
  const starting_den = simp_den * simp_multiplier;
  const simplified_fraction = getSimplifiedFraction(starting_num, starting_den);

  return {
    question: `Simplify the fraction ${starting_num}/${starting_den}`,
    correctAnswer: simplified_fraction,
    options: shuffleArray([
      simplified_fraction,
      `${simp_num}/${simp_den + getRandomInt(1, 3)}`,
      `${Math.abs(simp_num - getRandomInt(1, 3))}/${simp_den}`,
      `${Math.floor(starting_num / 2)}/${Math.floor(starting_den / 2)}`,
    ]),
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
