const { analyzeRepeatPressure, signatureOf } = require('../../netlify/functions/question-pool-health-utils');

const rec = (question, correctAnswer, topic = 'Geometry', subtopic = 'lines and angles') => ({
  topic, subtopic, question, correctAnswer,
});

describe('analyzeRepeatPressure', () => {
  test('flags a subtopic where one question recurs at/above the threshold', () => {
    const records = [
      rec('What is an exact location with no size?', 'point'),
      rec('What is an exact location with no size?', 'point'),
      rec('What is an exact location with no size?', 'point'),
      rec('Which is the best example of a line?', 'a road'),
    ];
    const { flags, totalAnswers } = analyzeRepeatPressure(records, { repeatThreshold: 3 });

    expect(totalAnswers).toBe(4);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      topic: 'Geometry',
      subtopic: 'lines and angles',
      maxRepeats: 3,
      distinctQuestions: 2,
      repeatedQuestionCount: 1,
      sampleQuestion: 'What is an exact location with no size?',
      severity: 'medium',
    });
  });

  test('does not flag when every question stays below the threshold', () => {
    const records = [
      rec('Q1', 'a'), rec('Q1', 'a'), // 2 < 3
      rec('Q2', 'b'),
    ];
    expect(analyzeRepeatPressure(records, { repeatThreshold: 3 }).flags).toHaveLength(0);
  });

  test('marks severity high when repeats reach twice the threshold', () => {
    const records = Array.from({ length: 6 }, () => rec('Same Q', 'x'));
    const { flags } = analyzeRepeatPressure(records, { repeatThreshold: 3 });
    expect(flags[0].severity).toBe('high');
    expect(flags[0].maxRepeats).toBe(6);
  });

  test('separates counts by topic/subtopic and by correct answer', () => {
    const records = [
      rec('Read the clock', '3:15', 'Measurement & Data', 'time'),
      rec('Read the clock', '3:15', 'Measurement & Data', 'time'),
      rec('Read the clock', '9:45', 'Measurement & Data', 'time'), // same text, different answer → distinct
      rec('Read the clock', '3:15', 'Geometry', 'time'), // different topic → separate group
    ];
    const { flags } = analyzeRepeatPressure(records, { repeatThreshold: 2 });
    const mdTime = flags.find((f) => f.topic === 'Measurement & Data');
    expect(mdTime.distinctQuestions).toBe(2); // 3:15 and 9:45
    expect(mdTime.maxRepeats).toBe(2); // 3:15 appeared twice in this group
  });

  test('treats a repeatThreshold below 2 as 2 (a single answer is never a repeat)', () => {
    const records = [rec('Q', 'a')];
    expect(analyzeRepeatPressure(records, { repeatThreshold: 1 }).flags).toHaveLength(0);
  });

  test('ignores records without question text and handles empty input', () => {
    expect(analyzeRepeatPressure([], {}).flags).toHaveLength(0);
    expect(analyzeRepeatPressure([{ topic: 'X' }, null], {}).totalAnswers).toBe(0);
  });

  test('signatureOf combines text and answer', () => {
    expect(signatureOf({ question: 'q', correctAnswer: 'a' })).toBe('q|||a');
    expect(signatureOf({})).toBe('|||');
  });
});
