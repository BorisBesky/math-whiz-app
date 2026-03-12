// 3rd Grade Multiplication Topic Module
// Heavy imports (questions.js, Explanation.js) are loaded on demand

export const multiplication = {
  id: 'multiplication',
  name: 'Multiplication',
  description: 'Understanding multiplication through skip counting, arrays, and equal groups',
  grade: 'G3',
  standards: ['3.OA.A.1', '3.OA.A.3', '3.OA.B.5', '3.OA.C.7'],

  // Lazy loaders — loaded on demand when quiz starts or explanation opens
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),

  // Topic metadata
  subtopics: [
    'basic multiplication',
    'skip counting',
    'arrays and groups',
    'word problems',
    'fact families'
  ],

  // Learning objectives
  objectives: [
    'Understand multiplication as repeated addition',
    'Use skip counting to solve multiplication problems',
    'Represent multiplication using arrays and groups',
    'Solve word problems involving equal groups',
    'Apply the commutative property of multiplication',
    'Connect multiplication and division as inverse operations'
  ]
};

export default multiplication;
