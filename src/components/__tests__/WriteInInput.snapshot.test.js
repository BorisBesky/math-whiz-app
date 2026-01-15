/**
 * Snapshot Tests for WriteInInput Component
 * Tests visual consistency of the text input for written answers
 */

import React from 'react';
import { render } from '@testing-library/react';
import WriteInInput from '../WriteInInput';

describe('WriteInInput Snapshots', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders empty state correctly', () => {
    const { container } = render(
      <WriteInInput value="" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with text value', () => {
    const { container } = render(
      <WriteInInput value="My answer is 42" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom placeholder', () => {
    const { container } = render(
      <WriteInInput
        value=""
        onChange={mockOnChange}
        placeholder="Show your work here..."
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders disabled state correctly', () => {
    const { container } = render(
      <WriteInInput
        value="Disabled answer"
        onChange={mockOnChange}
        disabled={true}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders near character limit state', () => {
    // Near 80% of 240 = ~192 characters
    const longText = 'A'.repeat(200);
    const { container } = render(
      <WriteInInput value={longText} onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders at character limit state', () => {
    const maxText = 'A'.repeat(240);
    const { container } = render(
      <WriteInInput value={maxText} onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom max length', () => {
    const { container } = render(
      <WriteInInput
        value="Short"
        onChange={mockOnChange}
        maxLength={50}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with additional className', () => {
    const { container } = render(
      <WriteInInput
        value="Test"
        onChange={mockOnChange}
        className="custom-class mt-4"
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with math symbols in answer', () => {
    const { container } = render(
      <WriteInInput
        value="3/4 + 1/4 = 1, and 5 × 6 = 30"
        onChange={mockOnChange}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
