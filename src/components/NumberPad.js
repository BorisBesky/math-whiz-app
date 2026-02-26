import React from 'react';
import { Delete, X } from 'lucide-react';

/**
 * NumberPad component for entering numeric answers
 * @param {string} value - Current input value
 * @param {function} onChange - Callback when value changes
 * @param {boolean} disabled - Whether the pad is disabled
 */
const NumberPad = React.memo(({ value, onChange, disabled = false }) => {
  const handleNumberClick = (num) => {
    if (disabled) return;
    onChange(value + num);
  };

  const handleDecimalClick = () => {
    if (disabled) return;
    if (!value.includes('.')) {
      onChange(value === '' || value === '-' ? (value + '0.') : value + '.');
    }
  };

  const handleToggleSign = () => {
    if (disabled) return;
    if (value === '' || value === '0' || value === '0.') return;
    if (value.startsWith('-')) {
      onChange(value.slice(1));
    } else {
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

  const numBtn = disabled
    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
    : "bg-white text-gray-800 border border-gray-200 hover:border-brand-blue hover:bg-blue-50 active:scale-95 active:bg-blue-100 shadow-sm";

  const actionBtn = disabled
    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
    : "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 active:scale-95 shadow-sm";

  const btnBase = "p-3 rounded-xl text-lg font-display font-bold transition-all duration-150 flex items-center justify-center";

  return (
    <div className="w-full max-w-[280px] mx-auto">
      {/* Display */}
      <div className="mb-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-card min-h-[48px] flex items-center justify-end shadow-inner-soft">
        <span className={`text-2xl font-display font-bold tracking-wide ${value ? 'text-gray-800' : 'text-gray-300'}`}>
          {value || '0'}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className={`${btnBase} ${numBtn}`}
          >
            {num}
          </button>
        ))}

        <button onClick={handleToggleSign} disabled={disabled} className={`${btnBase} ${numBtn} text-base`} title="Toggle Positive/Negative">
          +/−
        </button>
        <button onClick={() => handleNumberClick('0')} disabled={disabled} className={`${btnBase} ${numBtn}`}>
          0
        </button>
        <button onClick={handleDecimalClick} disabled={disabled} className={`${btnBase} ${numBtn} text-2xl`} title="Decimal Point">
          .
        </button>

        {/* Actions */}
        <button onClick={handleClear} disabled={disabled} className={`${btnBase} ${actionBtn}`} title="Clear">
          <X size={18} />
        </button>
        <button onClick={handleBackspace} disabled={disabled} className={`${btnBase} ${actionBtn} col-span-2 gap-1.5`} title="Backspace">
          <Delete size={16} /> Delete
        </button>
      </div>
    </div>
  );
});

NumberPad.displayName = 'NumberPad';

export default NumberPad;
