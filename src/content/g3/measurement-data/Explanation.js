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
      gridTemplateColumns: 'repeat(4, 25px)',
      gridTemplateRows: 'repeat(3, 25px)',
      gap: '2px',
      margin: '15px auto',
      width: 'fit-content',
    },
    square: {
      background: '#4ecdc4',
      border: '1px solid #26a69a',
    },
    outlineRow: {
      display: 'flex',
      flexDirection: 'row',
      gap: '2px',
      margin: '2px 0',
      justifyContent: 'center',
    },
    outlineSquareFilled: {
      width: '22px',
      height: '22px',
      background: '#4ecdc4',
      border: '1px solid #26a69a',
    },
    outlineSquareEmpty: {
      width: '22px',
      height: '22px',
      background: 'transparent',
      border: '1px dashed #94a3b8',
    },
    stepBox: {
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '10px',
      margin: '10px 0',
      border: '2px dashed #26a69a',
    },
    cubeStackRow: {
      fontFamily: 'monospace',
      fontSize: '1.3em',
      textAlign: 'center',
      lineHeight: 1.1,
      letterSpacing: '0.1em',
    },
  };

  const gridSquares = Array.from({ length: 12 }, (_, index) => (
    <div key={index} style={styles.square}></div>
  ));

  // "Perimeter" visual: a 5-wide × 3-tall rectangle traced out of unit squares,
  // where the inside squares are hollow so the eye follows just the outline —
  // that's what perimeter is.
  const perimeterRows = [];
  for (let r = 0; r < 3; r++) {
    const cells = [];
    for (let c = 0; c < 5; c++) {
      const onEdge = r === 0 || r === 2 || c === 0 || c === 4;
      cells.push(
        <div
          key={c}
          style={onEdge ? styles.outlineSquareFilled : styles.outlineSquareEmpty}
        />
      );
    }
    perimeterRows.push(
      <div key={r} style={styles.outlineRow}>
        {cells}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>📏 Measurement & Data</h1>

      <h2 style={styles.h2}>📐 Area - Space Inside</h2>
      <p>
        <strong>Area</strong> tells us how much space is <em>inside</em> a flat
        shape. We cover the shape with equal <strong>unit squares</strong> and
        count them. Area is always measured in <strong>square units</strong>
        — like square inches, square feet, or square cm — because a unit square
        is the thing we're counting.
      </p>

      <div style={styles.visual}>
        <h3>Rectangle: 4 units wide × 3 units tall</h3>
        <div style={styles.grid}>{gridSquares}</div>
        <p><strong>Area = 4 × 3 = 12 square units</strong></p>
        <p style={{ fontSize: '0.95em' }}>
          Count the squares inside the rectangle — there are 12 of them. Or notice there
          are <strong>3 rows of 4 squares</strong>: 3 × 4 = 12.
        </p>
      </div>

      <div style={styles.example}>
        <strong>Why length × width works:</strong>
        <br/>• Each row has one square per unit of width (4 squares in a 4-unit row).
        <br/>• There is one row per unit of length (3 rows in a 3-unit length).
        <br/>• So the total count is (number of rows) × (squares per row) = length × width.
      </div>

      <div style={styles.example}>
        <strong>🏠 Real Life:</strong> How much carpet do you need for a room?
        <br/>Room: 10 feet long × 8 feet wide
        <br/>Area = 10 × 8 = <strong>80 square feet</strong> of carpet!
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span>
        <strong>Area Tip:</strong> Area answers "how many squares cover this?" If a
        problem gives you the two side lengths of a rectangle, <strong>multiply</strong>.
        If it gives you the area and one side, <strong>divide</strong> to find the other side.
      </div>

      <h2 style={styles.h2}>🔲 Perimeter - Distance Around</h2>
      <p>
        <strong>Perimeter</strong> is the distance all the way <em>around</em> the outside of a
        shape. It's like how far an ant would walk if it crawled along every edge back to where it
        started. Perimeter is measured in regular units (inches, feet, cm) — NOT square units.
      </p>

      <div style={styles.visual}>
        <h3>Rectangle: 5 units wide × 3 units tall</h3>
        <div style={{ display: 'inline-block' }}>{perimeterRows}</div>
        <p>
          Trace just the outside: <strong>5 + 3 + 5 + 3 = 16 units</strong>.
        </p>
      </div>

      <div style={styles.example}>
        <strong>Rectangle with sides 6 cm and 4 cm:</strong>
        <br/>• Walk around all four sides: 6 + 4 + 6 + 4 = <strong>20 cm</strong>.
        <br/>• Shortcut: 2 × (length + width) = 2 × (6 + 4) = <strong>20 cm</strong>.
      </div>

      <div style={styles.example}>
        <strong>Any shape, not just rectangles:</strong>
        <br/>For a triangle with sides 5, 7, and 9: perimeter = 5 + 7 + 9 = <strong>21</strong>.
        <br/>For a 5-sided shape with sides 2, 3, 4, 2, 3: perimeter = 2 + 3 + 4 + 2 + 3 = <strong>14</strong>.
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>🚶</span>
        <strong>Perimeter vs. Area:</strong> Perimeter is the <em>fence around</em> a yard;
        area is the <em>grass inside</em>. Perimeter adds up sides; area covers space.
      </div>

      <h2 style={styles.h2}>📦 Volume - Space Inside 3D Objects</h2>
      <p>
        <strong>Volume</strong> is like area, but for 3-D shapes: it tells us how many
        <strong> unit cubes</strong> fit inside a box. Volume is measured in <strong>cubic units</strong>
        (cubic inches, cubic cm, cubic feet) — because a unit cube is what we're counting.
      </p>

      <div style={styles.visual}>
        <h3>Box: 3 cubes long × 2 cubes wide × 2 cubes tall</h3>
        <div style={styles.cubeStackRow}>⬛⬛⬛</div>
        <div style={styles.cubeStackRow}>⬛⬛⬛</div>
        <p style={{ margin: '6px 0' }}>Bottom layer: 3 × 2 = <strong>6 cubes</strong></p>
        <div style={styles.cubeStackRow}>⬛⬛⬛</div>
        <div style={styles.cubeStackRow}>⬛⬛⬛</div>
        <p style={{ margin: '6px 0' }}>Top layer: another <strong>6 cubes</strong></p>
        <p><strong>Volume = 6 + 6 = 12 cubic units</strong></p>
      </div>

      <div style={styles.example}>
        <strong>🧊 Cube Counting:</strong> A box is 3 cubes long, 2 cubes wide, 2 cubes high.
        <br/>• Bottom layer: 3 × 2 = 6 cubes.
        <br/>• The box has 2 layers like that: 6 × 2 = <strong>12 cubes</strong> total.
        <br/>• Formula: length × width × height = 3 × 2 × 2 = <strong>12 cubic units</strong>.
      </div>

      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Trick:</strong> First find the <em>bottom layer</em> (length × width), then
        multiply by the <em>height</em> to stack the layers.
      </div>

      <h2 style={styles.h2}>🧭 Picking the Right Measurement</h2>
      <div style={styles.stepBox}>
        <strong>If a problem asks about…</strong>
        <br/>• <strong>How much fence?</strong> → Perimeter (add up the sides)
        <br/>• <strong>How much paint or carpet?</strong> → Area (length × width for rectangles)
        <br/>• <strong>How much water fills it?</strong> → Volume (length × width × height for boxes)
      </div>

      <div style={styles.example}>
        <strong>Watch the units!</strong>
        <br/>• Perimeter: inches, feet, cm (plain units)
        <br/>• Area: square inches, square feet, square cm (<em>units²</em>)
        <br/>• Volume: cubic inches, cubic feet, cubic cm (<em>units³</em>)
      </div>

      <div style={styles.visual}>
        <span style={styles.emoji}>🌟</span>
        <strong>You're a Measurement Expert!</strong> These three skills — perimeter, area, and
        volume — help us build, decorate, pack, and understand the world around us!
      </div>
    </div>
  );
};

export default MeasurementDataExplanation;
