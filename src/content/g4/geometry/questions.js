// Question generation for 4th Grade Geometry topic
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';

// Helper functions that need to be imported from utils
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random geometry question for 4th grade
 * @param {number} difficulty - Difficulty level from 0 to 1 (0=easiest, 1=hardest)
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion(difficulty = 0.5) {
  // Define question types with minimum and maximum difficulty thresholds
  const questionTypes = [
    { generator: generateLinesAndAnglesQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    { generator: generatePointsLinesRaysQuestion, minDifficulty: 0.0, maxDifficulty: 1.0 },
    { generator: generateShapeClassificationQuestion, minDifficulty: 0.2, maxDifficulty: 1.0 },
    { generator: generateLineSymmetryQuestion, minDifficulty: 0.3, maxDifficulty: 1.0 },
    { generator: generateTriangleClassificationBySidesQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    { generator: generateTriangleClassificationByAnglesQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    { generator: generateQuadrilateralPropertiesQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    { generator: generateAngleMeasurementQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
  ];
  
  // Filter available questions based on difficulty
  const available = questionTypes.filter(
    q => difficulty >= q.minDifficulty && difficulty <= q.maxDifficulty
  );
  
  // Randomly select from available types
  const selected = available[getRandomInt(0, available.length - 1)];
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
      options: ["parallel", "perpendicular", "intersecting", "curved"],
      hint: "Think about train tracks - they run alongside each other but never meet.",
    },
    {
      question: "Two lines that meet at a right angle (90°) are called:",
      correctAnswer: "perpendicular",
      options: ["parallel", "perpendicular", "intersecting", "curved"],
      hint: "Think about the corner of a square - the lines meet at a perfect right angle.",
    },
    {
      question: "A line that goes on forever in both directions is called:",
      correctAnswer: "line",
      options: ["line", "ray", "line segment", "angle"],
      hint: "It has no endpoints and continues infinitely in both directions.",
    },
  ];
  
  const questionType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  return {
    ...questionType,
    options: shuffle(generateUniqueOptions(questionType.correctAnswer, questionType.options)),
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
  const properties = quad.properties
  const wrongQuads = quadrilaterals
    .filter(q => q.name !== quad.name)
    .map(q => q.name)
    .slice(0, 3);
  
  return {
    question: `Which quadrilateral has the property: "${properties.join(", ")}"?`,
    correctAnswer: quad.name,
    options: shuffle(generateUniqueOptions(quad.name, wrongQuads)),
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
  const angleTypes = [
    {
      name: "acute angle",
      range: "less than 90°",
      example: "45°",
      realLife: "open scissors",
    },
    {
      name: "right angle", 
      range: "exactly 90°",
      example: "90°",
      realLife: "corner of a book",
    },
    {
      name: "obtuse angle",
      range: "between 90° and 180°", 
      example: "120°",
      realLife: "laptop half-open",
    },
    {
      name: "straight angle",
      range: "exactly 180°",
      example: "180°", 
      realLife: "flat table edge",
    },
  ];
  
  const questionTypes = [
    {
      type: "classify",
      getQuestion: (angle) => `An angle that measures ${angle.example} is called a:`,
      correctAnswer: (angle) => angle.name,
    },
    {
      type: "measure",
      getQuestion: (angle) => `An ${angle.name} measures:`,
      correctAnswer: (angle) => angle.range,
    },
    {
      type: "realLife",
      getQuestion: (angle) => `Which real-life example shows an ${angle.name}?`,
      correctAnswer: (angle) => angle.realLife,
    },
  ];
  
  const angle = angleTypes[getRandomInt(0, angleTypes.length - 1)];
  const qType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  let wrongOptions;
  if (qType.type === "classify") {
    wrongOptions = angleTypes.filter(a => a.name !== angle.name).map(a => a.name);
  } else if (qType.type === "measure") {
    wrongOptions = angleTypes.filter(a => a.range !== angle.range).map(a => a.range);
  } else {
    wrongOptions = angleTypes.filter(a => a.realLife !== angle.realLife).map(a => a.realLife);
  }
  
  const correctAnswer = qType.correctAnswer(angle);
  const potentialDistractors = wrongOptions.slice(0, 3);

  return {
    question: qType.getQuestion(angle),
    correctAnswer: correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, potentialDistractors)),
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
      definition: "an exact location with no size",
      example: "the tip of a pencil",
      notation: "represented by a dot",
    },
    {
      name: "line", 
      definition: "goes on forever in both directions",
      example: "like a straight road that never ends",
      notation: "has no endpoints",
    },
    {
      name: "ray",
      definition: "starts at a point and goes on forever in one direction", 
      example: "like a flashlight beam",
      notation: "has one endpoint",
    },
    {
      name: "line segment",
      definition: "a part of a line with two endpoints",
      example: "like a street between two intersections", 
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
