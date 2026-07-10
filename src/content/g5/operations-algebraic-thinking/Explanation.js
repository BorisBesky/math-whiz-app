import React from 'react';

// Shown when a student taps "Explain" on an Operations & Algebraic Thinking 5th question.
// Follows the kid-friendly inline-style pattern of the other Explanations.
const OperationsAlgebraicThinking5thExplanation = () => {
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
      <h1 style={styles.h1}>🧮 Expressions, Primes & Patterns!</h1>

      <h2 style={styles.h2}>🎯 Order of operations</h2>
      <p>
        When an expression has parentheses <strong>( )</strong> or brackets <strong>[ ]</strong>,
        always work from the <strong>inside out</strong>: parentheses first, then brackets, then
        multiply or divide, and finally add or subtract.
      </p>
      <div style={styles.visual}>
        [4 + (10 − 7)] × 5
        <br />
        Inside first: 10 − 7 = <strong>3</strong>
        <br />
        Brackets next: 4 + 3 = <strong>7</strong>
        <br />
        Multiply last: 7 × 5 = <strong>35</strong> 🎉
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Tip:</strong> No parentheses? Multiplication still comes before addition:
        2 + 3 × 4 = 2 + 12 = 14, not 20!
      </div>

      <h2 style={styles.h2}>✍️ Writing expressions from words</h2>
      <p>
        The step that happens <strong>last</strong> goes on the <strong>outside</strong>. Earlier
        steps hide inside parentheses.
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>🗣️</span>
        "Add 8 and 7, <em>then</em> multiply by 2" → the multiplying happens last, so:{' '}
        <strong>2 × (8 + 7)</strong>
      </div>
      <p>
        And you can compare expressions <strong>without calculating</strong>: 3 × (18932 + 921) is
        exactly <strong>3 times as large</strong> as 18932 + 921 — no adding needed!
      </p>

      <h2 style={styles.h2}>🔢 Prime factorization</h2>
      <p>
        Every whole number can be broken down into <strong>prime</strong> building blocks (2, 3,
        5, 7, 11, …). Keep splitting until every piece is prime.
      </p>
      <div style={styles.visual}>
        24 = 4 × 6
        <br />
        4 = 2 × 2 and 6 = 2 × 3
        <br />
        So 24 = <strong>2 × 2 × 2 × 3</strong> 🧱
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>✅</span>
        <strong>Check yourself:</strong> every factor must be prime, and they must multiply back
        to your number: 2 × 2 × 2 × 3 = 24. ✓
      </div>

      <h2 style={styles.h2}>📈 Two patterns at once</h2>
      <p>
        Two patterns can grow together! Compare their <strong>matching terms</strong> (first with
        first, second with second …) to find the relationship.
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>🅰️</span> Pattern A (add 3): 0, 3, 6, 9, 12
        <br />
        <span style={styles.emoji}>🅱️</span> Pattern B (add 6): 0, 6, 12, 18, 24
        <br />
        Every term of B is <strong>2 times</strong> its matching term in A. As ordered pairs:
        (0, 0), (3, 6), (6, 12), (9, 18) — ready to graph!
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span>
        <strong>Remember:</strong> in an ordered pair, Pattern A comes first, Pattern B second.
      </div>
    </div>
  );
};

export default OperationsAlgebraicThinking5thExplanation;
