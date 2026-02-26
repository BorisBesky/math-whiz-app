import React, { useState, useEffect } from 'react';

/**
 * WriteInInput - A textarea component for written answer questions
 */
const WriteInInput = React.memo(({
  onChange,
  value = '',
  maxLength = 240,
  placeholder = 'Type your answer here...',
  disabled = false,
  className = ''
}) => {
  const [text, setText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setText(newValue);
      if (onChange) {
        onChange(newValue);
      }
    }
  };

  const handleClear = () => {
    setText('');
    if (onChange) {
      onChange('');
    }
  };

  const charCount = text.length;
  const charPercentage = (charCount / maxLength) * 100;
  const isNearLimit = charPercentage > 80;
  const isAtLimit = charCount >= maxLength;

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative rounded-card border-2 transition-all duration-200 ${
        disabled
          ? 'border-gray-200 bg-gray-50'
          : isFocused
            ? 'border-brand-blue bg-white shadow-glow-blue'
            : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
        <textarea
          value={text}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full p-4 rounded-card resize-none focus:outline-none text-gray-800 text-base font-body ${
            disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-transparent'
          }`}
          rows={4}
          aria-label="Written answer input"
          aria-describedby="char-count-info"
        />

        {/* Footer bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          {!disabled && text.length > 0 ? (
            <button
              onClick={handleClear}
              type="button"
              className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1 font-medium"
              aria-label="Clear text"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          ) : <div />}

          {/* Character counter with mini progress ring */}
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#e5e7eb" strokeWidth="2" />
              <circle
                cx="10" cy="10" r="8" fill="none"
                stroke={isAtLimit ? '#ef4444' : isNearLimit ? '#f97316' : '#3a7bd5'}
                strokeWidth="2"
                strokeDasharray={`${charPercentage * 0.503} 50.3`}
                strokeLinecap="round"
                transform="rotate(-90 10 10)"
                className="transition-all duration-300"
              />
            </svg>
            <span
              id="char-count-info"
              className={`text-xs font-bold transition-colors ${
                isAtLimit ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {charCount}/{maxLength}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Write clearly. You can use +, -, ×, ÷, = and fractions like 3/4.
      </p>
    </div>
  );
});

WriteInInput.displayName = 'WriteInInput';

export default WriteInInput;
