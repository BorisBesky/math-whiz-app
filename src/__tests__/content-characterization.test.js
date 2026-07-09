/**
 * Phase 0 characterization tests for the pluggable-content migration
 * (docs/PLUGGABLE_CONTENT_PLAN.md).
 *
 * These tests freeze the CURRENT topic/grade surface — names, order, and
 * cross-source agreement — so later phases (manifest extraction, registry,
 * derived constants) must reproduce it exactly. They are guardrails, not
 * aspirations: if you intentionally change curriculum data, update the
 * literals here in the same PR and call it out in review.
 *
 * Sources of truth being reconciled (all must agree until Phase 1 collapses
 * them into per-topic manifests):
 *   1. src/constants/shared-constants.js  (TOPICS, VALID_TOPICS_BY_GRADE, SUBTOPICS_BY_GRADE_TOPIC)
 *   2. src/constants/appConstants.js      (quizTopicsByGrade — defines UI order, TOPIC_CONTENT_MAP)
 *   3. src/utils/common_utils.js          (getTopicsForGrade — an inlined copy)
 *   4. src/content/<grade>/<topic>/index.js modules (the future single source)
 */
import { getTopicsForGrade } from '../utils/common_utils';
import {
  GRADES,
  VALID_TOPICS_BY_GRADE,
  SUBTOPICS_BY_GRADE_TOPIC,
} from '../constants/topics';
import {
  quizTopicsByGrade,
  TOPIC_CONTENT_MAP,
  conceptExplanationFiles,
} from '../constants/appConstants';
import { sanitizeTopicName } from '../utils/firebaseHelpers';
import content from '../content';

// Canonical topic lists as of Phase 0. Order matters: quizTopicsByGrade order
// is what students see in TopicSelection, and VALID_TOPICS_BY_GRADE[grade][0]
// is the implicit default topic in upload-pdf-questions-background.js.
const CANONICAL_TOPICS = {
  G3: ['Multiplication', 'Division', 'Fractions', 'Measurement & Data'],
  G4: [
    'Operations & Algebraic Thinking',
    'Base Ten',
    'Fractions 4th',
    'Measurement & Data 4th',
    'Geometry',
    'Binary Operations',
  ],
};
const ALL_CANONICAL_TOPICS = [...CANONICAL_TOPICS.G3, ...CANONICAL_TOPICS.G4];

describe('grade keys', () => {
  test('GRADES contains exactly G3 and G4', () => {
    expect(GRADES).toEqual({ G3: 'G3', G4: 'G4' });
  });
});

describe('topic lists agree across all sources (names AND order)', () => {
  test.each(['G3', 'G4'])('common_utils.getTopicsForGrade(%s)', (grade) => {
    expect(getTopicsForGrade(grade)).toEqual(CANONICAL_TOPICS[grade]);
  });

  test('common_utils.getTopicsForGrade falls back to the G3 list for unknown grades', () => {
    // Legacy quirk relied on by callers — preserve until a deliberate change.
    expect(getTopicsForGrade('G5')).toEqual(CANONICAL_TOPICS.G3);
    expect(getTopicsForGrade(undefined)).toEqual(CANONICAL_TOPICS.G3);
  });

  test.each(['G3', 'G4'])('appConstants.quizTopicsByGrade.%s', (grade) => {
    expect(quizTopicsByGrade[grade]).toEqual(CANONICAL_TOPICS[grade]);
  });

  test.each(['G3', 'G4'])('shared-constants VALID_TOPICS_BY_GRADE.%s', (grade) => {
    expect(VALID_TOPICS_BY_GRADE[grade]).toEqual(CANONICAL_TOPICS[grade]);
  });

  test('first topic per grade is pinned (upload-pdf default-topic fallback)', () => {
    expect(VALID_TOPICS_BY_GRADE.G3[0]).toBe('Multiplication');
    expect(VALID_TOPICS_BY_GRADE.G4[0]).toBe('Operations & Algebraic Thinking');
  });

  test.each([
    ['G3', 'g3'],
    ['G4', 'g4'],
  ])('content registry topics for %s match the canonical set', (grade, gradeId) => {
    // Set comparison: the registry's internal order (g4 lists Geometry first)
    // differs from the student-facing quizTopicsByGrade order and is not
    // user-visible today, so only membership is frozen here.
    const registryNames = content.getTopicsForGrade(gradeId).map((t) => t.name);
    expect([...registryNames].sort()).toEqual([...CANONICAL_TOPICS[grade]].sort());
  });
});

describe('TOPIC_CONTENT_MAP resolves every canonical topic in the content registry', () => {
  test('map keys are exactly the canonical topics', () => {
    expect(Object.keys(TOPIC_CONTENT_MAP).sort()).toEqual([...ALL_CANONICAL_TOPICS].sort());
  });

  test.each(ALL_CANONICAL_TOPICS)('"%s" resolves to a well-formed topic module', (topicName) => {
    const entry = TOPIC_CONTENT_MAP[topicName];
    expect(entry).toBeDefined();
    const [gradeId, topicId] = entry;

    const module = content.getTopic(gradeId, topicId);
    expect(module).toBeTruthy();
    expect(module.id).toBe(topicId);
    expect(module.name).toBe(topicName);
    // Module grade key ('G3') must match the registry grade id ('g3').
    expect(module.grade).toBe(gradeId.toUpperCase());
    expect(typeof module.loadGenerateQuestion).toBe('function');
    expect(typeof module.loadExplanationComponent).toBe('function');
    expect(Array.isArray(module.subtopics)).toBe(true);
    expect(module.subtopics.length).toBeGreaterThan(0);
  });
});

describe('subtopic parity: topic modules vs shared-constants', () => {
  // These two lists feed different surfaces today (modules → portal Focus
  // modals & generators; shared-constants → AI prompts & validation), so any
  // drift means teachers and the AI see different curricula.
  test.each(ALL_CANONICAL_TOPICS)('"%s" subtopics agree', (topicName) => {
    const [gradeId, topicId] = TOPIC_CONTENT_MAP[topicName];
    const module = content.getTopic(gradeId, topicId);
    const fromConstants = SUBTOPICS_BY_GRADE_TOPIC[gradeId.toUpperCase()][topicName];

    expect(fromConstants).toBeDefined();
    expect(module.subtopics).toEqual(fromConstants);
  });

  test('SUBTOPICS_BY_GRADE_TOPIC covers exactly the canonical topics per grade', () => {
    expect(Object.keys(SUBTOPICS_BY_GRADE_TOPIC.G3).sort()).toEqual([...CANONICAL_TOPICS.G3].sort());
    expect(Object.keys(SUBTOPICS_BY_GRADE_TOPIC.G4).sort()).toEqual([...CANONICAL_TOPICS.G4].sort());
  });
});

describe('Firestore key safety', () => {
  test('sanitized topic names are non-empty and unique per grade', () => {
    // sanitizeTopicName(name) is used as a Firestore field-path segment in
    // progress tracking; a collision would silently merge two topics' stats.
    for (const grade of Object.keys(CANONICAL_TOPICS)) {
      const sanitized = CANONICAL_TOPICS[grade].map(sanitizeTopicName);
      sanitized.forEach((s) => expect(s).toMatch(/^[A-Za-z0-9_]+$/));
      expect(new Set(sanitized).size).toBe(sanitized.length);
    }
  });
});

describe('legacy explanation fallbacks', () => {
  // G3 'Measurement & Data' has never had a direct iframe entry — only its
  // legacy sub-concepts (Area, Perimeter, Volume) do. Harmless today because
  // TOPIC_CONTENT_MAP serves it a React explanation first, so the iframe
  // fallback is unreachable. Frozen as-is; Phase 1 moves these paths into
  // manifests without changing coverage.
  const TOPICS_WITHOUT_LEGACY_IFRAME = ['Measurement & Data'];

  test('every topic outside the exception list has an iframe entry', () => {
    ALL_CANONICAL_TOPICS
      .filter((topicName) => !TOPICS_WITHOUT_LEGACY_IFRAME.includes(topicName))
      .forEach((topicName) => {
        expect(conceptExplanationFiles[topicName]).toEqual(expect.stringMatching(/^\/.+\.html$/));
      });
  });

  test('the known exceptions have no iframe entry', () => {
    TOPICS_WITHOUT_LEGACY_IFRAME.forEach((topicName) => {
      expect(conceptExplanationFiles[topicName]).toBeUndefined();
    });
  });
});
