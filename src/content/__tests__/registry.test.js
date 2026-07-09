import {
  getAllGrades,
  getGrade,
  getDefaultGradeKey,
  normalizeGradeKey,
  gradeWordPattern,
  getTopicsForGrade,
  getTopicNamesForGrade,
  getTopicByName,
  getTopicContent,
  prepareQuestionForDisplay,
} from '../registry';

describe('grades', () => {
  test('getAllGrades returns enabled grades sorted by ordinal', () => {
    expect(getAllGrades().map((g) => g.key)).toEqual(['G3', 'G4']);
  });

  test('getGrade accepts key or id in either case', () => {
    expect(getGrade('G4')?.id).toBe('g4');
    expect(getGrade('g4')?.key).toBe('G4');
    expect(getGrade('nope')).toBeUndefined();
  });

  test('default grade is G3', () => {
    expect(getDefaultGradeKey()).toBe('G3');
  });

  test.each([
    ['G3', 'G3'],
    ['g4', 'G4'],
    ['3rd', 'G3'],
    ['4th Grade', 'G4'],
    ['Grade 3', 'G3'],
    [4, 'G4'],
    ['Kindergarten', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('normalizeGradeKey(%p) -> %p', (input, expected) => {
    expect(normalizeGradeKey(input)).toBe(expected);
  });

  test('gradeWordPattern matches the same grade vocabulary as the historical literal regex', () => {
    const derived = new RegExp(gradeWordPattern(), 'g');
    const historical = /\b(3rd|4th|grade\s*[34]|g[34])\b/g;
    const samples = [
      'fractions 4th',
      'measurement & data 4th',
      'grade 3 math',
      'grade4 review',
      'g4 geometry',
      'g3',
      'algebra basics', // no grade words — must survive untouched
      'binary operations',
    ];
    for (const sample of samples) {
      expect(sample.replace(derived, '')).toBe(sample.replace(historical, ''));
    }
  });
});

describe('topics', () => {
  test('topic names per grade are in student-facing order', () => {
    expect(getTopicNamesForGrade('G3')).toEqual([
      'Multiplication',
      'Division',
      'Fractions',
      'Measurement & Data',
    ]);
    expect(getTopicNamesForGrade('g4')[0]).toBe('Operations & Algebraic Thinking');
    expect(getTopicNamesForGrade('G5')).toEqual([]);
  });

  test('topic objects expose manifest metadata and lazy loaders', () => {
    const [first] = getTopicsForGrade('G3');
    expect(first.name).toBe('Multiplication');
    expect(first.ui.theme).toBe('blue');
    expect(typeof first.loadGenerateQuestion).toBe('function');
    expect(typeof first.loadExplanationComponent).toBe('function');
  });

  test('getTopicByName resolves exact names, scoped and unscoped', () => {
    expect(getTopicByName('Fractions')?.grade).toBe('G3');
    expect(getTopicByName('Fractions 4th')?.grade).toBe('G4');
    expect(getTopicByName('Fractions 4th', 'G4')?.name).toBe('Fractions 4th');
    // Scoped lookups do not cross names: G4 has no topic literally named
    // 'Fractions' (grade-word stripping is questionService's layer, not ours).
    expect(getTopicByName('Fractions', 'G4')).toBeUndefined();
    expect(getTopicByName('Nonexistent Topic')).toBeUndefined();
  });

  test('getTopicByName falls back to normalized matching', () => {
    expect(getTopicByName('measurement and data')?.name).toBe('Measurement & Data');
    expect(getTopicByName('MEASUREMENT & DATA 4TH')?.name).toBe('Measurement & Data 4th');
  });

  test('getTopicContent replaces the TOPIC_CONTENT_MAP lookup', () => {
    const geometry = getTopicContent('Geometry');
    expect(geometry?.id).toBe('geometry');
    expect(geometry?.grade).toBe('G4');
  });
});

describe('display hooks', () => {
  test('topics without hooks pass questions through untouched', async () => {
    const question = { question: 'What is 3 × 4?', correctAnswer: '12' };
    await expect(prepareQuestionForDisplay('Multiplication', question)).resolves.toBe(question);
  });

  test('geometry hook is loadable and no-ops on non-angle-addition questions', async () => {
    const question = { question: 'How many sides does a square have?', correctAnswer: '4' };
    const prepared = await prepareQuestionForDisplay('Geometry', question);
    expect(prepared).toEqual(question);
  });
});
