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
