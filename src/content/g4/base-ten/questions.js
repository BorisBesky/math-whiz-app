// Question generation for 4th Grade Base Ten topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomIntUniqueDigits(count) {
  const digits = new Set();
  while (digits.size < count) {
    digits.add(getRandomInt(0, 9));
  }
  return Array.from(digits);
}

/**
 * Generates a random Base Ten question for 4th grade
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion() {
  // Array of all available question generators
  const questionTypes = [
    generatePlaceValueQuestion,
    generateRoundingQuestion,
    generateMultiDigitArithmeticQuestion,
    generateComparisonQuestion,
    generateSubtractionWordProblemQuestion,
    generateAdditionWordProblemQuestion,
    generateMultiStepWordProblemQuestion,
  ];
  
  // Randomly select a question type
  const selectedGenerator = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  return selectedGenerator();
}

// Additional specialized question generators
export function generatePlaceValueQuestion() {
  const number = getRandomIntUniqueDigits(7).join('');
  const positions = ["millions", "hundred thousands", "ten thousands", "thousands", "hundreds", "tens", "ones"];
  const digitIndex = getRandomInt(0, 6);
  const digit = number.toString()[digitIndex];
  const correctPosition = positions[digitIndex];
  const potentialDistractors = positions.filter((p) => p !== correctPosition).slice(0, 3);

  return {
    question: `In the number ${number}, what is the place value of the digit ${digit}?`,
    correctAnswer: correctPosition,
    options: shuffle(generateUniqueOptions(correctPosition, potentialDistractors)),
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
  const correctAnswer = rounded.toString();
  const potentialDistractors = [
    (rounded + roundTo.divisor).toString(),
    (rounded - roundTo.divisor).toString(),
    (number).toString(),
  ];

  return {
    question: `Round ${number} to the nearest ${roundTo.name}.`,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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

  const correctAnswer = answer.toString();
  const potentialDistractors = [
    (answer + 100).toString(),
    (answer - 100).toString(),
    (answer + 1000).toString(),
    (answer + 10000).toString(),
    (answer + 100000).toString(),
    (answer + 1000000).toString(),
  ];

  return {
    question,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
    options: shuffle(generateUniqueOptions(correctAnswer, [incorrectAnswer, "="])),
    hint: "Compare digits from left to right, starting with the highest place value.",
    standard: "4.NBT.A.2",
    concept: "Base Ten",
    grade: "G4",
    subtopic: "comparison",
  };
}

/**
 * Generates multi-digit subtraction word problems (4.NBT.B.4)
 */
export function generateSubtractionWordProblemQuestion() {
  const scenarios = [
    {
      context: "food drive",
      item: "cans",
      location: "school",
      timeframes: ["last year", "this year"],
      question: (name, smaller, larger, item) => 
        `${name} collected ${addCommas(smaller)} ${item} for the food drive last year. This year they collected ${addCommas(larger)} ${item} of food. How many more ${item} did the students of ${name} collect this year than last year?`
    },
    {
      context: "fundraising",
      item: "dollars",
      location: "school",
      timeframes: ["last month", "this month"],
      question: (name, smaller, larger, item) => 
        `${name} raised $${addCommas(smaller)} for charity last month. This month they raised $${addCommas(larger)}. How much more money did ${name} raise this month than last month?`
    },
    {
      context: "reading challenge", 
      item: "books",
      location: "library",
      timeframes: ["last semester", "this semester"],
      question: (name, smaller, larger, item) => 
        `${name} students read ${addCommas(smaller)} ${item} last semester. This semester they read ${addCommas(larger)} ${item}. How many more ${item} did they read this semester than last semester?`
    },
    {
      context: "recycling program",
      item: "bottles",
      location: "community center", 
      timeframes: ["last quarter", "this quarter"],
      question: (name, smaller, larger, item) => 
        `The ${name} recycling program collected ${addCommas(smaller)} ${item} last quarter. This quarter they collected ${addCommas(larger)} ${item}. How many more ${item} were collected this quarter than last quarter?`
    },
    {
      context: "ticket sales",
      item: "tickets",
      location: "theater",
      timeframes: ["opening week", "second week"],
      question: (name, smaller, larger, item) => 
        `${name} Theater sold ${addCommas(smaller)} ${item} during opening week. During the second week they sold ${addCommas(larger)} ${item}. How many more ${item} were sold in the second week than the opening week?`
    }
  ];

  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  const schoolNames = ["Riverside Elementary", "Oak Hill School", "Maplewood Academy", "Sunrise Elementary", "Valley View School"];
  const organizationNames = ["Green Valley", "Riverside", "Mountain View", "Sunset", "Hillcrest"];
  
  const isSchool = scenario.location === "school";
  const locationName = isSchool 
    ? schoolNames[getRandomInt(0, schoolNames.length - 1)]
    : organizationNames[getRandomInt(0, organizationNames.length - 1)];

  // Generate numbers ensuring the second is larger
  const smaller = getRandomInt(10000, 85000);
  const difference = getRandomInt(5000, 25000);
  const larger = smaller + difference;
  const correctAnswer = difference.toString();
  const potentialDistractors = [
    (larger).toString(),
    (smaller).toString(),
    (larger + smaller).toString(),
  ];

  return {
    question: scenario.question(locationName, smaller, larger, scenario.item),
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `To find "how many more," subtract the smaller amount from the larger amount: ${addCommas(larger)} - ${addCommas(smaller)}.`,
    standard: "4.NBT.B.4",
    concept: "Base Ten",
    grade: "G4",
    subtopic: "subtraction word problems",
  };
}

/**
 * Generates multi-digit addition word problems (4.NBT.B.4)
 */
export function generateAdditionWordProblemQuestion() {
  const scenarios = [
    {
      context: "attendance",
      question: (event, day1, day2, total) =>
        `During the ${event}, ${addCommas(day1)} people attended on Saturday and ${addCommas(day2)} people attended on Sunday. What was the total attendance for the weekend?`
    },
    {
      context: "sales",
      question: (store, product1, amount1, product2, amount2, total) =>
        `${store} sold ${addCommas(amount1)} ${product1} and ${addCommas(amount2)} ${product2} during their sale. How many items did they sell in total?`
    },
    {
      context: "population",
      question: (city, district1, pop1, district2, pop2, total) =>
        `${city} has ${addCommas(pop1)} people living in the ${district1} district and ${addCommas(pop2)} people in the ${district2} district. What is the total population of these two districts?`
    },
    {
      context: "library collection",
      question: (library, type1, count1, type2, count2, total) =>
        `${library} Library has ${addCommas(count1)} ${type1} and ${addCommas(count2)} ${type2}. How many books and magazines do they have altogether?`
    },
    {
      context: "votes",
      question: (election, candidate1, votes1, candidate2, votes2, total) =>
        `In the school election, ${candidate1} received ${addCommas(votes1)} votes and ${candidate2} received ${addCommas(votes2)} votes. How many total votes were cast for these two candidates?`
    }
  ];

  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  
  const names = {
    events: ["Spring Festival", "Art Fair", "Science Expo", "Book Fair", "Music Concert"],
    stores: ["Mega Store", "City Market", "Downtown Shop", "Valley Mall", "Riverside Store"],
    cities: ["Springfield", "Riverside", "Oak Hill", "Maplewood", "Sunset Valley"],
    districts: ["North", "South", "East", "West", "Central"],
    libraries: ["Central", "Downtown", "Community", "Public", "Regional"],
    types: [["fiction books", "magazines"], ["children's books", "adult books"], ["novels", "textbooks"]],
    candidates: ["Sarah", "Mike", "Emma", "Alex", "Jordan"]
  };

  const num1 = getRandomInt(12000, 75000);
  const num2 = getRandomInt(15000, 80000);
  const total = num1 + num2;
  const correctAnswer = total.toString();

  let questionText;
  switch (scenario.context) {
    case "attendance":
      questionText = scenario.question(
        names.events[getRandomInt(0, names.events.length - 1)], 
        num1, num2, total
      );
      break;
    case "sales":
      const bookTypes = names.types[getRandomInt(0, names.types.length - 1)];
      questionText = scenario.question(
        names.stores[getRandomInt(0, names.stores.length - 1)],
        bookTypes[0], num1, bookTypes[1], num2, total
      );
      break;
    case "population":
      const districts = ["North", "South"];
      questionText = scenario.question(
        names.cities[getRandomInt(0, names.cities.length - 1)],
        districts[0], num1, districts[1], num2, total
      );
      break;
    case "library collection":
      const collectionTypes = names.types[getRandomInt(0, names.types.length - 1)];
      questionText = scenario.question(
        names.libraries[getRandomInt(0, names.libraries.length - 1)],
        collectionTypes[0], num1, collectionTypes[1], num2, total
      );
      break;
    case "votes":
      const candidateNames = [names.candidates[0], names.candidates[1]];
      questionText = scenario.question(
        "election", candidateNames[0], num1, candidateNames[1], num2, total
      );
      break;
    default:
      questionText = `What is ${addCommas(num1)} + ${addCommas(num2)}?`;
  }

  const potentialDistractors = [
    (total - 1000).toString(),
    (total + 1000).toString(),
    (Math.abs(num1 - num2)).toString(),
  ];

  return {
    question: questionText,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: `Add the two numbers together: ${addCommas(num1)} + ${addCommas(num2)}.`,
    standard: "4.NBT.B.4",
    concept: "Base Ten",
    grade: "G4",
    subtopic: "addition word problems",
  };
}

/**
 * Generates multi-step word problems involving both addition and subtraction (4.NBT.B.4)
 */
export function generateMultiStepWordProblemQuestion() {
  const scenarios = [
    {
      context: "school supplies",
      question: (school, initial, bought, used) =>
        `${school} started the year with ${addCommas(initial)} pencils. They bought ${addCommas(bought)} more pencils during the first semester and used ${addCommas(used)} pencils. How many pencils do they have left?`
    },
    {
      context: "concert tickets", 
      question: (venue, capacity, sold1, sold2) =>
        `${venue} has ${addCommas(capacity)} seats. They sold ${addCommas(sold1)} tickets in advance and ${addCommas(sold2)} tickets at the door. How many seats are still empty?`
    },
    {
      context: "charity drive",
      question: (org, goal, week1, week2) =>
        `${org} set a goal to raise $${addCommas(goal)} for charity. They raised $${addCommas(week1)} in the first week and $${addCommas(week2)} in the second week. How much more money do they need to reach their goal?`
    }
  ];

  const scenario = scenarios[getRandomInt(0, scenarios.length - 1)];
  const names = {
    schools: ["Mariposa Upper Elementary", "Washington Middle School", "Jefferson Academy"],
    venues: ["City Theater", "Grand Auditorium", "Community Center"],
    organizations: ["Helping Hands Club", "Community Volunteers", "Youth Foundation"]
  };

  let questionText, answer;
  
  switch (scenario.context) {
    case "school supplies":
      const initial = getRandomInt(25000, 75000);
      const bought = getRandomInt(15000, 35000);
      const used = getRandomInt(20000, 45000);
      answer = initial + bought - used;
      questionText = scenario.question(
        names.schools[getRandomInt(0, names.schools.length - 1)],
        initial, bought, used
      );
      break;
    case "concert tickets":
      const capacity = getRandomInt(35000, 85000);
      const sold1 = getRandomInt(15000, 30000);
      const sold2 = getRandomInt(10000, 25000);
      answer = capacity - (sold1 + sold2);
      questionText = scenario.question(
        names.venues[getRandomInt(0, names.venues.length - 1)],
        capacity, sold1, sold2
      );
      break;
    case "charity drive":
      const goal = getRandomInt(75000, 150000);
      const week1 = getRandomInt(20000, 40000);
      const week2 = getRandomInt(15000, 35000);
      answer = goal - (week1 + week2);
      questionText = scenario.question(
        names.organizations[getRandomInt(0, names.organizations.length - 1)],
        goal, week1, week2
      );
      break;
    default:
      answer = 0;
      questionText = "Error in question generation";
  }

  // Ensure answer is positive
  if (answer < 0) {
    return generateMultiStepWordProblemQuestion();
  }
  const correctAnswer = answer.toString();
  const potentialDistractors = [
    (answer + 5000).toString(),
    (answer - 5000).toString(),
    (answer + 10000).toString(),
  ];

  return {
    question: questionText,
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    hint: "Break this into steps: first do any addition, then do any subtraction.",
    standard: "4.NBT.B.4",
    concept: "Base Ten", 
    grade: "G4",
    subtopic: "multi-step word problems",
  };
}

/**
 * Helper function to add commas to large numbers for readability
 */
function addCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const baseTenQuestions = {
  generateQuestion,
  generatePlaceValueQuestion,
  generateRoundingQuestion,
  generateMultiDigitArithmeticQuestion,
  generateComparisonQuestion,
  generateSubtractionWordProblemQuestion,
  generateAdditionWordProblemQuestion,
  generateMultiStepWordProblemQuestion,
};

export default baseTenQuestions;
