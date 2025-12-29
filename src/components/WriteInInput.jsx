import React, { useState, useEffect } from 'react';

/**
 * WriteInInput - A textarea component for written answer questions
 * Similar to DrawingCanvas but for text input
 * 
 * @param {Object} props
 * @param {Function} props.onChange - Callback when text changes, receives the text value
 * @param {string} props.value - Controlled input value
 * @param {number} props.maxLength - Maximum character limit (default: 240)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 */
const WriteInInput = ({ 
  onChange, 
  value = '', 
  maxLength = 240, 
  placeholder = 'Type your answer here...',
  disabled = false,
  className = ''
}) => {
  const [text, setText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value changes
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
      <div className={`relative rounded-lg border-2 transition-colors ${
        disabled 
          ? 'border-gray-200 bg-gray-50' 
          : isFocused 
            ? 'border-blue-500 bg-white shadow-sm' 
            : 'border-gray-300 bg-white hover:border-gray-400'
      }`}>
        <textarea
          value={text}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full p-4 rounded-lg resize-none focus:outline-none text-gray-800 text-base ${
            disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-transparent'
          }`}
          rows={4}
          aria-label="Written answer input"
          aria-describedby="char-count-info"
        />
        
        {/* Character count and clear button bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          {/* Clear button */}
          {!disabled && text.length > 0 && (
            <button
              onClick={handleClear}
              type="button"
              className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              aria-label="Clear text"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          )}
          {!disabled && text.length === 0 && <div />}
          
          {/* Character counter */}
          <div 
            id="char-count-info"
            className={`text-sm font-medium transition-colors ${
              isAtLimit 
                ? 'text-red-500' 
                : isNearLimit 
                  ? 'text-orange-500' 
                  : 'text-gray-400'
            }`}
          >
            {charCount}/{maxLength}
          </div>
        </div>
      </div>
      
      {/* Helper text */}
      <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Write your answer clearly. Include your work or reasoning for full credit.
          {' '}You can use symbols like +, -, ×, ÷, =, and fractions like 3/4.
        </span>
      </div>
    </div>
  );
};

export default WriteInInput;
