import {
  ANGLE_TYPES,
  generateAngleMeasurementQuestion,
  generatePointsLinesRaysQuestion,
  refreshAngleAdditionDiagram,
} from '../questions.js';

describe('geometry angle real-life examples', () => {
  it('has at least 8 real-life examples for every angle type', () => {
    ANGLE_TYPES.forEach((angleType) => {
      expect(Array.isArray(angleType.realLifeExamples)).toBe(true);
      expect(angleType.realLifeExamples.length).toBeGreaterThanOrEqual(8);
    });
  });

  it('uses unique real-life examples within each angle type', () => {
    ANGLE_TYPES.forEach((angleType) => {
      const uniqueExamples = new Set(angleType.realLifeExamples);
      expect(uniqueExamples.size).toBe(angleType.realLifeExamples.length);
    });
  });

  it('generates valid real-life angle questions with unique options', () => {
    const realLifeQuestionPrefix = 'Which real-life example shows an ';
    let realLifeQuestionCount = 0;

    for (let index = 0; index < 400; index += 1) {
      const question = generateAngleMeasurementQuestion();

      if (!question.question.startsWith(realLifeQuestionPrefix)) {
        continue;
      }

      realLifeQuestionCount += 1;

      const matchedAngleType = ANGLE_TYPES.find((angleType) =>
        question.question.includes(angleType.name)
      );

      expect(matchedAngleType).toBeDefined();
      expect(matchedAngleType.realLifeExamples).toContain(question.correctAnswer);
      expect(question.options).toContain(question.correctAnswer);

      const uniqueOptions = new Set(question.options);
      expect(uniqueOptions.size).toBe(question.options.length);
      expect(question.options.length).toBe(4);
    }

    expect(realLifeQuestionCount).toBeGreaterThan(0);
  });

  it('includes optionImages for real-life questions only', () => {
    const realLifePrefix = 'Which real-life example shows an';
    const questions = Array.from({ length: 300 }, () => generateAngleMeasurementQuestion());
    const realLifeQuestions = questions.filter((q) => q.question.startsWith(realLifePrefix));
    const nonRealLifeQuestions = questions.filter((q) => !q.question.startsWith(realLifePrefix));

    expect(realLifeQuestions.length).toBeGreaterThan(0);
    expect(nonRealLifeQuestions.length).toBeGreaterThan(0);

    realLifeQuestions.forEach((q) => {
      expect(q.optionImages).toBeDefined();
      expect(typeof q.optionImages).toBe('object');
      q.options.forEach((opt) => {
        expect(q.optionImages[opt]).toBeDefined();
        expect(q.optionImages[opt]).toMatch(/^\/images\/angles\/.+\.jpg$/);
      });
    });

    nonRealLifeQuestions.forEach((q) => {
      expect(q.optionImages).toBeUndefined();
    });
  });

  it('generates angle addition questions with consistent missing-angle answers', () => {
    const additionQuestionPrefix = 'Rays BC, BD, and BA all start at point B.';
    let additionQuestionCount = 0;

    for (let index = 0; index < 500; index += 1) {
      const question = generateAngleMeasurementQuestion();

      if (!question.question.startsWith(additionQuestionPrefix)) {
        continue;
      }

      additionQuestionCount += 1;

      const matches = [...question.question.matchAll(/angle\s([A-Z]{3})\s=\s(\d+)°/g)];
      const values = Object.fromEntries(
        matches.map(([, angleName, value]) => [angleName, Number(value)])
      );
      const answerValue = Number.parseInt(question.correctAnswer, 10);

      expect(question.options).toContain(question.correctAnswer);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options.length).toBe(4);
      expect(question.hint).toContain('angle CBA = angle CBD + angle DBA');
      expect(question.images).toBeDefined();
      expect(Array.isArray(question.images)).toBe(true);
      expect(question.images).toHaveLength(1);
      expect(question.images[0].type).toBe('question');
      expect(question.images[0].description).toContain('highlighted in red');
      expect(question.images[0].data).toContain('data:image/svg+xml;base64,');

      const expectedAnswerByPrompt = [
        { prompt: 'what is angle CBA?', expected: values.CBD + values.DBA },
        { prompt: 'what is angle CBD?', expected: values.CBA - values.DBA },
        { prompt: 'what is angle DBA?', expected: values.CBA - values.CBD },
      ];
      const matched = expectedAnswerByPrompt.find(({ prompt }) => question.question.includes(prompt));
      expect(matched).toBeDefined();
      expect(answerValue).toBe(matched.expected);
    }

    expect(additionQuestionCount).toBeGreaterThan(0);
  });

  it('refreshes stale angle addition diagrams from question text', () => {
    const staleQuestion = {
      question: 'Rays BC, BD, and BA all start at point B. Ray BD is inside angle CBA. If angle CBD = 85° and angle DBA = 69°, what is angle CBA?',
      images: [
        {
          type: 'question',
          data: 'data:image/svg+xml;base64,stale',
          description: 'Known angles are labeled. The missing angle is shown in red.',
        },
      ],
    };

    const refreshedQuestion = refreshAngleAdditionDiagram(staleQuestion);

    expect(refreshedQuestion.images).toHaveLength(1);
    expect(refreshedQuestion.images[0].data).toContain('data:image/svg+xml;base64,');
    expect(refreshedQuestion.images[0].data).not.toBe(staleQuestion.images[0].data);
    expect(refreshedQuestion.images[0].description).toBe(
      'Angle diagram with labeled points and the missing angle highlighted in red'
    );
  });
});

describe('points / lines / rays questions', () => {
  const runMany = (n) => Array.from({ length: n }, () => generatePointsLinesRaysQuestion(0.5));

  it('always produces a valid question whose correct answer is among unique options', () => {
    runMany(300).forEach((q) => {
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.subtopic).toBe('points lines rays');
      expect(q.options).toContain(q.correctAnswer);
      // No duplicate options.
      expect(new Set(q.options).size).toBe(q.options.length);
      // Multiple-choice forms have 4 options; true/false forms have 2.
      expect([2, 4]).toContain(q.options.length);
    });
  });

  it('produces substantially more variety than the original 12 combinations', () => {
    const distinct = new Set(runMany(500).map((q) => `${q.question}|||${q.correctAnswer}`));
    expect(distinct.size).toBeGreaterThan(20);
  });

  it('never asks how many endpoints a point has', () => {
    const endpointQuestions = runMany(400).filter((q) => /How many endpoints/.test(q.question));
    expect(endpointQuestions.length).toBeGreaterThan(0); // the form does occur
    endpointQuestions.forEach((q) => expect(q.question).not.toMatch(/does a point have/));
  });
});
