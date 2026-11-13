import React from 'react';

// Shown when a student taps "Explain" on an Algebra question.
// Follows the kid-friendly inline-style pattern of the other Explanations.
const AlgebraExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#7c3aed',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#6d28d9',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #6d28d9',
      paddingBottom: '10px',
    },
    example: {
      background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      borderLeft: '5px solid #7c3aed',
    },
    tip: {
      background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
      padding: '15px',
      borderRadius: '10px',
      margin: '15px 0',
      borderLeft: '5px solid #00b894',
    },
    visual: {
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
      textAlign: 'center',
      fontSize: '1.2em',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>ⓧ Algebra: The Mystery Number Game!</h1>

      <h2 style={styles.h2}>🔤 What is a variable?</h2>
      <p>
        A <strong>variable</strong> is a letter — like <strong>n</strong>, <strong>k</strong>, or{' '}
        <strong>x</strong> — that stands for a number we don't know yet. Think of it as a
        mystery box with a number hiding inside!
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>📦</span>
        Sam has some marbles. We don't know how many, so we write <strong>m</strong>. If Sam
        gets 3 more and now has 10, we can write: <strong>m + 3 = 10</strong>. The mystery
        number m must be <strong>7</strong>!
      </div>

      <h2 style={styles.h2}>🧮 Evaluating expressions</h2>
      <p>
        <strong>Evaluating</strong> means replacing the variable with its value and doing the
        math. Always multiply or divide <em>before</em> you add or subtract.
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>✏️</span>
        If <strong>n = 4</strong>, what is <strong>3 × n + 2</strong>?
        <br />
        Step 1: Replace n with 4 → <strong>3 × 4 + 2</strong>
        <br />
        Step 2: Multiply first → <strong>12 + 2</strong>
        <br />
        Step 3: Add → <strong>14</strong> 🎉
      </div>

      <h2 style={styles.h2}>⚖️ Solving one-step equations</h2>
      <p>
        An equation is like a balanced scale — both sides are equal. To find the mystery
        number, <strong>undo</strong> what was done to it, and do the same to both sides.
      </p>
      <div style={styles.visual}>
        n + 5 = 12 → undo the +5 → n = 12 − 5 → <strong>n = 7</strong>
        <br />
        n − 4 = 9 → undo the −4 → n = 9 + 4 → <strong>n = 13</strong>
        <br />
        3 × n = 15 → undo the ×3 → n = 15 ÷ 3 → <strong>n = 5</strong>
        <br />
        n ÷ 2 = 6 → undo the ÷2 → n = 6 × 2 → <strong>n = 12</strong>
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Tip:</strong> Addition and subtraction undo each other. Multiplication and
        division undo each other. Check your answer by putting it back into the equation!
      </div>

      <h2 style={styles.h2}>🤖 Number machines (input → output)</h2>
      <p>
        A number machine takes an <strong>input</strong>, follows a <strong>rule</strong>, and
        gives an <strong>output</strong>. To find a missing input, run the machine backwards!
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>➡️</span>
        Rule: <strong>multiply by 3, then add 1</strong>. Input 4 → 4 × 3 = 12 → 12 + 1 ={' '}
        <strong>13</strong>.
        <br />
        <span style={styles.emoji}>⬅️</span>
        Output 13? Work backwards: 13 − 1 = 12 → 12 ÷ 3 = <strong>4</strong>.
      </div>

      <h2 style={styles.h2}>📈 Growing patterns</h2>
      <p>
        A growing pattern adds the same amount each time. Find the jump between numbers, and
        you can keep the pattern going forever!
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>🐸</span>
        3, 7, 11, 15, __ — each number jumps up by <strong>4</strong>, so the next number is{' '}
        <strong>19</strong>. The rule is: <strong>add 4 each time</strong>.
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span>
        <strong>Remember:</strong> Variables are just mystery numbers — and you are the
        detective! 🕵️
      </div>
    </div>
  );
};

export default AlgebraExplanation;
