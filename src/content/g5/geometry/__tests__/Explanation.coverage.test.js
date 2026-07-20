import fs from 'fs';
import path from 'path';

// The g5 geometry question bank includes triangle-classification questions
// (equilateral, scalene, right) alongside quadrilateral ones — but the
// Explanation shipped with only a quadrilateral section, so a student who
// tapped "Explain" on a triangle question had nothing to read. Lock in a
// triangle-classification section so it doesn't regress.

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G5 geometry Explanation: covers triangle classification', () => {
  it('has a dedicated triangle-classification section (heading)', () => {
    expect(explanationSrc).toMatch(/Classifying triangles/i);
  });

  it('names each triangle type the question bank can ask about', () => {
    // The bank in questions.js SHAPE_DEFINITIONS uses these three.
    expect(explanationSrc).toMatch(/Equilateral triangle/i);
    expect(explanationSrc).toMatch(/Scalene triangle/i);
    expect(explanationSrc).toMatch(/Right triangle/i);
  });

  it('distinguishes classification by sides vs by angles', () => {
    expect(explanationSrc).toMatch(/By sides/i);
    expect(explanationSrc).toMatch(/By angles/i);
  });
});

describe('G5 geometry Explanation: quadrilateral coverage still intact', () => {
  it('still has the naming-quadrilaterals section', () => {
    expect(explanationSrc).toMatch(/Naming quadrilaterals/i);
  });
});
