/**
 * Phase 0 prompt snapshots for the pluggable-content migration
 * (docs/PLUGGABLE_CONTENT_PLAN.md).
 *
 * Freezes the exact prompt text the four AI functions send to Gemini, plus
 * the topic/grade validation error strings. Phase 3 rewires these functions
 * to derive their topic/grade knowledge from content manifests and MUST keep
 * these snapshots byte-identical; only after that may the wording evolve
 * deliberately.
 */

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({ verifyIdToken: jest.fn() }),
    firestore: {
      FieldValue: { serverTimestamp: jest.fn(() => 'SERVER_TIME') },
      Timestamp: { now: jest.fn(() => 'NOW_TIME') },
    },
  },
  db: { doc: jest.fn(), collection: jest.fn() },
}));

const generateQuestions = require('../../netlify/functions/gemini-generate-questions');
const geminiProxy = require('../../netlify/functions/gemini-proxy');
const uploadPdf = require('../../netlify/functions/upload-pdf-questions-background');
const teacherAiFocus = require('../../netlify/functions/teacher-ai-focus-analysis');

describe('gemini-generate-questions', () => {
  const GENERATABLE_TYPES = ['multiple-choice', 'numeric', 'fill-in-the-blanks'];

  test('TOPIC_GUIDELINES text is frozen', () => {
    expect(generateQuestions._test.TOPIC_GUIDELINES).toMatchSnapshot();
  });

  test.each([
    ['G3', 'Multiplication'],
    ['G4', 'Operations & Algebraic Thinking'],
  ])('buildPrompt for %s is frozen', (grade, topic) => {
    expect(
      generateQuestions._test.buildPrompt(grade, topic, GENERATABLE_TYPES, 5, '')
    ).toMatchSnapshot();
  });

  test('buildPrompt with additional instructions is frozen', () => {
    expect(
      generateQuestions._test.buildPrompt(
        'G3',
        'Fractions',
        ['multiple-choice'],
        3,
        'Use pizza examples.'
      )
    ).toMatchSnapshot();
  });
});

describe('gemini-proxy', () => {
  const { validateAndEnhancePrompt } = geminiProxy._test;

  test.each([
    ['G3', 'Multiplication'],
    ['G4', 'Geometry'],
  ])('enhanced prompt for %s is frozen', (grade, topic) => {
    expect(
      validateAndEnhancePrompt('Create a fun math story problem.', topic, grade)
    ).toMatchSnapshot();
  });

  test('invalid-topic error message embeds the exact G3 topic list', () => {
    let message;
    try {
      validateAndEnhancePrompt('p', 'Algebra', 'G3');
    } catch (err) {
      message = err.message;
    }
    expect(message).toBe(
      'Invalid topic: Algebra for 3rd grade. Valid topics are: Multiplication, Division, Fractions, Measurement & Data'
    );
  });

  test('invalid-topic error message embeds the exact G4 topic list', () => {
    let message;
    try {
      validateAndEnhancePrompt('p', 'Algebra', 'G4');
    } catch (err) {
      message = err.message;
    }
    expect(message).toBe(
      'Invalid topic: Algebra for 4th grade. Valid topics are: Operations & Algebraic Thinking, Base Ten, Fractions 4th, Measurement & Data 4th, Geometry, Binary Operations'
    );
  });

  test('unknown grade gets an invalid-grade error listing the enabled grades', () => {
    // Phase 3 conscious change: the legacy quirk labeled unknown grades
    // "4th grade" and reported "none defined" topics. Grades are now
    // validated first (this path was already unreachable in production —
    // the handler pre-validates the grade).
    let message;
    try {
      validateAndEnhancePrompt('p', 'Multiplication', 'G5');
    } catch (err) {
      message = err.message;
    }
    expect(message).toBe('Invalid grade: G5. Valid grades are: G3, G4');
  });
});

describe('upload-pdf-questions-background', () => {
  const { buildExtractionPrompt } = uploadPdf._test;

  test.each(['G3', 'G4'])('extraction prompt for %s is frozen', (grade) => {
    expect(buildExtractionPrompt(grade)).toMatchSnapshot();
  });

  test('unknown grade falls back to the G3 topic list and "Grade 3" label', () => {
    expect(buildExtractionPrompt('G5')).toBe(buildExtractionPrompt('G3'));
  });
});

describe('teacher-ai-focus-analysis', () => {
  test('buildPrompt with fixed inputs is frozen (embeds SUBTOPICS_BY_GRADE_TOPIC wholesale)', () => {
    const prompt = teacherAiFocus._test.buildPrompt({
      student: { selectedGrade: 'G4' },
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      metrics: {
        Geometry: { symmetry: { attempts: 4, correct: 1 } },
      },
      rankedNeeds: [{ topic: 'Geometry', subtopic: 'symmetry', need: 0.9 }],
      notEnoughData: [{ topic: 'Base Ten', subtopic: 'rounding' }],
      recentMisses: [
        {
          topic: 'Geometry',
          subtopic: 'symmetry',
          question: 'Which shape has a line of symmetry?',
        },
      ],
    });
    expect(prompt).toMatchSnapshot();
  });
});
