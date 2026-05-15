import { ANGLE_TYPES, generateAngleMeasurementQuestion, refreshAngleAdditionDiagram } from '../questions.js';

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
    let realLifeCount = 0;
    let nonRealLifeCount = 0;

    for (let i = 0; i < 300; i++) {
      const q = generateAngleMeasurementQuestion();
      const isRealLife = q.question.startsWith('Which real-life example shows an');

      if (isRealLife) {
        realLifeCount++;
        expect(q.optionImages).toBeDefined();
        expect(typeof q.optionImages).toBe('object');
        // Every option should have an image path
        q.options.forEach(opt => {
          expect(q.optionImages[opt]).toBeDefined();
          expect(q.optionImages[opt]).toMatch(/^\/images\/angles\/.+\.jpg$/);
        });
      } else {
        nonRealLifeCount++;
        expect(q.optionImages).toBeUndefined();
      }
    }

    expect(realLifeCount).toBeGreaterThan(0);
    expect(nonRealLifeCount).toBeGreaterThan(0);
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

      if (question.question.includes('what is angle CBA?')) {
        expect(answerValue).toBe(values.CBD + values.DBA);
      } else if (question.question.includes('what is angle CBD?')) {
        expect(answerValue).toBe(values.CBA - values.DBA);
      } else if (question.question.includes('what is angle DBA?')) {
        expect(answerValue).toBe(values.CBA - values.CBD);
      } else {
        throw new Error(`Unexpected angle addition question: ${question.question}`);
      }
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
