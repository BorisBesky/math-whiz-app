// Question generation for 3rd Grade Multiplication topic

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
 * Generates a random Multiplication question for 3rd grade
 * @param {number} difficulty - Difficulty level from 0 to 1
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5) {
  const m1 = getRandomInt(2, 2 + Math.floor(10 * difficulty));
  const m2 = getRandomInt(2, 2 + Math.floor(7 * difficulty));
  const mAnswer = m1 * m2;

  return {
    question: `What is ${m1} x ${m2}?`,
    correctAnswer: mAnswer.toString(),
    options: shuffleArray([
      mAnswer.toString(),
      (mAnswer + getRandomInt(1, 5)).toString(),
      (m1 * (m2 + 1)).toString(),
      ((m1 - 1) * m2).toString(),
    ]),
    hint: `Try skip-counting by ${m2}, ${m1} times!`,
    standard: "3.OA.C.7",
    concept: "Multiplication",
    grade: "G3",
    subtopic: "basic multiplication",
  };
}

/**
 * Generates a skip counting multiplication question
 */
export function generateSkipCountingQuestion() {
  const factor = getRandomInt(2, 9);
  const count = getRandomInt(3, 8);
  const result = factor * count;
  
  return {
    question: `If you skip count by ${factor}s, ${count} times, what number do you land on?`,
    correctAnswer: result.toString(),
    options: shuffleArray([
      result.toString(),
      (result + factor).toString(),
      (result - factor).toString(),
      (factor + count).toString(),
    ]),
    hint: `Start at 0 and add ${factor} each time: ${factor}, ${factor * 2}, ${factor * 3}...`,
    standard: "3.OA.C.7",
    concept: "Multiplication",
    grade: "G3",
    subtopic: "skip counting",
  };
}

/**
 * Generates an array/groups multiplication question
 */
export function generateArrayQuestion() {
  const rows = getRandomInt(2, 6);
  const cols = getRandomInt(2, 8);
  const total = rows * cols;
  
  return {
    question: `There are ${rows} rows of objects with ${cols} objects in each row. How many objects are there in total?`,
    correctAnswer: total.toString(),
    options: shuffleArray([
      total.toString(),
      (rows + cols).toString(),
      (total + rows).toString(),
      (total - cols).toString(),
    ]),
    hint: `Think of it as ${rows} groups of ${cols}. You can multiply ${rows} × ${cols}.`,
    standard: "3.OA.A.1",
    concept: "Multiplication",
    grade: "G3",
    subtopic: "arrays and groups",
  };
}

/**
 * Generates a word problem with equal groups
 */
export function generateEqualGroupsQuestion() {
  const groups = getRandomInt(3, 8);
  const itemsPerGroup = getRandomInt(2, 9);
  const total = groups * itemsPerGroup;
  
  const scenarios = [
    {
      item: "stickers",
      container: "sheets",
      question: (groups, itemsPerGroup, item, container) => `Sarah has ${groups} ${container} with ${itemsPerGroup} ${item} on each sheet. How many ${item} does she have altogether?`,
    },
    {
      item: "cookies",
      container: "plates",
      question: (groups, itemsPerGroup, item, container) => `There are ${groups} ${container} with ${itemsPerGroup} ${item} on each plate. How many ${item} are there in total?`,
    },
    {
      item: "flowers",
      container: "vases",
      question: (groups, itemsPerGroup, item, container) => `The florist has ${groups} ${container} with ${itemsPerGroup} ${item} in each vase. How many ${item} are there altogether?`,
    },
    {
      item: "books",
      container: "shelves",
      question: (groups, itemsPerGroup, item, container) => `The library has ${groups} ${container} with ${itemsPerGroup} ${item} on each shelf. How many ${item} are there in total?`,
    },
  ];
  
  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  
  return {
    question: scenario.question(groups, itemsPerGroup, scenario.item, scenario.container),
    correctAnswer: total.toString(),
    options: shuffleArray([
      total.toString(),
      (groups + itemsPerGroup).toString(),
      (total + groups).toString(),
      (total - itemsPerGroup).toString(),
    ]),
    hint: `This is ${groups} groups of ${itemsPerGroup}. Multiply ${groups} × ${itemsPerGroup}.`,
    standard: "3.OA.A.3",
    concept: "Multiplication",
    grade: "G3",
    subtopic: "word problems",
  };
}

/**
 * Generates a multiplication fact family question
 */
export function generateFactFamilyQuestion() {
  const factor1 = getRandomInt(2, 9);
  const factor2 = getRandomInt(2, 9);
  const product = factor1 * factor2;
  
  const questionTypes = [
    {
      question: `If ${factor1} × ${factor2} = ${product}, what is ${factor2} × ${factor1}?`,
      answer: product,
      property: "commutative",
    },
    {
      question: `If ${factor1} × ${factor2} = ${product}, what is ${product} ÷ ${factor1}?`,
      answer: factor2,
      property: "inverse",
    },
    {
      question: `If ${factor1} × ${factor2} = ${product}, what is ${product} ÷ ${factor2}?`,
      answer: factor1,
      property: "inverse",
    },
  ];
  
  const selected = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  return {
    question: selected.question,
    correctAnswer: selected.answer.toString(),
    options: shuffleArray([
      selected.answer.toString(),
      (selected.answer + 1).toString(),
      (selected.answer - 1).toString(),
      (selected.answer + getRandomInt(2, 5)).toString(),
    ]),
    hint: selected.property === "commutative" 
      ? "The order of factors doesn't change the product!" 
      : "Multiplication and division are opposite operations.",
    standard: "3.OA.B.5",
    concept: "Multiplication",
    grade: "G3",
    subtopic: "fact families",
  };
}

const multiplicationQuestions = {
  generateQuestion,
  generateSkipCountingQuestion,
  generateArrayQuestion,
  generateEqualGroupsQuestion,
  generateFactFamilyQuestion,
};

export default multiplicationQuestions;
