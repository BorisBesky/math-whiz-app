import React from 'react';

const MeasurementDataExplanation = () => {

  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#26a69a',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#00695c',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #00695c',
      paddingBottom: '10px',
    },
    h3: {
      color: '#00695c',
      fontSize: '1.4em',
      margin: '15px 0',
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
    conversionChart: {
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
    measurementVisual: {
      textAlign: 'center',
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      margin: '15px 0',
      border: '2px solid #26a69a',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      textAlign: 'center',
    },
    gridItem: {
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
    },
    rectangleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 30px)',
      gridTemplateRows: 'repeat(4, 30px)',
      gap: '2px',
      margin: '20px auto',
      width: 'fit-content',
    },
    gridSquare: {
      background: '#4ecdc4',
      border: '1px solid #26a69a',
    },
    linePlot: {
      fontFamily: 'monospace',
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      whiteSpace: 'pre-line',
    },
    angleGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '20px',
      textAlign: 'center',
    },
    timeChart: {
      textAlign: 'center',
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
    },
  };

  // Generate grid squares for the rectangle visualization
  const gridSquares = Array.from({ length: 24 }, (_, index) => (
    <div key={index} style={styles.gridSquare}></div>
  ));

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>📏 Measurement & Data (4.MD)</h1>
      
      <h2 style={styles.h2}>🔄 Unit Conversions</h2>
      <p>Learn to convert between different units of measurement! It's like translating between different measurement languages.</p>
      
      <div style={styles.conversionChart}>
        <h3 style={styles.h3}>📐 Length Conversions</h3>
        <div style={styles.gridContainer}>
          <div style={styles.gridItem}>
            <strong>Customary Units</strong><br/>
            1 foot = 12 inches<br/>
            1 yard = 3 feet<br/>
            1 yard = 36 inches<br/>
            1 mile = 5,280 feet
          </div>
          <div style={styles.gridItem}>
            <strong>Metric Units</strong><br/>
            1 meter = 100 centimeters<br/>
            1 kilometer = 1,000 meters<br/>
            1 meter = 1,000 millimeters
          </div>
        </div>
      </div>
      
      <div style={styles.example}>
        <strong>Example:</strong> How many inches are in 3 feet?
        <br/>• 1 foot = 12 inches
        <br/>• 3 feet = 3 × 12 = 36 inches
      </div>

      <div style={styles.conversionChart}>
        <h3 style={styles.h3}>⚖️ Weight/Mass Conversions</h3>
        <div style={styles.gridContainer}>
          <div style={styles.gridItem}>
            <strong>Customary Units</strong><br/>
            1 pound = 16 ounces<br/>
            1 ton = 2,000 pounds
          </div>
          <div style={styles.gridItem}>
            <strong>Metric Units</strong><br/>
            1 kilogram = 1,000 grams<br/>
            1 gram = 1,000 milligrams
          </div>
        </div>
      </div>

      <div style={styles.conversionChart}>
        <h3 style={styles.h3}>🥤 Capacity Conversions</h3>
        <div style={styles.gridContainer}>
          <div style={styles.gridItem}>
            <strong>Customary Units</strong><br/>
            1 gallon = 4 quarts<br/>
            1 quart = 2 pints<br/>
            1 pint = 2 cups
          </div>
          <div style={styles.gridItem}>
            <strong>Metric Units</strong><br/>
            1 liter = 1,000 milliliters
          </div>
        </div>
      </div>

      <div style={styles.conversionChart}>
        <h3 style={styles.h3}>⏰ Time Conversions</h3>
        <div style={styles.timeChart}>
          1 hour = 60 minutes<br/>
          1 minute = 60 seconds<br/>
          1 day = 24 hours<br/>
          1 week = 7 days<br/>
          1 year = 12 months
        </div>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🧠</span><strong>Conversion Tip:</strong> Multiply when going from bigger to smaller units, divide when going from smaller to bigger!
      </div>

      <h2 style={styles.h2}>📐 Area and Perimeter</h2>
      <p>Area tells us how much space is inside a shape. Perimeter tells us the distance around a shape.</p>
      
      <div style={styles.measurementVisual}>
        <h3>Rectangle: 6 units × 4 units</h3>
        <div style={styles.rectangleGrid}>
          {gridSquares}
        </div>
        <div style={{fontSize: '1.2em'}}>
          <strong>Area:</strong> 6 × 4 = 24 square units<br/>
          <strong>Perimeter:</strong> 6 + 4 + 6 + 4 = 20 units
        </div>
      </div>
      
      <div style={styles.example}>
        <strong>Area Formula for Rectangles:</strong> Area = length × width
        <br/><strong>Perimeter Formula for Rectangles:</strong> Perimeter = 2 × (length + width)
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🏠</span><strong>Real Life:</strong> Area helps us know how much carpet we need. Perimeter helps us know how much fence we need!
      </div>

      <h2 style={styles.h2}>📊 Line Plots with Fractions</h2>
      <p>Line plots help us organize and display data, especially when we have measurements in fractions!</p>
      
      <div style={styles.example}>
        <strong>Plant Heights (in inches):</strong>
        <br/>2¼, 2½, 2¼, 2¾, 2½, 2¼, 2¾, 2½
        <br/><br/>
        <div style={styles.linePlot}>
{`X         X         X
X    X    X    X    X
X    X    X    X    X
─────┼─────┼─────┼─────
2¼   2½   2¾   3`}
        </div>
      </div>

      <h2 style={styles.h2}>📐 Angles and Measurement</h2>
      <p>Angles tell us how much something turns or opens. We measure angles in degrees!</p>
      
      <div style={styles.measurementVisual}>
        <div style={styles.angleGrid}>
          <div>
            <strong>Right Angle</strong><br/>
            90°<br/>
            Like a corner of a book!
          </div>
          <div>
            <strong>Straight Angle</strong><br/>
            180°<br/>
            Like a straight line!
          </div>
          <div>
            <strong>Full Turn</strong><br/>
            360°<br/>
            Like spinning in a circle!
          </div>
        </div>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🔄</span><strong>Angle Tip:</strong> Use a protractor to measure angles accurately!
      </div>

      <div style={styles.conversionChart}>
        <span style={styles.emoji}>🌟</span><strong>You're a Measurement Master!</strong> Measuring helps us understand the world around us - from cooking to building to sports!
      </div>
    </div>
  );
};

export default MeasurementDataExplanation;
