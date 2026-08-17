import fs from 'fs';
import path from 'path';

// We can't easily render the Explanation component in jsdom without firing all
// its lifecycle code, so verify the source text directly for two known
// regressions: the angle real-life examples must agree with the question
// generator's classification, and the regular hexagon must list 6 (not 12)
// lines of symmetry.

const EXPLANATION_PATH = path.join(__dirname, '..', 'Explanation.js');
const QUESTIONS_PATH = path.join(__dirname, '..', 'questions.js');

const explanationSrc = fs.readFileSync(EXPLANATION_PATH, 'utf8');
const questionsSrc = fs.readFileSync(QUESTIONS_PATH, 'utf8');

describe('G4 geometry Explanation: agrees with the question generator on angle examples', () => {
  it('Explanation labels "open scissors" as an acute angle (matches the question bank)', () => {
    // The questions generator places "open scissors" in the acute realLifeExamples list.
    expect(questionsSrc).toMatch(/acute[^]*?"open scissors"/);
    // The Explanation page must agree.
    expect(explanationSrc).toMatch(/Open scissors\s*=\s*acute angle/);
    expect(explanationSrc).not.toMatch(/Open scissors\s*=\s*obtuse angle/);
  });

  it('Explanation labels "laptop half-open" as an obtuse angle (matches the question bank)', () => {
    expect(questionsSrc).toMatch(/obtuse[^]*?"laptop half-open"/);
    expect(explanationSrc).toMatch(/Laptop half-open\s*=\s*obtuse angle/);
    expect(explanationSrc).not.toMatch(/Laptop half-open\s*=\s*acute angle/);
  });
});

describe('G4 geometry Explanation: regular polygon symmetry counts', () => {
  it('says a regular hexagon has 6 (not 12) lines of symmetry', () => {
    // The D6 dihedral group has 12 symmetries (6 rotations + 6 reflections),
    // but only the 6 reflections count as lines of symmetry. Grab the popup
    // definition block (the object literal under shapeProperties), not the
    // earlier id reference where the shape SVG is constructed.
    const hexPopup = explanationSrc.match(
      /'hexagon-demo':\s*\{[\s\S]{0,500}?funFact[\s\S]{0,200}?\}/
    );
    expect(hexPopup).not.toBeNull();
    expect(hexPopup[0]).toMatch(/6 lines of symmetry/);
    expect(hexPopup[0]).not.toMatch(/12 lines of symmetry/);
  });
});

describe('G4 geometry Explanation: parallelogram does not falsely exclude right angles', () => {
  it('does not claim a parallelogram has "No right angles" (a rectangle is a parallelogram)', () => {
    expect(explanationSrc).not.toMatch(/Parallelogram[\s\S]{0,400}No right angles/);
  });
});

describe('G4 geometry Explanation: pentagon/hexagon gallery cards qualify "regular"', () => {
  // The gallery cards for these shapes list properties that only hold for the
  // regular variant ("5 equal sides", "sum of angles = 720°" for a hexagon —
  // the sum is 720° for any hexagon but the *equal* sides/angles are
  // regular-only). The card headers must say "Regular Pentagon" / "Regular
  // Hexagon" so the properties match the pictured shape. The popup detail-view
  // (`'pentagon-demo'` / `'hexagon-demo'` objects) already qualifies them.
  it('gallery card headers say "Regular Pentagon" and "Regular Hexagon"', () => {
    const pentagonCard = explanationSrc.match(
      /<strong>[^<]*Pentagon<\/strong>[\s\S]{0,300}?pentagon-demo/
    );
    expect(pentagonCard).not.toBeNull();
    expect(pentagonCard[0]).toMatch(/Regular Pentagon/);
    const hexagonCard = explanationSrc.match(
      /<strong>[^<]*Hexagon<\/strong>[\s\S]{0,300}?hexagon-demo/
    );
    expect(hexagonCard).not.toBeNull();
    expect(hexagonCard[0]).toMatch(/Regular Hexagon/);
  });
});
