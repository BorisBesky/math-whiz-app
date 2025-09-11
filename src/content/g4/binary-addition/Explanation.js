import React from 'react';

const BinaryAdditionExplanation = () => {

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
    h3: {
      color: '#e67e22',
      fontSize: '1.4em',
      marginTop: '25px',
      marginBottom: '15px',
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
    binaryDemo: {
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
      textAlign: 'center',
    },
    conversionTable: {
      background: 'linear-gradient(135deg, #f8e8ff 0%, #e8d5ff 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #9b59b6',
    },
    additionExample: {
      background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b3 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #f39c12',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      margin: '15px 0',
      backgroundColor: 'white',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    th: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '12px',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    td: {
      padding: '10px',
      textAlign: 'center',
      borderBottom: '1px solid #ecf0f1',
    },
    code: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '5px',
      padding: '2px 5px',
      fontFamily: 'monospace',
      fontSize: '1.1em',
      color: '#495057',
    },
    stepByStep: {
      backgroundColor: '#f8f9fa',
      border: '2px solid #6c757d',
      borderRadius: '10px',
      padding: '15px',
      margin: '10px 0',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>
        <span style={styles.emoji}>🤖</span>
        Binary Addition - The Computer's Math!
        <span style={styles.emoji}>💻</span>
      </h1>

      <div style={styles.tip}>
        <strong>💡 What You'll Learn:</strong> Binary is the special number system that computers use! 
        Instead of using digits 0-9 like we normally do, binary only uses 0 and 1. Let's learn how to count and add in this super cool "robot language"!
      </div>

      <h2 style={styles.h2}>
        <span style={styles.emoji}>🔢</span>
        What Are Binary Numbers?
      </h2>

      <p>
        <strong>Binary numbers</strong> are like a secret code that computers understand! While we use <strong>base-10</strong> (decimal) 
        numbers that go from 0 to 9, binary uses <strong>base-2</strong> numbers that only go from 0 to 1.
      </p>

      <div style={styles.binaryDemo}>
        <h3>Think of it like light switches! 💡</h3>
        <p><strong>0 = Light OFF 🌑</strong></p>
        <p><strong>1 = Light ON 🌟</strong></p>
        <p>Computers use millions of tiny "switches" to do all their amazing work!</p>
      </div>

      <h2 style={styles.h2}>
        <span style={styles.emoji}>🏠</span>
        Binary Place Values
      </h2>

      <p>
        In decimal numbers, each place is worth 10 times more than the place to its right (1, 10, 100, 1000...).
        In binary, each place is worth <strong>2 times</strong> more than the place to its right!
      </p>

      <div style={styles.conversionTable}>
        <h3 style={styles.h3}>Binary Place Values (Powers of 2):</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Place</th>
              <th style={styles.th}>Value</th>
              <th style={styles.th}>Power of 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}><strong>Ones</strong></td>
              <td style={styles.td}>1</td>
              <td style={styles.td}>2⁰</td>
            </tr>
            <tr>
              <td style={styles.td}><strong>Twos</strong></td>
              <td style={styles.td}>2</td>
              <td style={styles.td}>2¹</td>
            </tr>
            <tr>
              <td style={styles.td}><strong>Fours</strong></td>
              <td style={styles.td}>4</td>
              <td style={styles.td}>2²</td>
            </tr>
            <tr>
              <td style={styles.td}><strong>Eights</strong></td>
              <td style={styles.td}>8</td>
              <td style={styles.td}>2³</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={styles.h2}>
        <span style={styles.emoji}>🔄</span>
        Converting Between Binary and Decimal
      </h2>

      <h3 style={styles.h3}>From Binary to Decimal:</h3>
      <div style={styles.example}>
        <p><strong>Example: Convert binary 1011 to decimal</strong></p>
        <div style={styles.stepByStep}>
          <p>Step 1: Write the place values: <span style={styles.code}>8  4  2  1</span></p>
          <p>Step 2: Write the binary digits: <span style={styles.code}>1  0  1  1</span></p>
          <p>Step 3: Multiply and add where there's a 1:</p>
          <p><span style={styles.code}>(1×8) + (0×4) + (1×2) + (1×1) = 8 + 0 + 2 + 1 = 11</span></p>
          <p><strong>So binary 1011 = decimal 11! 🎉</strong></p>
        </div>
      </div>

      <h3 style={styles.h3}>From Decimal to Binary:</h3>
      <div style={styles.example}>
        <p><strong>Example: Convert decimal 9 to binary</strong></p>
        <div style={styles.stepByStep}>
          <p>Step 1: What powers of 2 add up to 9?</p>
          <p>Step 2: <span style={styles.code}>8 + 1 = 9</span></p>
          <p>Step 3: Put 1s in the 8s and 1s places, 0s everywhere else:</p>
          <p><span style={styles.code}>8  4  2  1</span></p>
          <p><span style={styles.code}>1  0  0  1</span></p>
          <p><strong>So decimal 9 = binary 1001! 🎉</strong></p>
        </div>
      </div>

      <h2 style={styles.h2}>
        <span style={styles.emoji}>➕</span>
        Binary Addition Rules
      </h2>

      <p>Binary addition follows these simple rules:</p>

      <div style={styles.conversionTable}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Addition</th>
              <th style={styles.th}>Result</th>
              <th style={styles.th}>Explanation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}><span style={styles.code}>0 + 0</span></td>
              <td style={styles.td}><span style={styles.code}>0</span></td>
              <td style={styles.td}>OFF + OFF = OFF</td>
            </tr>
            <tr>
              <td style={styles.td}><span style={styles.code}>0 + 1</span></td>
              <td style={styles.td}><span style={styles.code}>1</span></td>
              <td style={styles.td}>OFF + ON = ON</td>
            </tr>
            <tr>
              <td style={styles.td}><span style={styles.code}>1 + 0</span></td>
              <td style={styles.td}><span style={styles.code}>1</span></td>
              <td style={styles.td}>ON + OFF = ON</td>
            </tr>
            <tr>
              <td style={styles.td}><span style={styles.code}>1 + 1</span></td>
              <td style={styles.td}><span style={styles.code}>10</span></td>
              <td style={styles.td}>ON + ON = Carry 1, Write 0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={styles.h3}>Binary Addition Example:</h3>
      <div style={styles.additionExample}>
        <p><strong>Let's add binary 101 + 011:</strong></p>
        <div style={styles.stepByStep}>
          <pre style={{ fontSize: '1.2em', textAlign: 'center' }}>
{`   1 0 1
+  0 1 1
-------`}
          </pre>
          <p>Step by step from right to left:</p>
          <p>1. Ones place: <span style={styles.code}>1 + 1 = 10</span> (write 0, carry 1)</p>
          <p>2. Twos place: <span style={styles.code}>0 + 1 + 1 = 10</span> (write 0, carry 1)</p>
          <p>3. Fours place: <span style={styles.code}>1 + 0 + 1 = 10</span> (write 0, carry 1)</p>
          <pre style={{ fontSize: '1.2em', textAlign: 'center', backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '5px' }}>
{`   1 0 1  (5 in decimal)
+  0 1 1  (3 in decimal)
-------
 1 0 0 0  (8 in decimal)`}
          </pre>
          <p><strong>Check: 5 + 3 = 8 ✅</strong></p>
        </div>
      </div>

      <h2 style={styles.h2}>
        <span style={styles.emoji}>🎯</span>
        Practice Strategies
      </h2>

      <div style={styles.tip}>
        <p><strong>🧠 Memory Tricks:</strong></p>
        <ul>
          <li><strong>Powers of 2:</strong> 1, 2, 4, 8, 16... (each number doubles!)</li>
          <li><strong>Quick Check:</strong> Convert to decimal, do the math, convert back</li>
          <li><strong>Counting Pattern:</strong> 0, 1, 10, 11, 100, 101, 110, 111...</li>
          <li><strong>Light Switches:</strong> Think of 0 as OFF and 1 as ON</li>
        </ul>
      </div>

      <div style={styles.example}>
        <h3 style={styles.h3}>
          <span style={styles.emoji}>🏆</span>
          Quick Reference - First 10 Numbers:
        </h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Decimal</th>
              <th style={styles.th}>Binary</th>
              <th style={styles.th}>How to Remember</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}>All lights OFF</td></tr>
            <tr><td style={styles.td}>1</td><td style={styles.td}>1</td><td style={styles.td}>Just the 1s light ON</td></tr>
            <tr><td style={styles.td}>2</td><td style={styles.td}>10</td><td style={styles.td}>Just the 2s light ON</td></tr>
            <tr><td style={styles.td}>3</td><td style={styles.td}>11</td><td style={styles.td}>2s and 1s lights ON</td></tr>
            <tr><td style={styles.td}>4</td><td style={styles.td}>100</td><td style={styles.td}>Just the 4s light ON</td></tr>
            <tr><td style={styles.td}>5</td><td style={styles.td}>101</td><td style={styles.td}>4s and 1s lights ON</td></tr>
            <tr><td style={styles.td}>6</td><td style={styles.td}>110</td><td style={styles.td}>4s and 2s lights ON</td></tr>
            <tr><td style={styles.td}>7</td><td style={styles.td}>111</td><td style={styles.td}>All lights ON (4+2+1)</td></tr>
            <tr><td style={styles.td}>8</td><td style={styles.td}>1000</td><td style={styles.td}>Just the 8s light ON</td></tr>
            <tr><td style={styles.td}>9</td><td style={styles.td}>1001</td><td style={styles.td}>8s and 1s lights ON</td></tr>
          </tbody>
        </table>
      </div>

      <div style={styles.tip}>
        <p>
          <span style={styles.emoji}>🎮</span>
          <strong>Fun Fact:</strong> Every video game, smartphone app, and computer program is made entirely of binary numbers! 
          When you're playing games or watching videos, millions of 0s and 1s are working together to create everything you see on the screen!
        </p>
      </div>

      <h2 style={styles.h2}>
        <span style={styles.emoji}>🚀</span>
        You're Ready!
      </h2>

      <div style={styles.example}>
        <p>
          <strong>Congratulations!</strong> You now know the secret language that computers use to do everything from sending text messages 
          to launching rockets! Binary might seem tricky at first, but with practice, you'll be converting and adding binary numbers like a pro! 🌟
        </p>
      </div>
    </div>
  );
};

export default BinaryAdditionExplanation;
