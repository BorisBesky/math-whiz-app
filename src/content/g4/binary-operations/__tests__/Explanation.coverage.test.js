import fs from 'fs';
import path from 'path';

// The Explanation modal renders the whole topic explanation, so every subtopic
// that the question bank can hand out needs a matching section a student can
// scroll to. The manifest declares "comparing binary numbers" and the generator
// (`generateBinaryComparisonQuestion`) emits it — but the Explanation shipped
// without any comparing-binary content, so a student who tapped "Explain" on
// a comparison question got no help. Lock in the section so it doesn't
// regress.

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G4 binary-operations Explanation: covers the "comparing binary numbers" subtopic', () => {
  it('has a dedicated comparing-binary section (heading)', () => {
    expect(explanationSrc).toMatch(/Comparing Binary Numbers/i);
  });

  it('teaches the "convert to decimal first" strategy', () => {
    // Should tell students they can convert both numbers to decimal and compare.
    expect(explanationSrc).toMatch(/convert.*decimal|decimal.*first/i);
  });

  it('teaches the "compare place-by-place from the left" strategy', () => {
    // The other standard approach.
    expect(explanationSrc).toMatch(/place[- ]by[- ]place|from the (left|biggest)/i);
  });

  it('warns that a longer binary number is not automatically visually larger', () => {
    // The "100 > 11" gotcha — extra places mean bigger place values.
    expect(explanationSrc).toMatch(/longer.*bigger|extra places/i);
  });
});
