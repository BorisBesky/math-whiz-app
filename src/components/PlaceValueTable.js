import React, { useRef, useEffect } from 'react';

/**
 * Interactive place value table for fill-in-the-blanks questions.
 * Students fill in place names (header row) and place values (bottom row),
 * while digit values are pre-filled in the middle row.
 *
 * Blank ordering: headers L→R (indices 0..N-1), then values L→R (indices N..2N-1).
 */
const PlaceValueTable = ({
  tableData,
  fillInAnswers,
  fillInResults,
  correctAnswers,
  isAnswered,
  onAnswerChange,
}) => {
  const inputRefs = useRef([]);
  const { columns, numberStr } = tableData;

  // Total blanks: one header + one value per non-decimal-point column
  const blankColumns = columns.filter(c => !c.isDecimalPoint);
  const headerCount = blankColumns.length;

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (blankIndex, value) => {
    const newAnswers = [...fillInAnswers];
    newAnswers[blankIndex] = value;
    onAnswerChange(newAnswers);
  };

  const handleKeyDown = (e, currentRefIndex) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const nextRef = inputRefs.current[currentRefIndex + 1];
      if (nextRef) nextRef.focus();
    }
  };

  const getInputStyle = (blankIndex) => {
    const base = {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '0.85em',
      textAlign: 'center',
      padding: '6px 4px',
      borderRadius: '8px',
      outline: 'none',
      transition: 'all 0.2s ease',
      width: '100%',
      minWidth: '50px',
      maxWidth: '110px',
      boxSizing: 'border-box',
      background: '#fff',
    };

    if (isAnswered) {
      const isCorrect = fillInResults[blankIndex];
      if (isCorrect) {
        return {
          ...base,
          border: '2.5px solid #27ae60',
          background: '#eafaf1',
          color: '#1e8449',
          fontWeight: 'bold',
        };
      } else {
        return {
          ...base,
          border: '2.5px solid #e74c3c',
          background: '#fdedec',
          color: '#c0392b',
          fontWeight: 'bold',
        };
      }
    }

    const value = fillInAnswers[blankIndex] || '';
    if (value) {
      return {
        ...base,
        border: '2.5px solid #3498db',
        background: '#ebf5fb',
        color: '#2c3e50',
        fontWeight: '600',
      };
    }

    return {
      ...base,
      border: '2.5px dashed #bdc3c7',
      color: '#7f8c8d',
    };
  };

  // Build refs array tracking: headers first, then values
  let refIndex = 0;

  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)',
      borderRadius: '18px',
      border: '3px solid #3498db',
      padding: '20px 16px',
      margin: '8px 0',
      boxShadow: '0 6px 20px rgba(52, 152, 219, 0.15)',
    },
    numberDisplay: {
      textAlign: 'center',
      marginBottom: '16px',
    },
    numberEmoji: {
      fontSize: '1.4em',
    },
    numberLabel: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '1em',
      color: '#5d6d7e',
      marginRight: '8px',
    },
    numberValue: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '2em',
      fontWeight: 'bold',
      color: '#e67e22',
      letterSpacing: '2px',
    },
    scrollWrapper: {
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: '4px',
    },
    table: {
      margin: '0 auto',
      borderCollapse: 'separate',
      borderSpacing: '3px',
      width: '100%',
      maxWidth: '700px',
    },
    rowLabel: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '0.75em',
      color: '#7f8c8d',
      textAlign: 'right',
      padding: '4px 8px 4px 0',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
      fontWeight: 'bold',
    },
    headerCell: (isDecimal) => ({
      padding: '4px',
      textAlign: 'center',
      verticalAlign: 'middle',
      minWidth: '60px',
    }),
    digitCell: (isDecimal) => ({
      background: isDecimal ? '#fef9e7' : '#fffbf0',
      padding: '10px 6px',
      textAlign: 'center',
      borderRadius: '10px',
      fontSize: '1.8em',
      fontWeight: 'bold',
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      color: '#2c3e50',
      border: `2px solid ${isDecimal ? '#f0c040' : '#e8dcc8'}`,
      minWidth: '60px',
    }),
    decimalPointCell: {
      textAlign: 'center',
      fontSize: '2.2em',
      fontWeight: 'bold',
      color: '#e67e22',
      padding: '0 2px',
      verticalAlign: 'middle',
      width: '30px',
      minWidth: '30px',
    },
    decimalPointDigitCell: {
      textAlign: 'center',
      fontSize: '2.2em',
      fontWeight: 'bold',
      color: '#e67e22',
      padding: '10px 2px',
      width: '30px',
      minWidth: '30px',
    },
    valueCell: (isDecimal) => ({
      padding: '4px',
      textAlign: 'center',
      verticalAlign: 'middle',
      minWidth: '60px',
    }),
    headerTag: (isDecimal) => ({
      display: 'inline-block',
      background: isDecimal
        ? 'linear-gradient(135deg, #00b894 0%, #00a08a 100%)'
        : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
      color: '#fff',
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '0.72em',
      fontWeight: 'bold',
      padding: '5px 8px',
      borderRadius: '8px',
      textAlign: 'center',
      letterSpacing: '0.5px',
      minWidth: '55px',
      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
    }),
    valueTag: {
      display: 'inline-block',
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '0.8em',
      fontWeight: 'bold',
      color: '#6c3483',
      background: 'linear-gradient(135deg, #f5eef8 0%, #ebdef0 100%)',
      padding: '5px 8px',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1.5px solid #d2b4de',
      minWidth: '55px',
    },
    correctionText: {
      display: 'block',
      fontSize: '0.65em',
      color: '#27ae60',
      fontWeight: 'bold',
      marginTop: '2px',
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
    },
    instructions: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '0.9em',
      color: '#5d6d7e',
      textAlign: 'center',
      margin: '0 0 12px 0',
      fontStyle: 'italic',
    },
  };

  // Render each column
  const renderColumns = (rowType) => {
    let headerIdx = 0;
    let valueIdx = 0;

    return columns.map((col, colIdx) => {
      if (col.isDecimalPoint) {
        // Decimal point column
        if (rowType === 'header') {
          return (
            <td key={colIdx} style={{ ...styles.decimalPointCell, padding: '4px 2px' }}>
              <span style={{ visibility: 'hidden' }}>.</span>
            </td>
          );
        }
        if (rowType === 'digit') {
          return (
            <td key={colIdx} style={styles.decimalPointDigitCell}>.</td>
          );
        }
        if (rowType === 'value') {
          return (
            <td key={colIdx} style={{ ...styles.decimalPointCell, padding: '4px 2px' }}>
              <span style={{ visibility: 'hidden' }}>.</span>
            </td>
          );
        }
      }

      const isDecimal = col.isDecimal;

      if (rowType === 'header') {
        const blankIndex = headerIdx;
        headerIdx++;

        if (isAnswered) {
          const isCorrect = fillInResults[blankIndex];
          const userVal = (fillInAnswers[blankIndex] || '').trim();
          const correctVal = correctAnswers[blankIndex];

          return (
            <td key={colIdx} style={styles.headerCell(isDecimal)}>
              <span style={styles.headerTag(isDecimal)}>
                {isCorrect ? correctVal : userVal || '?'}
              </span>
              {!isCorrect && (
                <span style={styles.correctionText}>{correctVal}</span>
              )}
            </td>
          );
        }

        const currentRefIndex = refIndex++;
        return (
          <td key={colIdx} style={styles.headerCell(isDecimal)}>
            <input
              ref={el => inputRefs.current[currentRefIndex] = el}
              type="text"
              value={fillInAnswers[blankIndex] || ''}
              onChange={e => handleInputChange(blankIndex, e.target.value)}
              onKeyDown={e => handleKeyDown(e, currentRefIndex)}
              disabled={isAnswered}
              style={getInputStyle(blankIndex)}
              placeholder="place?"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </td>
        );
      }

      if (rowType === 'digit') {
        return (
          <td key={colIdx} style={styles.digitCell(isDecimal)}>
            {col.digit}
          </td>
        );
      }

      if (rowType === 'value') {
        const blankIndex = headerCount + valueIdx;
        valueIdx++;

        if (isAnswered) {
          const isCorrect = fillInResults[blankIndex];
          const userVal = (fillInAnswers[blankIndex] || '').trim();
          const correctVal = correctAnswers[blankIndex];

          return (
            <td key={colIdx} style={styles.valueCell(isDecimal)}>
              <span style={styles.valueTag}>
                {isCorrect ? correctVal : userVal || '?'}
              </span>
              {!isCorrect && (
                <span style={styles.correctionText}>{correctVal}</span>
              )}
            </td>
          );
        }

        const currentRefIndex = refIndex++;
        return (
          <td key={colIdx} style={styles.valueCell(isDecimal)}>
            <input
              ref={el => inputRefs.current[currentRefIndex] = el}
              type="text"
              value={fillInAnswers[blankIndex] || ''}
              onChange={e => handleInputChange(blankIndex, e.target.value)}
              onKeyDown={e => handleKeyDown(e, currentRefIndex)}
              disabled={isAnswered}
              style={getInputStyle(blankIndex)}
              placeholder="value?"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="text"
            />
          </td>
        );
      }

      return null;
    });
  };

  // Reset refIndex before render
  refIndex = 0;

  return (
    <div style={styles.container}>
      <div style={styles.numberDisplay}>
        <span style={styles.numberEmoji}>🔢 </span>
        <span style={styles.numberLabel}>Fill in the place value chart for</span>
        <br />
        <span style={styles.numberValue}>{numberStr}</span>
      </div>

      <p style={styles.instructions}>
        Type the place name in each header and the place value below each digit
      </p>

      <div style={styles.scrollWrapper}>
        <table style={styles.table}>
          <tbody>
            {/* Row 1: Place name headers (blanks) */}
            <tr>
              <td style={styles.rowLabel}>Place name</td>
              {renderColumns('header')}
            </tr>

            {/* Row 2: Digits (pre-filled) */}
            <tr>
              <td style={styles.rowLabel}>Digit</td>
              {renderColumns('digit')}
            </tr>

            {/* Row 3: Place values (blanks) */}
            <tr>
              <td style={styles.rowLabel}>Place value</td>
              {renderColumns('value')}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Error summary after checking */}
      {isAnswered && !fillInResults.every(r => r === true) && (
        <div style={{
          marginTop: '14px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
          borderRadius: '12px',
          borderLeft: '5px solid #e17055',
          fontFamily: "'Comic Sans MS', cursive, sans-serif",
          fontSize: '0.9em',
          color: '#2d3436',
        }}>
          <strong>Almost there!</strong> Check the cells highlighted in red above — the correct answers are shown underneath.
        </div>
      )}

      {isAnswered && fillInResults.every(r => r === true) && (
        <div style={{
          marginTop: '14px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
          borderRadius: '12px',
          borderLeft: '5px solid #00b894',
          fontFamily: "'Comic Sans MS', cursive, sans-serif",
          fontSize: '0.9em',
          color: '#2d3436',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '1.3em' }}>🌟</span> <strong>Perfect!</strong> You know your place values!
        </div>
      )}
    </div>
  );
};

export default PlaceValueTable;
