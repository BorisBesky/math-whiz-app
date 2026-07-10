import React from 'react';

// Shown when a student taps "Explain" on a Fractions 5th question.
// Follows the kid-friendly inline-style pattern of the other Explanations.
const Fractions5thExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#e11d48',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#be123c',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #be123c',
      paddingBottom: '10px',
    },
    example: {
      background: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      borderLeft: '5px solid #e11d48',
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
      <h1 style={styles.h1}>½ Fraction Power-Ups!</h1>

      <h2 style={styles.h2}>➕ Unlike denominators? Make them match!</h2>
      <p>
        You can only add or subtract fractions when the pieces are the{' '}
        <strong>same size</strong>. Different denominators? Rewrite both fractions with a{' '}
        <strong>common denominator</strong> first.
      </p>
      <div style={styles.visual}>
        2/3 + 5/4 → twelfths! → 8/12 + 15/12 = <strong>23/12</strong>
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>⚠️</span>
        <strong>Never</strong> add straight across: 1/2 + 1/3 is NOT 2/5 — it's 3/6 + 2/6 ={' '}
        <strong>5/6</strong>.
      </div>
      <p>
        Mixed numbers work the same way — turn them into fractions first, then convert back:
        2 1/3 + 1 1/2 = 7/3 + 3/2 = 14/6 + 9/6 = 23/6 = <strong>3 5/6</strong>.
      </p>

      <h2 style={styles.h2}>🍕 A fraction IS division</h2>
      <p>
        The fraction bar means "divided by": <strong>3/4 = 3 ÷ 4</strong>. If 4 friends share 3
        pizzas equally, each friend gets <strong>3/4</strong> of a pizza!
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>🤔</span>
        Where does 17 ÷ 5 land? 5 × 3 = 15 and 5 × 4 = 20, so 17 ÷ 5 = 17/5 is{' '}
        <strong>between 3 and 4</strong>.
      </div>

      <h2 style={styles.h2}>✖️ Multiplying fractions</h2>
      <p>
        Multiply the <strong>tops</strong> together and the <strong>bottoms</strong> together —
        then simplify.
      </p>
      <div style={styles.visual}>
        2/3 × 4/5 = <strong>8/15</strong> · 3/4 of 20 = <strong>15</strong>
      </div>
      <p>
        This also finds areas: a rectangle 2/3 m long and 4/5 m wide covers{' '}
        <strong>8/15 square meter</strong>.
      </p>

      <h2 style={styles.h2}>🔮 Scaling: predict without computing</h2>
      <p>Compare the fraction to 1 and you instantly know how the product compares:</p>
      <div style={styles.example}>
        <span style={styles.emoji}>📉</span> 4/5 × 60 is <strong>less than 60</strong> (4/5 &lt; 1
        shrinks it)
        <br />
        <span style={styles.emoji}>📈</span> 7/5 × 60 is <strong>greater than 60</strong> (7/5 &gt;
        1 grows it)
        <br />
        <span style={styles.emoji}>⚖️</span> 5/5 × 60 is <strong>exactly 60</strong> (5/5 = 1
        changes nothing)
      </div>

      <h2 style={styles.h2}>➗ Dividing with unit fractions</h2>
      <div style={styles.visual}>
        1/3 ÷ 4 = <strong>1/12</strong> (splitting a third into 4 parts makes twelfths)
        <br />
        4 ÷ 1/3 = <strong>12</strong> (each whole holds 3 thirds — 4 wholes hold 12)
      </div>
      <div style={styles.example}>
        <span style={styles.emoji}>🥣</span>
        How many 1/3-cup servings are in 2 cups of raisins? 2 ÷ 1/3 = <strong>6 servings</strong>.
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span>
        <strong>Remember:</strong> dividing by a small piece gives a BIG answer — and dividing a
        small piece gives a tiny one!
      </div>
    </div>
  );
};

export default Fractions5thExplanation;
