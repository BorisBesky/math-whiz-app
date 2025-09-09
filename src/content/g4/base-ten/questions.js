// Question generation for 4th Grade Base Ten topic

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
 * Generates a random Base Ten question for 4th grade
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion() {
  const nbtType = getRandomInt(1, 3);
  let question;
  
  switch (nbtType) {
    case 1: // Place value (4.NBT.1)
      const placeValue = getRandomInt(1000, 9999);
      const digit = placeValue.toString()[getRandomInt(0, 3)];
      const positions = ["thousands", "hundreds", "tens", "ones"];
      const digitPos = placeValue.toString().indexOf(digit);

      question = {
        question: `In the number ${placeValue}, what is the place value of the digit ${digit}?`,
        correctAnswer: positions[digitPos],
        options: shuffleArray([
          positions[digitPos],
          ...positions
            .filter((p) => p !== positions[digitPos])
            .slice(0, 3),
        ]),
        hint: `Look at the position of the digit ${digit} in ${placeValue}.`,
        standard: "4.NBT.A.1",
        concept: "Base Ten",
        grade: "G4",
        subtopic: "place value",
      };
      break;
      
    case 2: // Rounding (4.NBT.3)
      const roundNum = getRandomInt(1234, 8765);
      const roundToNearest = ["tens", "hundreds", "thousands"][
        getRandomInt(0, 2)
      ];
      let rounded;

      if (roundToNearest === "tens") {
        rounded = Math.round(roundNum / 10) * 10;
      } else if (roundToNearest === "hundreds") {
        rounded = Math.round(roundNum / 100) * 100;
      } else {
        rounded = Math.round(roundNum / 1000) * 1000;
      }

      question = {
        question: `Round ${roundNum} to the nearest ${roundToNearest}.`,
        correctAnswer: rounded.toString(),
        options: shuffleArray([
          rounded.toString(),
          (rounded + 10).toString(),
          (rounded - 10).toString(),
          (rounded + 100).toString(),
        ]),
        hint: `Look at the digit to the right of the ${roundToNearest} place to decide whether to round up or down.`,
        standard: "4.NBT.A.3",
        concept: "Base Ten",
        grade: "G4",
        subtopic: "rounding",
      };
      break;
      
    case 3: // Multi-digit addition/subtraction (4.NBT.4)
      const addend1 = getRandomInt(1000, 100000);
      const addend2 = getRandomInt(1000, 100000);
      const isAddition = Math.random() < 0.5;
      const answer = isAddition
        ? addend1 + addend2
        : Math.max(addend1, addend2) - Math.min(addend1, addend2);

      question = {
        question: isAddition
          ? `What is ${addend1} + ${addend2}?`
          : `What is ${Math.max(addend1, addend2)} - ${Math.min(
              addend1,
              addend2
            )}?`,
        correctAnswer: answer.toString(),
        options: shuffleArray([
          answer.toString(),
          (answer + 100).toString(),
          (answer - 100).toString(),
          (answer + 1000).toString(),
        ]),
        hint: isAddition
          ? "Add place by place, starting from the ones."
          : "Subtract place by place, borrowing when needed.",
        standard: "4.NBT.B.4",
        concept: "Base Ten",
        grade: "G4",
        subtopic: isAddition ? "addition" : "subtraction",
      };
      break;
      
    default:
      // Fallback to place value
      const defPlaceValue = getRandomInt(1000, 9999);
      const defDigit = defPlaceValue.toString()[getRandomInt(0, 3)];
      const defPositions = ["thousands", "hundreds", "tens", "ones"];
      const defDigitPos = defPlaceValue.toString().indexOf(defDigit);

      question = {
        question: `In the number ${defPlaceValue}, what is the place value of the digit ${defDigit}?`,
        correctAnswer: defPositions[defDigitPos],
        options: shuffleArray([
          defPositions[defDigitPos],
          ...defPositions
            .filter((p) => p !== defPositions[defDigitPos])
            .slice(0, 3),
        ]),
        hint: `Look at the position of the digit ${defDigit} in ${defPlaceValue}.`,
        standard: "4.NBT.A.1",
        concept: "Base Ten",
        grade: "G4",
        subtopic: "place value",
      };
      break;
  }
  
  return question;
}

// Additional specialized question generators
export function generatePlaceValueQuestion() {
  const number = getRandomInt(1000, 999999);
  const positions = ["millions", "hundred thousands", "ten thousands", "thousands", "hundreds", "tens", "ones"];
  const digitIndex = getRandomInt(0, 6);
  const digit = number.toString()[digitIndex];
  const correctPosition = positions[digitIndex];

  return {
    question: `In the number ${number}, what is the place value of the digit ${digit}?`,
    correctAnswer: correctPosition,
    options: shuffleArray([
      correctPosition,
      ...positions.filter((p) => p !== correctPosition).slice(0, 3),
    ]),
    hint: `Count the positions from right to left: ones, tens, hundreds, thousands, ten thousands, hundred thousands, millions.`,
    standard: "4.NBT.A.1",
    concept: "Base Ten",
    grade: "G4",
    subtopic: "place value",
  };
}

export function generateRoundingQuestion() {
  const number = getRandomInt(1234, 10000000);
  const roundingOptions = [
    { name: "tens", divisor: 10 },
    { name: "hundreds", divisor: 100 },
    { name: "thousands", divisor: 1000 },
    { name: "ten thousands", divisor: 10000 },
    { name: "hundred thousands", divisor: 100000 },
    { name: "millions", divisor: 1000000 }
  ];
  
  const roundTo = roundingOptions[getRandomInt(0, roundingOptions.length - 1)];
  const rounded = Math.round(number / roundTo.divisor) * roundTo.divisor;

  return {
    question: `Round ${number} to the nearest ${roundTo.name}.`,
    correctAnswer: rounded.toString(),
    options: shuffleArray([
      rounded.toString(),
      (rounded + roundTo.divisor).toString(),
      (rounded - roundTo.divisor).toString(),
      (number).toString(), // Original number as distractor
    ]),
    hint: `Look at the digit to the right of the ${roundTo.name} place. If it's 5 or more, round up. If it's less than 5, round down.`,
    standard: "4.NBT.A.3",
    concept: "Base Ten",
    grade: "G4",
    subtopic: "rounding",
  };
}

export function generateMultiDigitArithmeticQuestion() {
  const num1 = getRandomInt(1000, 1000000);
  const num2 = getRandomInt(1000, 1000000);
  const isAddition = Math.random() < 0.5;
  
  let question, answer, hint;
  
  if (isAddition) {
    answer = num1 + num2;
    question = `What is ${num1} + ${num2}?`;
    hint = "Add place by place, starting from the ones place. Remember to carry when needed.";
  } else {
    // Ensure subtraction doesn't result in negative
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    answer = larger - smaller;
    question = `What is ${larger} - ${smaller}?`;
    hint = "Subtract place by place, starting from the ones place. Remember to borrow when needed.";
  }

  return {
    question,
    correctAnswer: answer.toString(),
    options: shuffleArray([
      answer.toString(),
      (answer + 100).toString(),
      (answer - 100).toString(),
      (answer + 1000).toString(),
      (answer + 10000).toString(),
      (answer + 100000).toString(),
      (answer + 1000000).toString(),
    ]).slice(0, 3),
    hint,
    standard: "4.NBT.B.4",
    concept: "Base Ten",
    grade: "G4",
    subtopic: isAddition ? "addition" : "subtraction",
  };
}

export function generateComparisonQuestion() {
  const num1 = getRandomInt(1000, 1000000);
  const num2 = getRandomInt(1000, 1000000);
  
  // Ensure numbers are different
  if (num1 === num2) {
    return generateComparisonQuestion();
  }
  
  const correctAnswer = num1 > num2 ? ">" : "<";
  const incorrectAnswer = num1 > num2 ? "<" : ">";

  return {
    question: `Compare these numbers: ${num1} __ ${num2}`,
    correctAnswer,
    options: shuffleArray([correctAnswer, incorrectAnswer, "="]),
    hint: "Compare digits from left to right, starting with the highest place value.",
    standard: "4.NBT.A.2",
    concept: "Base Ten",
    grade: "G4",
    subtopic: "comparison",
  };
}

const baseTenQuestions = {
  generateQuestion,
  generatePlaceValueQuestion,
  generateRoundingQuestion,
  generateMultiDigitArithmeticQuestion,
  generateComparisonQuestion,
};

export default baseTenQuestions;
