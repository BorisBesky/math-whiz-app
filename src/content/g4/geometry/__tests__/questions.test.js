import fs from 'fs';
import path from 'path';
import {
  ANGLE_TYPES,
  generateAngleMeasurementQuestion,
  generatePointsLinesRaysQuestion,
  generateShapeClassificationQuestion,
  generateQuadrilateralPropertiesQuestion,
  refreshAngleAdditionDiagram,
} from '../questions.js';

describe('geometry real-life angle question grammar', () => {
  it('uses "a right angle" / "a straight angle" and "an acute angle" / "an obtuse angle"', () => {
    const expectedArticle = { acute: 'an', obtuse: 'an', right: 'a', straight: 'a' };
    const wrongPairings = [];
    let sawAny = false;
    for (let i = 0; i < 1500; i += 1) {
      const q = generateAngleMeasurementQuestion();
      const match = q.question.match(/^Which real-life example shows (a|an) (acute|right|obtuse|straight) angle\?$/);
      if (!match) continue;
      sawAny = true;
      const [, article, name] = match;
      if (article !== expectedArticle[name]) {
        wrongPairings.push(`${article} ${name}`);
      }
    }
    expect(sawAny).toBe(true);
    expect(wrongPairings).toEqual([]);
  });
});

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
    const realLifeQuestionRegex = /^Which real-life example shows (a|an) /;
    let realLifeQuestionCount = 0;

    for (let index = 0; index < 400; index += 1) {
      const question = generateAngleMeasurementQuestion();

      if (!realLifeQuestionRegex.test(question.question)) {
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
    const realLifeRegex = /^Which real-life example shows (a|an) /;
    const questions = Array.from({ length: 300 }, () => generateAngleMeasurementQuestion());
    const realLifeQuestions = questions.filter((q) => realLifeRegex.test(q.question));
    const nonRealLifeQuestions = questions.filter((q) => !realLifeRegex.test(q.question));

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

describe('geometry angle "measure" question grammar', () => {
  it('uses "An acute/obtuse angle measures:" and "A right/straight angle measures:"', () => {
    // Old wording: "acute angle measures:" — missing an article.
    let sawAny = false;
    const wrongPairings = [];
    for (let i = 0; i < 1000; i += 1) {
      const q = generateAngleMeasurementQuestion();
      const match = q.question.match(/^(A|An) (acute|right|obtuse|straight) angle measures:$/);
      if (!match) continue;
      sawAny = true;
      const [, article, name] = match;
      const expected = /^[aeiou]/i.test(name) ? 'An' : 'A';
      if (article !== expected) {
        wrongPairings.push(`${article} ${name}`);
      }
    }
    expect(sawAny).toBe(true);
    expect(wrongPairings).toEqual([]);
    // Explicitly guard against the pre-fix wording.
    for (let i = 0; i < 500; i += 1) {
      const q = generateAngleMeasurementQuestion();
      expect(q.question).not.toMatch(/^(acute|right|obtuse|straight) angle measures:$/);
    }
  });
});

describe('geometry shape classification: no hierarchy-driven ambiguity', () => {
  it('never puts a subclass shape into the distractor pool (e.g., "square" when the answer is "rectangle")', () => {
    // Rectangle description "opposite sides equal ... 4 right angles" is
    // also satisfied by a square; rhombus description "4 equal sides" is
    // also satisfied by a square; parallelogram description is satisfied by
    // all three. Those must not appear as distractors.
    const forbiddenBySubject = {
      rectangle: ['square'],
      rhombus: ['square'],
      parallelogram: ['square', 'rectangle', 'rhombus'],
    };
    for (let i = 0; i < 500; i += 1) {
      const q = generateShapeClassificationQuestion();
      const forbidden = forbiddenBySubject[q.correctAnswer] || [];
      forbidden.forEach((name) => {
        expect(q.options).not.toContain(name);
      });
      // Sanity: correct answer is in options; options are distinct.
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe('geometry quadrilateral properties: hierarchy-driven multiple correct answers are removed', () => {
  it('never puts a subclass shape into the distractor pool for parallelogram / rectangle / rhombus', () => {
    // The parallelogram property list is satisfied by squares, rectangles,
    // and rhombuses. The rectangle and rhombus property lists are satisfied
    // by squares. None of those subclass names should ever appear as
    // distractors for their superclass question.
    const forbiddenBySubject = {
      rectangle: ['square'],
      rhombus: ['square'],
      parallelogram: ['square', 'rectangle', 'rhombus'],
    };
    for (let i = 0; i < 500; i += 1) {
      const q = generateQuadrilateralPropertiesQuestion();
      const forbidden = forbiddenBySubject[q.correctAnswer] || [];
      forbidden.forEach((name) => {
        expect(q.options).not.toContain(name);
      });
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it('always ships four options even for parallelogram (the smallest in-hierarchy distractor pool)', () => {
    // Only "trapezoid" survives the hierarchy filter for target=parallelogram
    // — the generator must pad with fallback distractors to reach four.
    let parallelogramSeen = 0;
    for (let i = 0; i < 500; i += 1) {
      const q = generateQuadrilateralPropertiesQuestion();
      if (q.correctAnswer === 'parallelogram') parallelogramSeen += 1;
      expect(q.options.length).toBe(4);
    }
    expect(parallelogramSeen).toBeGreaterThan(0);
  });
});

describe('geometry shapes.js: the "obtuse" classified triangle actually has an obtuse angle', () => {
  const shapesSrc = fs.readFileSync(
    path.join(__dirname, '..', 'shapes.js'),
    'utf8'
  );

  it('renders a triangle whose largest interior angle is > 90°', () => {
    // Extract the `points` string emitted by the obtuse branch. It follows
    // the template `${centerX + dx1},${centerY + dy1} …` — parse the six
    // offsets and compute interior angles at each vertex.
    const obtuseBlock = shapesSrc.match(
      /case\s+"obtuse"[^]*?points\s*=\s*`([^`]+)`/
    );
    expect(obtuseBlock).not.toBeNull();
    // Collapse the template's internal whitespace so multi-line
    // `${centerY + 30}` fragments (which the file breaks across lines) still
    // parse as a single offset.
    const template = obtuseBlock[1].replace(/\s+/g, ' ');
    // ${centerX + N} / ${centerX - N} / ${centerX} — extract signed offsets.
    const offsetPattern = /\$\{ *centerX(?: *([+-]) *(\d+))? *\}, *\$\{ *centerY(?: *([+-]) *(\d+))? *\}/g;
    const vertices = [];
    let match;
    while ((match = offsetPattern.exec(template)) !== null) {
      const dx = match[2] ? (match[1] === '-' ? -Number(match[2]) : Number(match[2])) : 0;
      const dy = match[4] ? (match[3] === '-' ? -Number(match[4]) : Number(match[4])) : 0;
      vertices.push([dx, dy]);
    }
    expect(vertices.length).toBe(3);
    const dist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
    const [A, B, C] = vertices;
    const a = dist(B, C);
    const b = dist(A, C);
    const c = dist(A, B);
    const deg = (cos) => (Math.acos(cos) * 180) / Math.PI;
    const angA = deg((b * b + c * c - a * a) / (2 * b * c));
    const angB = deg((a * a + c * c - b * b) / (2 * a * c));
    const angC = deg((a * a + b * b - c * c) / (2 * a * b));
    const maxAngle = Math.max(angA, angB, angC);
    expect(maxAngle).toBeGreaterThan(90);
  });
});
