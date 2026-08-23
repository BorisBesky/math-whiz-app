import React from 'react';
import { render, screen } from '@testing-library/react';

// Every G5 Explanation ships inline SVG teaching figures. Rendering each one
// here catches a broken figure (bad JSX, missing export) before a student taps
// "Explain" and gets a blank screen.
import BaseTen from '../base-ten/Explanation';
import Fractions from '../fractions/Explanation';
import Geometry from '../geometry/Explanation';
import MeasurementData from '../measurement-data/Explanation';
import OperationsAlgebraicThinking from '../operations-algebraic-thinking/Explanation';

const EXPLANATIONS = [
  ['Base Ten 5th', BaseTen],
  ['Fractions 5th', Fractions],
  ['Geometry 5th', Geometry],
  ['Measurement & Data 5th', MeasurementData],
  ['Operations & Algebraic Thinking 5th', OperationsAlgebraicThinking],
];

describe('G5 Explanations render with visual figures', () => {
  it.each(EXPLANATIONS)('%s renders without crashing', (_name, Component) => {
    render(<Component />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  // A figure is either an inline <svg role="img"> or an <img> showing an SVG
  // data URI built by the topic's visuals.js. Querying by role covers both,
  // and only finds figures that carry the role in the first place.
  it.each(EXPLANATIONS)('%s includes at least one diagram', (_name, Component) => {
    render(<Component />);
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });

  it.each(EXPLANATIONS)('%s labels every diagram for screen readers', (_name, Component) => {
    render(<Component />);
    // A figure with no aria-label, <title>, or alt text resolves to an empty
    // accessible name — a screen reader would announce it as just "image".
    expect(screen.queryAllByRole('img', { name: '' })).toHaveLength(0);
  });
});

// Every subtopic the question bank can ask about needs something to read when
// a student taps "Explain". These two were added alongside their generators;
// lock the sections in so a future edit can't quietly drop them.
describe('G5 Explanations cover the newer subtopics', () => {
  const textOf = (Component) => {
    render(<Component />);
    return document.body.textContent;
  };

  it('Base Ten covers expanded form and number names (5.NBT.A.3.a)', () => {
    const text = textOf(BaseTen);
    expect(text).toMatch(/expanded form/i);
    expect(text).toMatch(/number name/i);
    // the "and" = decimal point rule, and the placeholder-zero trap
    expect(text).toMatch(/decimal point/i);
    expect(text).toMatch(/0\.407/);
  });

  it('Fractions covers benchmark estimation (5.NF.A.2)', () => {
    const text = textOf(Fractions);
    expect(text).toMatch(/benchmark/i);
    expect(text).toMatch(/estimate/i);
    // the reasonableness example from the standard itself
    expect(text).toMatch(/2\/5 \+ 1\/2 = 3\/7/);
  });
});
