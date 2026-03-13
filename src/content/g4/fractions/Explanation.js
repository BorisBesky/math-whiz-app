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
      
      <div style={styles.example}>
        <strong>Converting Fractions to Decimals:</strong>
        <br/>• ¹⁄₁₀ = 1 ÷ 10 = 0.1 (one tenth)
        <br/>• ⁵⁄₁₀₀ = 5 ÷ 100 = 0.05 (five hundredths)
        <br/>• ²⁵⁄₁₀₀ = 25 ÷ 100 = 0.25 (twenty-five hundredths)
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span><strong>Decimal Trick:</strong> For tenths, put one digit after the decimal point. For hundredths, put two digits!
      </div>

      <h3 style={{...styles.h2, fontSize: '1.4em', borderBottom: '2px dashed #ad1457', marginTop: '20px'}}>📏 Decimals on a Number Line</h3>
      <p>You can show decimals on a number line! This helps you see how big or small they are.</p>

      <div style={styles.fractionVisual}>
        <p><strong>A number line from 0 to 1:</strong></p>
        <div style={{fontFamily: 'monospace', fontSize: '1.1em'}}>
          0 ---|---|---|---|---|---|---|---|---|---| 1
        </div>
        <p style={{fontSize: '0.9em'}}>Each big mark = 0.1 (one tenth)</p>
        <p style={{fontSize: '0.9em'}}>Each tiny mark = 0.01 (one hundredth)</p>
      </div>

      <div style={styles.example}>
        <strong>Placing 0.75 on the number line:</strong>
        <br/>• Start at 0
        <br/>• Count 7 big marks to reach 0.7
        <br/>• Count 5 more small marks to reach 0.75
        <br/>• That is three-quarters of the way from 0 to 1!
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span><strong>Number Line Tip:</strong> Think of the number line like a ruler! 0.50 is right in the middle. Numbers less than 0.50 are in the left half, and numbers greater than 0.50 are in the right half.
      </div>

      <h2 style={styles.h2}>🧮 Decimal Operations</h2>
      <p>Once you know how to write decimals, you can add, subtract, multiply, and divide them!</p>

      <h3 style={{...styles.h2, fontSize: '1.4em', borderBottom: '2px dashed #ad1457', marginTop: '20px'}}>➕ Adding Decimals</h3>
      <p>Line up the decimal points, then add just like whole numbers!</p>

      <div style={styles.example}>
        <strong>Example: 3.25 + 4.1</strong>
        <br/>
        <div style={{fontFamily: 'monospace', fontSize: '1.2em', margin: '10px 0'}}>
          {'  3.25'}
          <br/>{'+ 4.10'} (Fill empty spots with 0)
          <br/>{'______'}
          <br/>{'  7.35'}
        </div>
      </div>

      <h3 style={{...styles.h2, fontSize: '1.4em', borderBottom: '2px dashed #ad1457', marginTop: '20px'}}>➖ Subtracting Decimals</h3>
      <p>Line up the decimal points, then subtract just like whole numbers!</p>

      <div style={styles.example}>
        <strong>Example: 5.80 - 2.35</strong>
        <br/>
        <div style={{fontFamily: 'monospace', fontSize: '1.2em', margin: '10px 0'}}>
          {'  5.80'}
          <br/>{'- 2.35'}
          <br/>{'______'}
          <br/>{'  3.45'}
        </div>
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span><strong>Decimal Lineup Trick:</strong> Always line up the decimal points! Add zeros at the end if one number has fewer decimal places.
      </div>

      <h3 style={{...styles.h2, fontSize: '1.4em', borderBottom: '2px dashed #ad1457', marginTop: '20px'}}>✖️ Multiplying Decimals</h3>
      <p>Multiply the numbers as if the decimals weren't there, then put the decimal back in!</p>

      <div style={styles.example}>
        <strong>Example: 0.5 × 0.3</strong>
        <br/>• Ignore decimals: 5 × 3 = 15
        <br/>• Count decimal places: 0.5 (1 place) + 0.3 (1 place) = 2 places
        <br/>• Move dot 2 places left in 15: .15
        <br/>• Answer: 0.15
      </div>

      <h3 style={{...styles.h2, fontSize: '1.4em', borderBottom: '2px dashed #ad1457', marginTop: '20px'}}>➗ Dividing Decimals</h3>
      <p>Make the number you are dividing by a whole number first!</p>

      <div style={styles.example}>
        <strong>Example: 3.6 ÷ 0.6</strong>
        <br/>• Move decimal in 0.6 one hop right → 6
        <br/>• Move decimal in 3.6 one hop right → 36
        <br/>• Divide: 36 ÷ 6 = 6
        <br/>• Answer: 6
      </div>

      <h2 style={styles.h2}>🔄 Mixed Numbers</h2>
      <p>A mixed number has a whole number AND a fraction together!</p>
      
      <div style={styles.fractionVisual}>
        <div style={styles.flexContainer}>
          <div>
            <div style={styles.fraction}>2³⁄₄</div>
            <p>Two and three-fourths</p>
          </div>
          <div style={styles.equals}>=</div>
          <div>
            <p>🍕🍕 + 🍕🍕🍕 (of 🍕🍕🍕🍕)</p>
            <p>2 whole pizzas + ³⁄₄ of another</p>
          </div>
        </div>
      </div>
      
      <div style={styles.example}>
        <strong>Converting Mixed Numbers to Improper Fractions:</strong>
        <br/>Convert 2³⁄₄ to an improper fraction:
        <br/>• Multiply whole number by denominator: 2 × 4 = 8
        <br/>• Add the numerator: 8 + 3 = 11
        <br/>• Put over the same denominator: ¹¹⁄₄
        <br/>• So 2³⁄₄ = ¹¹⁄₄ ✓
      </div>
      
      <div style={styles.example}>
        <strong>Converting Improper Fractions to Mixed Numbers:</strong>
        <br/>Convert ¹¹⁄₄ to a mixed number:
        <br/>• Divide: 11 ÷ 4 = 2 remainder 3
        <br/>• The quotient (2) is the whole number
        <br/>• The remainder (3) is the new numerator
        <br/>• So ¹¹⁄₄ = 2³⁄₄ ✓
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Mixed Number Tip:</strong> An improper fraction has a numerator BIGGER than the denominator (like ⁷⁄₄). A mixed number shows this more clearly (1³⁄₄).
      </div>
      
      <div style={styles.example}>
        <strong>Adding Mixed Numbers:</strong>
        <br/>1²⁄₅ + 2¹⁄₅ = ?
        <br/>• Add the whole numbers: 1 + 2 = 3
        <br/>• Add the fractions: ²⁄₅ + ¹⁄₅ = ³⁄₅
        <br/>• Combine: 3³⁄₅ ✓
      </div>

      <div style={styles.fractionVisual}>
        <span style={styles.emoji}>🎉</span><strong>You're a Fraction Master!</strong> Fractions help us understand parts of wholes - just like sharing treats with friends!
      </div>
    </div>
  );
};

export default FractionsExplanation;
