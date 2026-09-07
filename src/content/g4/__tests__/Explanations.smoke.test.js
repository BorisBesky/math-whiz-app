import React from 'react';
import { render, screen } from '@testing-library/react';

// Every G4 Explanation renders under jsdom to catch a broken figure (bad JSX,
// missing export) before a student taps "Explain" and gets a blank screen,
// and to guard against inline <svg role="img"> figures that lack any
// accessible name — the geometry parallel/perpendicular demos regressed this
// way and left screen-reader users with no text where the picture carries
// the concept.
import Algebra from '../algebra/Explanation';
import BaseTen from '../base-ten/Explanation';
import BinaryOperations from '../binary-operations/Explanation';
import Fractions from '../fractions/Explanation';
import Geometry from '../geometry/Explanation';
import MeasurementData from '../measurement-data/Explanation';
import OperationsAlgebraicThinking from '../operations-algebraic-thinking/Explanation';

const EXPLANATIONS = [
  ['Algebra 4th', Algebra],
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
