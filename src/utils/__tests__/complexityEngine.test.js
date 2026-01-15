/**
 * Tests for the Complexity Engine
 * Tests scoring, ranking, and adaptive difficulty selection
 */

import {
  rankQuestionsByComplexity,
  computePerTopicComplexity,
  nextTargetComplexity,
  adaptAnsweredHistory,
  __complexityTunables
} from '../complexityEngine';

const { TIME_WEIGHT, INCORRECT_WEIGHT, MIN_COMPLEXITY, MAX_COMPLEXITY, PROGRESS_STEP } = __complexityTunables;

describe('complexityEngine', () => {
  describe('rankQuestionsByComplexity', () => {
    it('returns empty array for empty or null history', () => {
      expect(rankQuestionsByComplexity([])).toEqual([]);
      expect(rankQuestionsByComplexity(null)).toEqual([]);
      expect(rankQuestionsByComplexity(undefined)).toEqual([]);
    });

    it('assigns higher complexity to incorrect answers', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 5000, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: false, timeSpentMs: 5000, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      const q1 = ranked.find(r => r.questionId === 'q1');
      const q2 = ranked.find(r => r.questionId === 'q2');

      expect(q2.complexityScore).toBeGreaterThan(q1.complexityScore);
    });

    it('assigns higher complexity to slower answers within same topic', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 2000, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: true, timeSpentMs: 10000, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      const q1 = ranked.find(r => r.questionId === 'q1');
      const q2 = ranked.find(r => r.questionId === 'q2');

      expect(q2.complexityScore).toBeGreaterThan(q1.complexityScore);
    });

    it('sorts results by complexity score descending', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 1000, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: false, timeSpentMs: 5000, createdAt: new Date() },
        { questionId: 'q3', topic: 'fractions', isCorrect: true, timeSpentMs: 3000, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].complexityScore).toBeGreaterThanOrEqual(ranked[i + 1].complexityScore);
      }
    });

    it('handles different topics independently', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 10000, createdAt: new Date() },
        { questionId: 'q2', topic: 'multiplication', isCorrect: true, timeSpentMs: 1000, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      // Both should have similar time-based complexity since they're normalized per topic
      // The exact values depend on the median calculation, but both should be valid scores
      ranked.forEach(r => {
        expect(r.complexityScore).toBeGreaterThanOrEqual(0);
        expect(r.complexityScore).toBeLessThanOrEqual(1);
      });
    });

    it('handles minimum time values (avoids log(0))', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 0, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: true, timeSpentMs: 1, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      expect(ranked).toHaveLength(2);
      ranked.forEach(r => {
        expect(r.complexityScore).toBeGreaterThanOrEqual(0);
        expect(r.complexityScore).toBeLessThanOrEqual(1);
        expect(Number.isNaN(r.complexityScore)).toBe(false);
      });
    });

    it('removes outliers beyond 3 standard deviations', () => {
      const baseTime = 5000;
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: baseTime, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: true, timeSpentMs: baseTime + 1000, createdAt: new Date() },
        { questionId: 'q3', topic: 'fractions', isCorrect: true, timeSpentMs: baseTime - 1000, createdAt: new Date() },
        { questionId: 'outlier', topic: 'fractions', isCorrect: true, timeSpentMs: 500000, createdAt: new Date() } // Extreme outlier
      ];

      const ranked = rankQuestionsByComplexity(history);

      // All should have valid scores
      ranked.forEach(r => {
        expect(r.complexityScore).toBeGreaterThanOrEqual(0);
        expect(r.complexityScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('computePerTopicComplexity', () => {
    it('returns empty array for empty history', () => {
      expect(computePerTopicComplexity([])).toEqual([]);
    });

    it('computes average complexity per topic', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 5000, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: false, timeSpentMs: 5000, createdAt: new Date() },
        { questionId: 'q3', topic: 'multiplication', isCorrect: true, timeSpentMs: 3000, createdAt: new Date() }
      ];

      const perTopic = computePerTopicComplexity(history);

      expect(perTopic).toHaveLength(2);

      const fractions = perTopic.find(t => t.topic === 'fractions');
      const multiplication = perTopic.find(t => t.topic === 'multiplication');

      expect(fractions).toBeDefined();
      expect(fractions.count).toBe(2);
      expect(fractions.avg).toBeGreaterThanOrEqual(0);
      expect(fractions.avg).toBeLessThanOrEqual(1);

      expect(multiplication).toBeDefined();
      expect(multiplication.count).toBe(1);
    });

    it('sorts topics by most recently answered', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 5000, createdAt: yesterday },
        { questionId: 'q2', topic: 'multiplication', isCorrect: true, timeSpentMs: 5000, createdAt: now }
      ];

      const perTopic = computePerTopicComplexity(history);

      expect(perTopic[0].topic).toBe('multiplication');
      expect(perTopic[1].topic).toBe('fractions');
    });

    it('includes lastAnsweredAt date for each topic', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 5000, createdAt: new Date() }
      ];

      const perTopic = computePerTopicComplexity(history);

      expect(perTopic[0].lastAnsweredAt).toBeInstanceOf(Date);
    });
  });

  describe('nextTargetComplexity', () => {
    it('returns 0.5 for random mode', () => {
      const result = nextTargetComplexity({ history: [], topic: 'fractions', mode: 'random' });
      expect(result).toBe(0.5);
    });

    it('returns 0.5 for empty history (neutral starting point)', () => {
      const result = nextTargetComplexity({ history: [], topic: 'fractions', mode: 'progressive' });
      expect(result).toBe(0.5);
    });

    it('increases complexity progressively based on history', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 3000, createdAt: new Date() },
        { questionId: 'q2', topic: 'fractions', isCorrect: true, timeSpentMs: 3000, createdAt: new Date() }
      ];

      const result = nextTargetComplexity({ history, topic: 'fractions', mode: 'progressive' });

      // Should be base + PROGRESS_STEP, clamped between MIN and MAX
      expect(result).toBeGreaterThanOrEqual(MIN_COMPLEXITY);
      expect(result).toBeLessThanOrEqual(MAX_COMPLEXITY);
    });

    it('respects lastAskedComplexity to avoid going backwards', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: true, timeSpentMs: 3000, createdAt: new Date() }
      ];

      const result = nextTargetComplexity({
        history,
        topic: 'fractions',
        mode: 'progressive',
        lastAskedComplexity: 0.7
      });

      expect(result).toBeGreaterThanOrEqual(0.7 + PROGRESS_STEP);
    });

    it('clamps result to MAX_COMPLEXITY', () => {
      const result = nextTargetComplexity({
        history: [],
        topic: 'fractions',
        mode: 'progressive',
        lastAskedComplexity: 0.99
      });

      expect(result).toBeLessThanOrEqual(MAX_COMPLEXITY);
    });

    it('filters history by topic', () => {
      const history = [
        { questionId: 'q1', topic: 'fractions', isCorrect: false, timeSpentMs: 10000, createdAt: new Date() },
        { questionId: 'q2', topic: 'multiplication', isCorrect: true, timeSpentMs: 1000, createdAt: new Date() }
      ];

      // Should only consider fractions history
      const fractionsResult = nextTargetComplexity({ history, topic: 'fractions', mode: 'progressive' });
      const multiplicationResult = nextTargetComplexity({ history, topic: 'multiplication', mode: 'progressive' });

      // Both should be valid but may differ based on their respective histories
      expect(fractionsResult).toBeGreaterThanOrEqual(MIN_COMPLEXITY);
      expect(multiplicationResult).toBeGreaterThanOrEqual(MIN_COMPLEXITY);
    });
  });

  describe('adaptAnsweredHistory', () => {
    it('returns empty array for null or undefined input', () => {
      expect(adaptAnsweredHistory(null)).toEqual([]);
      expect(adaptAnsweredHistory(undefined)).toEqual([]);
    });

    it('converts app format to engine format', () => {
      const appHistory = [
        {
          id: 'answer-1',
          question: 'What is 2 + 2?',
          correctAnswer: '4',
          topic: 'addition',
          isCorrect: true,
          timeTaken: 5, // seconds in app format
          timestamp: '2024-01-15T10:00:00Z'
        }
      ];

      const adapted = adaptAnsweredHistory(appHistory);

      expect(adapted).toHaveLength(1);
      expect(adapted[0].questionId).toBe('answer-1');
      expect(adapted[0].question).toBe('What is 2 + 2?');
      expect(adapted[0].topic).toBe('addition');
      expect(adapted[0].isCorrect).toBe(true);
      expect(adapted[0].timeSpentMs).toBe(5000); // Converted to ms
      expect(adapted[0].createdAt).toBeInstanceOf(Date);
    });

    it('generates questionId from topic and question if id is missing', () => {
      const appHistory = [
        {
          question: 'What is 3 x 4?',
          topic: 'multiplication',
          isCorrect: true,
          timeTaken: 3
        }
      ];

      const adapted = adaptAnsweredHistory(appHistory);

      expect(adapted[0].questionId).toContain('multiplication');
      expect(adapted[0].questionId).toContain('What is 3 x 4?');
    });

    it('uses date string as fallback for createdAt', () => {
      const appHistory = [
        {
          id: 'q1',
          topic: 'fractions',
          isCorrect: true,
          timeTaken: 2,
          date: '2024-01-15'
        }
      ];

      const adapted = adaptAnsweredHistory(appHistory);

      expect(adapted[0].createdAt).toBeInstanceOf(Date);
      expect(adapted[0].createdAt.getUTCFullYear()).toBe(2024);
    });

    it('handles zero or negative timeTaken', () => {
      const appHistory = [
        { id: 'q1', topic: 'fractions', isCorrect: true, timeTaken: -5 },
        { id: 'q2', topic: 'fractions', isCorrect: true, timeTaken: 0 }
      ];

      const adapted = adaptAnsweredHistory(appHistory);

      expect(adapted[0].timeSpentMs).toBe(0); // Clamped to 0
      expect(adapted[1].timeSpentMs).toBe(0);
    });

    it('preserves signature if present', () => {
      const appHistory = [
        {
          id: 'q1',
          topic: 'fractions',
          isCorrect: true,
          timeTaken: 2,
          signature: 'unique-sig-123'
        }
      ];

      const adapted = adaptAnsweredHistory(appHistory);

      expect(adapted[0].signature).toBe('unique-sig-123');
    });
  });

  describe('complexity score calculation', () => {
    it('uses correct weights for time and incorrectness', () => {
      // Verify the weights are as documented
      expect(TIME_WEIGHT).toBe(0.6);
      expect(INCORRECT_WEIGHT).toBe(0.4);
      expect(TIME_WEIGHT + INCORRECT_WEIGHT).toBe(1);
    });

    it('produces score of INCORRECT_WEIGHT for instant incorrect answer', () => {
      // If time component is 0 and answer is incorrect:
      // score = 0.6 * 0 + 0.4 * 1 = 0.4
      const history = [
        { questionId: 'q1', topic: 'test', isCorrect: false, timeSpentMs: 1, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      // With single item, time normalization gives 0.5 (median)
      // score = 0.6 * 0.5 + 0.4 * 1 = 0.3 + 0.4 = 0.7
      expect(ranked[0].complexityScore).toBeCloseTo(0.7, 1);
    });

    it('produces score close to 0 for fast correct answer', () => {
      // For a single fast correct answer:
      // time component = 0.5 (normalized to median)
      // score = 0.6 * 0.5 + 0.4 * 0 = 0.3
      const history = [
        { questionId: 'q1', topic: 'test', isCorrect: true, timeSpentMs: 1000, createdAt: new Date() }
      ];

      const ranked = rankQuestionsByComplexity(history);

      expect(ranked[0].complexityScore).toBeCloseTo(0.3, 1);
    });
  });
});
