import React from 'react';
import { Delete, X } from 'lucide-react';

/**
 * NumberPad component for entering numeric answers
 * @param {string} value - Current input value
 * @param {function} onChange - Callback when value changes
 * @param {boolean} disabled - Whether the pad is disabled
 */
const NumberPad = ({ value, onChange, disabled = false }) => {
  const handleNumberClick = (num) => {
    if (disabled) return;
    onChange(value + num);
  };

  const handleDecimalClick = () => {
    if (disabled) return;
    // Only allow one decimal point
    if (!value.includes('.')) {
      // If value is empty or just "-", add "0." after the sign instead of just "."
      onChange(value === '' || value === '-' ? (value + '0.') : value + '.');
    }
  };

  const handleToggleSign = () => {
    if (disabled) return;
    // Don't toggle if empty or just "0"
    if (value === '' || value === '0' || value === '0.') return;
    
    if (value.startsWith('-')) {
      // Remove negative sign
      onChange(value.slice(1));
    } else {
      // Add negative sign
      onChange('-' + value);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const buttonClass = (isSpecial = false) => {
    const baseClass = "p-2.5 rounded-lg text-lg font-bold transition-all duration-200 ";
    if (disabled) {
      return baseClass + "bg-gray-200 text-gray-400 cursor-not-allowed";
    }
    if (isSpecial) {
      return baseClass + "bg-red-500 text-white hover:bg-red-600 active:scale-95";
    }
    return baseClass + "bg-blue-500 text-white hover:bg-blue-600 active:scale-95";
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Display Screen */}
      <div className="mb-3 p-3 bg-white border-2 border-blue-300 rounded-lg min-h-[50px] flex items-center justify-center">
        <span className={`text-xl font-bold ${value ? 'text-gray-800' : 'text-gray-400 italic'}`}>
          {value || 'Enter number...'}
        </span>
      </div>

      {/* Number Pad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className={buttonClass()}
          >
            {num}
          </button>
        ))}

        {/* Bottom row: +/-, 0, Decimal */}
        <button
          onClick={handleToggleSign}
          disabled={disabled}
          className={buttonClass() + " flex items-center justify-center text-lg"}
          title="Toggle Positive/Negative"
        >
          +/−
        </button>

        <button
          onClick={() => handleNumberClick('0')}
          disabled={disabled}
          className={buttonClass()}
        >
          0
        </button>

        <button
          onClick={handleDecimalClick}
          disabled={disabled}
          className={buttonClass() + " flex items-center justify-center text-2xl"}
          title="Decimal Point"
        >
          .
        </button>

        {/* Second bottom row: Clear and Backspace */}
        <button
          onClick={handleClear}
          disabled={disabled}
          className={buttonClass(true) + " col-span-1 flex items-center justify-center"}
          title="Clear"
        >
          <X size={20} />
        </button>

        <button
          onClick={handleBackspace}
          disabled={disabled}
          className={buttonClass(true) + " col-span-2 flex items-center justify-center gap-1.5"}
          title="Backspace"
        >
          <Delete size={18} /> Delete
        </button>
      </div>
    </div>
  );
};

export default NumberPad;

