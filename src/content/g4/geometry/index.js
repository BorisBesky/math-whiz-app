// 4th Grade Geometry Topic Module
// Metadata lives in manifest.json; heavy imports (questions.js, Explanation.js,
// shapes.js) load on demand when a quiz starts or an explanation opens.
import manifest from './manifest.json';

export const geometry = {
  ...manifest,
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
  // Angle-addition questions rebuild their diagram SVG from the question text
  // so persisted/imported copies without images still render one.
  loadQuestionHooks: () => import('./questions').then(m => ({
    prepareForDisplay: m.refreshAngleAdditionDiagram,
  })),
};

export default geometry;
