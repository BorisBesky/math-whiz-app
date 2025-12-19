// 4th Grade Geometry Topic Module
import { generateQuestion } from './questions';
import GeometryExplanation from './Explanation';
import * as geometricShapes from './shapes';

export const geometry = {
  id: 'geometry',
  name: 'Geometry',
  description: 'Points, lines, angles, and classification of shapes',
  grade: 'G4',
  standards: ['4.G.A.1', '4.G.A.2', '4.G.A.3'],
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: GeometryExplanation,
  
  // Shape utilities
  shapes: geometricShapes,
  
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
