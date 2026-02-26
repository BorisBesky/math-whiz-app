import { ANGLE_TYPES, generateAngleMeasurementQuestion } from '../questions.js';

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
});
