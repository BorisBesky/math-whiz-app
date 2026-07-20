import fs from 'fs';
import path from 'path';

// The G4 fractions addition/subtraction generators (see
// `generateFractionAdditionQuestion` / `generateFractionSubtractionQuestion`
// in ../questions.js) can pick TWO different denominators — so students
// receive unlike-denominator problems. The Explanation used to only teach
// the like-denominator case, which mismatched what the quiz was asking.
// These tests lock in the "unlike denominators" section so students always
// have somewhere to read the strategy when they tap "Explain".

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G4 fractions Explanation: covers add/subtract with UNLIKE denominators', () => {
  it('has an explicit unlike-denominators section (heading)', () => {
    expect(explanationSrc).toMatch(/Unlike Denominators/i);
  });

  it('teaches the "find a common denominator, then add" strategy', () => {
    expect(explanationSrc).toMatch(/common denominator/i);
  });

  it('warns against the "add straight across" misconception', () => {
    // The section calls out "NOT ²⁄₅" — the most common wrong-answer trap for
    // 1/2 + 1/3. Match Unicode super/subscripts as well as plain 2 and 5.
    expect(explanationSrc).toMatch(/\bNOT\b/);
    expect(explanationSrc).toMatch(/[²2][/⁄][₅5]/);
  });

  it('shows at least one worked unlike-denominators addition example', () => {
    // Existence of a rewrite step with twelfths — either "/12", "⁄12", or the
    // subscript form "⁄₁₂" that the Explanation uses.
    expect(explanationSrc).toMatch(/[/⁄](12|₁₂)/);
  });
});
