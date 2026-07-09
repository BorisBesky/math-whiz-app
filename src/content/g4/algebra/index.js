// 4th Grade Algebra Topic Module
// Metadata lives in manifest.json; heavy imports (questions.js, Explanation.js)
// load on demand when a quiz starts or an explanation opens.
import manifest from './manifest.json';

export const algebra = {
  ...manifest,
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
};

export default algebra;
