import {
  getAllowedSubtopicsForTopic,
  isSubtopicAllowed,
  normalizeAllowedSubtopics,
  normalizeAllowedSubtopicsByTopic,
  normalizeSubtopicValue,
} from '../subtopicUtils';

describe('subtopicUtils', () => {
  test('normalizes Firestore REST arrayValue focus data', () => {
    const allowed = {
      arrayValue: {
        values: [
          { stringValue: 'comparison' },
          { stringValue: 'division' },
          { stringValue: 'multiplication' },
          { stringValue: 'subtraction' },
          { stringValue: 'addition' },
        ],
      },
    };

    expect(normalizeAllowedSubtopics(allowed)).toEqual([
      'comparison',
      'division',
      'multiplication',
      'subtraction',
      'addition',
    ]);
  });

  test('matches Firestore REST focus data against uploaded question subtopics', () => {
    const allowedSubtopicsByTopic = {
      'Base Ten': {
        arrayValue: {
          values: [
            { stringValue: 'comparison' },
            { stringValue: 'division' },
            { stringValue: 'multiplication' },
            { stringValue: 'subtraction' },
            { stringValue: 'addition' },
          ],
        },
      },
    };

    expect(isSubtopicAllowed({ subtopic: 'addition' }, 'Base Ten', allowedSubtopicsByTopic)).toBe(true);
    expect(isSubtopicAllowed({ subtopic: 'subtraction' }, 'Base Ten', allowedSubtopicsByTopic)).toBe(true);
    expect(isSubtopicAllowed({ subtopic: 'division' }, 'Base Ten', allowedSubtopicsByTopic)).toBe(true);
    expect(isSubtopicAllowed({ subtopic: 'place value' }, 'Base Ten', allowedSubtopicsByTopic)).toBe(false);
  });

  test('matches full Firestore REST mapValue focus data', () => {
    const allowedSubtopicsByTopic = {
      mapValue: {
        fields: {
          'Base Ten': {
            arrayValue: {
              values: [
                { stringValue: 'comparison' },
                { stringValue: 'division' },
                { stringValue: 'multiplication' },
                { stringValue: 'subtraction' },
                { stringValue: 'addition' },
              ],
            },
          },
        },
      },
    };

    expect(Object.keys(normalizeAllowedSubtopicsByTopic(allowedSubtopicsByTopic))).toEqual(['Base Ten']);
    expect(getAllowedSubtopicsForTopic(allowedSubtopicsByTopic, 'Base Ten')).toEqual([
      'comparison',
      'division',
      'multiplication',
      'subtraction',
      'addition',
    ]);
    expect(isSubtopicAllowed({ subtopic: { stringValue: 'multiplication' } }, 'Base Ten', allowedSubtopicsByTopic)).toBe(true);
    expect(isSubtopicAllowed({ fields: { subtopic: { stringValue: 'division' } } }, 'Base Ten', allowedSubtopicsByTopic)).toBe(true);
    expect(isSubtopicAllowed({ fields: { subtopic: { stringValue: 'rounding' } } }, 'Base Ten', allowedSubtopicsByTopic)).toBe(false);
  });

  test('removes copied terminal wrapping artifacts from subtopic comparisons', () => {
    expect(normalizeSubtopicValue('sub │\n│ traction')).toBe('subtraction');
  });
});
