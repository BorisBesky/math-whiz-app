// 3rd Grade Fractions Topic Module
import { generateQuestion } from './questions';
import FractionsExplanation from './Explanation';

export const fractions = {
  id: 'fractions',
  name: 'Fractions',
  description: 'Understanding fractions as parts of a whole, equivalent fractions, and comparison',
  grade: 'G3',
  standards: ['3.NF.A.1', '3.NF.A.2', '3.NF.A.3.a', '3.NF.A.3.b', '3.NF.A.3.c', '3.NF.A.3.d'],
  generateQuestion,
  ExplanationComponent: FractionsExplanation,
  subtopics: ['equivalent fractions', 'comparison', 'addition', 'subtraction', 'simplification'],
  objectives: [
    'Understand fractions as parts of a whole',
    'Identify equivalent fractions', 
    'Compare fractions with same denominators or numerators',
    'Add and subtract simple fractions',
    'Simplify fractions to lowest terms'
  ]
};

export default fractions;
