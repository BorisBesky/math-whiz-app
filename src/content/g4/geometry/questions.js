// Question generation for 4th Grade Geometry topic
import { QUESTION_TYPES } from '../../../constants/shared-constants.js';
import { generateUniqueOptions, shuffle } from '../../../utils/question-helpers.js';
import {
  COMPOSITE_SHAPE_TEMPLATES,
  computePerimeterUnits,
  createCompositeShapeSVG,
} from './composite-shapes.js';

// Helper functions that need to be imported from utils
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createSvgDataUri(svg) {
  if (typeof btoa === 'function') {
    const utf8 = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    return `data:image/svg+xml;base64,${btoa(utf8)}`;
  }

  // eslint-disable-next-line no-undef
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
}

function polarToSvgPoint(centerX, centerY, length, angleDegrees) {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: centerX + length * Math.cos(angleRadians),
    y: centerY - length * Math.sin(angleRadians),
  };
}

function createAngleArcPath(centerX, centerY, radius, startAngle, endAngle) {
  const startPoint = polarToSvgPoint(centerX, centerY, radius, startAngle);
  const endPoint = polarToSvgPoint(centerX, centerY, radius, endAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep > 180 ? 1 : 0;
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endPoint.x} ${endPoint.y}`;
}

function createAngleAdditionSvg({ angleCBD, angleDBA, angleCBA, missingAngleType }) {
  const width = 420;
  const height = 260;
  const centerX = 210;
  const centerY = 205;
  const rayLength = 140;
  const labelMinX = 22;
  const labelMaxX = width - 22;
  const labelMinY = 42;
  const labelMaxY = height - 20;
  const rayStroke = '#1f2937';
  const knownArcStroke = '#2563eb';
  const missingArcStroke = '#dc2626';
  const wholeArcStroke = '#7c3aed';

  const pointB = { x: centerX, y: centerY };
  const pointA = polarToSvgPoint(centerX, centerY, rayLength, 0);
  const pointD = polarToSvgPoint(centerX, centerY, rayLength, angleDBA);
  const pointC = polarToSvgPoint(centerX, centerY, rayLength, angleCBA);

  const pointLabel = (label, point, dx = 0, dy = 0) => {
    const x = Math.min(labelMaxX, Math.max(labelMinX, point.x + dx));
    const y = Math.min(labelMaxY, Math.max(labelMinY, point.y + dy));

    return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#111827">${label}</text>`;
  };

  const angleLabel = (
    text,
    startAngle,
    endAngle,
    radius,
    {
      color = '#111827',
      angleOffset = 0,
      radialOffset = 0,
      tangentOffset = 0,
    } = {}
  ) => {
    const midAngle = startAngle + (endAngle - startAngle) / 2 + angleOffset;
    const labelRadius = radius + radialOffset;
    const angleRadians = (midAngle * Math.PI) / 180;
    const basePoint = polarToSvgPoint(centerX, centerY, labelRadius, midAngle);
    const tangentX = -Math.sin(angleRadians);
    const tangentY = -Math.cos(angleRadians);
    const x = Math.min(labelMaxX, Math.max(labelMinX, basePoint.x + tangentOffset * tangentX));
    const y = Math.min(labelMaxY, Math.max(labelMinY, basePoint.y + tangentOffset * tangentY));

    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${color}">${text}</text>`;
  };

  const labelDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const resolveLabelCollisions = (specs) => {
    const minDistance = 28;
    const nextSpecs = specs.map((spec) => ({
      ...spec,
      options: { ...spec.options },
    }));

    const toPoint = (spec) => {
      const {
        startAngle,
        endAngle,
        radius,
        options: {
          angleOffset = 0,
          radialOffset = 0,
          tangentOffset = 0,
        } = {},
      } = spec;
      const midAngle = startAngle + (endAngle - startAngle) / 2 + angleOffset;
      const labelRadius = radius + radialOffset;
      const angleRadians = (midAngle * Math.PI) / 180;
      const basePoint = polarToSvgPoint(centerX, centerY, labelRadius, midAngle);
      const tangentX = -Math.sin(angleRadians);
      const tangentY = -Math.cos(angleRadians);
      return {
        x: Math.min(labelMaxX, Math.max(labelMinX, basePoint.x + tangentOffset * tangentX)),
        y: Math.min(labelMaxY, Math.max(labelMinY, basePoint.y + tangentOffset * tangentY)),
      };
    };

    for (let i = 0; i < nextSpecs.length; i += 1) {
      for (let j = i + 1; j < nextSpecs.length; j += 1) {
        const p1 = toPoint(nextSpecs[i]);
        const p2 = toPoint(nextSpecs[j]);
        if (labelDistance(p1, p2) < minDistance) {
          const push = i === 2 || j === 2 ? 18 : 12;
          nextSpecs[j].options.radialOffset = (nextSpecs[j].options.radialOffset || 0) + push;
          nextSpecs[j].options.tangentOffset = (nextSpecs[j].options.tangentOffset || 0) + (j % 2 === 0 ? -8 : 8);
        }
      }
    }

    return nextSpecs;
  };

  const knownLabels = [];
  const arcPaths = [];
  let labelSpecs = [];

  if (missingAngleType === 'angle CBA') {
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 56, 0, angleDBA)}" fill="none" stroke="${knownArcStroke}" stroke-width="4" stroke-linecap="round" />`);
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 88, angleDBA, angleCBA)}" fill="none" stroke="${knownArcStroke}" stroke-width="4" stroke-linecap="round" />`);
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 122, 0, angleCBA)}" fill="none" stroke="${missingArcStroke}" stroke-width="5" stroke-linecap="round" />`);
    labelSpecs = [
      { text: `${angleDBA}°`, startAngle: 0, endAngle: angleDBA, radius: 66, options: { tangentOffset: 10 } },
      { text: `${angleCBD}°`, startAngle: angleDBA, endAngle: angleCBA, radius: 98, options: { tangentOffset: -10 } },
      { text: '?', startAngle: 0, endAngle: angleCBA, radius: 140, options: { color: missingArcStroke, tangentOffset: 8 } },
    ];
  } else if (missingAngleType === 'angle CBD') {
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 56, 0, angleDBA)}" fill="none" stroke="${knownArcStroke}" stroke-width="4" stroke-linecap="round" />`);
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 90, 0, angleCBA)}" fill="none" stroke="${wholeArcStroke}" stroke-width="4" stroke-linecap="round" />`);
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 124, angleDBA, angleCBA)}" fill="none" stroke="${missingArcStroke}" stroke-width="5" stroke-linecap="round" />`);
    labelSpecs = [
      { text: `${angleDBA}°`, startAngle: 0, endAngle: angleDBA, radius: 68, options: { tangentOffset: 10 } },
      { text: `${angleCBA}°`, startAngle: 0, endAngle: angleCBA, radius: 104, options: { tangentOffset: -12 } },
      { text: '?', startAngle: angleDBA, endAngle: angleCBA, radius: 138, options: { color: missingArcStroke, tangentOffset: 8 } },
    ];
  } else {
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 56, angleDBA, angleCBA)}" fill="none" stroke="${knownArcStroke}" stroke-width="4" stroke-linecap="round" />`);
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 90, 0, angleCBA)}" fill="none" stroke="${wholeArcStroke}" stroke-width="4" stroke-linecap="round" />`);
    arcPaths.push(`<path d="${createAngleArcPath(centerX, centerY, 124, 0, angleDBA)}" fill="none" stroke="${missingArcStroke}" stroke-width="5" stroke-linecap="round" />`);
    labelSpecs = [
      { text: `${angleCBD}°`, startAngle: angleDBA, endAngle: angleCBA, radius: 66, options: { tangentOffset: -10 } },
      { text: `${angleCBA}°`, startAngle: 0, endAngle: angleCBA, radius: 105, options: { tangentOffset: 13 } },
      { text: '?', startAngle: 0, endAngle: angleDBA, radius: 138, options: { color: missingArcStroke, tangentOffset: -11 } },
    ];
  }

  resolveLabelCollisions(labelSpecs).forEach((spec) => {
    knownLabels.push(
      angleLabel(
        spec.text,
        spec.startAngle,
        spec.endAngle,
        spec.radius,
        spec.options
      )
    );
  });

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" rx="16" fill="#f8fafc" />` +
    `<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">Angle addition diagram</text>` +
    `<line x1="${pointB.x}" y1="${pointB.y}" x2="${pointA.x}" y2="${pointA.y}" stroke="${rayStroke}" stroke-width="4" stroke-linecap="round" />` +
    `<line x1="${pointB.x}" y1="${pointB.y}" x2="${pointD.x}" y2="${pointD.y}" stroke="${rayStroke}" stroke-width="4" stroke-linecap="round" />` +
    `<line x1="${pointB.x}" y1="${pointB.y}" x2="${pointC.x}" y2="${pointC.y}" stroke="${rayStroke}" stroke-width="4" stroke-linecap="round" />` +
    arcPaths.join('') +
    `<circle cx="${pointB.x}" cy="${pointB.y}" r="4.5" fill="#111827" />` +
    pointLabel('B', pointB, -18, 22) +
    pointLabel('A', pointA, 10, 6) +
    pointLabel('D', pointD, 8, -6) +
    pointLabel('C', pointC, -2, -10) +
    knownLabels.join('') +
    `</svg>`;

  return createSvgDataUri(svg);
}

const ANGLE_ADDITION_PREFIX = 'Rays BC, BD, and BA all start at point B.';
const ANGLE_ADDITION_DIAGRAM_DESCRIPTION =
  'Angle diagram with labeled points and the missing angle highlighted in red';

function getMissingAngleValue(missingAngleName, values) {
  if (missingAngleName === 'CBA' && values.CBD && values.DBA) {
    return values.CBD + values.DBA;
  }

  if (missingAngleName === 'CBD' && values.CBA && values.DBA) {
    return values.CBA - values.DBA;
  }

  if (missingAngleName === 'DBA' && values.CBA && values.CBD) {
    return values.CBA - values.CBD;
  }

  return null;
}

function parseAngleAdditionQuestion(questionText) {
  if (typeof questionText !== 'string' || !questionText.startsWith(ANGLE_ADDITION_PREFIX)) {
    return null;
  }

  const values = {};
  [...questionText.matchAll(/angle\s([A-Z]{3})\s=\s(\d+)°/g)].forEach(([, angleName, value]) => {
    values[angleName] = Number(value);
  });

  const missingAngleName = questionText.match(/what is angle\s([A-Z]{3})\?/i)?.[1];
  if (!missingAngleName) {
    return null;
  }

  if (!['CBA', 'CBD', 'DBA'].includes(missingAngleName)) {
    return null;
  }

  values[missingAngleName] = getMissingAngleValue(missingAngleName, values);

  if (!values.CBA || !values.CBD || !values.DBA) {
    return null;
  }

  return {
    angleCBD: values.CBD,
    angleDBA: values.DBA,
    angleCBA: values.CBA,
    missingAngleType: `angle ${missingAngleName}`,
  };
}

export function refreshAngleAdditionDiagram(question) {
  const parsedQuestion = parseAngleAdditionQuestion(question?.question);

  if (!parsedQuestion) {
    return question;
  }

  const refreshedImage = {
    type: 'question',
    data: createAngleAdditionSvg(parsedQuestion),
    description: ANGLE_ADDITION_DIAGRAM_DESCRIPTION,
  };

  return {
    ...question,
    images: [
      refreshedImage,
      ...(question.images || []).filter((image) => image?.type !== 'question'),
    ],
  };
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
    'find missing side': { generator: generateMissingSideQuestion, minDifficulty: 0.4, maxDifficulty: 1.0 },
    'composite shapes': { generator: generateCompositeShapeAreaPerimeterQuestion, minDifficulty: 0.5, maxDifficulty: 1.0 },
    'rectangle to square': { generator: generateRectangleToSquareAreaQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
    'photo collage': { generator: generatePhotoCollageQuestion, minDifficulty: 0.6, maxDifficulty: 1.0 },
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

function generateAngleAdditionQuestion() {
  let angleCBD = getRandomInt(20, 85);
  let angleDBA = getRandomInt(15, 80);

  while (angleCBD + angleDBA >= 180) {
    angleCBD = getRandomInt(20, 85);
    angleDBA = getRandomInt(15, 80);
  }

  const angleCBA = angleCBD + angleDBA;
  const missingAngleType = ['angle CBD', 'angle DBA', 'angle CBA'][getRandomInt(0, 2)];

  let question;
  let correctAnswerValue;
  let rawDistractors;

  if (missingAngleType === 'angle CBA') {
    question = `Rays BC, BD, and BA all start at point B. Ray BD is inside angle CBA. If angle CBD = ${angleCBD}\u00b0 and angle DBA = ${angleDBA}\u00b0, what is angle CBA?`;
    correctAnswerValue = angleCBA;
    rawDistractors = [
      Math.abs(angleCBD - angleDBA),
      angleCBD,
      angleDBA,
      angleCBA + 10,
      Math.max(1, angleCBA - 10),
    ];
  } else if (missingAngleType === 'angle CBD') {
    question = `Rays BC, BD, and BA all start at point B. Ray BD is inside angle CBA. If angle CBA = ${angleCBA}\u00b0 and angle DBA = ${angleDBA}\u00b0, what is angle CBD?`;
    correctAnswerValue = angleCBD;
    rawDistractors = [
      angleCBA + angleDBA,
      angleCBA,
      angleDBA,
      Math.max(1, angleCBD - 10),
      angleCBD + 10,
    ];
  } else {
    question = `Rays BC, BD, and BA all start at point B. Ray BD is inside angle CBA. If angle CBA = ${angleCBA}\u00b0 and angle CBD = ${angleCBD}\u00b0, what is angle DBA?`;
    correctAnswerValue = angleDBA;
    rawDistractors = [
      angleCBA + angleCBD,
      angleCBA,
      angleCBD,
      Math.max(1, angleDBA - 10),
      angleDBA + 10,
    ];
  }

  const correctAnswer = `${correctAnswerValue}\u00b0`;
  const distractorOptions = [...new Set(rawDistractors)]
    .filter((value) => Number.isFinite(value) && value > 0 && value !== correctAnswerValue)
    .map((value) => `${value}\u00b0`);
  const diagram = createAngleAdditionSvg({
    angleCBD,
    angleDBA,
    angleCBA,
    missingAngleType,
  });

  return {
    question,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, distractorOptions)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Since ray BD splits angle CBA into two smaller angles, angle CBA = angle CBD + angle DBA. Add the two smaller angles or subtract the known part from the whole angle.',
    standard: '4.MD.C.7',
    concept: 'Geometry',
    grade: 'G4',
    subtopic: 'angle measurement',
    difficultyRange: { min: 0.6, max: 1.0 },
    images: [
      {
        type: 'question',
        data: diagram,
        description: ANGLE_ADDITION_DIAGRAM_DESCRIPTION,
      },
    ],
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
    {
      type: "addition",
    },
  ];

  const pickRandomFrom = (items) => items[getRandomInt(0, items.length - 1)];
  
  const angle = angleTypes[getRandomInt(0, angleTypes.length - 1)];
  const qType = questionTypes[getRandomInt(0, questionTypes.length - 1)];
  
  let wrongOptions;
  if (qType.type === "addition") {
    return {
      ...generateAngleAdditionQuestion(),
      suggestedDifficulty: difficulty,
    };
  }

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
  // Scope kept to the "points lines rays" subtopic (point / line / ray / line segment).
  // `endpoints` is the count used by the endpoint-count question form; `hasEndpoints`
  // marks concepts for which "how many endpoints" is a sensible question (a point is not
  // described by endpoints, so it is excluded from that form).
  const concepts = [
    {
      name: "point", phrase: "a point", Phrase: "A point",
      definition: "is an exact location with no size",
      example: "the tip of a sharpened pencil",
      notation: "is shown as a single dot",
      endpoints: 0, hasEndpoints: false,
    },
    {
      name: "line", phrase: "a line", Phrase: "A line",
      definition: "goes on forever in both directions",
      example: "a straight road that never ends",
      notation: "has no endpoints",
      endpoints: 0, hasEndpoints: true,
    },
    {
      name: "ray", phrase: "a ray", Phrase: "A ray",
      definition: "starts at one point and goes on forever in one direction",
      example: "a beam of light from a flashlight",
      notation: "has exactly one endpoint",
      endpoints: 1, hasEndpoints: true,
    },
    {
      name: "line segment", phrase: "a line segment", Phrase: "A line segment",
      definition: "is a part of a line with two endpoints",
      example: "the edge of a ruler between its two ends",
      notation: "has two endpoints",
      endpoints: 2, hasEndpoints: true,
    },
  ];

  const pick = (arr) => arr[getRandomInt(0, arr.length - 1)];
  const otherConcepts = (concept) => concepts.filter((c) => c.name !== concept.name);
  const endpointLabel = (n) => (n === 0 ? "0 (none)" : String(n));
  const ENDPOINT_OPTIONS = ["0 (none)", "1", "2", "infinitely many"];

  // Each builder takes a concept and returns { question, correctAnswer, distractors } or,
  // for fixed-option forms, { question, correctAnswer, fixedOptions }. A builder may return
  // null when it does not apply to the given concept (the caller retries).
  const builders = [
    // Definition → identify the term.
    (c) => ({
      question: pick([`What ${c.definition}?`, `Which term ${c.definition}?`]),
      correctAnswer: c.name,
      distractors: shuffle(otherConcepts(c).map((x) => x.name)).slice(0, 3),
    }),
    // Example → identify the real-world example.
    (c) => ({
      question: pick([
        `Which is the best example of ${c.phrase}?`,
        `Which real-world object best represents ${c.phrase}?`,
      ]),
      correctAnswer: c.example,
      distractors: shuffle(otherConcepts(c).map((x) => x.example)).slice(0, 3),
    }),
    // Notation true/false. A false variant borrows another concept's notation; within
    // this concept set every notation is unique, so a borrowed statement is reliably false.
    (c) => {
      if (Math.random() < 0.5) {
        const other = pick(otherConcepts(c));
        return {
          question: `True or False: ${c.Phrase} ${other.notation}.`,
          correctAnswer: "False",
          fixedOptions: ["True", "False"],
        };
      }
      return {
        question: `True or False: ${c.Phrase} ${c.notation}.`,
        correctAnswer: "True",
        fixedOptions: ["True", "False"],
      };
    },
    // Endpoint count (point excluded — endpoints don't describe it).
    (c) => {
      if (!c.hasEndpoints) return null;
      return {
        question: `How many endpoints does ${c.phrase} have?`,
        correctAnswer: endpointLabel(c.endpoints),
        fixedOptions: ENDPOINT_OPTIONS,
      };
    },
  ];

  let built = null;
  let concept = null;
  for (let attempt = 0; attempt < 8 && !built; attempt += 1) {
    concept = pick(concepts);
    built = pick(builders)(concept);
  }
  if (!built) {
    // Guaranteed-valid fallback.
    concept = concepts[0];
    built = {
      question: `What ${concept.definition}?`,
      correctAnswer: concept.name,
      distractors: otherConcepts(concept).map((x) => x.name).slice(0, 3),
    };
  }

  const options = built.fixedOptions
    ? shuffle([...built.fixedOptions])
    : shuffle(generateUniqueOptions(built.correctAnswer, built.distractors));

  return {
    question: built.question,
    correctAnswer: built.correctAnswer,
    options,
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Remember: ${concept.phrase} ${concept.definition}.`,
    standard: "4.G.A.1",
    concept: "Geometry",
    grade: "G4",
    subtopic: "points lines rays",
    difficultyRange: { min: 0.0, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates questions where students find a missing side length given the
 * area or perimeter of a square or rectangle (4.MD.A.3 inverse problems).
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateMissingSideQuestion(difficulty = 0.5) {
  const shape = Math.random() < 0.5 ? 'square' : 'rectangle';
  const measure = Math.random() < 0.5 ? 'area' : 'perimeter';
  const unit = 'units';

  let question;
  let correctAnswerVal;
  let hint;
  let rawDistractors;

  if (shape === 'square') {
    if (measure === 'area') {
      const side = getRandomInt(2, 12);
      const area = side * side;
      correctAnswerVal = side;
      question = `The area of a square is ${area} square units. What is the length of each side?`;
      hint = 'For a square, area = side × side. Find a number that, multiplied by itself, equals the area.';
      rawDistractors = [
        Math.round(area / 2),
        Math.round(area / 4),
        side + 1,
        Math.max(1, side - 1),
      ];
    } else {
      const side = getRandomInt(2, 20);
      const perimeter = 4 * side;
      correctAnswerVal = side;
      question = `The perimeter of a square is ${perimeter} units. What is the length of each side?`;
      hint = 'For a square, perimeter = 4 × side. Divide the perimeter by 4.';
      rawDistractors = [
        Math.round(perimeter / 2),
        Math.round(perimeter / 3),
        side + 1,
        Math.max(1, side - 2),
      ];
    }
  } else {
    let length = getRandomInt(3, 15);
    let width = getRandomInt(2, 12);
    while (width === length) {
      width = getRandomInt(2, 12);
    }

    const givenIsLength = Math.random() < 0.5;
    const givenSideName = givenIsLength ? 'length' : 'width';
    const otherSideName = givenIsLength ? 'width' : 'length';
    const givenSide = givenIsLength ? length : width;
    const otherSide = givenIsLength ? width : length;
    correctAnswerVal = otherSide;

    if (measure === 'area') {
      const area = length * width;
      question = `A rectangle has an area of ${area} square units. If its ${givenSideName} is ${givenSide} units, what is its ${otherSideName}?`;
      hint = 'Area = length × width. Divide the area by the known side to find the other side.';
      rawDistractors = [
        area - givenSide,
        Math.max(1, area - givenSide * 2),
        otherSide + 1,
        Math.max(1, otherSide - 1),
      ];
    } else {
      const perimeter = 2 * (length + width);
      question = `A rectangle has a perimeter of ${perimeter} units. If its ${givenSideName} is ${givenSide} units, what is its ${otherSideName}?`;
      hint = 'Perimeter = 2 × (length + width). Halve the perimeter to get length + width, then subtract the known side.';
      rawDistractors = [
        perimeter - givenSide,
        Math.max(1, perimeter / 2 - givenSide + 1),
        otherSide + 2,
        Math.max(1, otherSide - 1),
      ];
    }
  }

  const correctAnswer = `${correctAnswerVal} ${unit}`;
  const distractorOptions = rawDistractors
    .filter((d) => Number.isFinite(d) && d > 0 && d !== correctAnswerVal)
    .map((d) => `${d} ${unit}`);

  return {
    question,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, distractorOptions)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint,
    standard: '4.MD.A.3',
    concept: 'Geometry',
    grade: 'G4',
    subtopic: 'find missing side',
    difficultyRange: { min: 0.4, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

/**
 * Generates a question where a rectangle is changed into a square by
 * shortening its length and increasing its width. Students use the square's
 * perimeter to find the square side, then reverse the changes to find the
 * original rectangle's area.
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateRectangleToSquareAreaQuestion(difficulty = 0.5) {
  function formatUnits(value) {
    return `${value} ${value === 1 ? 'unit' : 'units'}`;
  }

  const squareSide = getRandomInt(5, 16);
  const shortenBy = getRandomInt(1, Math.min(6, squareSide - 1));
  const increaseBy = getRandomInt(1, Math.min(5, squareSide - 2));
  const squarePerimeter = 4 * squareSide;
  const originalLength = squareSide + shortenBy;
  const originalWidth = squareSide - increaseBy;
  const originalArea = originalLength * originalWidth;
  const correctAnswer = `${originalArea} square units`;

  const rawDistractors = [
    squareSide * squareSide,
    squareSide * originalWidth,
    originalLength * squareSide,
    (squareSide - shortenBy) * (squareSide + increaseBy),
    originalArea + originalLength,
    Math.max(1, originalArea - originalWidth),
  ];

  const distractorOptions = [...new Set(rawDistractors)]
    .filter((value) => Number.isFinite(value) && value > 0 && value !== originalArea)
    .map((value) => `${value} square units`);

  return {
    question: `A rectangle is changed into a square. Its length is shortened by ${formatUnits(shortenBy)} and its width is increased by ${formatUnits(increaseBy)}. The square has a perimeter of ${squarePerimeter} units. What was the area of the original rectangle?`,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, distractorOptions)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'First find the square side length by dividing the square perimeter by 4. The original length was that side plus the amount shortened, and the original width was that side minus the amount increased. Then multiply length × width.',
    standard: '4.MD.A.3',
    concept: 'Geometry',
    grade: 'G4',
    subtopic: 'rectangle to square',
    difficultyRange: { min: 0.6, max: 1.0 },
    suggestedDifficulty: difficulty,
  };
}

const PHOTO_COLLAGE_LAYOUTS = [
  { columns: 4, rows: 3, ratio: 2, largeSquares: [[0, 0], [2, 0]] },
  { columns: 4, rows: 4, ratio: 2, largeSquares: [[0, 0], [2, 0], [0, 2]] },
  { columns: 5, rows: 4, ratio: 2, largeSquares: [[0, 0], [2, 0], [0, 2], [2, 2]] },
  { columns: 6, rows: 4, ratio: 2, largeSquares: [[0, 0], [2, 0], [0, 2], [2, 2]] },
  { columns: 7, rows: 3, ratio: 3, largeSquares: [[0, 0], [3, 0]] },
  { columns: 6, rows: 4, ratio: 3, largeSquares: [[0, 0], [3, 0]] },
  { columns: 7, rows: 4, ratio: 3, largeSquares: [[0, 0], [3, 0]] },
];

function formatCollageAnswer(largeSide, smallSide) {
  return `Large: ${largeSide} units, Small: ${smallSide} units`;
}

function createPhotoCollageSVG(layout) {
  const cellPx = layout.ratio === 3 ? 36 : 42;
  const padding = 20;
  const titleHeight = 32;
  const legendHeight = 58;
  const width = layout.columns * cellPx + padding * 2;
  const height = layout.rows * cellPx + padding * 2 + titleHeight + legendHeight;
  const gridTop = padding + titleHeight;
  const coveredCells = new Set();

  layout.largeSquares.forEach(([col, row]) => {
    for (let y = row; y < row + layout.ratio; y += 1) {
      for (let x = col; x < col + layout.ratio; x += 1) {
        coveredCells.add(`${x},${y}`);
      }
    }
  });

  const smallCells = [];
  const smallRects = [];
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.columns; col += 1) {
      if (!coveredCells.has(`${col},${row}`)) {
        const x = padding + col * cellPx;
        const y = gridTop + row * cellPx;
        smallCells.push([col, row]);
        smallRects.push(
          `<rect x="${x}" y="${y}" width="${cellPx}" height="${cellPx}" fill="#a7f3d0" stroke="#059669" stroke-width="2" />`
        );
      }
    }
  }

  const largeRects = layout.largeSquares.map(([col, row], index) => {
    const x = padding + col * cellPx;
    const y = gridTop + row * cellPx;
    const size = layout.ratio * cellPx;
    return (
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#bfdbfe" stroke="#2563eb" stroke-width="3" />` +
      `<text x="${x + size / 2}" y="${y + size / 2 - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#1d4ed8">Large</text>` +
      `<text x="${x + size / 2}" y="${y + size / 2 + 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#1d4ed8">photo ${index + 1}</text>`
    );
  });

  const smallLabels = smallCells.slice(0, 3).map(([col, row]) => {
    const x = padding + col * cellPx + cellPx / 2;
    const y = gridTop + row * cellPx + cellPx / 2 + 5;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#047857">Small</text>`;
  });

  const gridWidth = layout.columns * cellPx;
  const gridHeight = layout.rows * cellPx;
  const legendY = gridTop + gridHeight + 20;
  const secondLegendY = legendY + 24;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="#f8fafc" rx="12" />` +
    `<text x="${width / 2}" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#111827">Photo collage layout</text>` +
    smallRects.join('') +
    largeRects.join('') +
    smallLabels.join('') +
    `<rect x="${padding}" y="${gridTop}" width="${gridWidth}" height="${gridHeight}" fill="none" stroke="#111827" stroke-width="3" />` +
    `<rect x="${padding}" y="${legendY - 14}" width="16" height="16" fill="#bfdbfe" stroke="#2563eb" stroke-width="2" />` +
    `<text x="${padding + 24}" y="${legendY}" font-family="Arial, sans-serif" font-size="13" fill="#1f2937">Large square photos</text>` +
    `<rect x="${padding}" y="${secondLegendY - 14}" width="16" height="16" fill="#a7f3d0" stroke="#059669" stroke-width="2" />` +
    `<text x="${padding + 24}" y="${secondLegendY}" font-family="Arial, sans-serif" font-size="13" fill="#1f2937">Small square photos</text>` +
    `</svg>`;

  return createSvgDataUri(svg);
}

/**
 * Generates a question about a rectangular photo collage made from large and
 * small square photos. The large square side length is an integer multiple of
 * the small square side length, so students can use total area to solve both
 * lengths.
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generatePhotoCollageQuestion(difficulty = 0.5) {
  const layout = PHOTO_COLLAGE_LAYOUTS[getRandomInt(0, PHOTO_COLLAGE_LAYOUTS.length - 1)];
  const largePhotoCount = layout.largeSquares.length;
  const smallPhotoCount = layout.columns * layout.rows - largePhotoCount * layout.ratio * layout.ratio;
  const smallSide = getRandomInt(2, 6);
  const largeSide = layout.ratio * smallSide;
  const totalArea = layout.columns * layout.rows * smallSide * smallSide;
  const correctAnswer = formatCollageAnswer(largeSide, smallSide);

  const rawDistractors = [
    [largeSide + layout.ratio, smallSide + 1],
    [largeSide + layout.ratio * 2, smallSide + 2],
    [largeSide + layout.ratio * 3, smallSide + 3],
    [Math.max(layout.ratio, largeSide - layout.ratio), Math.max(1, smallSide - 1)],
    [largeSide, smallSide + 1],
    [largeSide + layout.ratio, smallSide],
    [smallSide, largeSide],
  ];

  const distractorOptions = rawDistractors
    .filter(([large, small]) => large > small && large === layout.ratio * small)
    .map(([large, small]) => formatCollageAnswer(large, small));

  return {
    question: `A rectangular collage is made of ${largePhotoCount} large square photos and ${smallPhotoCount} small square photos. Each large photo's side length is ${layout.ratio} times each small photo's side length. The total area of the collage is ${totalArea} square units. What are the side lengths of the large and small photos?`,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, distractorOptions)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: `Think of the small photo side as one unit of length. Each large photo has area ${layout.ratio} × ${layout.ratio} = ${layout.ratio * layout.ratio} small-photo areas. Count the total number of small-photo areas, then use the total area to find one small side length.`,
    standard: '4.MD.A.3',
    concept: 'Geometry',
    grade: 'G4',
    subtopic: 'photo collage',
    difficultyRange: { min: 0.6, max: 1.0 },
    suggestedDifficulty: difficulty,
    images: [
      {
        type: 'question',
        data: createPhotoCollageSVG(layout),
        description: 'Rectangular collage made of large and small square photos',
      },
    ],
  };
}

/**
 * Generates an area or perimeter question about a composite shape made of
 * equal squares (4.MD.A.3). The shape is drawn as an SVG with every side
 * length labeled, and students must compute either the total area or the
 * total perimeter.
 * @param {number} difficulty - Difficulty level from 0 to 1
 */
export function generateCompositeShapeAreaPerimeterQuestion(difficulty = 0.5) {
  const template = COMPOSITE_SHAPE_TEMPLATES[getRandomInt(0, COMPOSITE_SHAPE_TEMPLATES.length - 1)];
  const cells = template.cells;
  const unitLength = getRandomInt(2, 4);

  const numCells = cells.length;
  const area = numCells * unitLength * unitLength;
  const perimeter = computePerimeterUnits(cells) * unitLength;

  const isAreaQuestion = Math.random() < 0.5;
  const correctAnswerVal = isAreaQuestion ? area : perimeter;
  const unit = isAreaQuestion ? 'square units' : 'units';
  const correctAnswer = `${correctAnswerVal} ${unit}`;

  const rawDistractors = isAreaQuestion
    ? [
        perimeter,
        area + unitLength * unitLength,
        Math.max(1, area - unitLength * unitLength),
        numCells * unitLength,
      ]
    : [
        area,
        perimeter + unitLength * 2,
        Math.max(1, perimeter - unitLength * 2),
        numCells * unitLength,
      ];

  const distractorOptions = [...new Set(rawDistractors)]
    .filter((v) => Number.isFinite(v) && v > 0 && v !== correctAnswerVal)
    .map((v) => `${v} ${unit}`);

  const svgDataUri = createCompositeShapeSVG(cells, unitLength);

  return {
    question: `The figure below shows the length of every side in units. What is the ${
      isAreaQuestion ? 'area' : 'perimeter'
    } of the figure?`,
    correctAnswer,
    options: shuffle(generateUniqueOptions(correctAnswer, distractorOptions)),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: isAreaQuestion
      ? 'Split the figure into rectangles. Find each rectangle\'s area (length × width), then add them together.'
      : 'Add the lengths of every side going all the way around the outside of the figure.',
    standard: '4.MD.A.3',
    concept: 'Geometry',
    grade: 'G4',
    subtopic: 'composite shapes',
    difficultyRange: { min: 0.5, max: 1.0 },
    suggestedDifficulty: difficulty,
    images: [
      {
        type: 'question',
        data: svgDataUri,
        description: 'Composite shape with all side lengths labeled',
      },
    ],
  };
}

const geometryQuestions = {
  generateQuestion,
  refreshAngleAdditionDiagram,
  generateLinesAndAnglesQuestion,
  generateShapeClassificationQuestion,
  generateTriangleClassificationBySidesQuestion,
  generateTriangleClassificationByAnglesQuestion,
  generateQuadrilateralPropertiesQuestion,
  generateLineSymmetryQuestion,
  generateAngleMeasurementQuestion,
  generatePointsLinesRaysQuestion,
  generateMissingSideQuestion,
  generateRectangleToSquareAreaQuestion,
  generatePhotoCollageQuestion,
  generateCompositeShapeAreaPerimeterQuestion,
};

export default geometryQuestions;
