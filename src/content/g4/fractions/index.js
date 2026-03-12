// 4th Grade Fractions Topic Module
// Heavy imports (questions.js, Explanation.js) are loaded on demand

export const fractions = {
  id: 'fractions',
  name: 'Fractions 4th',
  description: 'Equivalent fractions, comparison, addition, subtraction, and decimal notation',
  grade: 'G4',
  standards: ['4.NF.A.1', '4.NF.A.2', '4.NF.B.3.a', '4.NF.B.3.b', '4.NF.B.4.a', '4.NF.C.5', '4.NF.C.6', '4.NF.C.7'],

  // Lazy loaders — loaded on demand when quiz starts or explanation opens
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
  
  // Topic metadata
  subtopics: [
    'equivalent fractions',
    'comparison',
    'addition',
    'subtraction',
    'multiplication',
    'decimal notation',
    'decimal operations',
    'mixed numbers'
  ],
  
  // Learning objectives
  objectives: [
    'Understand equivalent fractions',
    'Compare and order fractions',
    'Add and subtract fractions with like denominators',
    'Multiply fractions by whole numbers',
    'Express fractions with denominators of 10 as decimals',
    'Compare decimal notations for fractions',
    'Add, subtract, multiply, and divide decimals',
    'Solve word problems involving fractions'
  ]
};

export default fractions;
