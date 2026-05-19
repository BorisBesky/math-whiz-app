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
    const { asFragment } = render(
      <NumberPad value="" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with numeric value', () => {
    const { asFragment } = render(
      <NumberPad value="123" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with decimal value', () => {
    const { asFragment } = render(
      <NumberPad value="3.14" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with negative value', () => {
    const { asFragment } = render(
      <NumberPad value="-42" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders disabled state correctly', () => {
    const { asFragment } = render(
      <NumberPad value="123" onChange={mockOnChange} disabled={true} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders with large number', () => {
    const { asFragment } = render(
      <NumberPad value="999999999" onChange={mockOnChange} />
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
