import fs from 'fs';
import path from 'path';
import {
  ANGLE_TYPES,
  generateAngleMeasurementQuestion,
  generateLineSymmetryQuestion,
  generateLinesAndAnglesQuestion,
  generatePointsLinesRaysQuestion,
  generateShapeClassificationQuestion,
  generateQuadrilateralPropertiesQuestion,
  generateTriangleClassificationBySidesQuestion,
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

  it('always produces a valid 4-option question whose correct answer is among unique options', () => {
    runMany(500).forEach((q) => {
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.subtopic).toBe('points lines rays');
      expect(q.options).toContain(q.correctAnswer);
      // No duplicate options.
      expect(new Set(q.options).size).toBe(q.options.length);
      // Every form ships as a 4-option MC. The previous "True or False:
      // <statement>." form shipped 2 options — a coin flip inside a UI
      // designed around a four-way pick — and this assertion guards against
      // any future builder shipping fewer than 4 again.
      expect(q.options.length).toBe(4);
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

  it('labels the notation "which is true/false" statements consistently with the endpoint bank', () => {
    // Regression: the earlier builder shipped "True or False: <statement>."
    // with only two options, so a student saw a 50 % coin flip inside the
    // 4-option UI. It also mislabelled "A point has no endpoints." as False
    // even though a point has 0 endpoints. The new 4-option "Which
    // statement is TRUE / FALSE?" form must never place a mathematically
    // true statement in a slot the question requires to be false, or vice
    // versa. We derive truth from the endpoint bank so a future edit of
    // the notation list is checked against the same source of truth.
    const TRUE_STATEMENTS = new Set([
      'A point is shown as a single dot.',
      'A point has no endpoints.',
      'A line has no endpoints.',
      'A ray has exactly one endpoint.',
      'A line segment has two endpoints.',
    ]);
    let trueFormsSeen = 0;
    let falseFormsSeen = 0;
    const mislabelled = [];
    for (let i = 0; i < 1500; i += 1) {
      const q = generatePointsLinesRaysQuestion(0.5);
      const trueForm = q.question === 'Which statement is TRUE?';
      const falseForm = q.question === 'Which statement is FALSE?';
      if (!trueForm && !falseForm) continue;
      if (trueForm) trueFormsSeen += 1;
      else falseFormsSeen += 1;
      // The correct answer must match the question's requested truth.
      const answerIsTrue = TRUE_STATEMENTS.has(q.correctAnswer);
      if (trueForm && !answerIsTrue) mislabelled.push(`TRUE-form correct is FALSE: ${q.correctAnswer}`);
      if (falseForm && answerIsTrue) mislabelled.push(`FALSE-form correct is TRUE: ${q.correctAnswer}`);
      // Every distractor must carry the OPPOSITE truth from the correct
      // answer's — otherwise a distractor is also a valid answer and the
      // student is marked wrong for picking it.
      for (const option of q.options) {
        if (option === q.correctAnswer) continue;
        const optionIsTrue = TRUE_STATEMENTS.has(option);
        if (trueForm && optionIsTrue) mislabelled.push(`TRUE-form distractor is TRUE: ${option}`);
        if (falseForm && !optionIsTrue) mislabelled.push(`FALSE-form distractor is FALSE: ${option}`);
      }
    }
    expect(mislabelled).toEqual([]);
    expect(trueFormsSeen).toBeGreaterThan(0);
    expect(falseFormsSeen).toBeGreaterThan(0);
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
      // The parallelogram target excludes 3 of the 4 named shape distractors
      // (square, rectangle, rhombus), leaving only "triangle" in-hierarchy.
      // The generator must pad with named shapes outside the parallelogram
      // hierarchy (kite / pentagon / hexagon / circle) so the shipped MC is
      // always 4-option — never a 2-option coin flip.
      expect(q.options.length).toBe(4);
    }
  });

  it('never teaches exclusive definitions that contradict the inclusive shape hierarchy', () => {
    // Explanation.js in this topic (and G5 hierarchy) teaches: every square
    // is a rectangle, a rhombus, and a parallelogram. A question stating
    // "rectangle has adjacent sides of different lengths" or "rhombus has
    // no right angles" would directly deny that hierarchy and confuse the
    // same student who read the Explanation. The specific exclusive phrasings
    // we regressed away from must never come back.
    const exclusivePhrases = [
      // Historic rectangle wording that excluded squares.
      /adjacent sides of different lengths/i,
      // Historic rhombus / parallelogram wording that excluded squares.
      /and no right angles/i,
    ];
    for (let i = 0; i < 500; i += 1) {
      const q = generateShapeClassificationQuestion();
      exclusivePhrases.forEach((pattern) => {
        expect(q.question).not.toMatch(pattern);
      });
    }
  });
});

describe('triangle classification by sides: no hierarchy-driven ambiguity', () => {
  // Under the inclusive definition an equilateral triangle also has "two
  // sides equal" — it has three. A prompt worded "What type of triangle has
  // 2 sides equal?" therefore has TWO defensible answers (isosceles and
  // equilateral), and a student picking equilateral would be marked wrong on
  // a mathematically-correct choice. The isosceles prompt must always carry
  // the "exactly" qualifier.
  it('never asks "What type of triangle has 2 sides equal?" without an "exactly" qualifier', () => {
    let isoscelesSeen = 0;
    for (let i = 0; i < 500; i += 1) {
      const q = generateTriangleClassificationBySidesQuestion();
      if (q.correctAnswer !== 'isosceles') continue;
      isoscelesSeen += 1;
      expect(q.question).toMatch(/exactly/i);
      // Belt-and-suspenders: forbid the exact pre-fix wording verbatim.
      expect(q.question).not.toBe('What type of triangle has 2 sides equal?');
    }
    expect(isoscelesSeen).toBeGreaterThan(0);
  });

  it('always produces a valid question with the correct answer among unique options', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateTriangleClassificationBySidesQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(['equilateral', 'isosceles', 'scalene']).toContain(q.correctAnswer);
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

describe('generateLinesAndAnglesQuestion subtopic scope', () => {
  // Regression: one variant used to ask for the definition of "line", "ray",
  // or "line segment" — those are basic figures that belong to the
  // "points lines rays" subtopic (generated by generatePointsLinesRaysQuestion).
  // Mixing them into "lines and angles" mistags the item so Focus mode, the
  // repeat-pressure analysis, and Question Bank filters put it in the wrong
  // bucket.
  it('always tags questions as "lines and angles"', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateLinesAndAnglesQuestion();
      expect(q.subtopic).toBe('lines and angles');
    }
  });

  it('never emits basic figure definitions that belong to "points lines rays"', () => {
    const misplaced = [];
    const misplacedAnswers = new Set(['line', 'ray', 'line segment', 'point']);
    for (let i = 0; i < 200; i += 1) {
      const q = generateLinesAndAnglesQuestion();
      if (misplacedAnswers.has(q.correctAnswer)) {
        misplaced.push(`${q.question} → ${q.correctAnswer}`);
      }
    }
    expect(misplaced).toEqual([]);
  });

  it('always includes the correct answer in its options', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateLinesAndAnglesQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe('line symmetry: no hierarchy-driven ambiguity', () => {
  // A square is a rectangle in the shape hierarchy the app teaches
  // (g5/geometry/Explanation.js, g5 hierarchy statements). If the question
  // asks "How many lines of symmetry does a rectangle have?" a student who
  // reasons "a square is a rectangle, so it can have 4" is mathematically
  // correct but would be marked wrong. Same for "isosceles triangle" — an
  // equilateral triangle is isosceles too, so it can have 3 lines instead
  // of 1. The generator must qualify these shape names.
  it('never asks about "a rectangle" or "an isosceles triangle" without a hierarchy qualifier', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateLineSymmetryQuestion();
      // Extract the shape phrase between "a " and " have?"
      const match = q.question.match(/^How many lines of symmetry does an? (.+) have\?$/);
      expect(match).not.toBeNull();
      const shape = match[1];
      // The specific ambiguous phrases must never appear on their own.
      expect(shape).not.toBe('rectangle');
      expect(shape).not.toBe('isosceles triangle');
    }
  });

  it('always includes the correct answer in options, all distinct', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateLineSymmetryQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it('emits subtopic "symmetry"', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = generateLineSymmetryQuestion();
      expect(q.subtopic).toBe('symmetry');
    }
  });
});
