import fs from 'fs';
import path from 'path';

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G4 measurement-data Explanation: covers every declared subtopic students may hit', () => {
  it('teaches how to read an analog clock (the "clock reading" subtopic has a question generator)', () => {
    expect(explanationSrc).toMatch(/Reading an Analog Clock/i);
    // Should tell students which hand is which.
    expect(explanationSrc).toMatch(/short.*hour|hour.*short/i);
    expect(explanationSrc).toMatch(/long.*minute|minute.*long/i);
  });

  it('teaches how to read bar graphs / pictographs (the "data interpretation" subtopic)', () => {
    expect(explanationSrc).toMatch(/Bar Graphs?|Pictographs?/i);
    // A pictograph explanation needs a "key" reference.
    expect(explanationSrc).toMatch(/key/i);
  });
});
