// Question generation for 4th Grade Measurement & Data topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random Measurement & Data question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5) {
  // Define question types with minimum and maximum difficulty thresholds
  const questionTypes = [
    { generator: generateLengthConversionQuestion, minDifficulty: 0.0, maxDifficulty: 0.8 },
    { generator: generateWeightCapacityConversionQuestion, minDifficulty: 0.2, maxDifficulty: 0.9 },
    { generator: generateTimeConversionQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    { generator: generateAreaPerimeterQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
  ];
  
  // Filter available questions based on difficulty
  const available = questionTypes.filter(
    q => difficulty >= q.minDifficulty && difficulty <= q.maxDifficulty
  );
  
  // Randomly select from available types
  const selected = available[getRandomInt(0, available.length - 1)];
  return selected.generator(difficulty);
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateLengthConversionQuestion(difficulty = 0.5) {
  const lengthConversions = [
    { from: "feet", to: "inches", factor: 12, abbrev: ["ft", "in"] },
    { from: "yards", to: "feet", factor: 3, abbrev: ["yd", "ft"] },
    { from: "miles", to: "feet", factor: 5280, abbrev: ["mi", "ft"] },
    {
      from: "meters",
      to: "centimeters",
      factor: 100,
      abbrev: ["m", "cm"],
    },
    {
      from: "kilometers",
      to: "meters",
      factor: 1000,
      abbrev: ["km", "m"],
    },
    { from: "yards", to: "inches", factor: 36, abbrev: ["yd", "in"] },
  ];
  
  const lengthConv = lengthConversions[getRandomInt(0, lengthConversions.length - 1)];
  const lengthAmount = lengthConv.factor > 100 ? getRandomInt(1, 3) : getRandomInt(2, 8);
  const lengthConverted = lengthAmount * lengthConv.factor;
  const correctAnswer = `${lengthConverted} ${lengthConv.to}`;
  const potentialDistractors = [
      `${lengthAmount} ${lengthConv.to}`,
      `${lengthConverted + (lengthConv.factor < 100 ? 5 : 100)} ${lengthConv.to}`,
      `${Math.floor(lengthConverted / 2)} ${lengthConv.to}`,
  ];

  return {
    question: `How many ${lengthConv.to} are in ${lengthAmount} ${lengthConv.from}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Remember: 1 ${lengthConv.from.slice(0, -1)} = ${lengthConv.factor} ${lengthConv.to}.`,
    standard: "4.MD.A.1",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "length conversion",
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateWeightCapacityConversionQuestion(difficulty = 0.5) {
  const weightCapacityConversions = [
    {
      from: "pounds",
      to: "ounces",
      factor: 16,
      abbrev: ["lb", "oz"],
    },
    { from: "tons", to: "pounds", factor: 2000, abbrev: ["T", "lb"] },
    {
      from: "gallons",
      to: "quarts",
      factor: 4,
      abbrev: ["gal", "qt"],
    },
    { from: "quarts", to: "pints", factor: 2, abbrev: ["qt", "pt"] },
    { from: "pints", to: "cups", factor: 2, abbrev: ["pt", "c"] },
    {
      from: "kilograms",
      to: "grams",
      factor: 1000,
      abbrev: ["kg", "g"],
    },
    {
      from: "liters",
      to: "milliliters",
      factor: 1000,
      abbrev: ["L", "mL"],
    },
  ];
  
  const wcConv = weightCapacityConversions[getRandomInt(0, weightCapacityConversions.length - 1)];
  const wcAmount = wcConv.factor > 100 ? getRandomInt(1, 3) : getRandomInt(2, 8);
  const wcConverted = wcAmount * wcConv.factor;
  const correctAnswer = `${wcConverted} ${wcConv.to}`;
  const potentialDistractors = [
    `${wcAmount} ${wcConv.to}`,
    `${wcConverted + (wcConv.factor < 100 ? 5 : 100)} ${wcConv.to}`,
    `${Math.floor(wcConverted / 2)} ${wcConv.to}`,
  ];

  return {
    question: `How many ${wcConv.to} are in ${wcAmount} ${wcConv.from}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Remember: 1 ${wcConv.from.slice(0, -1)} = ${wcConv.factor} ${wcConv.to}.`,
    standard: "4.MD.A.1",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "weight and capacity conversion",
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateTimeConversionQuestion(difficulty = 0.5) {
  const timeConversions = [
    {
      from: "hours",
      to: "minutes",
      factor: 60,
      abbrev: ["hr", "min"],
    },
    {
      from: "minutes",
      to: "seconds",
      factor: 60,
      abbrev: ["min", "sec"],
    },
    { from: "days", to: "hours", factor: 24, abbrev: ["d", "hr"] },
    { from: "weeks", to: "days", factor: 7, abbrev: ["wk", "d"] },
    { from: "years", to: "months", factor: 12, abbrev: ["yr", "mo"] },
  ];
  
  const timeConv = timeConversions[getRandomInt(0, timeConversions.length - 1)];
  const timeAmount = getRandomInt(2, 8);
  const timeConverted = timeAmount * timeConv.factor;
  const correctAnswer = `${timeConverted} ${timeConv.to}`;
  const potentialDistractors = [
      `${timeAmount} ${timeConv.to}`,
      `${timeConverted + 10} ${timeConv.to}`,
      `${Math.floor(timeConverted / 2)} ${timeConv.to}`,
  ];

  return {
    question: `How many ${timeConv.to} are in ${timeAmount} ${timeConv.from}?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Remember: 1 ${timeConv.from.slice(0, -1)} = ${timeConv.factor} ${timeConv.to}.`,
    standard: "4.MD.A.1",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "time conversion",
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateAreaPerimeterQuestion(difficulty = 0.5) {
  const rectLength = getRandomInt(4, 12);
  const rectWidth = getRandomInt(3, 8);
  const isAreaQuestion = Math.random() < 0.5;
  const correctAnswerVal = isAreaQuestion
    ? rectLength * rectWidth
    : 2 * (rectLength + rectWidth);
  const unit = isAreaQuestion ? "square units" : "units";
  const correctAnswer = `${correctAnswerVal} ${unit}`;
  const potentialDistractors = [
    `${
      isAreaQuestion
        ? 2 * (rectLength + rectWidth)
        : rectLength * rectWidth
    } ${unit}`,
    `${correctAnswerVal + 5} ${unit}`,
    `${correctAnswerVal - 3} ${unit}`,
  ];

  return {
    question: `A rectangle has a length of ${rectLength} units and a width of ${rectWidth} units. What is its ${
      isAreaQuestion ? "area" : "perimeter"
    }?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: isAreaQuestion
      ? "Area = length × width"
      : "Perimeter = 2 × (length + width)",
    standard: "4.MD.A.3",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: isAreaQuestion ? "area" : "perimeter",
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateAngleQuestion(difficulty = 0.5) {
  const angles = [
    { name: "right angle", degrees: 90 },
    { name: "straight angle", degrees: 180 },
    { name: "acute angle", degrees: getRandomInt(30, 80) },
    { name: "obtuse angle", degrees: getRandomInt(100, 170) },
  ];
  
  const selectedAngle = angles[getRandomInt(0, angles.length - 1)];
  const correctAnswer = selectedAngle.name;
  const potentialDistractors = angles.filter(a => a.name !== selectedAngle.name).map(a => a.name).slice(0, 3);
  
  return {
    question: `What type of angle measures ${selectedAngle.degrees}°?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: "Right angles are 90°, acute angles are less than 90°, obtuse angles are between 90° and 180°, and straight angles are 180°.",
    standard: "4.MD.C.5",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "angles",
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateDataInterpretationQuestion(difficulty = 0.5) {
  const data = [
    { category: "Apples", value: getRandomInt(15, 30) },
    { category: "Oranges", value: getRandomInt(10, 25) },
    { category: "Bananas", value: getRandomInt(20, 35) },
    { category: "Grapes", value: getRandomInt(12, 28) },
  ];
  
  data.sort((a, b) => b.value - a.value);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const highest = data[0];
  const lowest = data[data.length - 1];
  
  const questionTypes = [
    {
      question: `According to the chart, which fruit was sold the most?`,
      answer: highest.category,
      options: data.map(item => item.category)
    },
    {
      question: `How many fruits were sold in total?`,
      answer: total.toString(),
      options: [total, total + 5, total - 8, total + 12].map(n => n.toString())
    },
    {
      question: `How many more ${highest.category.toLowerCase()} were sold than ${lowest.category.toLowerCase()}?`,
      answer: (highest.value - lowest.value).toString(),
      options: [
        highest.value - lowest.value,
        highest.value + lowest.value,
        highest.value - lowest.value + 3,
        highest.value - lowest.value - 2
      ].map(n => n.toString())
    }
  ];
  
  const selectedQuestion = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  return {
    question: `Fruit Sales Data:\n${data.map(item => `${item.category}: ${item.value}`).join('\n')}\n\n${selectedQuestion.question}`,
    correctAnswer: selectedQuestion.answer,
    options: shuffle(generateUniqueOptions(selectedQuestion.answer, selectedQuestion.options)),
    hint: "Look carefully at the data and compare the numbers for each category.",
    standard: "4.MD.B.4",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "data interpretation",
  };
}

const measurementDataQuestions = {
  generateQuestion,
  generateLengthConversionQuestion,
  generateWeightCapacityConversionQuestion,
  generateTimeConversionQuestion,
  generateAreaPerimeterQuestion,
  generateAngleQuestion,
  generateDataInterpretationQuestion,
};

export default measurementDataQuestions;
