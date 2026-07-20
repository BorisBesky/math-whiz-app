import React from 'react';

// Shown when a student taps "Explain" on a Geometry 5th question.
// Follows the kid-friendly inline-style pattern of the other Explanations.
const Geometry5thExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#059669',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#047857',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #047857',
      paddingBottom: '10px',
    },
    example: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      borderLeft: '5px solid #059669',
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
      fontSize: '1.2em',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🗺️ Grids & Shape Families!</h1>

      <h2 style={styles.h2}>📍 The coordinate plane</h2>
      <p>
        Two number lines cross at the <strong>origin (0, 0)</strong>: the <strong>x-axis</strong>{' '}
        goes right, the <strong>y-axis</strong> goes up. Every point gets an address called an{' '}
        <strong>ordered pair</strong>.
      </p>
      <div style={styles.visual}>
        (3, 4) means: go <strong>3 right</strong>, then <strong>4 up</strong>
        <br />
        🏃 x first (run), 🪜 y second (climb)!
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Bonus:</strong> the first coordinate is also the distance from the y-axis, and the
        second is the distance from the x-axis. Points like (5, 0) sit right ON the x-axis.
      </div>

      <h2 style={styles.h2}>🏙️ Distances on a map</h2>
      <p>
        When two points share a coordinate, they sit on the same street — the distance is just the{' '}
        <strong>difference</strong> of the other coordinates.
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>📚</span>
        Library at (2, 3), pool at (2, 8): same x, so they are 8 − 3 = <strong>5 blocks</strong>{' '}
        apart.
      </div>

      <h2 style={styles.h2}>🔷 Naming quadrilaterals</h2>
      <div style={styles.visual}>
        <strong>Trapezoid:</strong> exactly one pair of parallel sides
        <br />
        <strong>Parallelogram:</strong> two pairs of parallel sides
        <br />
        <strong>Rectangle:</strong> a parallelogram with four right angles
        <br />
        <strong>Rhombus:</strong> a parallelogram with four equal sides
        <br />
        <strong>Square:</strong> a rectangle AND a rhombus at once!
      </div>

      <h2 style={styles.h2}>🔺 Classifying triangles</h2>
      <p>
        Triangles get names two different ways — by their <strong>sides</strong> and by
        their <strong>angles</strong>.
      </p>
      <div style={styles.visual}>
        <strong>By sides:</strong>
        <br />
        <strong>Equilateral triangle:</strong> all three sides equal (and all three
        angles equal too!)
        <br />
        <strong>Isosceles triangle:</strong> exactly two sides equal
        <br />
        <strong>Scalene triangle:</strong> no equal sides — every side a different length
      </div>
      <div style={styles.visual}>
        <strong>By angles:</strong>
        <br />
        <strong>Right triangle:</strong> has one right angle (exactly 90°)
        <br />
        <strong>Acute triangle:</strong> all three angles less than 90°
        <br />
        <strong>Obtuse triangle:</strong> has one angle greater than 90°
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Tip:</strong> a triangle can pick a name from each list — for example,
        the same triangle can be both <em>isosceles</em> and <em>right</em>.
      </div>

      <h2 style={styles.h2}>👨‍👩‍👧 The shape family tree</h2>
      <p>
        Shape categories <strong>nest inside each other</strong> — and properties pass{' '}
        <strong>down</strong> the family tree, never up.
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>✅</span>
        Every <strong>square is a rectangle</strong> (it has four right angles) — but not every
        rectangle is a square!
        <br />
        <span style={styles.emoji}>✅</span>
        All rectangles are parallelograms, so squares are parallelograms too.
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span>
        <strong>Remember:</strong> all rectangles have four right angles, and a square is a
        rectangle — so a square must have four right angles too. That's hierarchy thinking!
      </div>
    </div>
  );
};

export default Geometry5thExplanation;
