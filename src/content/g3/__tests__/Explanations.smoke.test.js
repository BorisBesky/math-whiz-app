import React from 'react';
import { render, screen } from '@testing-library/react';

// Mirrors the G4/G5 smoke suites. Each 3rd-grade Explanation.js renders under
// jsdom to catch a broken file (bad JSX, missing export, exception during
// render) before a student taps "Explain" and gets a blank screen. The 3rd-
// grade files are the youngest cohort's first content, so a regression here
// hits the audience least able to recover from a broken page on their own.
import Division from '../division/Explanation';
import Fractions from '../fractions/Explanation';
import MeasurementData from '../measurement-data/Explanation';
import Multiplication from '../multiplication/Explanation';

const EXPLANATIONS = [
  ['Division', Division],
  ['Fractions', Fractions],
  ['Measurement & Data', MeasurementData],
  ['Multiplication', Multiplication],
];

describe('G3 Explanations render without crashing', () => {
  it.each(EXPLANATIONS)('%s renders and shows an h1', (_name, Component) => {
    render(<Component />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  // If a future edit adds inline <svg role="img"> without a title/aria-label,
  // or an <img> without alt text, a screen reader announces it as just
  // "image". Lock that out, same as the G4 and G5 suites already do.
  it.each(EXPLANATIONS)('%s labels every role="img" diagram for screen readers', (_name, Component) => {
    render(<Component />);
    expect(screen.queryAllByRole('img', { name: '' })).toHaveLength(0);
  });
});

// Every subtopic the question bank can ask about needs something to read when
// a student taps "Explain". Mirror the G5 pattern of locking subtopic coverage
// in so a future edit can't quietly drop a section a kid depends on.
describe('G3 Explanations cover every subtopic listed in the manifest', () => {
  const textOf = (Component) => {
    render(<Component />);
    return document.body.textContent.toLowerCase();
  };

  it('Measurement & Data covers area, perimeter, and volume (3.MD.C.5–D.8)', () => {
    const text = textOf(MeasurementData);
    expect(text).toMatch(/area/);
    expect(text).toMatch(/perimeter/);
    expect(text).toMatch(/volume/);
    // The three units of measure the standard calls out specifically:
    // "square units" (area), plain units (perimeter), "cubic units" (volume).
    expect(text).toMatch(/square units?/);
    expect(text).toMatch(/cubic units?/);
    // And a working formula a student can latch onto for a rectangle.
    expect(text).toMatch(/length [×x] width/);
  });

  // The other three G3 topics had no subtopic-coverage lock. Mirror the G5
  // pattern across the whole G3 cohort so a future edit can't quietly delete
  // an "Equivalent Fractions" or "Fact Families" section and leave the
  // youngest cohort reading a page that doesn't mention the thing they just
  // missed.
  it('Division covers basic division, equal sharing, grouping, fact families, remainders, arrays', () => {
    const text = textOf(Division);
    expect(text).toMatch(/divid/);
    expect(text).toMatch(/equal.*shar|shar.*equal/);
    expect(text).toMatch(/group/);
    expect(text).toMatch(/fact famil/);
    expect(text).toMatch(/remainder/);
    expect(text).toMatch(/array/);
  });

  it('Fractions covers equivalent, comparison, addition, subtraction, simplification (3.NF)', () => {
    const text = textOf(Fractions);
    expect(text).toMatch(/equivalent/);
    expect(text).toMatch(/compar/);
    expect(text).toMatch(/add/);
    expect(text).toMatch(/subtract/);
    expect(text).toMatch(/simplif|reduc/);
    // The 3rd-grade bar for a fraction: numerator and denominator both named.
    expect(text).toMatch(/numerator/);
    expect(text).toMatch(/denominator/);
  });

  it('Multiplication covers basic, skip counting, arrays, word problems, fact families', () => {
    const text = textOf(Multiplication);
    expect(text).toMatch(/multipl/);
    expect(text).toMatch(/skip count/);
    expect(text).toMatch(/array|group/);
    expect(text).toMatch(/word problem/);
    expect(text).toMatch(/fact famil/);
  });
});
