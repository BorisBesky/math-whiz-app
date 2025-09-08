import React from 'react';

const OperationsAlgebraicThinkingExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#4a90e2',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#e74c3c',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #e74c3c',
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
    funFact: {
      background: 'linear-gradient(135deg, #dda0dd 0%, #98d8c8 100%)',
      padding: '15px',
      borderRadius: '10px',
      margin: '15px 0',
      borderLeft: '5px solid #6c5ce7',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🧮 Operations & Algebraic Thinking (4.OA)</h1>
      
      <h2 style={styles.h2}>🔍 Multiplicative Comparisons</h2>
      <p>Learn to compare quantities using multiplication! When we say "3 times as many," we multiply to find the answer.</p>
      
      <div style={styles.example}>
        <strong>Example:</strong> Sarah has 4 stickers. Tom has 3 times as many stickers as Sarah. How many stickers does Tom have?
        <br/><strong>Solution:</strong> 4 × 3 = 12 stickers
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span><strong>Tip:</strong> Look for phrases like "times as many," "times as much," or "times larger" - these mean multiplication!
      </div>

      <h2 style={styles.h2}>🔢 Prime and Composite Numbers</h2>
      <p>Numbers can be organized into special groups based on their factors!</p>
      
      <div style={styles.example}>
        <strong>Prime Numbers:</strong> Have exactly 2 factors (1 and themselves)
        <br/>Examples: 2, 3, 5, 7, 11, 13, 17, 19...
        <br/><br/>
        <strong>Composite Numbers:</strong> Have more than 2 factors
        <br/>Examples: 4, 6, 8, 9, 10, 12, 14, 15...
      </div>
      
      <div style={styles.funFact}>
        <span style={styles.emoji}>🎯</span><strong>Fun Fact:</strong> The number 1 is neither prime nor composite - it's special!
      </div>

      <h2 style={styles.h2}>⚡ Factors and Multiples</h2>
      <p>Factors divide evenly into a number, while multiples are what you get when you multiply!</p>
      
      <div style={styles.example}>
        <strong>Factors of 12:</strong> 1, 2, 3, 4, 6, 12 (these all divide into 12 evenly)
        <br/><strong>Multiples of 5:</strong> 5, 10, 15, 20, 25, 30... (keep adding 5!)
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎮</span><strong>Memory Trick:</strong> Factors are smaller (they fit inside), multiples are bigger (they multiply up)!
      </div>

      <h2 style={styles.h2}>🔄 Number Patterns</h2>
      <p>Discover the rules that make number sequences work!</p>
      
      <div style={styles.example}>
        <strong>Pattern:</strong> 3, 6, 9, 12, 15, ?
        <br/><strong>Rule:</strong> Add 3 each time
        <br/><strong>Next number:</strong> 18
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🕵️</span><strong>Pattern Detective:</strong> Look at the difference between numbers to find the rule!
      </div>

      <div style={styles.funFact}>
        <span style={styles.emoji}>🌟</span><strong>You're Amazing!</strong> 4th grade math helps you think like a mathematician. Keep exploring patterns and relationships in numbers!
      </div>
    </div>
  );
};

export default OperationsAlgebraicThinkingExplanation;
