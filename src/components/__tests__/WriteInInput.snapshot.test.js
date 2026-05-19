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
    const { asFragment } = render(
      <WriteInInput value="" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with text value', () => {
    const { asFragment } = render(
      <WriteInInput value="My answer is 42" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with custom placeholder', () => {
    const { asFragment } = render(
      <WriteInInput
        value=""
        onChange={mockOnChange}
        placeholder="Show your work here..."
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders disabled state correctly', () => {
    const { asFragment } = render(
      <WriteInInput
        value="Disabled answer"
        onChange={mockOnChange}
        disabled={true}
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders near character limit state', () => {
    // Near 80% of 240 = ~192 characters
    const longText = 'A'.repeat(200);
    const { asFragment } = render(
      <WriteInInput value={longText} onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders at character limit state', () => {
    const maxText = 'A'.repeat(240);
    const { asFragment } = render(
      <WriteInInput value={maxText} onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with custom max length', () => {
    const { asFragment } = render(
      <WriteInInput
        value="Short"
        onChange={mockOnChange}
        maxLength={50}
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with additional className', () => {
    const { asFragment } = render(
      <WriteInInput
        value="Test"
        onChange={mockOnChange}
        className="custom-class mt-4"
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with math symbols in answer', () => {
    const { asFragment } = render(
      <WriteInInput
        value="3/4 + 1/4 = 1, and 5 × 6 = 30"
        onChange={mockOnChange}
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
