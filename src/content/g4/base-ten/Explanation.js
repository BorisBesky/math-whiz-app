import React from 'react';

const BaseTenExplanation = () => {

  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#e67e22',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#d35400',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #d35400',
      paddingBottom: '10px',
    },
    example: {
      background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      borderLeft: '5px solid #e17055',
    },
    tip: {
      background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
      padding: '15px',
      borderRadius: '10px',
      margin: '15px 0',
      borderLeft: '5px solid #00b894',
    },
    placeValue: {
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
      textAlign: 'center',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
    bigNumber: {
      fontSize: '2em',
      fontWeight: 'bold',
      color: '#e67e22',
      textAlign: 'center',
      margin: '10px 0',
    },
    table: {
      margin: '0 auto',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      background: '#3498db',
      color: 'white',
      padding: '10px',
      border: '1px solid #2980b9',
    },
    tableCell: {
      padding: '15px',
      border: '1px solid #bdc3c7',
      fontSize: '1.5em',
      fontWeight: 'bold',
    },
    preformatted: {
      fontSize: '1.2em',
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      lineHeight: 1.4,
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🔢 Number & Operations in Base Ten (4.NBT)</h1>
      
      <h2 style={styles.h2}>🏗️ Place Value to 1,000,000</h2>
      <p>Understanding place value helps us read and write really big numbers!</p>
      
      <div style={styles.placeValue}>
        <div style={styles.bigNumber}>756,429</div>
        <table style={styles.table}>
          <tr style={{background: '#3498db', color: 'white'}}>
            <td style={styles.tableHeader}>Hundred Thousands</td>
            <td style={styles.tableHeader}>Ten Thousands</td>
            <td style={styles.tableHeader}>Thousands</td>
            <td style={styles.tableHeader}>Hundreds</td>
            <td style={styles.tableHeader}>Tens</td>
            <td style={styles.tableHeader}>Ones</td>
          </tr>
          <tr>
            <td style={styles.tableCell}>7</td>
            <td style={styles.tableCell}>5</td>
            <td style={styles.tableCell}>6</td>
            <td style={styles.tableCell}>4</td>
            <td style={styles.tableCell}>2</td>
            <td style={styles.tableCell}>9</td>
          </tr>
        </table>
        <p><strong>Seven hundred fifty-six thousand, four hundred twenty-nine</strong></p>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>📍</span><strong>Place Value Tip:</strong> Each place is 10 times bigger than the place to its right!
      </div>

      <h2 style={styles.h2}>🔢 Decimal Place Value</h2>
      <p>Decimals extend our place value system to numbers smaller than 1!</p>

      <div style={styles.placeValue}>
        <div style={styles.bigNumber}>45.327</div>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tableHeader}>Tens</td>
              <td style={styles.tableHeader}>Ones</td>
              <td style={{...styles.tableHeader, background: '#e67e22'}}>.</td>
              <td style={styles.tableHeader}>Tenths</td>
              <td style={styles.tableHeader}>Hundredths</td>
              <td style={styles.tableHeader}>Thousandths</td>
            </tr>
            <tr>
              <td style={styles.tableCell}>4</td>
              <td style={styles.tableCell}>5</td>
              <td style={{...styles.tableCell, color: '#e67e22', fontSize: '2em'}}>.</td>
              <td style={styles.tableCell}>3</td>
              <td style={styles.tableCell}>2</td>
              <td style={styles.tableCell}>7</td>
            </tr>
            <tr>
              <td style={{...styles.tableCell, fontSize: '0.8em'}}>10</td>
              <td style={{...styles.tableCell, fontSize: '0.8em'}}>1</td>
              <td style={styles.tableCell}></td>
              <td style={{...styles.tableCell, fontSize: '0.8em'}}>1/10</td>
              <td style={{...styles.tableCell, fontSize: '0.8em'}}>1/100</td>
              <td style={{...styles.tableCell, fontSize: '0.8em'}}>1/1000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.example}>
        <strong>What is the value of each digit in 3.57?</strong>
        <br/>• The 3 is in the <strong>ones</strong> place — value: 3
        <br/>• The 5 is in the <strong>tenths</strong> place — value: 0.5
        <br/>• The 7 is in the <strong>hundredths</strong> place — value: 0.07
        <br/><br/>
        <strong>Expanded Form:</strong> 3.57 = 3 + 0.5 + 0.07
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>🔗</span><strong>10× Rule Works for Decimals Too!</strong> Each place is 10 times bigger than the place to its right. So 0.5 is 10 times greater than 0.05, and 0.05 is 10 times greater than 0.005!
      </div>

      <h2 style={styles.h2}>🎯 Rounding Numbers</h2>
      <p>Rounding helps us work with easier numbers when we don't need exact answers.</p>
      
      <div style={styles.example}>
        <strong>Round 4,567 to the nearest thousand:</strong>
        <br/>• Look at the hundreds place: 5
        <br/>• Since 5 ≥ 5, round UP
        <br/>• Answer: 5,000
        <br/><br/>
        <strong>Round 4,234 to the nearest thousand:</strong>
        <br/>• Look at the hundreds place: 2
        <br/>• Since 2 &lt; 5, round DOWN
        <br/>• Answer: 4,000
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎲</span><strong>Rounding Rule:</strong> 5 or more, round up the floor! 4 or less, let it rest!
      </div>

      <h2 style={styles.h2}>⚖️ Comparing Multi-Digit Numbers</h2>
      <p>To compare big numbers, always start from the <strong>leftmost</strong> place (the biggest place). Whichever number has the bigger digit there is greater — you don't have to look any further.</p>

      <div style={styles.example}>
        <strong>Compare 45,872 and 45,910:</strong>
        <br/>• Ten thousands: 4 = 4 (tie, keep going)
        <br/>• Thousands: 5 = 5 (tie, keep going)
        <br/>• Hundreds: 8 &lt; 9 → 45,872 &lt; 45,910 ✓
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>🐊</span><strong>Reminder:</strong> The alligator eats the bigger number: 45,910 &gt; 45,872. If two numbers have a different number of digits (like 8,000 vs 12,000), the one with MORE digits is bigger.
      </div>

      <h2 style={styles.h2}>➕➖ Adding &amp; Subtracting Big Numbers</h2>
      <p>Line up the numbers by <strong>place value</strong> (ones under ones, tens under tens, …). Then work column by column from right to left, carrying or borrowing whenever a column overflows or under-flows.</p>

      <div style={styles.example}>
        <strong>Add 3,458 + 2,791:</strong>
        <pre style={styles.preformatted}>
{`   1 1 1
    3,458
  + 2,791
   ------
    6,249`}
        </pre>
        Ones: 8+1=9. Tens: 5+9=14 (write 4, carry 1). Hundreds: 4+7+1=12 (write 2, carry 1). Thousands: 3+2+1=6.
      </div>

      <div style={styles.example}>
        <strong>Subtract 6,032 − 1,875:</strong>
        <pre style={styles.preformatted}>
{`    5 9 12 12
    6,0 3 2
  − 1, 8 7 5
   ---------
    4, 1 5 7`}
        </pre>
        You may need to borrow across a zero — regroup 6,000 as 5,900 + 100 first.
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>✅</span><strong>Check trick:</strong> A subtraction answer plus what you subtracted should equal the original number (4,157 + 1,875 = 6,032). ✓
      </div>

      <h2 style={styles.h2}>🧩 Multi-Step Word Problems</h2>
      <p>Real problems often need <strong>two or more steps</strong>. Slow down and use a plan:</p>

      <div style={styles.example}>
        <strong>Plan the steps:</strong>
        <br/>1. <strong>Underline</strong> what the question is asking.
        <br/>2. <strong>Circle</strong> the important numbers.
        <br/>3. Decide what to do first (usually a hidden step you have to compute before the real question).
        <br/>4. Do the second step using the answer from step 3.
        <br/>5. <strong>Check</strong>: does the answer make sense?
      </div>

      <div style={styles.example}>
        <strong>Example:</strong> A theater has 24 rows of 18 seats. Tonight 372 seats are sold. How many seats are still empty?
        <br/>• Step 1 (hidden): total seats = 24 × 18 = <strong>432</strong>.
        <br/>• Step 2 (real question): empty = 432 − 372 = <strong>60 seats</strong>. ✓
      </div>

      <h2 style={styles.h2}>✖️ Multi-Digit Multiplication</h2>
      <p>Multiply larger numbers using what you know about place value!</p>
      
      <div style={styles.example}>
        <strong>Example: 23 × 47</strong>
        <pre style={styles.preformatted}>
{`    23
  × 47
  ----
   161  (23 × 7)
 + 920  (23 × 40)
  ----
 1,081`}
        </pre>
      </div>

      <h2 style={styles.h2}>➗ Multi-Digit Division</h2>
      <p>Divide larger numbers step by step, just like long division!</p>
      
      <div style={styles.example}>
        <strong>Example: 84 ÷ 4 = 21</strong>
        <br/>• 8 ÷ 4 = 2 (in the tens place)
        <br/>• 4 ÷ 4 = 1 (in the ones place)
        <br/>• Answer: 21
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🔍</span><strong>Division Tip:</strong> Work from left to right, one place value at a time!
      </div>

      <div style={styles.placeValue}>
        <span style={styles.emoji}>🌟</span><strong>You're a Place Value Pro!</strong> Numbers are like addresses - each digit has its own special place!
      </div>
    </div>
  );
};

export default BaseTenExplanation;
