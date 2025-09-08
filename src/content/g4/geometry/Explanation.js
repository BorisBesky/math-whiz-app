import React, { useEffect } from 'react';
import * as shapes from './shapes';

const GeometryExplanation = () => {
  useEffect(() => {
    // Initialize interactive geometry demonstrations when component mounts
    // Add a small delay to ensure DOM elements are rendered
    const initializeShapes = () => {
      if (!shapes.createPointSVG) {
        console.warn('Shape functions not available');
        return;
      }

      // Basic geometric elements
      shapes.createPointSVG('point-demo', {
        fill: '#333',
        radius: 8,
        showLabel: true,
        label: 'P'
      });
      
      shapes.createLineSVG('line-demo', {
        stroke: '#2196f3',
        strokeWidth: '3',
        showPoints: true
      });
      
      shapes.createRaySVG('ray-demo', {
        stroke: '#ff9800',
        strokeWidth: '3',
        showLabel: true,
        label: 'A'
      });
      
      shapes.createAngleSVG('angle-demo', 60, {
        stroke: '#9c27b0',
        strokeWidth: '3',
        arcStroke: '#e91e63',
        showLabel: true
      });
      
      // Triangle classifications by sides
      shapes.createClassifiedTriangleSVG('equilateral-triangle', 'equilateral', {
        fill: '#4caf50',
        stroke: '#388e3c',
        strokeWidth: '2'
      });
      
      shapes.createClassifiedTriangleSVG('isosceles-triangle', 'isosceles', {
        fill: '#2196f3',
        stroke: '#1976d2',
        strokeWidth: '2'
      });
      
      shapes.createClassifiedTriangleSVG('scalene-triangle', 'scalene', {
        fill: '#ff9800',
        stroke: '#f57c00',
        strokeWidth: '2'
      });
      
      // Triangle classifications by angles
      shapes.createClassifiedTriangleSVG('right-triangle', 'right', {
        fill: '#e91e63',
        stroke: '#c2185b',
        strokeWidth: '2'
      });
      
      shapes.createClassifiedTriangleSVG('acute-triangle', 'acute', {
        fill: '#9c27b0',
        stroke: '#7b1fa2',
        strokeWidth: '2'
      });
      
      shapes.createClassifiedTriangleSVG('obtuse-triangle', 'obtuse', {
        fill: '#ff5722',
        stroke: '#d84315',
        strokeWidth: '2'
      });
      
      // Symmetry demonstrations
      shapes.createSymmetryDemoSVG('butterfly-symmetry', 'butterfly', {
        fill: '#9c27b0',
        stroke: '#7b1fa2'
      });
      
      shapes.createSymmetryDemoSVG('square-symmetry', 'square', {
        fill: '#ff9800',
        stroke: '#f57c00'
      });
      
      shapes.createSymmetryDemoSVG('circle-symmetry', 'circle', {
        fill: '#4caf50',
        stroke: '#388e3c'
      });
      
      // Angle measurements
      shapes.createAngleSVG('acute-angle', 45, {
        stroke: '#4caf50',
        strokeWidth: '2',
        arcStroke: '#66bb6a',
        showLabel: true
      });
      
      shapes.createAngleSVG('right-angle', 90, {
        stroke: '#2196f3',
        strokeWidth: '2',
        arcStroke: '#64b5f6',
        showLabel: true
      });
      
      shapes.createAngleSVG('obtuse-angle', 120, {
        stroke: '#ff9800',
        strokeWidth: '2',
        arcStroke: '#ffb74d',
        showLabel: true
      });
      
      shapes.createAngleSVG('straight-angle', 180, {
        stroke: '#e91e63',
        strokeWidth: '2',
        arcStroke: '#f06292',
        showLabel: true
      });
      
      // Existing shape gallery
      shapes.createSquareSVG('square-demo', 80, {
        fill: '#ff9800',
        stroke: '#f57c00',
        strokeWidth: '2'
      });
      
      shapes.createRectangleSVG('rectangle-demo', 100, 60, {
        fill: '#4ecdc4',
        stroke: '#26a69a',
        strokeWidth: '2'
      });
      
      shapes.createRhombusSVG('rhombus-demo', 80, 100, {
        fill: '#8bc34a',
        stroke: '#689f38',
        strokeWidth: '2'
      });
      
      shapes.createParallelogramSVG('parallelogram-demo', 90, 60, 25, {
        fill: '#607d8b',
        stroke: '#455a64',
        strokeWidth: '2'
      });
      
      shapes.createTrapezoidSVG('trapezoid-demo', 60, 100, 70, {
        fill: '#ff5722',
        stroke: '#d84315',
        strokeWidth: '2'
      });
      
      shapes.createTriangleSVG('triangle-demo', 90, 80, {
        fill: '#9c27b0',
        stroke: '#7b1fa2',
        strokeWidth: '2'
      });
      
      shapes.createCircleSVG('circle-demo', 45, {
        fill: '#e91e63',
        stroke: '#c2185b',
        strokeWidth: '2'
      });
      
      shapes.createPentagonSVG('pentagon-demo', 45, {
        fill: '#00bcd4',
        stroke: '#0097a7',
        strokeWidth: '2'
      });
      
      shapes.createHexagonSVG('hexagon-demo', 45, {
        fill: '#795548',
        stroke: '#5d4037',
        strokeWidth: '2'
      });

      // Initialize quadrilateral visualizations with property annotations
      shapes.createClassifiedQuadrilateralSVG('square-quadrilateral', 'square', {
        size: 70,
        fill: '#2196f3',
        stroke: '#1976d2',
        strokeWidth: '2',
        showProperties: true
      });

      shapes.createClassifiedQuadrilateralSVG('rectangle-quadrilateral', 'rectangle', {
        width: 90,
        height: 60,
        fill: '#4caf50',
        stroke: '#388e3c',
        strokeWidth: '2',
        showProperties: true
      });

      shapes.createClassifiedQuadrilateralSVG('rhombus-quadrilateral', 'rhombus', {
        size: 70,
        angle: 60,
        fill: '#ff9800',
        stroke: '#f57c00',
        strokeWidth: '2',
        showProperties: true
      });

      shapes.createClassifiedQuadrilateralSVG('parallelogram-quadrilateral', 'parallelogram', {
        width: 90,
        height: 60,
        angle: 65,
        fill: '#9c27b0',
        stroke: '#7b1fa2',
        strokeWidth: '2',
        showProperties: true
      });

      shapes.createClassifiedQuadrilateralSVG('trapezoid-quadrilateral', 'trapezoid', {
        topWidth: 50,
        bottomWidth: 90,
        height: 60,
        fill: '#e91e63',
        stroke: '#c2185b',
        strokeWidth: '2',
        showProperties: true
      });

      shapes.createClassifiedQuadrilateralSVG('general-quadrilateral', 'quadrilateral', {
        fill: '#607d8b',
        stroke: '#455a64',
        strokeWidth: '2',
        showProperties: false
      });
    };

    // Use setTimeout to ensure DOM elements are rendered
    const timer = setTimeout(initializeShapes, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#5e72e4',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#3b4d82',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #3b4d82',
      paddingBottom: '10px',
    },
    h3: {
      color: '#3b4d82',
      fontSize: '1.4em',
      marginTop: '20px',
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
    shapeShowcase: {
      background: 'linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
      textAlign: 'center',
    },
    geometryVisual: {
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      margin: '15px 0',
      border: '2px solid #5e72e4',
      textAlign: 'center',
    },
    angleVisual: {
      display: 'inline-block',
      margin: '10px',
      padding: '15px',
      background: 'white',
      borderRadius: '8px',
      border: '2px solid #5e72e4',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '20px',
      margin: '20px 0',
    },
    shapeBox: {
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
    },
    shapeBox20: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
    },
    centerText: {
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
        <h1 style={styles.h1}>📐 Geometry (4.G)</h1>
        
        <h2 style={styles.h2}>📍 Points, Lines, Rays, and Angles</h2>
        <p>The building blocks of geometry! Every shape is made from these basic elements.</p>
        
        <div style={styles.geometryVisual}>
          <div style={styles.grid}>
            <div>
              <h3>🔵 Point</h3>
              <div id="point-demo"></div>
              <p>An exact location with no size</p>
            </div>
            <div>
              <h3>📏 Line</h3>
              <div id="line-demo"></div>
              <p>Goes on forever in both directions</p>
            </div>
            <div>
              <h3>➡️ Ray</h3>
              <div id="ray-demo"></div>
              <p>Starts at a point and goes on forever in one direction</p>
            </div>
            <div>
              <h3>📐 Angle</h3>
              <div id="angle-demo"></div>
              <p>Formed when two rays meet at a point</p>
            </div>
          </div>
        </div>
        
        <div style={styles.tip}>
          <span style={styles.emoji}>🎯</span><strong>Memory Tip:</strong> A ray is like a flashlight beam - it starts somewhere and keeps going!
        </div>

        <h2 style={styles.h2}>🔺 Classifying Triangles</h2>
        <p>Triangles can be classified by their sides and by their angles!</p>
        
        <div style={styles.shapeShowcase}>
          <h3>By Sides:</h3>
          <div style={styles.grid3}>
            <div style={styles.shapeBox}>
              <strong>Equilateral</strong><br/>
              All 3 sides equal<br/>
              <div id="equilateral-triangle"></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Isosceles</strong><br/>
              2 sides equal<br/>
              <div id="isosceles-triangle"></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Scalene</strong><br/>
              All sides different<br/>
              <div id="scalene-triangle"></div>
            </div>
          </div>
          
          <h3>By Angles:</h3>
          <div style={styles.grid3}>
            <div style={styles.shapeBox}>
              <strong>Right Triangle</strong><br/>
              Has one 90° angle<br/>
              <div id="right-triangle"></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Acute Triangle</strong><br/>
              All angles less than 90°<br/>
              <div id="acute-triangle"></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Obtuse Triangle</strong><br/>
              One angle greater than 90°<br/>
              <div id="obtuse-triangle"></div>
            </div>
          </div>
        </div>

        <h2 style={styles.h2}>🔷 Classifying Quadrilaterals</h2>
        <p>Four-sided shapes have special names based on their properties!</p>
        
        <div style={styles.shapeShowcase}>
          <div style={styles.grid}>
            <div style={styles.shapeBox20}>
              <strong>🟦 Square</strong><br/>
              • All sides equal<br/>
              • All angles are 90°<br/>
              • Opposite sides parallel<br/>
              <div id="square-quadrilateral" style={{marginTop: '10px'}}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>📱 Rectangle</strong><br/>
              • Opposite sides equal<br/>
              • All angles are 90°<br/>
              • Opposite sides parallel<br/>
              <div id="rectangle-quadrilateral" style={{marginTop: '10px'}}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔶 Rhombus</strong><br/>
              • All sides equal<br/>
              • Opposite angles equal<br/>
              • Opposite sides parallel<br/>
              <div id="rhombus-quadrilateral" style={{marginTop: '10px'}}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔧 Parallelogram</strong><br/>
              • Opposite sides equal<br/>
              • Opposite angles equal<br/>
              • Opposite sides parallel<br/>
              <div id="parallelogram-quadrilateral" style={{marginTop: '10px'}}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🪂 Trapezoid</strong><br/>
              • Exactly one pair of parallel sides<br/>
              • Can have different shapes<br/>
              <div id="trapezoid-quadrilateral" style={{marginTop: '10px'}}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🏠 Quadrilateral</strong><br/>
              • Any four-sided shape<br/>
              • General term for all 4-sided figures<br/>
              <div id="general-quadrilateral" style={{marginTop: '10px'}}></div>
            </div>
          </div>
        </div>
        
        <div style={styles.example}>
          <strong>Fun Fact:</strong> A square is a special type of rectangle, and a rectangle is a special type of parallelogram!
        </div>

        <h2 style={styles.h2}>↔️ Line Symmetry</h2>
        <p>A shape has line symmetry if you can fold it along a line and both halves match perfectly!</p>
        
        <div style={styles.geometryVisual}>
          <h3>Examples of Symmetrical Shapes:</h3>
          <div style={styles.grid3}>
            <div style={styles.shapeBox}>
              <strong>Butterfly 🦋</strong><br/>
              1 line of symmetry<br/>
              (vertical through middle)<br/>
              <div id="butterfly-symmetry"></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Square ⬜</strong><br/>
              4 lines of symmetry<br/>
              (2 diagonal, 2 through sides)<br/>
              <div id="square-symmetry"></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Circle ⭕</strong><br/>
              Infinite lines of symmetry<br/>
              (any line through center)<br/>
              <div id="circle-symmetry"></div>
            </div>
          </div>
        </div>
        
        <div style={styles.tip}>
          <span style={styles.emoji}>🪞</span><strong>Symmetry Test:</strong> Imagine folding the shape along a line. If both sides match exactly, it has line symmetry!
        </div>

        <h2 style={styles.h2}>📏 Angle Measurement</h2>
        <p>Angles tell us how much something turns. We measure them in degrees!</p>
        
        <div style={styles.geometryVisual}>
          <div style={styles.grid}>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Acute Angle</strong><br/>
              Less than 90°<br/>
              <div id="acute-angle"></div>
            </div>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Right Angle</strong><br/>
              Exactly 90°<br/>
              <div id="right-angle"></div>
            </div>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Obtuse Angle</strong><br/>
              Between 90° and 180°<br/>
              <div id="obtuse-angle"></div>
            </div>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Straight Angle</strong><br/>
              Exactly 180°<br/>
              <div id="straight-angle"></div>
            </div>
          </div>
        </div>
        
        <div style={styles.example}>
          <strong>Real Life Angles:</strong>
          <br/>• Corner of a book = 90° (right angle)
          <br/>• Open scissors = acute angle
          <br/>• Laptop half-open = obtuse angle
          <br/>• Flat table = 180° (straight angle)
        </div>

        <h2 style={styles.h2}>🎨 Interactive Shape Gallery</h2>
        <p>Explore different geometric shapes and their properties!</p>
        
        <div style={styles.geometryVisual}>
          <h3>Basic Quadrilaterals:</h3>
          <div style={styles.grid3}>
            <div style={styles.centerText}>
              <div id="square-demo"></div>
              <strong>Square</strong>
            </div>
            <div style={styles.centerText}>
              <div id="rectangle-demo"></div>
              <strong>Rectangle</strong>
            </div>
            <div style={styles.centerText}>
              <div id="rhombus-demo"></div>
              <strong>Rhombus</strong>
            </div>
          </div>
          
          <div style={styles.grid3}>
            <div style={styles.centerText}>
              <div id="parallelogram-demo"></div>
              <strong>Parallelogram</strong>
            </div>
            <div style={styles.centerText}>
              <div id="trapezoid-demo"></div>
              <strong>Trapezoid</strong>
            </div>
            <div style={styles.centerText}>
              <div id="triangle-demo"></div>
              <strong>Triangle</strong>
            </div>
          </div>
        </div>
        
        <div style={styles.geometryVisual}>
          <h3>Other Shapes:</h3>
          <div style={styles.grid3}>
            <div style={styles.centerText}>
              <div id="circle-demo"></div>
              <strong>Circle</strong>
            </div>
            <div style={styles.centerText}>
              <div id="pentagon-demo"></div>
              <strong>Pentagon</strong>
            </div>
            <div style={styles.centerText}>
              <div id="hexagon-demo"></div>
              <strong>Hexagon</strong>
            </div>
          </div>
        </div>

        <div style={styles.shapeShowcase}>
          <span style={styles.emoji}>🌟</span><strong>You're a Geometry Expert!</strong> Shapes are everywhere around us - from the buildings we see to the patterns in nature!
        </div>
    </div>
  );
};

export default GeometryExplanation;
