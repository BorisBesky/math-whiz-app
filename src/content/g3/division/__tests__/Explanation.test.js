import React from 'react';
import { render, screen } from '@testing-library/react';
import Explanation from '../Explanation';
import { division } from '../index';

describe('G3 DivisionExplanation', () => {
  it('renders the top-level page title', () => {
    render(<Explanation />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Division/i })
    ).toBeInTheDocument();
  });

  it('covers the "remainders" subtopic that the topic registers', () => {
    // The remainders subtopic was registered in index.js and exposed as an
    // explicit objective, but the explanation was silent on it — students
    // selecting that subtopic got remainder questions with no preparation.
    expect(division.subtopics).toContain('remainders');

    const { container } = render(<Explanation />);
    expect(
      screen.getByRole('heading', { name: /Remainders/i })
    ).toBeInTheDocument();
    // The body should also define the term so a student can act on it.
    expect(container.textContent).toMatch(/what's left over is called/i);
  });
});
