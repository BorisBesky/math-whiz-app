import React from 'react';

const MultiplicationExplanation = () => {
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
    visual: {
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 30px)',
      gridTemplateRows: 'repeat(3, 30px)',
      gap: '5px',
      margin: '20px auto',
      width: 'fit-content',
    },
    dot: {
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      background: '#e67e22',
      border: '2px solid #d35400',
    },
    skipCount: {
      fontSize: '1.4em',
      color: '#e67e22',
      margin: '10px 0',
      textAlign: 'center',
    },
  };

  // Generate dots for visual array (3 rows × 4 columns = 12)
  const arrayDots = Array.from({ length: 12 }, (_, index) => (
    <div key={index} style={styles.dot}></div>
  ));

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>✖️ Multiplication Magic!</h1>
      
      <h2 style={styles.h2}>🧮 What is Multiplication?</h2>
      <p>Multiplication is a fast way to add the same number many times! Instead of adding 3 + 3 + 3 + 3, we can say 4 × 3 = 12.</p>
      
      <div style={styles.example}>
        <strong>Example:</strong> 4 × 3 means "4 groups of 3"
        <br/>• Group 1: 3 items
        <br/>• Group 2: 3 items  
        <br/>• Group 3: 3 items
        <br/>• Group 4: 3 items
        <br/>• Total: 3 + 3 + 3 + 3 = 12
      </div>

      <h2 style={styles.h2}>🔢 Skip Counting</h2>
      <p>One great way to multiply is by skip counting! Let's count by 3s:</p>
      
      <div style={styles.visual}>
        <div style={styles.skipCount}>3, 6, 9, 12, 15, 18, 21, 24, 27, 30</div>
        <p>When we skip count by 3s four times, we land on 12!</p>
        <p><strong>So 4 × 3 = 12</strong></p>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Skip Counting Tip:</strong> Start at 0 and keep adding the same number!
      </div>

      <h2 style={styles.h2}>📊 Arrays and Groups</h2>
      <p>We can arrange objects in rows and columns to see multiplication!</p>
      
      <div style={styles.visual}>
        <h3>3 rows × 4 columns = 12 total</h3>
        <div style={styles.grid}>
          {arrayDots}
        </div>
        <p>Count the dots: 3 rows with 4 dots each = 3 × 4 = 12</p>
      </div>

      <h2 style={styles.h2}>🔄 The Commutative Property</h2>
      <p>The order doesn't matter! 3 × 4 is the same as 4 × 3.</p>
      
      <div style={styles.example}>
        <strong>Same Answer, Different Ways:</strong>
        <br/>• 3 × 4 = 12 (3 groups of 4)
        <br/>• 4 × 3 = 12 (4 groups of 3)
        <br/>• Both equal 12!
      </div>

      <h2 style={styles.h2}>👥 Real Life Examples</h2>
      <div style={styles.example}>
        <strong>🍕 Pizza Party:</strong> If you have 5 tables with 6 people at each table, how many people total?
        <br/>Answer: 5 × 6 = 30 people!
        <br/><br/>
        <strong>📚 Book Collection:</strong> If you have 4 shelves with 8 books on each shelf, how many books total?
        <br/>Answer: 4 × 8 = 32 books!
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span><strong>Remember:</strong> Multiplication is everywhere! Count rows in a garden, seats in a theater, or windows in a building!
      </div>

      <h2 style={styles.h2}>🎲 Multiplication Facts</h2>
      <div style={styles.visual}>
        <h3>Times Tables to Remember:</h3>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left'}}>
          <div>
            <strong>2s:</strong> 2, 4, 6, 8, 10<br/>
            <strong>5s:</strong> 5, 10, 15, 20, 25<br/>
            <strong>10s:</strong> 10, 20, 30, 40, 50
          </div>
          <div>
            <strong>3s:</strong> 3, 6, 9, 12, 15<br/>
            <strong>4s:</strong> 4, 8, 12, 16, 20<br/>
            <strong>9s:</strong> 9, 18, 27, 36, 45
          </div>
        </div>
      </div>

      <div style={styles.visual}>
        <span style={styles.emoji}>🎉</span><strong>You're a Multiplication Master!</strong> Practice makes perfect - the more you practice, the faster you'll become!
      </div>
    </div>
  );
};

export default MultiplicationExplanation;
