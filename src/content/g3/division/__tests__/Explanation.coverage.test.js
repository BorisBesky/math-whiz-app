import fs from 'fs';
import path from 'path';

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G3 division Explanation: covers every declared subtopic', () => {
  it('teaches division through arrays (the "arrays" subtopic has a question generator)', () => {
    expect(explanationSrc).toMatch(/Arrays/i);
    // An arrays explanation needs to talk about rows and columns.
    expect(explanationSrc).toMatch(/row/i);
    expect(explanationSrc).toMatch(/column|per row/i);
  });
});
