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
  const geoType = getRandomInt(1, 2);
  let question;
  
  switch (geoType) {
    case 1: // Lines and angles (4.G.1)
      question = {
        question: `Two lines that never meet and are always the same distance apart are called:`,
        correctAnswer: "parallel",
        options: shuffleArray([
          "parallel",
          "perpendicular",
          "intersecting",
          "curved",
        ]),
        hint: "Think about train tracks - they run alongside each other but never meet.",
        standard: "4.G.A.1",
        concept: "Geometry",
        grade: "G4",
        subtopic: "lines and angles",
      };
      break;
      
    case 2: // Classify triangles and quadrilaterals (4.G.2)
      const shapes = [
        {
          name: "square",
          description: "has 4 equal sides and 4 right angles",
        },
        {
          name: "rectangle",
          description:
            "has 4 sides with opposite sides equal and 4 right angles",
        },
        { name: "triangle", description: "has 3 sides and 3 angles" },
      ];
      const shape = shapes[getRandomInt(0, shapes.length - 1)];

      question = {
        question: `What shape ${shape.description}?`,
        correctAnswer: shape.name,
        options: shuffleArray([
          shape.name,
          ...shapes
            .filter((s) => s.name !== shape.name)
            .map((s) => s.name)
            .slice(0, 2),
          "circle",
        ]),
        hint: "Think about the properties of each shape.",
        standard: "4.G.A.2",
        concept: "Geometry",
        grade: "G4",
        subtopic: "classify shapes",
      };
      break;
      
    default:
      // Fallback to lines and angles
      question = {
        question: `Two lines that never meet and are always the same distance apart are called:`,
        correctAnswer: "parallel",
        options: shuffleArray([
          "parallel",
          "perpendicular",
          "intersecting",
          "curved",
        ]),
        hint: "Think about train tracks - they run alongside each other but never meet.",
        standard: "4.G.A.1",
        concept: "Geometry",
        grade: "G4",
        subtopic: "lines and angles",
      };
      break;
  }
  
  return question;
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

const geometryQuestions = {
  generateQuestion,
  generateLinesAndAnglesQuestion,
  generateShapeClassificationQuestion,
};

export default geometryQuestions;
