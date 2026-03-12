// 4th Grade Operations & Algebraic Thinking Topic Module
// Heavy imports (questions.js, Explanation.js) are loaded on demand

export const operationsAlgebraicThinking = {
  id: 'operations-algebraic-thinking',
  name: 'Operations & Algebraic Thinking',
  description: 'Multiplicative comparisons, prime and composite numbers, factors and multiples',
  grade: 'G4',
  standards: ['4.OA.A.1', '4.OA.A.2', '4.OA.A.3', '4.OA.B.4', '4.OA.C.5'],

  // Lazy loaders — loaded on demand when quiz starts or explanation opens
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
  
  // Topic metadata
  subtopics: [
    'multiplicative comparison',
    'prime vs composite',
    'factors',
    'multiples',
    'number patterns'
  ],
  
  // Learning objectives
  objectives: [
    'Solve multiplicative comparison word problems',
    'Identify prime and composite numbers',
    'Find factors and multiples of whole numbers',
    'Recognize and extend number patterns',
    'Use mathematical reasoning and problem-solving strategies'
  ]
};

export default operationsAlgebraicThinking;
