/**
 * Shared generator-contract suite (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 4).
 *
 * Every topic module must satisfy this contract for the quiz pipeline to work:
 * src/content/__tests__/topicContracts.test.js runs it against every
 * registered topic automatically, so a new topic folder is covered without
 * writing any test code. Topic-specific edge cases still belong in the
 * topic's own __tests__/questions.test.js.
 *
 * Usage inside a Jest file:
 *   runTopicContractTests(topicModule);            // whole describe block
 *   runTopicContractTests(topicModule, options);   // tune draws/variety
 */
import { isMultipleChoiceAnswerable } from '../../services/quizGenerationService';
import { getQuestionSignature } from '../../utils/questionKey';

const DIFFICULTIES = [0, 0.25, 0.5, 0.75, 1];

/**
 * @param {object} topicModule - a registry topic (manifest fields + loaders)
 * @param {object} [options]
 * @param {number} [options.draws=200] draws for the variety check
 * @param {number} [options.minVariety=10] distinct question signatures required
 */
export const runTopicContractTests = (topicModule, options = {}) => {
  const { draws = 200, minVariety = 10 } = options;

  describe(`topic contract: ${topicModule.grade}/${topicModule.id}`, () => {
    let generateQuestion;

    beforeAll(async () => {
      generateQuestion = await topicModule.loadGenerateQuestion();
    });

    test('module exposes the required manifest fields and loaders', () => {
      expect(topicModule.id).toEqual(expect.any(String));
      expect(topicModule.name).toEqual(expect.any(String));
      expect(topicModule.grade).toMatch(/^G[0-9]+$/);
      expect(Array.isArray(topicModule.subtopics)).toBe(true);
      expect(topicModule.subtopics.length).toBeGreaterThan(0);
      expect(typeof topicModule.loadGenerateQuestion).toBe('function');
      expect(typeof topicModule.loadExplanationComponent).toBe('function');
    });

    test('explanation component loads', async () => {
      const Explanation = await topicModule.loadExplanationComponent();
      // React components are functions or (for memo/forwardRef) objects
      expect(['function', 'object']).toContain(typeof Explanation);
      expect(Explanation).toBeTruthy();
    });

    test.each(DIFFICULTIES)('difficulty %p produces well-formed questions', (difficulty) => {
      for (let i = 0; i < 25; i++) {
        const question = generateQuestion(difficulty, null);
        expect(question).toBeTruthy();
        expect(typeof question.question).toBe('string');
        expect(question.question.length).toBeGreaterThan(0);
        expect(question.correctAnswer).toBeDefined();
        expect(String(question.correctAnswer).length).toBeGreaterThan(0);

        // A multiple-choice question the student cannot answer is a hard bug.
        expect(isMultipleChoiceAnswerable(question)).toBe(true);

        if (question.questionType === 'fill-in-the-blanks') {
          const blanks = question.question.match(/_{2,}/g) || [];
          const answers = String(question.correctAnswer).split(';;');
          expect(blanks.length).toBe(answers.length);
          expect(blanks.length).toBeGreaterThan(0);
        }

        // Subtopic must be declared and belong to the manifest — the portal
        // Focus feature and the repeat-pressure analysis key on it.
        expect(topicModule.subtopics).toContain(question.subtopic);
      }
    });

    test('respects an allowedSubtopics restriction', () => {
      for (const allowed of topicModule.subtopics) {
        let produced = 0;
        for (let i = 0; i < 15; i++) {
          const question = generateQuestion(0.5, [allowed]);
          // Generators may return null/undefined when they cannot satisfy the
          // restriction at this difficulty; the quiz loop tolerates that.
          if (!question) continue;
          expect(question.subtopic).toBe(allowed);
          produced += 1;
        }
        // At least one subtopic-restricted draw should succeed overall;
        // per-subtopic gaps are tolerated (difficulty-gated subtopics).
        if (produced > 0) return;
      }
      throw new Error('generator produced no questions under any single-subtopic restriction');
    });

    test(`produces at least ${minVariety} distinct questions over ${draws} draws`, () => {
      const signatures = new Set();
      for (let i = 0; i < draws; i++) {
        const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];
        const question = generateQuestion(difficulty, null);
        if (question) {
          signatures.add(getQuestionSignature(question));
        }
      }
      expect(signatures.size).toBeGreaterThanOrEqual(minVariety);
    });
  });
};

export default runTopicContractTests;
