// Question generation for 4th Grade Geometry topic

// Helper functions that need to be imported from utils
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
 * Generates a random geometry question for 4th grade
 * @returns {Object} Question object with question, options, correctAnswer, hint, standard, etc.
 */
export function generateQuestion() {
  // Array of all available question generators
  const questionTypes = [
    generateLinesAndAnglesQuestion,
    generateShapeClassificationQuestion,
    generateTriangleClassificationBySidesQuestion,
    generateTriangleClassificationByAnglesQuestion,
    generateQuadrilateralPropertiesQuestion,
    generateLineSymmetryQuestion,
    generateAngleMeasurementQuestion,
    generatePointsLinesRaysQuestion,
  ];
  
  // Randomly select a question type
  const selectedGenerator = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  return selectedGenerator();
}

// Additional question types for future expansion
export function generateLinesAndAnglesQuestion() {
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
    options: shuffleArray(questionType.options),
    standard: "4.G.A.1",
    concept: "Geometry",
    grade: "G4",
    subtopic: "lines and angles",
  };
}

export function generateShapeClassificationQuestion() {
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
      description: "has 4 sides with opposite sides parallel and equal",
      properties: ["4 sides", "opposite sides parallel", "opposite sides equal"],
    },
  ];
  
  const shape = shapes[getRandomInt(0, shapes.length - 1)];
  const otherShapes = shapes.filter((s) => s.name !== shape.name);
  const wrongOptions = otherShapes
    .map((s) => s.name)
    .slice(0, 2);
  
  return {
    question: `What shape ${shape.description}?`,
    correctAnswer: shape.name,
    options: shuffleArray([
      shape.name,
      ...wrongOptions,
      "circle",
    ]),
    hint: "Think about the properties of each shape.",
    standard: "4.G.A.2",
    concept: "Geometry",
    grade: "G4",
    subtopic: "classify shapes",
  };
}

/**
 * Generates questions about triangle classification by sides
 */
export function generateTriangleClassificationBySidesQuestion() {
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
  
  return {
    question: `What type of triangle has ${triangle.properties}?`,
    correctAnswer: triangle.name,
    options: shuffleArray([
      triangle.name,
      ...wrongOptions,
      "pentagon",
    ]),
    hint: triangle.description,
    standard: "4.G.A.2",
    concept: "Geometry",
    grade: "G4",
    subtopic: "triangle classification",
  };
}

/**
 * Generates questions about triangle classification by angles
 */
export function generateTriangleClassificationByAnglesQuestion() {
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
  
  return {
    question: `What type of triangle has ${triangle.properties}?`,
    correctAnswer: triangle.name,
    options: shuffleArray([
      triangle.name,
      ...wrongOptions,
      "straight triangle",
    ]),
    hint: triangle.description,
    standard: "4.G.A.2",
    concept: "Geometry",
    grade: "G4",
    subtopic: "triangle classification",
  };
}

/**
 * Generates questions about quadrilateral properties
 */
export function generateQuadrilateralPropertiesQuestion() {
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
        "opposite angles equal",
        "opposite sides parallel",
        "2 lines of symmetry",
      ],
    },
    {
      name: "parallelogram", 
      properties: [
        "opposite sides equal",
        "opposite angles equal",
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
  const property = quad.properties[getRandomInt(0, quad.properties.length - 1)];
  const wrongQuads = quadrilaterals
    .filter(q => q.name !== quad.name)
    .map(q => q.name)
    .slice(0, 3);
  
  return {
    question: `Which quadrilateral has the property: "${property}"?`,
    correctAnswer: quad.name,
    options: shuffleArray([
      quad.name,
      ...wrongQuads,
    ]),
    hint: `Think about the defining characteristics of each quadrilateral.`,
    standard: "4.G.A.2",
    concept: "Geometry", 
    grade: "G4",
    subtopic: "quadrilateral properties",
  };
}

/**
 * Generates questions about line symmetry
 */
export function generateLineSymmetryQuestion() {
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
    options: shuffleArray([
      example.lines,
      ...wrongOptions,
    ]),
    hint: `A line of symmetry divides a shape so both halves match exactly. ${example.explanation}.`,
    standard: "4.G.A.3",
    concept: "Geometry",
    grade: "G4", 
    subtopic: "line symmetry",
  };
}

/**
 * Generates questions about angle measurement and classification
 */
export function generateAngleMeasurementQuestion() {
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
  
  return {
    question: qType.getQuestion(angle),
    correctAnswer: qType.correctAnswer(angle),
    options: shuffleArray([
      qType.correctAnswer(angle),
      ...wrongOptions.slice(0, 3),
    ]),
    hint: `Remember: ${angle.name}s ${angle.range}.`,
    standard: "4.G.A.1",
    concept: "Geometry",
    grade: "G4",
    subtopic: "angle measurement",
  };
}

/**
 * Generates questions about points, lines, and rays
 */
export function generatePointsLinesRaysQuestion() {
  const concepts = [
    {
      name: "point",
      definition: "an exact location with no size",
      example: "the tip of a pencil",
      notation: "written with a capital letter",
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
      example: "like a piece of string", 
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
  
  return {
    question: qType.getQuestion(concept),
    correctAnswer: qType.correctAnswer(concept),
    options: shuffleArray([
      qType.correctAnswer(concept),
      ...wrongOptions.slice(0, 3),
    ]),
    hint: `Remember: a ${concept.name} ${concept.definition}.`,
    standard: "4.G.A.1", 
    concept: "Geometry",
    grade: "G4",
    subtopic: "points lines rays",
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
