// 4th Grade Geometry Topic Module
// Heavy imports (questions.js, Explanation.js, shapes.js) are loaded on demand

export const geometry = {
  id: 'geometry',
  name: 'Geometry',
  description: 'Points, lines, angles, and classification of shapes',
  grade: 'G4',
  standards: ['4.G.A.1', '4.G.A.2', '4.G.A.3'],

  // Lazy loaders — loaded on demand when quiz starts or explanation opens
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
  
  // Topic metadata
  subtopics: [
    'lines and angles',
    'points lines rays',
    'classify shapes',
    'symmetry',
    'triangles',
    'quadrilaterals',
    'angle measurement'
  ],
  
  // Learning objectives
  objectives: [
    'Identify and draw points, lines, line segments, rays, and angles',
    'Classify triangles by their sides and angles',
    'Classify quadrilaterals by their properties',
    'Identify lines of symmetry in shapes',
    'Recognize parallel and perpendicular lines',
    'Measure and classify angles (acute, right, obtuse, straight)'
  ]
};

export default geometry;
