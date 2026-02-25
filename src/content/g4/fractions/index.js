// 4th Grade Fractions Topic Module
import { generateQuestion } from './questions';
import FractionsExplanation from './Explanation';

export const fractions = {
  id: 'fractions',
  name: 'Fractions 4th',
  description: 'Equivalent fractions, comparison, addition, subtraction, and decimal notation',
  grade: 'G4',
  standards: ['4.NF.A.1', '4.NF.A.2', '4.NF.B.3.a', '4.NF.B.3.b', '4.NF.B.4.a', '4.NF.C.5', '4.NF.C.6', '4.NF.C.7'],
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: FractionsExplanation,
  
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
