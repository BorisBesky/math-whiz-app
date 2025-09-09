// Question generation for 3rd Grade Division topic

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
 * Generates a random Division question for 3rd grade
 * @param {number} difficulty - Difficulty level from 0 to 1
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5) {
  const d_quotient = getRandomInt(2, 2 + Math.floor(7 * difficulty));
  const d_divisor = getRandomInt(2, 2 + Math.floor(7 * difficulty));
  const d_dividend = d_quotient * d_divisor;

  return {
    question: `What is ${d_dividend} ÷ ${d_divisor}?`,
    correctAnswer: d_quotient.toString(),
    options: shuffleArray([
      d_quotient.toString(),
      (d_quotient + 1).toString(),
      (d_quotient - 1).toString(),
      (d_quotient + getRandomInt(2, 4)).toString(),
    ]),
    hint: `Think: ${d_divisor} multiplied by what number gives you ${d_dividend}?`,
    standard: "3.OA.C.7",
    concept: "Division",
    grade: "G3",
    subtopic: "basic division",
  };
}

/**
 * Generates an equal sharing division question
 */
export function generateEqualSharingQuestion() {
  const totalItems = getRandomInt(12, 36);
  const numGroups = getRandomInt(2, 6);
  
  // Ensure equal division
  const adjustedTotal = totalItems - (totalItems % numGroups);
  const itemsPerGroup = adjustedTotal / numGroups;
  
  const scenarios = [
    {
      item: "cookies",
      container: "friends",
      question: (total, groups, item, container) => `You have ${total} ${item} to share equally among ${groups} ${container}. How many ${item} will each friend get?`,
    },
    {
      item: "stickers",
      container: "children",
      question: (total, groups, item, container) => `There are ${total} ${item} to divide equally among ${groups} ${container}. How many ${item} will each child receive?`,
    },
    {
      item: "apples",
      container: "baskets",
      question: (total, groups, item, container) => `A farmer has ${total} ${item} to put into ${groups} ${container} with the same number in each basket. How many ${item} go in each basket?`,
    },
    {
      item: "books",
      container: "shelves",
      question: (total, groups, item, container) => `The librarian needs to put ${total} ${item} on ${groups} ${container} with the same number on each shelf. How many ${item} go on each shelf?`,
    },
  ];
  
  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  
  return {
    question: scenario.question(adjustedTotal, numGroups, scenario.item, scenario.container),
    correctAnswer: itemsPerGroup.toString(),
    options: shuffleArray([
      itemsPerGroup.toString(),
      (itemsPerGroup + 1).toString(),
      (itemsPerGroup - 1).toString(),
      (adjustedTotal - numGroups).toString(),
    ]),
    hint: `Divide ${adjustedTotal} into ${numGroups} equal groups. ${adjustedTotal} ÷ ${numGroups} = ?`,
    standard: "3.OA.A.2",
    concept: "Division",
    grade: "G3",
    subtopic: "equal sharing",
  };
}

/**
 * Generates a grouping division question
 */
export function generateGroupingQuestion() {
  const itemsPerGroup = getRandomInt(3, 8);
  const numGroups = getRandomInt(3, 7);
  const totalItems = itemsPerGroup * numGroups;
  
  const scenarios = [
    {
      item: "pencils",
      container: "boxes",
      question: (total, perGroup, item, container) => `You have ${total} ${item}. If you put ${perGroup} ${item} in each box, how many ${container} will you need?`,
    },
    {
      item: "students",
      container: "teams",
      question: (total, perGroup, item, container) => `There are ${total} ${item} in the class. If each team has ${perGroup} ${item}, how many ${container} can be made?`,
    },
    {
      item: "flowers",
      container: "bouquets",
      question: (total, perGroup, item, container) => `A florist has ${total} ${item}. If each bouquet contains ${perGroup} ${item}, how many ${container} can be made?`,
    },
    {
      item: "marbles",
      container: "bags",
      question: (total, perGroup, item, container) => `You have ${total} ${item}. If you put ${perGroup} ${item} in each bag, how many ${container} will you fill?`,
    },
  ];
  
  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  
  return {
    question: scenario.question(totalItems, itemsPerGroup, scenario.item, scenario.container),
    correctAnswer: numGroups.toString(),
    options: shuffleArray([
      numGroups.toString(),
      (numGroups + 1).toString(),
      (numGroups - 1).toString(),
      (totalItems - itemsPerGroup).toString(),
    ]),
    hint: `How many groups of ${itemsPerGroup} can you make from ${totalItems}? ${totalItems} ÷ ${itemsPerGroup} = ?`,
    standard: "3.OA.A.2",
    concept: "Division",
    grade: "G3",
    subtopic: "grouping",
  };
}

/**
 * Generates a fact family division question
 */
export function generateFactFamilyQuestion() {
  const factor1 = getRandomInt(2, 9);
  const factor2 = getRandomInt(2, 9);
  const product = factor1 * factor2;
  
  const questionTypes = [
    {
      question: `If ${factor1} × ${factor2} = ${product}, what is ${product} ÷ ${factor1}?`,
      answer: factor2,
    },
    {
      question: `If ${factor1} × ${factor2} = ${product}, what is ${product} ÷ ${factor2}?`,
      answer: factor1,
    },
    {
      question: `${factor1} × __ = ${product}. What number goes in the blank?`,
      answer: factor2,
    },
    {
      question: `__ × ${factor2} = ${product}. What number goes in the blank?`,
      answer: factor1,
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
      (selected.answer + getRandomInt(2, 4)).toString(),
    ]),
    hint: "Remember: multiplication and division are opposite operations. They're like inverse partners!",
    standard: "3.OA.B.6",
    concept: "Division",
    grade: "G3",
    subtopic: "fact families",
  };
}

/**
 * Generates a remainder division question (for advanced students)
 */
export function generateRemainderQuestion() {
  const divisor = getRandomInt(3, 7);
  const quotient = getRandomInt(3, 8);
  const remainder = getRandomInt(1, divisor - 1);
  const dividend = quotient * divisor + remainder;
  
  return {
    question: `What is the remainder when ${dividend} ÷ ${divisor}?`,
    correctAnswer: remainder.toString(),
    options: shuffleArray([
      remainder.toString(),
      (remainder + 1).toString(),
      (remainder - 1 >= 0 ? remainder - 1 : remainder + 1).toString(),
      divisor.toString(),
    ]),
    hint: `Divide ${dividend} by ${divisor}. How much is left over after making equal groups?`,
    standard: "3.OA.C.7",
    concept: "Division",
    grade: "G3",
    subtopic: "remainders",
  };
}

/**
 * Generates an array division question
 */
export function generateArrayDivisionQuestion() {
  const rows = getRandomInt(3, 6);
  const cols = getRandomInt(3, 8);
  const total = rows * cols;
  
  const questionTypes = [
    {
      question: `There are ${total} objects arranged in ${rows} equal rows. How many objects are in each row?`,
      answer: cols,
    },
    {
      question: `There are ${total} objects arranged in equal rows with ${cols} objects in each row. How many rows are there?`,
      answer: rows,
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
      (total - selected.answer).toString(),
    ]),
    hint: "Think about how arrays work. Rows × columns = total, so total ÷ one dimension = the other dimension.",
    standard: "3.OA.A.3",
    concept: "Division",
    grade: "G3",
    subtopic: "arrays",
  };
}

const divisionQuestions = {
  generateQuestion,
  generateEqualSharingQuestion,
  generateGroupingQuestion,
  generateFactFamilyQuestion,
  generateRemainderQuestion,
  generateArrayDivisionQuestion,
};

export default divisionQuestions;
