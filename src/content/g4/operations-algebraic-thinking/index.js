// 4th Grade Operations & Algebraic Thinking Topic Module
import { generateQuestion } from './questions';
import OperationsAlgebraicThinkingExplanation from './Explanation';

export const operationsAlgebraicThinking = {
  id: 'operations-algebraic-thinking',
  name: 'Operations & Algebraic Thinking',
  description: 'Multiplicative comparisons, prime and composite numbers, factors and multiples',
  grade: 'G4',
  standards: ['4.OA.A.1', '4.OA.A.2', '4.OA.A.3', '4.OA.B.4', '4.OA.C.5'],
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: OperationsAlgebraicThinkingExplanation,
  
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
