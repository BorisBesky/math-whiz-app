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
      // If value is empty, add "0." instead of just "."
      onChange(value === '' ? '0.' : value + '.');
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
    const baseClass = "p-4 rounded-lg text-xl font-bold transition-all duration-200 ";
    if (disabled) {
      return baseClass + "bg-gray-200 text-gray-400 cursor-not-allowed";
    }
    if (isSpecial) {
      return baseClass + "bg-red-500 text-white hover:bg-red-600 active:scale-95";
    }
    return baseClass + "bg-blue-500 text-white hover:bg-blue-600 active:scale-95";
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Display Screen */}
      <div className="mb-4 p-4 bg-white border-2 border-blue-300 rounded-lg min-h-[60px] flex items-center justify-center">
        <span className={`text-2xl font-bold ${value ? 'text-gray-800' : 'text-gray-400 italic'}`}>
          {value || 'Enter number...'}
        </span>
      </div>

      {/* Number Pad Grid */}
      <div className="grid grid-cols-3 gap-3">
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

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          onClick={handleClear}
          disabled={disabled}
          className={buttonClass(true) + " flex items-center justify-center"}
          title="Clear"
        >
          <X size={24} />
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
          className={buttonClass() + " flex items-center justify-center text-3xl"}
          title="Decimal Point"
        >
          .
        </button>

        {/* Second bottom row: Backspace spanning across */}
        <button
          onClick={handleBackspace}
          disabled={disabled}
          className={buttonClass(true) + " col-span-3 flex items-center justify-center gap-2"}
          title="Backspace"
        >
          <Delete size={24} /> Delete
        </button>
      </div>
    </div>
  );
};

export default NumberPad;

