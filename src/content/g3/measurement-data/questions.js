// Question generation for 3rd Grade Measurement & Data topic
import { QUESTION_TYPES } from '../../../constants/topics.js';
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random Measurement & Data question for 3rd grade
 * @param {number} difficulty - Difficulty level from 0 to 1
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'area': { generator: generateAreaQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'perimeter': { generator: generatePerimeterQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'volume': { generator: generateVolumeQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
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

export function generateAreaQuestion() {
  const md_length = getRandomInt(3, 15);
  const md_width = getRandomInt(3, 10);
  const area = md_length * md_width;
  const perimeter = (md_length + md_width) * 2;
  const sumSides = md_length + md_width;
  const correctAnswer = `${area} cm²`;
  // Perimeter distractor equals the area for pairs like (3,6), (4,4), (6,3).
  // Shift by +2 whenever the "perimeter as area" distractor would collide.
  const perimeterDistractor = perimeter === area ? perimeter + 2 : perimeter;
  const sumDistractor = sumSides === area ? sumSides + 1 : sumSides;
  const potentialDistractors = [
    `${perimeterDistractor} cm²`,
    `${sumDistractor} cm²`,
    `${area + 10} cm²`,
  ];

  return {
    question: `A rectangle has a length of ${md_length} cm and a width of ${md_width} cm. What is its area?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: "Area of a rectangle is found by multiplying its length and width.",
    standard: "3.MD.C.7.b",
    concept: "Measurement & Data",
    grade: "G3",
    subtopic: "area",
  };
}

export function generatePerimeterQuestion() {
  const md_side1 = getRandomInt(5, 20);
  const md_side2 = getRandomInt(5, 20);
  const correctAnswer = `${2 * (md_side1 + md_side2)} inches`;
  const potentialDistractors = [
      `${md_side1 * md_side2} inches`,
      `${md_side1 + md_side2} inches`,
      `${2 * (md_side1 + md_side2) + 10} inches`,
  ];

  return {
    question: `What is the perimeter of a rectangle with sides of length ${md_side1} inches and ${md_side2} inches?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: "Perimeter is the distance all the way around a shape. Add up all four sides!",
    standard: "3.MD.D.8",
    concept: "Measurement & Data",
    grade: "G3",
    subtopic: "perimeter",
  };
}

export function generateVolumeQuestion() {
  const vol_l = getRandomInt(2, 4);
  const vol_w = getRandomInt(2, 4);
  const vol_h = getRandomInt(1, 3);
  const volume = vol_l * vol_w * vol_h;
  const sumDims = vol_l + vol_w + vol_h;
  // Sum of dimensions equals the volume for (3,2,1) etc., and can collide with
  // the "volume - 2" distractor (e.g. 2×2×2 → volume=8, sum=5, volume-2=6 but
  // 2×3×1 → volume=6, sum=6). Shift the sum distractor if it collides with any
  // of the other displayed answers.
  const collidesWithVolume = sumDims === volume;
  const collidesWithMinus2 = sumDims === volume - 2;
  const collidesWithPlus5 = sumDims === volume + 5;
  const sumDistractor = collidesWithVolume || collidesWithMinus2 || collidesWithPlus5
    ? volume + 1
    : sumDims;
  const correctAnswer = `${volume} cubes`;
  const potentialDistractors = [
    `${sumDistractor} cubes`,
    `${volume + 5} cubes`,
    `${volume - 2} cubes`,
  ];

  return {
    question: `A box is built with unit cubes. It is ${vol_l} cubes long, ${vol_w} cubes wide, and ${vol_h} cubes high. How many cubes were used to build it?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: "Volume is the space inside an object. You can find it by multiplying length x width x height.",
    standard: "3.MD.C.5",
    concept: "Measurement & Data",
    grade: "G3",
    subtopic: "volume",
  };
}

const measurementDataQuestions = {
  generateQuestion,
  generateAreaQuestion,
  generatePerimeterQuestion,
  generateVolumeQuestion,
};

export default measurementDataQuestions;
