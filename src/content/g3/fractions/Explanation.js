import React from 'react';

const FractionsExplanation = () => {
  const styles = {
    container: { fontFamily: "'Comic Sans MS', cursive, sans-serif", lineHeight: 1.6, color: '#333', padding: '0', margin: '0' },
    h1: { color: '#e91e63', textAlign: 'center', fontSize: '2.5em', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' },
    h2: { color: '#ad1457', fontSize: '1.8em', marginTop: '30px', borderBottom: '3px solid #ad1457', paddingBottom: '10px' },
    example: { background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', padding: '20px', borderRadius: '15px', margin: '20px 0', borderLeft: '5px solid #e17055' },
    tip: { background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)', padding: '15px', borderRadius: '10px', margin: '15px 0', borderLeft: '5px solid #00b894' },
    visual: { background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)', padding: '20px', borderRadius: '15px', margin: '20px 0', border: '3px solid #3498db', textAlign: 'center' },
    emoji: { fontSize: '1.5em', marginRight: '10px' },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🍰 Fractions - Parts of a Whole!</h1>
      
      <h2 style={styles.h2}>🧩 What are Fractions?</h2>
      <p>Fractions show parts of something whole. Like slices of pizza or pieces of pie!</p>
      
      <div style={styles.example}>
        <strong>🍕 Pizza Example:</strong> If you cut a pizza into 8 slices and eat 3 slices:
        <br/>• You ate 3/8 of the pizza
        <br/>• The top number (3) = parts you have
        <br/>• The bottom number (8) = total parts
      </div>

      <h2 style={styles.h2}>⚖️ Comparing Fractions</h2>
      <div style={styles.visual}>
        <h3>Same Bottom Numbers (Denominators):</h3>
        <p>3/8 vs 5/8</p>
        <p>🍰🍰🍰⬜⬜⬜⬜⬜ vs 🍰🍰🍰🍰🍰⬜⬜⬜</p>
        <p><strong>5/8 is bigger because 5 &gt; 3!</strong></p>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Comparison Tip:</strong> When denominators are the same, compare the numerators!
      </div>

      <h2 style={styles.h2}>🔄 Equivalent Fractions</h2>
      <p>Different fractions can be equal! Like 1/2 = 2/4 = 4/8</p>
      
      <div style={styles.example}>
        <strong>Making Equivalent Fractions:</strong>
        <br/>• Start with 1/2
        <br/>• Multiply top and bottom by 2: (1×2)/(2×2) = 2/4
        <br/>• Multiply top and bottom by 4: (1×4)/(2×4) = 4/8
        <br/>• They're all the same amount!
      </div>

      <div style={styles.visual}>
        <span style={styles.emoji}>🌟</span><strong>You're a Fraction Champion!</strong> Fractions help us share things fairly and understand parts of wholes!
      </div>
    </div>
  );
};

export default FractionsExplanation;
