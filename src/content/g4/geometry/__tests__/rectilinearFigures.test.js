// Verifies generateRectilinearFigureQuestion against the figure a student
// actually sees: every answer is recomputed from the polygon drawn in the SVG
// (not from the generator's own bookkeeping), and every unlabeled side must be
// deducible from the labels that are shown.
import { generateQuestion, generateRectilinearFigureQuestion } from '../questions.js';
import { solveSideLengths } from '../../../../utils/rectilinearShapes.js';

const decodeSvg = (dataUri) => Buffer.from(dataUri.split(',')[1], 'base64').toString('utf8');

// Rebuild the outline from the SVG polygon and the clockwise label list in
// the image description (both follow the same side order).
const readFigure = (q) => {
  const svg = decodeSvg(q.images[0].data);
  const points = svg
    .match(/<polygon points="([^"]+)"/)[1]
    .split(' ')
    .map((pair) => pair.split(',').map(Number));
  const edges = points.map(([x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    const dir = x2 > x1 ? 'R' : x2 < x1 ? 'L' : y2 > y1 ? 'D' : 'U';
    return { dir, px: Math.abs(x2 - x1) + Math.abs(y2 - y1) };
  });
  const labels = q.images[0].description
    .match(/clockwise from the top left: (.+)\.$/)[1]
    .split(', ');
  expect(labels).toHaveLength(edges.length);

  const firstLabeled = labels.findIndex((l) => /^\d+ /.test(l));
  const cellPx = edges[firstLabeled].px / parseInt(labels[firstLabeled], 10);
  const lengths = edges.map((e) => e.px / cellPx);
  const twiceArea = points.reduce((acc, [x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    return acc + (x1 * y2 - x2 * y1);
  }, 0);
  return { svg, edges, labels, lengths, area: Math.abs(twiceArea) / 2 / cellPx ** 2 };
};

const draw = (count = 600) => Array.from(
  { length: count },
  (_, i) => generateRectilinearFigureQuestion([0.5, 0.65, 0.8, 0.95][i % 4])
);

describe('generateRectilinearFigureQuestion', () => {
  test('answers match the drawn figure and every hidden side is deducible', () => {
    const kinds = { area: 0, perimeter: 0, missing: 0 };
    for (const q of draw()) {
      const { edges, labels, lengths, area } = readFigure(q);
      const isShown = (label) => /^\d+ /.test(label);

      // Every shown label matches the drawn side it sits on.
      const shown = labels.map((label, i) => [label, i]).filter(([label]) => isShown(label));
      expect(shown.map(([label]) => parseInt(label, 10))).toEqual(shown.map(([, i]) => lengths[i]));

      // What the student can see must pin down every side.
      const known = labels.map((label, i) => (isShown(label) ? lengths[i] : null));
      expect(solveSideLengths(edges.map((e) => ({ dir: e.dir })), known)).toEqual(lengths);

      const kind = /What is the area/.test(q.question) ? 'area'
        : /What is the perimeter/.test(q.question) ? 'perimeter'
          : /side marked "\?"/.test(q.question) ? 'missing'
            : 'unrecognized';
      expect(kind).not.toBe('unrecognized');
      kinds[kind] += 1;

      const expected = {
        area,
        perimeter: lengths.reduce((a, b) => a + b, 0),
        missing: lengths[labels.indexOf('the side marked ?')],
      }[kind];
      expect(parseInt(q.correctAnswer, 10)).toBe(expected);
      expect(labels.filter((l) => l === 'the side marked ?')).toHaveLength(kind === 'missing' ? 1 : 0);
      expect(q.correctAnswer).toMatch(
        kind === 'area'
          ? /^\d+ square (centimeters|meters|feet|inches)$/
          : /^\d+ (centimeters?|meters?|feet|foot|inch(es)?)$/
      );

      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
      expect(q.subtopic).toBe('composite shapes');
    }
    expect(kinds.area).toBeGreaterThan(0);
    expect(kinds.perimeter).toBeGreaterThan(0);
    expect(kinds.missing).toBeGreaterThan(0);
  });

  test('easier draws label every side; harder draws leave sides to deduce', () => {
    const unlabeledAt = (difficulty) => Array.from({ length: 200 }, () => {
      const q = generateRectilinearFigureQuestion(difficulty);
      return (q.images[0].description.match(/unlabeled|the side marked \?/g) || []).length;
    });
    expect(Math.max(...unlabeledAt(0.5))).toBe(0);
    expect(Math.max(...unlabeledAt(0.9))).toBeGreaterThan(0);
  });

  test('the figure is an accessible SVG with the "?" side highlighted', () => {
    for (const q of draw(200)) {
      const { svg } = readFigure(q);
      expect(svg).toMatch(/role="img"/);
      expect(svg).toMatch(/<title>[^<]+<\/title>/);
      expect(svg.includes('fill="#dc2626">?</text>')).toBe(/side marked "\?"/.test(q.question));
    }
  });

  test('is reachable through the "composite shapes" subtopic', () => {
    const questions = Array.from({ length: 200 }, () => generateQuestion(0.8, ['composite shapes']));
    expect(questions.some((q) => /made of rectangles/.test(q.question))).toBe(true);
    expect(questions.some((q) => /shows the length of every side in units/.test(q.question))).toBe(true);
  });
});
