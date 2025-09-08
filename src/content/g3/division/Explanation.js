import React from 'react';

const DivisionExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#e74c3c',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#c0392b',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #c0392b',
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
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>➗ Division: Sharing & Grouping!</h1>
      
      <h2 style={styles.h2}>🤔 What is Division?</h2>
      <p>Division is splitting things into equal groups or sharing things fairly! It's the opposite of multiplication.</p>
      
      <div style={styles.example}>
        <strong>Example:</strong> 12 ÷ 3 = 4
        <br/>This means: "Take 12 things and split them into 3 equal groups"
        <br/>Each group will have 4 things!
      </div>

      <h2 style={styles.h2}>🍪 Equal Sharing</h2>
      <p>When we share things equally, everyone gets the same amount!</p>
      
      <div style={styles.visual}>
        <h3>Example: 15 cookies for 3 friends</h3>
        <p>👦 Friend 1: 🍪🍪🍪🍪🍪</p>
        <p>👧 Friend 2: 🍪🍪🍪🍪🍪</p>
        <p>👦 Friend 3: 🍪🍪🍪🍪🍪</p>
        <p><strong>15 ÷ 3 = 5 cookies each!</strong></p>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Sharing Tip:</strong> Count out the items and give one to each person, then repeat until all items are shared!
      </div>

      <h2 style={styles.h2}>📦 Making Groups</h2>
      <p>Sometimes we want to know how many groups we can make!</p>
      
      <div style={styles.example}>
        <strong>Example:</strong> 20 marbles, putting 4 in each bag
        <br/>🎒 Bag 1: ⚫⚫⚫⚫
        <br/>🎒 Bag 2: ⚫⚫⚫⚫  
        <br/>🎒 Bag 3: ⚫⚫⚫⚫
        <br/>🎒 Bag 4: ⚫⚫⚫⚫
        <br/>🎒 Bag 5: ⚫⚫⚫⚫
        <br/><strong>We can make 5 bags! 20 ÷ 4 = 5</strong>
      </div>

      <h2 style={styles.h2}>🔄 Division and Multiplication are Partners!</h2>
      <p>Division and multiplication work together like best friends!</p>
      
      <div style={styles.visual}>
        <h3>Fact Family Example:</h3>
        <p><strong>3 × 4 = 12</strong></p>
        <p><strong>4 × 3 = 12</strong></p>
        <p><strong>12 ÷ 3 = 4</strong></p>
        <p><strong>12 ÷ 4 = 3</strong></p>
        <p>They all use the same three numbers: 3, 4, and 12!</p>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🧠</span><strong>Memory Trick:</strong> If you know 6 × 7 = 42, then you also know 42 ÷ 6 = 7 and 42 ÷ 7 = 6!
      </div>

      <h2 style={styles.h2}>🎯 Division Strategies</h2>
      <div style={styles.example}>
        <strong>Strategy 1 - Use Multiplication:</strong>
        <br/>To solve 24 ÷ 6, think "6 times what equals 24?"
        <br/>6 × 4 = 24, so 24 ÷ 6 = 4!
        <br/><br/>
        <strong>Strategy 2 - Draw Pictures:</strong>
        <br/>Draw 24 circles and group them by 6s
        <br/>Count how many groups you made!
        <br/><br/>
        <strong>Strategy 3 - Use Skip Counting:</strong>
        <br/>Count by 6s: 6, 12, 18, 24
        <br/>That's 4 jumps, so 24 ÷ 6 = 4!
      </div>

      <h2 style={styles.h2}>🏃‍♂️ Real Life Division</h2>
      <div style={styles.example}>
        <strong>🍕 Pizza Party:</strong> 24 pizza slices for 8 people
        <br/>24 ÷ 8 = 3 slices per person!
        <br/><br/>
        <strong>🚗 Car Trips:</strong> 35 kids, 5 kids per car
        <br/>35 ÷ 5 = 7 cars needed!
        <br/><br/>
        <strong>📱 Phone Time:</strong> 60 minutes to share among 4 siblings
        <br/>60 ÷ 4 = 15 minutes each!
      </div>

      <div style={styles.visual}>
        <span style={styles.emoji}>🌟</span><strong>You're a Division Detective!</strong> Division helps us solve sharing problems and figure out how to split things fairly!
      </div>
    </div>
  );
};

export default DivisionExplanation;
