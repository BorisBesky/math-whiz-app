// Question generation for 3rd Grade Multiplication topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a basic multiplication question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
function generateBasicMultiplicationQuestion(difficulty = 0.5) {
  const m1 = getRandomInt(2, 2 + Math.floor(10 * difficulty));
  const m2 = getRandomInt(2, 2 + Math.floor(7 * difficulty));
  const mAnswer = m1 * m2;
  const correctAnswer = mAnswer.toString();
  const potentialDistractors = [
    (mAnswer + getRandomInt(1, 5)).toString(),
    (m1 * (m2 + 1)).toString(),
    ((m1 - 1) * m2).toString(),
  ];

  return {
    question: `What is ${m1} x ${m2}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Try skip-counting by ${m2}, ${m1} times!`,
    standard: "3.OA.C.7",
    concept: "Multiplication",
    grade: "G3",
    subtopic: "basic multiplication",
  };
}

/**
 * Generates a random Multiplication question for 3rd grade
 * @param {number} difficulty - Difficulty level from 0 to 1
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'basic multiplication': { generator: generateBasicMultiplicationQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'skip counting': { generator: generateSkipCountingQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'arrays and groups': { generator: generateArrayQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'word problems': { generator: generateEqualGroupsQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'fact families': { generator: generateFactFamilyQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
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

  // If still no valid question types, return null
  if (questionTypes.length === 0) {
    console.warn('[generateQuestion] No valid question types found for allowed subtopics:', allowedSubtopics);
    return null;
  }
  
  // Filter available questions based on difficulty
  const available = questionTypes.filter(
    q => difficulty >= q.minDifficulty && difficulty <= q.maxDifficulty
  );

  // If no questions available for this difficulty, use all question types (relax difficulty constraint)
  const candidates = available.length > 0 ? available : questionTypes;

  // Randomly select from available types
  const selected = candidates[getRandomInt(0, candidates.length - 1)];
  return selected.generator(difficulty);
}

/**
 * Generates a skip counting multiplication question
 */
export function generateSkipCountingQuestion() {
  const factor = getRandomInt(2, 9);
  const count = getRandomInt(3, 8);
  const result = factor * count;
  const correctAnswer = result.toString();
  const potentialDistractors = [
    (result + factor).toString(),
    (result - factor).toString(),
    (factor + count).toString(),
  ];
  
  return {
    question: `If you skip count by ${factor}s, ${count} times, what number do you land on?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
  const correctAnswer = total.toString();
  const potentialDistractors = [
    (rows + cols).toString(),
    (total + rows).toString(),
    (total - cols).toString(),
  ];
  
  return {
    question: `There are ${rows} rows of objects with ${cols} objects in each row. How many objects are there in total?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
  const correctAnswer = total.toString();
  
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
  const potentialDistractors = [
    (groups + itemsPerGroup).toString(),
    (total + groups).toString(),
    (total - itemsPerGroup).toString(),
  ];
  
  return {
    question: scenario.question(groups, itemsPerGroup, scenario.item, scenario.container),
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
  const correctAnswer = selected.answer.toString();
  const potentialDistractors = [
    (selected.answer + 1).toString(),
    (selected.answer - 1).toString(),
    (selected.answer + getRandomInt(2, 5)).toString(),
  ];
  
  return {
    question: selected.question,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
