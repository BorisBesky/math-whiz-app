/**
 * Snapshot Tests for NumberPad Component
 * Tests visual consistency of the number input pad
 */

import React from 'react';
import { render } from '@testing-library/react';
import NumberPad from '../NumberPad';

describe('NumberPad Snapshots', () => {
  const mockOnChange = jest.fn();

  it('renders empty state correctly', () => {
    const { container } = render(
      <NumberPad value="" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with numeric value', () => {
    const { container } = render(
      <NumberPad value="123" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with decimal value', () => {
    const { container } = render(
      <NumberPad value="3.14" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with negative value', () => {
    const { container } = render(
      <NumberPad value="-42" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders disabled state correctly', () => {
    const { container } = render(
      <NumberPad value="123" onChange={mockOnChange} disabled={true} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with large number', () => {
    const { container } = render(
      <NumberPad value="999999999" onChange={mockOnChange} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
