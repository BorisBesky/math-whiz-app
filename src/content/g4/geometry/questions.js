// Question generation for 4th Grade Geometry topic
import { QUESTION_TYPES } from '../../../constants/shared-constants.js';
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions that need to be imported from utils
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Maps each real-life example name to its image path in public/images/angles/
const ANGLE_EXAMPLE_IMAGES = {
  // Acute
  "open scissors": "/images/angles/acute-scissors.jpg",
  "slice of pizza tip": "/images/angles/acute-pizza.jpg",
  "clock hands at 1:00": "/images/angles/acute-clock-1.jpg",
  "partially opened book": "/images/angles/acute-book.jpg",
  "roof peak on a steep house": "/images/angles/acute-roof.jpg",
  "letter V shape": "/images/angles/acute-v-shape.jpg",
  "narrow road fork": "/images/angles/acute-road-fork.jpg",
  "paper folded into a sharp corner": "/images/angles/acute-folded-paper.jpg",
  // Right
  "corner of a book": "/images/angles/right-book-corner.jpg",
  "corner of a window frame": "/images/angles/right-window.jpg",
  "corner of a square tile": "/images/angles/right-tile.jpg",
  "edge where wall meets floor": "/images/angles/right-wall-floor.jpg",
  "corner of a picture frame": "/images/angles/right-picture-frame.jpg",
  "corner of a notebook": "/images/angles/right-notebook.jpg",
  "intersection of perpendicular streets": "/images/angles/right-streets.jpg",
  "corner of a rectangular table": "/images/angles/right-table.jpg",
  // Obtuse
  "laptop half-open": "/images/angles/obtuse-laptop.jpg",
  "door opened wide": "/images/angles/obtuse-door.jpg",
  "clock hands at 4:00": "/images/angles/obtuse-clock-4.jpg",
  "wide pair of tongs": "/images/angles/obtuse-tongs.jpg",
  "reclining beach chair angle": "/images/angles/obtuse-beach-chair.jpg",
  "open mailbox lid": "/images/angles/obtuse-mailbox.jpg",
  "tree branch splitting wide": "/images/angles/obtuse-tree-branch.jpg",
  "opened umbrella rib section": "/images/angles/obtuse-umbrella.jpg",
  // Straight
  "flat table edge": "/images/angles/straight-table-edge.jpg",
  "horizon line": "/images/angles/straight-horizon.jpg",
  "straight ruler edge": "/images/angles/straight-ruler.jpg",
  "taut jump rope": "/images/angles/straight-jump-rope.jpg",
  "straight road segment": "/images/angles/straight-road.jpg",
  "edge of a shelf": "/images/angles/straight-shelf.jpg",
  "fully opened book laid flat": "/images/angles/straight-flat-book.jpg",
  "straight line on notebook paper": "/images/angles/straight-notebook-line.jpg",
};

export const ANGLE_TYPES = [
  {
    name: "acute angle",
    range: "less than 90°",
    example: "45°",
    realLifeExamples: [
      "open scissors",
      "slice of pizza tip",
      "clock hands at 1:00",
      "partially opened book",
      "roof peak on a steep house",
      "letter V shape",
      "narrow road fork",
      "paper folded into a sharp corner",
    ],
  },
  {
    name: "right angle",
    range: "exactly 90°",
    example: "90°",
    realLifeExamples: [
      "corner of a book",
      "corner of a window frame",
      "corner of a square tile",
      "edge where wall meets floor",
      "corner of a picture frame",
      "corner of a notebook",
      "intersection of perpendicular streets",
      "corner of a rectangular table",
    ],
  },
  {
    name: "obtuse angle",
    range: "between 90° and 180°",
    example: "120°",
    realLifeExamples: [
      "laptop half-open",
      "door opened wide",
      "clock hands at 4:00",
      "wide pair of tongs",
      "reclining beach chair angle",
      "open mailbox lid",
      "tree branch splitting wide",
      "opened umbrella rib section",
    ],
  },
  {
    name: "straight angle",
    range: "exactly 180°",
    example: "180°",
    realLifeExamples: [
      "flat table edge",
      "horizon line",
      "straight ruler edge",
      "taut jump rope",
      "straight road segment",
      "edge of a shelf",
      "fully opened book laid flat",
      "straight line on notebook paper",
    ],
  },
];

/**
 * Generates a random geometry question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @param {string[]} allowedSubtopics - Optional array of allowed subtopic names. If provided, only questions from these subtopics will be generated.
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5, allowedSubtopics = null) {
  // Map subtopic names to generators
  const subtopicToGenerator = {
    'lines and angles': { generator: generateLinesAndAnglesQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'points lines rays': { generator: generatePointsLinesRaysQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    'classify shapes': { generator: generateShapeClassificationQuestion, minDifficulty: 0.2, maxDifficulty: 1.0 },
    'symmetry': { generator: generateLineSymmetryQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    'triangles': [
      { generator: generateTriangleClassificationBySidesQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
      { generator: generateTriangleClassificationByAnglesQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    ],
    'quadrilaterals': { generator: generateQuadrilateralPropertiesQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    'angle measurement': { generator: generateAngleMeasurementQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
  };
  
  // Normalize subtopic names for comparison
  const normalize = (str) => str.toLowerCase().trim();
  
  // If allowed subtopics are specified, filter to only those generators
  let questionTypes = [];
  if (allowedSubtopics && allowedSubtopics.length > 0) {
    const normalizedAllowed = allowedSubtopics.map(normalize);
    Object.entries(subtopicToGenerator).forEach(([subtopic, config]) => {
      if (normalizedAllowed.includes(normalize(subtopic))) {
        // Handle arrays (like triangles which has multiple generators)
        if (Array.isArray(config)) {
          questionTypes.push(...config);
        } else {
          questionTypes.push(config);
        }
      }
    });
  } else {
    // Default: all question types
    Object.values(subtopicToGenerator).forEach(config => {
      if (Array.isArray(config)) {
        questionTypes.push(...config);
      } else {
        questionTypes.push(config);
      }
    });
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

// Additional question types for future expansion
/**
 * Generates a lines and angles question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateLinesAndAnglesQuestion(difficulty = 0.5) {
  const questionTypes = [
    {
      question: "Two lines that never meet and are always the same distance apart are called:",
      correctAnswer: "parallel",
      options: ["perpendicular", "intersecting", "curved"],
      hint: "Think about train tracks - they run alongside each other but never meet.",
    },
    {
      question: "Two lines that meet at a right angle (90°) are called:",
      correctAnswer: "perpendicular",
      options: ["parallel", "intersecting", "curved"],
      hint: "Think about the corner of a square - the lines meet at a perfect right angle.",
    },
    {
      question: "The geometric figure that is straight and goes on forever in both directions is called:",
      correctAnswer: "line",
      options: ["ray", "line segment", "angle"],
      hint: "It has no endpoints and continues infinitely in both directions.",
    },
  ];
  
  const questionType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  return {
    ...questionType,
    options: shuffle(generateUniqueOptions(questionType.correctAnswer, questionType.options)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    standard: "4.G.A.1",
    concept: "Geometry",
    grade: "G4",
    subtopic: "lines and angles",
    difficultyRange: { min: 0.0, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a shape classification question
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateShapeClassificationQuestion(difficulty = 0.5) {
  const shapes = [
    {
      name: "square",
      description: "has 4 equal sides and 4 right angles",
      properties: ["4 sides", "all sides equal", "all angles 90°"],
    },
    {
      name: "rectangle",
      description: "has 4 sides with opposite sides equal and 4 right angles",
      properties: ["4 sides", "opposite sides equal", "all angles 90°"],
    },
    {
      name: "triangle",
      description: "has 3 sides and 3 angles",
      properties: ["3 sides", "3 angles"],
    },
    {
      name: "rhombus",
      description: "has 4 equal sides but angles are not necessarily 90°",
      properties: ["4 sides", "all sides equal", "opposite angles equal"],
    },
    {
      name: "parallelogram",
      description: "has 4 sides with opposite sides parallel and equal and angles not necessarily 90°",
      properties: ["4 sides", "opposite sides parallel", "opposite sides equal"],
    },
  ];
  
  const shape = shapes[getRandomInt(0, shapes.length - 1)];
  const otherShapes = shapes.filter((s) => s.name !== shape.name);
  const wrongOptions = otherShapes
    .map((s) => s.name)
    .slice(0, 2);

  const potentialDistractors = [...wrongOptions, "circle"];
  
  return {
    question: `What shape ${shape.description}?`,
    correctAnswer: shape.name,
    options: shuffle(generateUniqueOptions(shape.name, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: "Think about the properties of each shape.",
    standard: "4.G.A.2",
    concept: "Geometry",
    grade: "G4",
    subtopic: "classify shapes",
    difficultyRange: { min: 0.2, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions about triangle classification by sides
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateTriangleClassificationBySidesQuestion(difficulty = 0.5) {
  const triangleTypes = [
    {
      name: "equilateral",
      description: "A triangle with all three sides equal",
      properties: "all 3 sides equal",
    },
    {
      name: "isosceles", 
      description: "A triangle with exactly two sides equal",
      properties: "2 sides equal",
    },
    {
      name: "scalene",
      description: "A triangle with all three sides different lengths",
      properties: "all sides different",
    },
  ];
  
  const triangle = triangleTypes[getRandomInt(0, triangleTypes.length - 1)];
  const wrongOptions = triangleTypes
    .filter(t => t.name !== triangle.name)
    .map(t => t.name);
  const potentialDistractors = [...wrongOptions, "pentagon"];
  
  return {
    question: `What type of triangle has ${triangle.properties}?`,
    correctAnswer: triangle.name,
    options: shuffle(generateUniqueOptions(triangle.name, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: triangle.description,
    standard: "4.G.A.2",
    concept: "Geometry",
    grade: "G4",
    subtopic: "triangle classification",
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions about triangle classification by angles
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateTriangleClassificationByAnglesQuestion(difficulty = 0.5) {
  const triangleTypes = [
    {
      name: "right triangle",
      description: "A triangle with one 90° angle",
      properties: "one 90° angle",
    },
    {
      name: "acute triangle",
      description: "A triangle with all angles less than 90°",
      properties: "all angles less than 90°",
    },
    {
      name: "obtuse triangle", 
      description: "A triangle with one angle greater than 90°",
      properties: "one angle greater than 90°",
    },
  ];
  
  const triangle = triangleTypes[getRandomInt(0, triangleTypes.length - 1)];
  const wrongOptions = triangleTypes
    .filter(t => t.name !== triangle.name)
    .map(t => t.name);
  const potentialDistractors = [...wrongOptions, "straight triangle"];
  
  return {
    question: `What type of triangle has ${triangle.properties}?`,
    correctAnswer: triangle.name,
    options: shuffle(generateUniqueOptions(triangle.name, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: triangle.description,
    standard: "4.G.A.2",
    concept: "Geometry",
    grade: "G4",
    subtopic: "triangle classification",
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions about quadrilateral properties
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateQuadrilateralPropertiesQuestion(difficulty = 0.5) {
  const quadrilaterals = [
    {
      name: "square",
      properties: [
        "all sides equal",
        "all angles are 90°", 
        "opposite sides parallel",
        "4 lines of symmetry",
      ],
    },
    {
      name: "rectangle",
      properties: [
        "opposite sides equal",
        "all angles are 90°",
        "opposite sides parallel", 
        "2 lines of symmetry",
      ],
    },
    {
      name: "rhombus",
      properties: [
        "all sides equal",
        "opposite angles equal and not necessarily 90°",
        "opposite sides parallel",
        "2 lines of symmetry",
      ],
    },
    {
      name: "parallelogram", 
      properties: [
        "opposite sides equal",
        "opposite angles equal and not necessarily 90°",
        "opposite sides parallel",
      ],
    },
    {
      name: "trapezoid",
      properties: [
        "exactly one pair of parallel sides",
        "can have different shapes",
        "may have a line of symmetry",
      ],
    },
  ];
  
  const quad = quadrilaterals[getRandomInt(0, quadrilaterals.length - 1)];
  const properties = quad.properties;
  const wrongQuads = quadrilaterals
    .filter(q => q.name !== quad.name)
    .map(q => q.name)
    .slice(0, 3);
  
  return {
    question: `Which quadrilateral has ALL of these properties: "${properties.join(", ")}"?`,
    correctAnswer: quad.name,
    options: shuffle(generateUniqueOptions(quad.name, wrongQuads)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Think about the defining characteristics of each quadrilateral.`,
    standard: "4.G.A.2",
    concept: "Geometry", 
    grade: "G4",
    subtopic: "quadrilateral properties",
    difficultyRange: { min: 0.5, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions about line symmetry
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateLineSymmetryQuestion(difficulty = 0.5) {
  const symmetryExamples = [
    {
      shape: "circle",
      lines: "infinite lines of symmetry",
      explanation: "any line through the center",
    },
    {
      shape: "square",
      lines: "4 lines of symmetry", 
      explanation: "2 diagonal lines and 2 lines through opposite sides",
    },
    {
      shape: "rectangle",
      lines: "2 lines of symmetry",
      explanation: "one vertical and one horizontal through the center",
    },
    {
      shape: "equilateral triangle",
      lines: "3 lines of symmetry",
      explanation: "from each vertex to the middle of the opposite side",
    },
    {
      shape: "isosceles triangle",
      lines: "1 line of symmetry",
      explanation: "from the vertex between equal sides to the middle of the base",
    },
  ];
  
  const example = symmetryExamples[getRandomInt(0, symmetryExamples.length - 1)];
  const wrongOptions = symmetryExamples
    .filter(e => e.lines !== example.lines)
    .map(e => e.lines)
    .slice(0, 3);
  
  return {
    question: `How many lines of symmetry does a ${example.shape} have?`,
    correctAnswer: example.lines,
    options: shuffle(generateUniqueOptions(example.lines, wrongOptions)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `A line of symmetry divides a shape so both halves match exactly. ${example.explanation}.`,
    standard: "4.G.A.3",
    concept: "Geometry",
    grade: "G4", 
    subtopic: "line symmetry",
    difficultyRange: { min: 0.3, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions about angle measurement and classification
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateAngleMeasurementQuestion(difficulty = 0.5) {
  const angleTypes = ANGLE_TYPES;
  
  const questionTypes = [
    {
      type: "classify",
      getQuestion: (angle) => `An angle that measures ${angle.example} is called a:`,
      correctAnswer: (angle) => angle.name,
    },
    {
      type: "measure",
      getQuestion: (angle) => `${angle.name} measures:`,
      correctAnswer: (angle) => angle.range,
    },
    {
      type: "realLife",
      getQuestion: (angle) => `Which real-life example shows an ${angle.name}?`,
    },
  ];

  const pickRandomFrom = (items) => items[getRandomInt(0, items.length - 1)];
  
  const angle = angleTypes[getRandomInt(0, angleTypes.length - 1)];
  const qType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  let wrongOptions;
  if (qType.type === "classify") {
    wrongOptions = angleTypes.filter(a => a.name !== angle.name).map(a => a.name);
  } else if (qType.type === "measure") {
    wrongOptions = angleTypes.filter(a => a.range !== angle.range).map(a => a.range);
  } else {
    wrongOptions = angleTypes
      .filter(a => a.name !== angle.name)
      .map(a => pickRandomFrom(a.realLifeExamples));
  }
  
  const correctAnswer = qType.type === "realLife"
    ? pickRandomFrom(angle.realLifeExamples)
    : qType.correctAnswer(angle);
  const potentialDistractors = wrongOptions.slice(0, 3);
  const finalOptions = shuffle(generateUniqueOptions(correctAnswer, potentialDistractors));

  // Build optionImages only for realLife questions
  const optionImages = qType.type === "realLife"
    ? Object.fromEntries(
        finalOptions
          .filter(opt => ANGLE_EXAMPLE_IMAGES[opt])
          .map(opt => [opt, ANGLE_EXAMPLE_IMAGES[opt]])
      )
    : undefined;

  return {
    question: qType.getQuestion(angle),
    correctAnswer: correctAnswer,
    options: finalOptions,
    ...(optionImages && Object.keys(optionImages).length > 0 && { optionImages }),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Remember: ${angle.name}s ${angle.range}.`,
    standard: "4.G.A.1",
    concept: "Geometry",
    grade: "G4",
    subtopic: "angle measurement",
    difficultyRange: { min: 0.6, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions about points, lines, and rays
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generatePointsLinesRaysQuestion(difficulty = 0.5) {
  const concepts = [
    {
      name: "point",
      definition: "is an exact location with no size",
      example: "the tip of a pencil",
      notation: "represented by a dot",
    },
    {
      name: "line", 
      definition: "goes on forever in both directions",
      example: "a straight road that never ends",
      notation: "has no endpoints",
    },
    {
      name: "ray",
      definition: "starts at a point and goes on forever in one direction", 
      example: "a flashlight beam",
      notation: "has one endpoint",
    },
    {
      name: "line segment",
      definition: "is a part of a line with two endpoints",
      example: "a street between two intersections", 
      notation: "has two endpoints",
    },
  ];
  
  const questionTypes = [
    {
      type: "definition",
      getQuestion: (concept) => `What ${concept.definition}?`,
      correctAnswer: (concept) => concept.name,
    },
    {
      type: "example", 
      getQuestion: (concept) => `Which is the best example of a ${concept.name}?`,
      correctAnswer: (concept) => concept.example,
    },
    {
      type: "notation",
      getQuestion: (concept) => `A ${concept.name} ${concept.notation}.`,
      correctAnswer: (concept) => "True",
    },
  ];
  
  const concept = concepts[getRandomInt(0, concepts.length - 1)];
  const qType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  let wrongOptions;
  if (qType.type === "definition") {
    wrongOptions = concepts.filter(c => c.name !== concept.name).map(c => c.name);
  } else if (qType.type === "example") {
    wrongOptions = concepts.filter(c => c.example !== concept.example).map(c => c.example);
  } else {
    wrongOptions = ["False", "Sometimes", "Never"];
  }

  const correctAnswer = qType.correctAnswer(concept);
  const potentialDistractors = wrongOptions.slice(0, 3);
  
  return {
    question: qType.getQuestion(concept),
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Remember: a ${concept.name} ${concept.definition}.`,
    standard: "4.G.A.1", 
    concept: "Geometry",
    grade: "G4",
    subtopic: "points lines rays",
    difficultyRange: { min: 0.0, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

const geometryQuestions = {
  generateQuestion,
  generateLinesAndAnglesQuestion,
  generateShapeClassificationQuestion,
  generateTriangleClassificationBySidesQuestion,
  generateTriangleClassificationByAnglesQuestion,
  generateQuadrilateralPropertiesQuestion,
  generateLineSymmetryQuestion,
  generateAngleMeasurementQuestion,
  generatePointsLinesRaysQuestion,
};

export default geometryQuestions;
