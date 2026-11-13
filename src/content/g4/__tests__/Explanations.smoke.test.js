import React from 'react';
import { render, screen } from '@testing-library/react';

// Every G4 Explanation renders under jsdom to catch a broken figure (bad JSX,
// missing export) before a student taps "Explain" and gets a blank screen,
// and to guard against inline <svg role="img"> figures that lack any
// accessible name — the geometry parallel/perpendicular demos regressed this
// way and left screen-reader users with no text where the picture carries
// the concept.
import BaseTen from '../base-ten/Explanation';
import BinaryOperations from '../binary-operations/Explanation';
import Fractions from '../fractions/Explanation';
import Geometry from '../geometry/Explanation';
import MeasurementData from '../measurement-data/Explanation';
import OperationsAlgebraicThinking from '../operations-algebraic-thinking/Explanation';

const EXPLANATIONS = [
  ['Base Ten 4th', BaseTen],
  ['Binary Operations 4th', BinaryOperations],
  ['Fractions 4th', Fractions],
  ['Geometry 4th', Geometry],
  ['Measurement & Data 4th', MeasurementData],
  ['Operations & Algebraic Thinking 4th', OperationsAlgebraicThinking],
];

describe('G4 Explanations render without crashing', () => {
  it.each(EXPLANATIONS)('%s renders and shows an h1', (_name, Component) => {
    render(<Component />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  // Mirrors the G5 accessibility guard. A figure with role="img" but no
  // aria-label/<title>/alt resolves to an empty accessible name — a screen
  // reader would announce it as just "image".
  it.each(EXPLANATIONS)('%s labels every role="img" diagram for screen readers', (_name, Component) => {
    render(<Component />);
    expect(screen.queryAllByRole('img', { name: '' })).toHaveLength(0);
  });
});

// Every subtopic the question bank can ask about needs *something* a student
// can read when they tap "Explain" after missing a question. Mirror the G5
// pattern: lock in subtopic text coverage so a future edit can't quietly
// delete the "Equivalent Fractions" or "Composite Shapes" section and leave
// a student staring at a page that doesn't mention the thing they got wrong.
// The checks are intentionally LENIENT — a short synonym (e.g. "Number
// machines" for "input/output tables") passes as long as the identifying
// vocabulary appears somewhere in the rendered text.
describe('G4 Explanations cover every subtopic in the manifest', () => {
  const textOf = (Component) => {
    render(<Component />);
    return document.body.textContent.toLowerCase();
  };

  it('Base Ten covers place value, rounding, +/−/×/÷, comparison, decimals (4.NBT & 4.NF.C)', () => {
    const text = textOf(BaseTen);
    expect(text).toMatch(/place value/);
    expect(text).toMatch(/round/);
    expect(text).toMatch(/addition|adding/);
    expect(text).toMatch(/subtract/);
    expect(text).toMatch(/multiplication|multiply/);
    expect(text).toMatch(/division|divid/);
    expect(text).toMatch(/compar/);
    expect(text).toMatch(/decimal/);
    expect(text).toMatch(/word problem/);
  });

  it('Binary Operations covers all 8 binary-arithmetic subtopics', () => {
    const text = textOf(BinaryOperations);
    expect(text).toMatch(/binary to decimal|binary.*decimal/);
    expect(text).toMatch(/decimal to binary|decimal.*binary/);
    expect(text).toMatch(/add/);
    expect(text).toMatch(/subtract/);
    expect(text).toMatch(/multipl/);
    expect(text).toMatch(/divid/);
    expect(text).toMatch(/place value/);
    expect(text).toMatch(/compar/);
  });

  it('Fractions covers equivalent, compare, +/−/×, decimals, mixed numbers (4.NF.A/B/C)', () => {
    const text = textOf(Fractions);
    expect(text).toMatch(/equivalent/);
    expect(text).toMatch(/compar/);
    expect(text).toMatch(/add/);
    expect(text).toMatch(/subtract/);
    expect(text).toMatch(/multipl/);
    expect(text).toMatch(/decimal/);
    expect(text).toMatch(/mixed number/);
    expect(text).toMatch(/number line/);
  });

  it('Geometry covers lines/angles, shape classification, symmetry, missing sides, composite (4.G.A)', () => {
    const text = textOf(Geometry);
    expect(text).toMatch(/line|angle/);
    expect(text).toMatch(/ray/);
    expect(text).toMatch(/classify|classification/);
    expect(text).toMatch(/symmetry/);
    expect(text).toMatch(/triangle/);
    expect(text).toMatch(/quadrilateral/);
    expect(text).toMatch(/angle measurement|measuring angles/);
    expect(text).toMatch(/missing side|find.*side/);
    expect(text).toMatch(/composite|rectilinear/);
  });

  it('Measurement & Data covers length/weight/time conversion, clock, area, perimeter, angles, data (4.MD)', () => {
    const text = textOf(MeasurementData);
    expect(text).toMatch(/length|conversion/);
    expect(text).toMatch(/weight|capacity/);
    expect(text).toMatch(/time/);
    expect(text).toMatch(/clock/);
    expect(text).toMatch(/area/);
    expect(text).toMatch(/perimeter/);
    expect(text).toMatch(/angle/);
    expect(text).toMatch(/bar graph|pictograph|data/);
    expect(text).toMatch(/line plot/);
  });

  it('Operations & Algebraic Thinking covers multiplicative compare, factors, multiples, patterns, long division', () => {
    const text = textOf(OperationsAlgebraicThinking);
    expect(text).toMatch(/multiplicative|times as many|as many/);
    expect(text).toMatch(/prime/);
    expect(text).toMatch(/composite/);
    expect(text).toMatch(/factor/);
    expect(text).toMatch(/multiple/);
    expect(text).toMatch(/pattern/);
    expect(text).toMatch(/word problem/);
    expect(text).toMatch(/long division/);
    expect(text).toMatch(/remainder/);
  });
});
