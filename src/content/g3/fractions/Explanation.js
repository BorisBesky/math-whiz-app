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
    stepBox: { background: '#f8f9fa', padding: '15px', borderRadius: '10px', margin: '10px 0', border: '2px dashed #e91e63' },
    centeredText: { textAlign: 'center', fontSize: '1.3em', margin: '10px 0' },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🍰 Fractions - Parts of a Whole!</h1>
      
      <h2 style={styles.h2}>🧩 What are Fractions?</h2>
      <p>Fractions show parts of something whole. Like slices of pizza or pieces of pie!</p>
      
      <div style={styles.example}>
        <strong>🍕 Pizza Example:</strong> If you cut a pizza into 8 slices and eat 3 slices:
        <br/>• You ate 3/8 of the pizza
        <br/>• The top number (3) = parts you have (numerator)
        <br/>• The bottom number (8) = total parts (denominator)
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
        <p>🍫 Half a chocolate bar = 🍫🍫 Two quarters = 🍫🍫🍫🍫 Four eighths</p>
        <p><strong>1/2 = 2/4 = 4/8</strong></p>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Equivalent Fraction Rule:</strong> Multiply or divide BOTH the top and bottom by the same number!
      </div>

      <h2 style={styles.h2}>⚖️ Comparing Fractions</h2>
      <p>Which fraction is bigger? Let's find out!</p>
      
      <div style={styles.visual}>
        <h3>Same Denominators (bottom numbers):</h3>
        <p>3/8 vs 5/8</p>
        <p>🍰🍰🍰⬜⬜⬜⬜⬜ vs 🍰🍰🍰🍰🍰⬜⬜⬜</p>
        <p><strong>5/8 is bigger because 5 &gt; 3!</strong></p>
      </div>
      
      <div style={styles.example}>
        <strong>Same Numerators (top numbers):</strong>
        <br/>Compare 2/3 vs 2/5
        <br/>• Same numerator (2), different denominators
        <br/>• The SMALLER denominator means BIGGER pieces!
        <br/>• 2/3 &gt; 2/5 (thirds are bigger than fifths)
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🍕</span><strong>Pizza Rule:</strong> If you share with fewer people (smaller denominator), everyone gets bigger slices!
      </div>

      <h2 style={styles.h2}>➕ Adding Fractions</h2>
      <p>When fractions have the SAME denominator, adding is easy!</p>
      
      <div style={styles.example}>
        <strong>Adding with Same Denominators:</strong>
        <div style={styles.centeredText}>
          <strong>1/4 + 2/4 = 3/4</strong>
        </div>
        <div style={styles.stepBox}>
          <strong>Step 1:</strong> Check - are the denominators the same? ✓ Yes, both are 4
          <br/><strong>Step 2:</strong> Add the numerators: 1 + 2 = 3
          <br/><strong>Step 3:</strong> Keep the same denominator: 4
          <br/><strong>Answer:</strong> 3/4
        </div>
      </div>
      
      <div style={styles.visual}>
        <p>🍕 One slice + 🍕🍕 Two slices = 🍕🍕🍕 Three slices</p>
        <p><strong>1/4 + 2/4 = 3/4 of the pizza!</strong></p>
      </div>
      
      <div style={styles.example}>
        <strong>Adding with Different Denominators:</strong>
        <div style={styles.centeredText}>
          <strong>1/2 + 1/4 = ?</strong>
        </div>
        <div style={styles.stepBox}>
          <strong>Step 1:</strong> Find a common denominator (4 works!)
          <br/><strong>Step 2:</strong> Convert 1/2 to fourths: 1/2 = 2/4
          <br/><strong>Step 3:</strong> Now add: 2/4 + 1/4 = 3/4
          <br/><strong>Answer:</strong> 3/4
        </div>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Adding Tip:</strong> You can only add fractions when they have the same denominator. If they don't, find a common denominator first!
      </div>

      <h2 style={styles.h2}>➖ Subtracting Fractions</h2>
      <p>Subtracting fractions works just like adding - keep the denominator, subtract the numerators!</p>
      
      <div style={styles.example}>
        <strong>Subtracting with Same Denominators:</strong>
        <div style={styles.centeredText}>
          <strong>5/6 - 2/6 = 3/6</strong>
        </div>
        <div style={styles.stepBox}>
          <strong>Step 1:</strong> Check - same denominators? ✓ Yes, both are 6
          <br/><strong>Step 2:</strong> Subtract the numerators: 5 - 2 = 3
          <br/><strong>Step 3:</strong> Keep the same denominator: 6
          <br/><strong>Answer:</strong> 3/6 (which can be simplified to 1/2!)
        </div>
      </div>
      
      <div style={styles.visual}>
        <p>🍪🍪🍪🍪🍪 Five sixths - 🍪🍪 Two sixths = 🍪🍪🍪 Three sixths</p>
        <p><strong>5/6 - 2/6 = 3/6 = 1/2</strong></p>
      </div>
      
      <div style={styles.example}>
        <strong>Subtracting with Different Denominators:</strong>
        <div style={styles.centeredText}>
          <strong>3/4 - 1/2 = ?</strong>
        </div>
        <div style={styles.stepBox}>
          <strong>Step 1:</strong> Find a common denominator (4 works!)
          <br/><strong>Step 2:</strong> Convert 1/2 to fourths: 1/2 = 2/4
          <br/><strong>Step 3:</strong> Now subtract: 3/4 - 2/4 = 1/4
          <br/><strong>Answer:</strong> 1/4
        </div>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🧮</span><strong>Subtraction Rule:</strong> Just like addition - get the same denominator first, then subtract the numerators!
      </div>

      <h2 style={styles.h2}>✨ Simplifying Fractions</h2>
      <p>Simplifying means making a fraction as simple as possible while keeping the same value!</p>
      
      <div style={styles.example}>
        <strong>How to Simplify:</strong>
        <div style={styles.centeredText}>
          <strong>Simplify 4/8</strong>
        </div>
        <div style={styles.stepBox}>
          <strong>Step 1:</strong> Find a number that divides BOTH top and bottom evenly
          <br/>• 4 and 8 can both be divided by 2... or by 4!
          <br/><strong>Step 2:</strong> Divide both by that number
          <br/>• Using 4: (4÷4)/(8÷4) = 1/2
          <br/><strong>Answer:</strong> 4/8 = 1/2
        </div>
      </div>
      
      <div style={styles.visual}>
        <p><strong>More Examples:</strong></p>
        <p>6/9 → divide by 3 → 2/3 ✓</p>
        <p>8/12 → divide by 4 → 2/3 ✓</p>
        <p>10/15 → divide by 5 → 2/3 ✓</p>
      </div>
      
      <div style={styles.example}>
        <strong>Finding the Greatest Common Factor (GCF):</strong>
        <br/>To simplify 12/18:
        <br/>• Factors of 12: 1, 2, 3, 4, 6, 12
        <br/>• Factors of 18: 1, 2, 3, 6, 9, 18
        <br/>• Common factors: 1, 2, 3, 6
        <br/>• Greatest Common Factor: 6
        <br/>• 12÷6 / 18÷6 = 2/3 ✓
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🔍</span><strong>Simplifying Tip:</strong> A fraction is fully simplified when you can't find any number (except 1) that divides both the top and bottom evenly!
      </div>

      <div style={styles.visual}>
        <span style={styles.emoji}>🌟</span><strong>You're a Fraction Champion!</strong> Fractions help us share things fairly, compare amounts, and solve real-world problems!
      </div>
    </div>
  );
};

export default FractionsExplanation;
