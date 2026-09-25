import fs from 'fs';
import path from 'path';

// The Explanation modal renders the whole topic explanation, so every subtopic
// students may hit via a generated question needs a matching section they can
// scroll to. These tests lock in that coverage; if a subtopic is added to the
// question bank without a matching Explanation section, the student would open
// "Explain" and see no help — the tests will fail here so the gap is caught.

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G4 geometry Explanation: covers the "find missing side" subtopic', () => {
  it('has a dedicated missing-side section (heading)', () => {
    expect(explanationSrc).toMatch(/Finding a Missing Side/);
  });

  it('teaches how to solve when the SQUARE\'s perimeter is given', () => {
    // Must show that side = perimeter ÷ 4.
    expect(explanationSrc).toMatch(/perimeter\s*÷\s*4|÷\s*4/i);
    expect(explanationSrc).toMatch(/4\s*×\s*side/i);
  });

  it('teaches how to solve when the SQUARE\'s area is given', () => {
    // Must show that side × side = area (perfect-square strategy).
    expect(explanationSrc).toMatch(/side\s*×\s*side/i);
    // At least one worked perfect square (e.g. 7 × 7 = 49).
    expect(explanationSrc).toMatch(/\b\d+\s*×\s*\d+\s*=\s*\d+\b/);
  });

  it('teaches how to solve when a RECTANGLE\'s area and one side are given', () => {
    // Must show width = area ÷ known side.
    expect(explanationSrc).toMatch(/area\s*÷\s*length|width\s*=\s*area\s*÷/i);
  });

  it('teaches how to solve when a RECTANGLE\'s perimeter and one side are given', () => {
    // Must show length + width = perimeter ÷ 2, then subtract.
    expect(explanationSrc).toMatch(/perimeter\s*÷\s*2/i);
    expect(explanationSrc).toMatch(/length\s*\+\s*width/i);
  });
});

describe('G4 geometry Explanation: composite shapes with unlabeled sides', () => {
  // generateRectilinearFigureQuestion leaves sides blank or marks one "?";
  // the Explanation must teach how to recover them before area/perimeter.
  it('has a worked example for finding sides that are not labeled', () => {
    expect(explanationSrc).toMatch(/Finding Sides That Aren't Labeled/);
    expect(explanationSrc).toMatch(/Opposite sides add up/);
    expect(explanationSrc).toMatch(/9 − 5 = <strong>4 cm/);
    expect(explanationSrc).toMatch(/9 × 7 − 4 × 3 = 63 − 12 = <strong>51 square cm/);
  });

  it('warns against adding only the labeled sides for perimeter', () => {
    expect(explanationSrc).toMatch(/adding only the labeled numbers/);
  });
});
