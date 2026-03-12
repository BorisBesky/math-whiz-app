// 4th Grade Base Ten Topic Module
// Heavy imports (questions.js, Explanation.js) are loaded on demand

export const baseTen = {
  id: 'base-ten',
  name: 'Base Ten',
  description: 'Place value, rounding, and multi-digit operations',
  grade: 'G4',
  standards: ['4.NBT.A.1', '4.NBT.A.2', '4.NBT.A.3', '4.NBT.B.4', '4.NBT.B.5', '4.NBT.B.6', '4.NF.C.6'],

  // Lazy loaders — loaded on demand when quiz starts or explanation opens
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
  
  // Topic metadata
  subtopics: [
    'place value',
    'rounding',
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'comparison',
    'decimal place value'
  ],
  
  // Learning objectives
  objectives: [
    'Understand place value to 1,000,000',
    'Compare and order multi-digit numbers',
    'Round numbers to any place value',
    'Add and subtract multi-digit numbers',
    'Multiply and divide multi-digit numbers',
    'Use number patterns and properties',
    'Understand decimal place value for tenths, hundredths, and thousandths'
  ]
};

export default baseTen;
