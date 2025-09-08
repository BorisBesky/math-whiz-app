import React from 'react';

const MeasurementDataExplanation = () => {
  const styles = {
    container: { fontFamily: "'Comic Sans MS', cursive, sans-serif", lineHeight: 1.6, color: '#333', padding: '0', margin: '0' },
    h1: { color: '#26a69a', textAlign: 'center', fontSize: '2.5em', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' },
    h2: { color: '#00695c', fontSize: '1.8em', marginTop: '30px', borderBottom: '3px solid #00695c', paddingBottom: '10px' },
    example: { background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', padding: '20px', borderRadius: '15px', margin: '20px 0', borderLeft: '5px solid #e17055' },
    tip: { background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)', padding: '15px', borderRadius: '10px', margin: '15px 0', borderLeft: '5px solid #00b894' },
    visual: { background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)', padding: '20px', borderRadius: '15px', margin: '20px 0', border: '3px solid #3498db', textAlign: 'center' },
    emoji: { fontSize: '1.5em', marginRight: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 25px)', gridTemplateRows: 'repeat(3, 25px)', gap: '2px', margin: '15px auto', width: 'fit-content' },
    square: { background: '#4ecdc4', border: '1px solid #26a69a' },
  };

  const gridSquares = Array.from({ length: 12 }, (_, index) => (
    <div key={index} style={styles.square}></div>
  ));

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>📏 Measurement & Data</h1>
      
      <h2 style={styles.h2}>📐 Area - Space Inside</h2>
      <p>Area tells us how much space is inside a shape. We measure it in square units!</p>
      
      <div style={styles.visual}>
        <h3>Rectangle: 4 units × 3 units</h3>
        <div style={styles.grid}>{gridSquares}</div>
        <p><strong>Area = 4 × 3 = 12 square units</strong></p>
      </div>
      
      <div style={styles.example}>
        <strong>🏠 Real Life:</strong> How much carpet do you need for a room?
        <br/>Room: 10 feet long × 8 feet wide
        <br/>Area = 10 × 8 = 80 square feet of carpet!
      </div>

      <h2 style={styles.h2}>🔲 Perimeter - Distance Around</h2>
      <p>Perimeter is like walking all the way around the outside of a shape!</p>
      
      <div style={styles.example}>
        <strong>Example:</strong> Rectangle with sides 6 cm and 4 cm
        <br/>• Walk around: 6 + 4 + 6 + 4 = 20 cm
        <br/>• Formula: 2 × (length + width) = 2 × (6 + 4) = 20 cm
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🚶</span><strong>Perimeter Tip:</strong> Add up ALL the sides to find how far you walk around!
      </div>

      <h2 style={styles.h2}>📦 Volume - Space Inside 3D Objects</h2>
      <p>Volume tells us how many cubes fit inside a box or container!</p>
      
      <div style={styles.example}>
        <strong>🧊 Cube Counting:</strong> A box is 3 cubes long, 2 cubes wide, 2 cubes high
        <br/>• Bottom layer: 3 × 2 = 6 cubes
        <br/>• Two layers: 6 × 2 = 12 cubes total
        <br/>• Volume = 3 × 2 × 2 = 12 cubic units
      </div>

      <div style={styles.visual}>
        <span style={styles.emoji}>🌟</span><strong>You're a Measurement Expert!</strong> These skills help us build, decorate, and understand the world around us!
      </div>
    </div>
  );
};

export default MeasurementDataExplanation;
