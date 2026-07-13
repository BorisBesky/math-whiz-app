import fs from 'fs';
import path from 'path';

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G4 base-ten Explanation: covers every declared subtopic', () => {
  it('teaches multi-digit comparison', () => {
    expect(explanationSrc).toMatch(/Comparing Multi-Digit Numbers/i);
  });

  it('teaches multi-digit addition and subtraction', () => {
    expect(explanationSrc).toMatch(/Adding\s*(&amp;|and)\s*Subtracting/i);
  });

  it('teaches multi-step word problems', () => {
    expect(explanationSrc).toMatch(/Multi-Step Word Problems/i);
  });
});
