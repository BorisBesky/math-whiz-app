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
    linePlotContainer: {
      margin: '30px auto',
      maxWidth: '500px',
      padding: '20px 20px 40px 20px',
      background: '#f8f9fa',
      borderRadius: '15px',
      boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)',
    },
    linePlot: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      borderBottom: '3px solid #333',
      height: '120px',
      position: 'relative',
      padding: '0 10px',
    },
    linePlotColumn: {
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'center',
      flex: 1,
      position: 'relative',
    },
    linePlotTick: {
      width: '3px',
      height: '15px',
      background: '#333',
      position: 'absolute',
      bottom: '-9px',
    },
    linePlotLabel: {
      position: 'absolute',
      bottom: '-35px',
      fontWeight: 'bold',
      fontSize: '1.1em',
      whiteSpace: 'nowrap',
    },
    linePlotX: {
      color: '#e17055',
      fontWeight: 'bold',
      fontSize: '1.8em',
      marginBottom: '-5px',
    },
    angleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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

  const AngleSVG = ({ angle, size = 100, stroke = '#9c27b0', arcStroke = '#e91e63' }) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const rayLength = size * 0.4;
    const angleRad = (angle * Math.PI) / 180;
    const ray2X = centerX + rayLength * Math.cos(angleRad);
    const ray2Y = centerY - rayLength * Math.sin(angleRad);
    const arcRadius = size * 0.15;
    const arcEndX = centerX + arcRadius * Math.cos(angleRad);
    const arcEndY = centerY - arcRadius * Math.sin(angleRad);
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // For 360 degrees, the path doesn't render well as a single arc
    // We'll show a full circle instead
    if (angle === 360) {
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={centerX} cy={centerY} r="3" fill="#333" />
          <line x1={centerX} y1={centerY} x2={centerX + rayLength} y2={centerY} stroke={stroke} strokeWidth="2" />
          <circle cx={centerX} cy={centerY} r={arcRadius} fill="none" stroke={arcStroke} strokeWidth="2" />
        </svg>
      );
    }

    const pathData = `M ${centerX + arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEndX} ${arcEndY}`;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={centerX} cy={centerY} r="3" fill="#333" />
        <line x1={centerX} y1={centerY} x2={centerX + rayLength} y2={centerY} stroke={stroke} strokeWidth="2" />
        <line x1={centerX} y1={centerY} x2={ray2X} y2={ray2Y} stroke={stroke} strokeWidth="2" />
        <path d={pathData} fill="none" stroke={arcStroke} strokeWidth="2" />
      </svg>
    );
  };

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
        <div style={styles.linePlotContainer}>
          <div style={styles.linePlot}>
            <div style={styles.linePlotColumn}>
              <div style={styles.linePlotLabel}>2¼</div>
              <div style={styles.linePlotTick}></div>
              <div style={styles.linePlotX}>X</div>
              <div style={styles.linePlotX}>X</div>
              <div style={styles.linePlotX}>X</div>
            </div>
            <div style={styles.linePlotColumn}>
              <div style={styles.linePlotLabel}>2½</div>
              <div style={styles.linePlotTick}></div>
              <div style={styles.linePlotX}>X</div>
              <div style={styles.linePlotX}>X</div>
              <div style={styles.linePlotX}>X</div>
            </div>
            <div style={styles.linePlotColumn}>
              <div style={styles.linePlotLabel}>2¾</div>
              <div style={styles.linePlotTick}></div>
              <div style={styles.linePlotX}>X</div>
              <div style={styles.linePlotX}>X</div>
            </div>
            <div style={styles.linePlotColumn}>
              <div style={styles.linePlotLabel}>3</div>
              <div style={styles.linePlotTick}></div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={styles.h2}>📐 Angles and Measurement</h2>
      <p>Angles tell us how much something turns or opens. We measure angles in degrees!</p>
      
      <div style={styles.measurementVisual}>
        <div style={styles.angleGrid}>
          <div>
            <strong>Right Angle</strong><br/>
            <AngleSVG angle={90} /><br/>
            90°<br/>
            Like a corner of a book!
          </div>
          <div>
            <strong>Acute Angle</strong><br/>
            <AngleSVG angle={45} /><br/>
            Less than 90°<br/>
            Like open scissors!
          </div>
          <div>
            <strong>Obtuse Angle</strong><br/>
            <AngleSVG angle={135} /><br/>
            Between 90° and 180°<br/>
            Like a reclining chair!
          </div>
          <div>
            <strong>Straight Angle</strong><br/>
            <AngleSVG angle={180} /><br/>
            180°<br/>
            Like a straight line!
          </div>
          <div>
            <strong>Full Turn</strong><br/>
            <AngleSVG angle={360} /><br/>
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
