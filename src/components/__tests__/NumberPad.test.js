/**
 * Tests for NumberPad component
 * Tests numeric input handling for quiz answers
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NumberPad from '../NumberPad';

describe('NumberPad', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all number buttons 0-9', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);

      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: i.toString() })).toBeInTheDocument();
      }
    });

    it('renders decimal point button', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);
      expect(screen.getByTitle('Decimal Point')).toBeInTheDocument();
    });

    it('renders sign toggle button', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);
      expect(screen.getByTitle('Toggle Positive/Negative')).toBeInTheDocument();
    });

    it('renders clear and backspace buttons', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);
      expect(screen.getByTitle('Clear')).toBeInTheDocument();
      expect(screen.getByTitle('Backspace')).toBeInTheDocument();
    });

    it('displays current value', () => {
      render(<NumberPad value="123" onChange={mockOnChange} />);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('displays placeholder when value is empty', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);
      const allZeros = screen.getAllByText('0');
      // Display shows '0' placeholder and there's a '0' button — both should exist
      expect(allZeros.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('number input', () => {
    it('appends clicked number to value', () => {
      render(<NumberPad value="12" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '3' }));

      expect(mockOnChange).toHaveBeenCalledWith('123');
    });

    it('starts with clicked number when empty', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '5' }));

      expect(mockOnChange).toHaveBeenCalledWith('5');
    });

    it('allows leading zeros for decimal numbers', () => {
      render(<NumberPad value="0." onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '5' }));

      expect(mockOnChange).toHaveBeenCalledWith('0.5');
    });
  });

  describe('decimal point', () => {
    it('adds decimal point to value', () => {
      render(<NumberPad value="12" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Decimal Point'));

      expect(mockOnChange).toHaveBeenCalledWith('12.');
    });

    it('prevents multiple decimal points', () => {
      render(<NumberPad value="12.5" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Decimal Point'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('adds "0." when value is empty', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Decimal Point'));

      expect(mockOnChange).toHaveBeenCalledWith('0.');
    });

    it('adds "0." after negative sign', () => {
      render(<NumberPad value="-" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Decimal Point'));

      expect(mockOnChange).toHaveBeenCalledWith('-0.');
    });
  });

  describe('sign toggle', () => {
    it('adds negative sign to positive number', () => {
      render(<NumberPad value="42" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Toggle Positive/Negative'));

      expect(mockOnChange).toHaveBeenCalledWith('-42');
    });

    it('removes negative sign from negative number', () => {
      render(<NumberPad value="-42" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Toggle Positive/Negative'));

      expect(mockOnChange).toHaveBeenCalledWith('42');
    });

    it('does not toggle empty value', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Toggle Positive/Negative'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not toggle zero', () => {
      render(<NumberPad value="0" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Toggle Positive/Negative'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not toggle "0."', () => {
      render(<NumberPad value="0." onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Toggle Positive/Negative'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('backspace', () => {
    it('removes last character', () => {
      render(<NumberPad value="123" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Backspace'));

      expect(mockOnChange).toHaveBeenCalledWith('12');
    });

    it('handles single character', () => {
      render(<NumberPad value="5" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Backspace'));

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('handles empty value', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Backspace'));

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('removes decimal point', () => {
      render(<NumberPad value="12." onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Backspace'));

      expect(mockOnChange).toHaveBeenCalledWith('12');
    });
  });

  describe('clear', () => {
    it('clears entire value', () => {
      render(<NumberPad value="12345" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Clear'));

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('handles already empty value', () => {
      render(<NumberPad value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByTitle('Clear'));

      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('disabled state', () => {
    it('prevents number clicks when disabled', () => {
      render(<NumberPad value="12" onChange={mockOnChange} disabled={true} />);

      fireEvent.click(screen.getByRole('button', { name: '3' }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('prevents decimal click when disabled', () => {
      render(<NumberPad value="12" onChange={mockOnChange} disabled={true} />);

      fireEvent.click(screen.getByTitle('Decimal Point'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('prevents sign toggle when disabled', () => {
      render(<NumberPad value="12" onChange={mockOnChange} disabled={true} />);

      fireEvent.click(screen.getByTitle('Toggle Positive/Negative'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('prevents backspace when disabled', () => {
      render(<NumberPad value="12" onChange={mockOnChange} disabled={true} />);

      fireEvent.click(screen.getByTitle('Backspace'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('prevents clear when disabled', () => {
      render(<NumberPad value="12" onChange={mockOnChange} disabled={true} />);

      fireEvent.click(screen.getByTitle('Clear'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      render(<NumberPad value="" onChange={mockOnChange} disabled={true} />);

      const button = screen.getByRole('button', { name: '1' });
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  describe('edge cases', () => {
    it('handles negative decimal numbers', () => {
      render(<NumberPad value="-0.5" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '2' }));

      expect(mockOnChange).toHaveBeenCalledWith('-0.52');
    });

    it('preserves decimal precision', () => {
      render(<NumberPad value="3.14159" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '2' }));

      expect(mockOnChange).toHaveBeenCalledWith('3.141592');
    });

    it('handles very large numbers', () => {
      render(<NumberPad value="999999999" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '9' }));

      expect(mockOnChange).toHaveBeenCalledWith('9999999999');
    });
  });
});
