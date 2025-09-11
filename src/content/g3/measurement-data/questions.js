// Question generation for 3rd Grade Measurement & Data topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestion(difficulty = 0.5) {
  const md_question_type = getRandomInt(1, 1 + Math.floor(2 * difficulty));

  switch (md_question_type) {
    case 1: // Area
      return generateAreaQuestion();
    case 2: // Perimeter
      return generatePerimeterQuestion();
    case 3: // Volume
      return generateVolumeQuestion();
    default:
      return generateAreaQuestion();
  }
}

export function generateAreaQuestion() {
  const md_length = getRandomInt(3, 15);
  const md_width = getRandomInt(3, 10);
  const area = md_length * md_width;
  const correctAnswer = `${area} cm²`;
  const potentialDistractors = [
    `${(md_length + md_width) * 2} cm²`,
    `${md_length + md_width} cm²`,
    `${area + 10} cm²`,
  ];

  return {
    question: `A rectangle has a length of ${md_length} cm and a width of ${md_width} cm. What is its area?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
  const correctAnswer = `${volume} cubes`;
  const potentialDistractors = [
    `${vol_l + vol_w + vol_h} cubes`,
    `${volume + 5} cubes`,
    `${volume - 2} cubes`,
  ];

  return {
    question: `A box is built with unit cubes. It is ${vol_l} cubes long, ${vol_w} cubes wide, and ${vol_h} cubes high. How many cubes were used to build it?`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
