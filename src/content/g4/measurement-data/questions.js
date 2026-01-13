// Question generation for 4th Grade Measurement & Data topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';
import { generateClockSVG } from '../../../utils/clockGenerator.js';

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random Measurement & Data question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'length conversion': { generator: generateLengthConversionQuestion, minDifficulty: 0.0, maxDifficulty: 0.8 },
    'weight and capacity conversion': { generator: generateWeightCapacityConversionQuestion, minDifficulty: 0.2, maxDifficulty: 0.9 },
    'time conversion': { generator: generateTimeConversionQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    'clock reading': { generator: generateClockReadingQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'area': { generator: (diff) => generateAreaPerimeterQuestion(diff, 'area'), minDifficulty: 0.5, maxDifficulty: 1.0 },
    'perimeter': { generator: (diff) => generateAreaPerimeterQuestion(diff, 'perimeter'), minDifficulty: 0.5, maxDifficulty: 1.0 },
    'angles': { generator: generateAngleQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'data interpretation': { generator: generateDataInterpretationQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'line plots': { generator: generateLinePlotQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
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
  
  // Filter available questions based on difficulty
  const available = questionTypes.filter(
    q => difficulty >= q.minDifficulty && difficulty <= q.maxDifficulty
  );

  // If no questions available for this difficulty, use all question types (relax difficulty constraint)
  const candidates = available.length > 0 ? available : questionTypes;

  // If still no valid question types, return null
  if (candidates.length === 0) {
    console.warn('[generateQuestion] No valid question types found for allowed subtopics:', allowedSubtopics);
    return null;
  }
  // Randomly select from available types
  const selected = candidates[getRandomInt(0, candidates.length - 1)];
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
    questionType: 'multiple-choice',
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
    questionType: 'multiple-choice',
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
    questionType: 'multiple-choice',
    hint: `Remember: 1 ${timeConv.from.slice(0, -1)} = ${timeConv.factor} ${timeConv.to}.`,
    standard: "4.MD.A.1",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "time conversion",
  };
}

/**
 * @param {number} difficulty - Difficulty level from 0 to 1
 * @param {string} requestedSubtopic - Optional: 'area' or 'perimeter' to force a specific type
 */
export function generateAreaPerimeterQuestion(difficulty = 0.5, requestedSubtopic = null) {
  const rectLength = getRandomInt(4, 12);
  const rectWidth = getRandomInt(3, 8);
  // If a specific subtopic is requested, use it; otherwise random
  const isAreaQuestion = requestedSubtopic === 'area' 
    ? true 
    : requestedSubtopic === 'perimeter' 
    ? false 
    : Math.random() < 0.5;
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
    questionType: 'multiple-choice',
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
    questionType: 'multiple-choice',
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
    questionType: 'multiple-choice',
    hint: "Look carefully at the data and compare the numbers for each category.",
    standard: "4.MD.B.4",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "data interpretation",
  };
}

/**
 * Generates a clock reading question with an analog clock SVG
 * @param {number} difficulty - Difficulty level from 0 to 1
 * @returns {Object} Question object with clock image and time reading question
 */
export function generateClockReadingQuestion(difficulty = 0.5) {
  let hours, minutes;
  
  // Difficulty-based time selection
  if (difficulty < 0.4) {
    // Easy: On-the-hour or quarter hours
    const easyTimes = [
      // On-the-hour
      [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
      [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0],
      // Quarter hours
      [1, 15], [2, 15], [3, 15], [4, 15], [5, 15], [6, 15],
      [7, 15], [8, 15], [9, 15], [10, 15], [11, 15], [12, 15],
      [1, 30], [2, 30], [3, 30], [4, 30], [5, 30], [6, 30],
      [7, 30], [8, 30], [9, 30], [10, 30], [11, 30], [12, 30],
      [1, 45], [2, 45], [3, 45], [4, 45], [5, 45], [6, 45],
      [7, 45], [8, 45], [9, 45], [10, 45], [11, 45], [12, 45],
    ];
    const selected = easyTimes[getRandomInt(0, easyTimes.length - 1)];
    hours = selected[0];
    minutes = selected[1];
  } else if (difficulty < 0.7) {
    // Medium: 5-minute intervals
    hours = getRandomInt(1, 12);
    const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    minutes = minuteOptions[getRandomInt(0, minuteOptions.length - 1)];
  } else {
    // Hard: Any minute
    hours = getRandomInt(1, 12);
    minutes = getRandomInt(0, 59);
  }
  
  // Generate clock SVG
  // For harder questions (difficulty > 0.5), only show cardinal numbers (12, 3, 6, 9)
  const clockSVG = generateClockSVG(hours, minutes, {
    size: 250,
    showNumbers: true,
    showOnlyCardinalNumbers: difficulty > 0.5
  });
  
  // Format correct answer in simple time format (H:MM)
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const correctAnswer = `${hours}:${formattedMinutes}`;
  
  // Helper function to format time without AM/PM
  const formatTime = (h, m) => {
    const fm = m.toString().padStart(2, '0');
    return `${h}:${fm}`;
  };
  
  // Generate distractors
  const potentialDistractors = [];
  
  // Distractor 1: Swap hour and minute (common mistake)
  const swappedMinutes = hours * 5; // Convert hour to approximate minutes
  // Convert minutes to approximate hours, always in range 1-12
  const swappedHours = ((Math.floor(minutes / 5) % 12) + 1);
  if (swappedHours >= 1 && swappedHours <= 12 && swappedMinutes !== minutes) {
    potentialDistractors.push(formatTime(swappedHours, swappedMinutes));
  }
  
  // Distractor 2: Off by 5 minutes
  const offBy5 = (minutes + 5) % 60;
  potentialDistractors.push(formatTime(hours, offBy5));
  
  // Distractor 3: Off by one hour
  const offByHour = ((hours % 12) + 1) || 12;
  potentialDistractors.push(formatTime(offByHour, minutes));
  
  // Distractor 4: Off by 15 minutes
  const offBy15 = (minutes + 15) % 60;
  potentialDistractors.push(formatTime(hours, offBy15));
  
  // Distractor 5: Off by one hour in the other direction
  const offByHourBack = hours === 1 ? 12 : hours - 1;
  potentialDistractors.push(formatTime(offByHourBack, minutes));
  
  // Ensure we have enough unique distractors
  const uniqueDistractors = [...new Set(potentialDistractors)].filter(d => d !== correctAnswer);
  
  return {
    question: "What time is shown on the clock?",
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, uniqueDistractors)),
    questionType: 'multiple-choice',
    hint: "Look at where the hour hand and minute hand are pointing. The hour hand is shorter and the minute hand is longer.",
    standard: "4.MD.A.1",
    concept: "Measurement & Data 4th",
    grade: "G4",
    subtopic: "clock reading",
    images: [
      {
        type: 'question',
        data: clockSVG,
        description: 'Analog clock showing the time'
      }
    ]
  };
}

/**
 * Generates a line plot question with fraction measurements
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateLinePlotQuestion(difficulty = 0.5) {
  // Generate data points using fractions
  const denominators = [2, 4, 8];
  const denominator = denominators[getRandomInt(0, denominators.length - 1)];
  
  // Create data points
  let dataPoints = [];
  let counts = {};
  
  // Define possible values (whole number + fraction)
  const wholeNumbers = [1, 2, 3];
  let allPossibleValues = [];
  
  for (let w of wholeNumbers) {
    for (let i = 0; i < denominator; i++) {
        allPossibleValues.push({ whole: w, numerator: i, denominator });
    }
  }
  
  // Select distinct values to use in the plot (3 to 5 distinct values)
  const numDistinctValues = getRandomInt(3, 5);
  const selectedValues = shuffle(allPossibleValues).slice(0, numDistinctValues);
  
  // Determine frequencies with guaranteed unique max and min
  const minFreq = 1;
  const maxFreq = getRandomInt(3, 5); // Ensure gap for distinctness (at least 2 greater than min)
  
  // Assign counts
  let valueCounts = [];
  
  // 1. Max frequency
  valueCounts.push({ value: selectedValues[0], count: maxFreq });
  
  // 2. Min frequency
  valueCounts.push({ value: selectedValues[1], count: minFreq });
  
  // 3. Others (strictly between min and max)
  for (let i = 2; i < selectedValues.length; i++) {
      const midCount = getRandomInt(minFreq + 1, maxFreq - 1);
      valueCounts.push({ value: selectedValues[i], count: midCount });
  }

  // Construct dataPoints list and counts map
  valueCounts.forEach(item => {
    // Add to dataPoints list
    for(let k=0; k < item.count; k++) {
        dataPoints.push(item.value);
    }
    
    // Build counts map
    const key = item.value.numerator === 0 
        ? `${item.value.whole}` 
        : `${item.value.whole} ${item.value.numerator}/${item.value.denominator}`;
    counts[key] = item.count;
  });
  
  dataPoints = shuffle(dataPoints);
  const numPoints = dataPoints.length;
  
  const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  
  // Find statistics
  const mostCommon = sortedKeys[0];
  const leastCommon = sortedKeys[sortedKeys.length - 1];
  
  const questionTypes = ['count', 'mostCommon', 'leastCommon', 'howMany'];
  const questionType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  // Format data description for the question
  const dataDescription = dataPoints.map(point => 
    point.numerator === 0 
      ? `${point.whole}` 
      : `${point.whole} ${point.numerator}/${point.denominator}`
  ).join(', ');
  
  if (questionType === 'count') {
    const targetValue = sortedKeys[getRandomInt(0, Math.min(2, sortedKeys.length - 1))];
    const correctAnswer = counts[targetValue].toString();
    const potentialDistractors = [
      (counts[targetValue] + 1).toString(),
      (counts[targetValue] - 1).toString(),
      (numPoints).toString(),
    ];
    
    return {
      question: `Line Plot Data:\n${dataDescription}\n\nHow many data points are at ${targetValue}?`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
      questionType: 'multiple-choice',
      hint: "Count how many times the value appears in the list.",
      standard: "4.MD.B.4",
      concept: "Measurement & Data 4th",
      grade: "G4",
      subtopic: "line plots",
    };
  } else if (questionType === 'mostCommon') {
    const correctAnswer = mostCommon;
    const wrongOptions = sortedKeys.filter(k => k !== mostCommon).slice(0, 3);
    
    return {
      question: `Line Plot Data:\n${dataDescription}\n\nWhich measurement appears most frequently?`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, wrongOptions)),
      questionType: 'multiple-choice',
      hint: "Find the value that appears most frequently in the list.",
      standard: "4.MD.B.4",
      concept: "Measurement & Data 4th",
      grade: "G4",
      subtopic: "line plots",
    };
  } else if (questionType === 'leastCommon') {
    const correctAnswer = leastCommon;
    const wrongOptions = sortedKeys.filter(k => k !== leastCommon).slice(0, 3);
    
    return {
      question: `Line Plot Data:\n${dataDescription}\n\nWhich measurement appears least frequently?`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, wrongOptions)),
      questionType: 'multiple-choice',
      hint: "Find the value that appears least frequently in the list.",
      standard: "4.MD.B.4",
      concept: "Measurement & Data 4th",
      grade: "G4",
      subtopic: "line plots",
    };
  } else {
    const correctAnswer = numPoints.toString();
    const potentialDistractors = [
      (numPoints + 2).toString(),
      (numPoints - 1).toString(),
      (sortedKeys.length).toString(),
    ];
    
    return {
      question: `Line Plot Data:\n${dataDescription}\n\nHow many total measurements are shown on the line plot?`,
      correctAnswer: correctAnswer,
      options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
      questionType: 'multiple-choice',
      hint: "Count all the numbers in the list.",
      standard: "4.MD.B.4",
      concept: "Measurement & Data 4th",
      grade: "G4",
      subtopic: "line plots",
    };
  }
}

const measurementDataQuestions = {
  generateQuestion,
  generateLengthConversionQuestion,
  generateWeightCapacityConversionQuestion,
  generateTimeConversionQuestion,
  generateAreaPerimeterQuestion,
  generateAngleQuestion,
  generateDataInterpretationQuestion,
  generateClockReadingQuestion,
  generateLinePlotQuestion,
};

export default measurementDataQuestions;
