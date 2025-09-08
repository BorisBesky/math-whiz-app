import React from 'react';

const FractionsExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#e91e63',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#ad1457',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #ad1457',
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
    fractionVisual: {
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
    fraction: {
      fontSize: '2em',
      fontWeight: 'bold',
      color: '#e91e63',
      margin: '10px',
    },
    visualBar: {
      background: '#ecf0f1',
      height: '40px',
      borderRadius: '20px',
      margin: '15px 0',
      position: 'relative',
      border: '2px solid #34495e',
    },
    filledPart: {
      background: 'linear-gradient(90deg, #e74c3c, #f39c12)',
      height: '36px',
      borderRadius: '18px',
      margin: '2px',
    },
    flexContainer: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    centeredText: {
      textAlign: 'center',
      fontSize: '1.5em',
    },
    decimalExamples: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      fontSize: '1.3em',
    },
    equals: {
      fontSize: '2em',
      color: '#e91e63',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🍰 Number & Operations - Fractions (4.NF)</h1>
      
      <h2 style={styles.h2}>🔄 Equivalent Fractions</h2>
      <p>Different fractions can represent the same amount! It's like cutting the same pizza into different sized pieces.</p>
      
      <div style={styles.fractionVisual}>
        <div style={styles.flexContainer}>
          <div>
            <div style={styles.fraction}>½</div>
            <div style={{...styles.visualBar, width: '100px'}}>
              <div style={{...styles.filledPart, width: '50%'}}></div>
            </div>
          </div>
          <div style={styles.equals}>=</div>
          <div>
            <div style={styles.fraction}>²⁄₄</div>
            <div style={{...styles.visualBar, width: '100px'}}>
              <div style={{...styles.filledPart, width: '50%'}}></div>
            </div>
          </div>
          <div style={styles.equals}>=</div>
          <div>
            <div style={styles.fraction}>⁴⁄₈</div>
            <div style={{...styles.visualBar, width: '100px'}}>
              <div style={{...styles.filledPart, width: '50%'}}></div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Equivalent Fraction Trick:</strong> Multiply or divide both the top and bottom by the same number!
      </div>

      <h2 style={styles.h2}>📊 Comparing Fractions</h2>
      <p>When fractions have the same denominator (bottom number), compare the numerators (top numbers)!</p>
      
      <div style={styles.example}>
        <strong>Compare: ³⁄₈ and ⁵⁄₈</strong>
        <br/>• Same denominator (8), so compare numerators
        <br/>• 3 &lt; 5
        <br/>• Therefore: ³⁄₈ &lt; ⁵⁄₈
      </div>
      
      <div style={styles.example}>
        <strong>Compare: ²⁄₃ and ³⁄₄</strong>
        <br/>• Different denominators, so find equivalent fractions
        <br/>• ²⁄₃ = ⁸⁄₁₂ and ³⁄₄ = ⁹⁄₁₂
        <br/>• 8 &lt; 9, so ²⁄₃ &lt; ³⁄₄
      </div>

      <h2 style={styles.h2}>➕ Adding Fractions with Like Denominators</h2>
      <p>When the bottom numbers are the same, just add the top numbers!</p>
      
      <div style={styles.example}>
        <div style={styles.centeredText}>
          <strong>²⁄₇ + ³⁄₇ = ⁵⁄₇</strong>
        </div>
        <br/>Step by step:
        <br/>• Same denominators (7) ✓
        <br/>• Add numerators: 2 + 3 = 5
        <br/>• Keep the same denominator: 7
        <br/>• Answer: ⁵⁄₇
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🍕</span><strong>Pizza Rule:</strong> If you have pizza slices of the same size, just count how many you have total!
      </div>

      <h2 style={styles.h2}>➖ Subtracting Fractions with Like Denominators</h2>
      <p>Just like addition, but subtract the top numbers instead!</p>
      
      <div style={styles.example}>
        <div style={styles.centeredText}>
          <strong>⁶⁄₉ - ²⁄₉ = ⁴⁄₉</strong>
        </div>
        <br/>Step by step:
        <br/>• Same denominators (9) ✓
        <br/>• Subtract numerators: 6 - 2 = 4
        <br/>• Keep the same denominator: 9
        <br/>• Answer: ⁴⁄₉
      </div>

      <h2 style={styles.h2}>✖️ Multiplying Fractions by Whole Numbers</h2>
      <p>To multiply a fraction by a whole number, multiply the numerator (top) by the whole number!</p>
      
      <div style={styles.example}>
        <strong>3 × ²⁄₅ = ?</strong>
        <br/>• Multiply the numerator: 3 × 2 = 6
        <br/>• Keep the denominator: 5
        <br/>• Answer: ⁶⁄₅ (or 1¹⁄₅)
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🔢</span><strong>Think of it as:</strong> How many groups of ²⁄₅ do you have when you take 3 groups?
      </div>

      <h2 style={styles.h2}>🔢 Decimal Notation</h2>
      <p>Some fractions can be written as decimals! These are especially useful for tenths and hundredths.</p>
      
      <div style={styles.fractionVisual}>
        <div style={styles.decimalExamples}>
          <div>¹⁄₁₀ = 0.1</div>
          <div>³⁄₁₀ = 0.3</div>
          <div>¹⁄₄ = 0.25</div>
          <div>¹⁄₂ = 0.5</div>
          <div>³⁄₄ = 0.75</div>
        </div>
      </div>

      <div style={styles.fractionVisual}>
        <span style={styles.emoji}>🎉</span><strong>You're a Fraction Master!</strong> Fractions help us understand parts of wholes - just like sharing treats with friends!
      </div>
    </div>
  );
};

export default FractionsExplanation;
