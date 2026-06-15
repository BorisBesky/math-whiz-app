import React from 'react';
import { render, screen } from '@testing-library/react';
import Explanation from '../Explanation';

describe('OperationsAlgebraicThinkingExplanation', () => {
  it('renders the top-level page title', () => {
    render(<Explanation />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Operations & Algebraic Thinking/i })
    ).toBeInTheDocument();
  });

  it('does not contain the Unicode replacement character in any section heading', () => {
    // The replacement character U+FFFD shows up as a black diamond / question mark
    // and means an emoji or character could not be decoded. Two h2 headings used
    // to ship with broken bytes here — guard against the regression.
    render(<Explanation />);
    const headings = screen.getAllByRole('heading');
    for (const heading of headings) {
      expect(heading.textContent).not.toContain('�');
    }
  });

  it('renders the expected top-level section headings', () => {
    render(<Explanation />);
    expect(screen.getByRole('heading', { name: /Multiplicative Comparisons/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Order of Operations/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Multiplication Properties/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Prime and Composite Numbers/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Factors and Multiples/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Number Patterns/i })).toBeInTheDocument();
  });
});
