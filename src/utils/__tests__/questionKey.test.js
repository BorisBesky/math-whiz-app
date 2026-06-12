import { getQuestionSignature, getQuestionMasteryKey } from '../questionKey';

describe('questionKey', () => {
  describe('getQuestionSignature', () => {
    test('combines question text and correct answer', () => {
      expect(getQuestionSignature({ question: 'What is 2+2?', correctAnswer: '4' }))
        .toBe('What is 2+2?|||4');
    });

    test('distinguishes same text with different answers', () => {
      const a = getQuestionSignature({ question: 'Read the clock', correctAnswer: '3:15' });
      const b = getQuestionSignature({ question: 'Read the clock', correctAnswer: '9:45' });
      expect(a).not.toBe(b);
    });

    test('tolerates missing fields', () => {
      expect(getQuestionSignature({})).toBe('|||');
      expect(getQuestionSignature(null)).toBe('|||');
    });
  });

  describe('getQuestionMasteryKey', () => {
    test('prefers an explicit questionTag (existing tagged generators unchanged)', () => {
      expect(getQuestionMasteryKey({ questionTag: 'place-value-table', question: 'x', correctAnswer: 'y' }))
        .toBe('place-value-table');
    });

    test('derives a stable gen_ key from the signature when untagged', () => {
      const q = { question: 'What is an exact location with no size?', correctAnswer: 'point' };
      const key = getQuestionMasteryKey(q);
      expect(key).toMatch(/^gen_[0-9a-z]+$/);
      // Deterministic across calls.
      expect(getQuestionMasteryKey({ ...q })).toBe(key);
    });

    test('produces Firestore-path-safe keys even for text with dots/slashes/spaces', () => {
      const key = getQuestionMasteryKey({ question: 'A line A.B / segment? yes', correctAnswer: 'true' });
      expect(key).not.toMatch(/[.[\]/*~ ?]/);
    });

    test('different questions get different keys', () => {
      const k1 = getQuestionMasteryKey({ question: 'What is a point?', correctAnswer: 'point' });
      const k2 = getQuestionMasteryKey({ question: 'What is a line?', correctAnswer: 'line' });
      expect(k1).not.toBe(k2);
    });
  });
});
