import React, { useEffect } from 'react';
import * as shapes from './shapes';
import { createCompositeShapeSVG } from './composite-shapes';

const GeometryExplanation = () => {
  // Example composite shapes used in the area/perimeter walk-through below.
  const exampleLShapeCells = [
    [0, 0], [0, 1], [0, 2], [1, 2], [2, 2],
  ];
  const exampleTShapeCells = [
    [0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [1, 3], [2, 3],
  ];
  const exampleLShapeUri = createCompositeShapeSVG(exampleLShapeCells, 3);
  const exampleTShapeUri = createCompositeShapeSVG(exampleTShapeCells, 2);

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

      shapes.createLineSegmentSVG('line-segment-demo', {
        stroke: '#4caf50',
        strokeWidth: '3',
        showLabel: true
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

    // Add interactive functionality to shapes
    const addInteractivity = () => {
      const shapeIds = [
        'square-demo', 'rectangle-demo', 'rhombus-demo', 'parallelogram-demo', 
        'trapezoid-demo', 'triangle-demo', 'circle-demo', 'pentagon-demo', 'hexagon-demo'
      ];

      shapeIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
          const svgElement = container.querySelector('svg');
          if (svgElement) {
            // Add click functionality
            svgElement.style.cursor = 'pointer';
            svgElement.style.transition = 'transform 0.3s ease, filter 0.3s ease';
            
            // Hover effects
            svgElement.addEventListener('mouseenter', () => {
              svgElement.style.transform = 'scale(1.1)';
              svgElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
            });
            
            svgElement.addEventListener('mouseleave', () => {
              svgElement.style.transform = 'scale(1)';
              svgElement.style.filter = 'none';
            });
            
            // Click to show properties
            svgElement.addEventListener('click', () => {
              showShapeProperties(id);
            });
          }
        }
      });
    };

    // Function to show shape properties in an interactive popup
    const showShapeProperties = (shapeId) => {
      const shapeProperties = {
        'square-demo': {
          name: '🟦 Square',
          properties: [
            '• 4 equal sides',
            '• 4 right angles (90°)',
            '• 4 lines of symmetry',
            '• Opposite sides parallel',
            '• All angles equal',
            '• Diagonals bisect at right angles'
          ],
          funFact: 'A square is a special rectangle where all sides are equal!'
        },
        'rectangle-demo': {
          name: '📱 Rectangle',
          properties: [
            '• Opposite sides equal',
            '• 4 right angles (90°)',
            '• 2 lines of symmetry',
            '• Opposite sides parallel',
            '• Diagonals are equal length',
            '• Diagonals bisect each other'
          ],
          funFact: 'Every square is a rectangle, but not every rectangle is a square!'
        },
        'rhombus-demo': {
          name: '🔶 Rhombus',
          properties: [
            '• 4 equal sides',
            '• Opposite angles equal',
            '• 2 lines of symmetry',
            '• Opposite sides parallel',
            '• Diagonals bisect at right angles',
            '• Angles come in pairs'
          ],
          funFact: 'A rhombus is like a "tilted square" - all sides equal but angles can vary!'
        },
        'parallelogram-demo': {
          name: '🔧 Parallelogram',
          properties: [
            '• Opposite sides equal',
            '• Opposite angles equal',
            '• Opposite sides parallel',
            '• Diagonals bisect each other',
            '• Lines of symmetry only when it is a rectangle, square, or rhombus'
          ],
          funFact: 'Rectangles, squares, and rhombuses are all special types of parallelograms!'
        },
        'trapezoid-demo': {
          name: '🪂 Trapezoid',
          properties: [
            '• 4 sides',
            '• Exactly 1 pair parallel sides',
            '• Can have different angles',
            '• May have line symmetry',
            '• Two legs (non-parallel sides)',
            '• Two bases (parallel sides)'
          ],
          funFact: 'Some trapezoids look like pyramid bases or the shape of a playground slide!'
        },
        'triangle-demo': {
          name: '🔺 Triangle',
          properties: [
            '• 3 sides',
            '• 3 angles',
            '• Sum of angles = 180°',
            '• Can be many types (equilateral, isosceles, scalene)',
            '• Can have lines of symmetry when opposite angles are equal',
            '• Simplest polygon',
            '• Very stable shape'
          ],
          funFact: 'Triangles are the strongest shape - that\'s why they\'re used in bridges!'
        },
        'circle-demo': {
          name: '⭕ Circle',
          properties: [
            '• All points equal distance from center',
            '• No sides or angles',
            '• Infinite lines of symmetry',
            '• Has circumference and diameter',
            '• π (pi) relates circumference to diameter',
            '• Perfectly round'
          ],
          funFact: 'A circle has infinite lines of symmetry - any line through the center!'
        },
        'pentagon-demo': {
          name: '🔷 Pentagon',
          properties: [
            '• 5 equal sides',
            '• 5 equal angles',
            '• 5 lines of symmetry',
            '• Sum of angles = 540°',
            '• Each angle = 108°',
            '• Star shape fits inside'
          ],
          funFact: 'The Pentagon building in Washington D.C. is shaped like a pentagon!'
        },
        'hexagon-demo': {
          name: '⬡ Hexagon',
          properties: [
            '• 6 equal sides',
            '• 6 equal angles',
            '• 12 lines of symmetry',
            '• Sum of angles = 720°',
            '• Each angle = 120°',
            '• Tessellates perfectly'
          ],
          funFact: 'Bees use hexagons for their honeycomb because it\'s the most efficient shape!'
        }
      };

      const shapeInfo = shapeProperties[shapeId];
      if (!shapeInfo) return;

      // Remove any existing popup
      const existingPopup = document.getElementById('shape-popup');
      if (existingPopup) {
        existingPopup.remove();
      }

      // Create popup
      const popup = document.createElement('div');
      popup.id = 'shape-popup';
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        max-width: 400px;
        font-family: 'Comic Sans MS', cursive, sans-serif;
        animation: popupFadeIn 0.3s ease-out;
      `;

      // Add CSS animation
      if (!document.getElementById('popup-styles')) {
        const style = document.createElement('style');
        style.id = 'popup-styles';
        style.textContent = `
          @keyframes popupFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes popupFadeOut {
            from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `;
        document.head.appendChild(style);
      }

      popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 1.4em;">${shapeInfo.name}</h3>
          <button id="close-popup" style="
            background: rgba(255,255,255,0.2); 
            border: none; 
            color: white; 
            font-size: 18px; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
        <div style="margin-bottom: 15px;">
          ${shapeInfo.properties.map(prop => `<div style="margin: 5px 0;">${prop}</div>`).join('')}
        </div>
        <div style="
          background: rgba(255,255,255,0.1); 
          padding: 12px; 
          border-radius: 8px; 
          border-left: 4px solid #ffd700;
        ">
          <strong>💡 Fun Fact:</strong> ${shapeInfo.funFact}
        </div>
      `;

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.id = 'popup-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(popup);

      // Close functionality
      const closePopup = () => {
        popup.style.animation = 'popupFadeOut 0.3s ease-out';
        setTimeout(() => {
          popup.remove();
          backdrop.remove();
        }, 300);
      };

      document.getElementById('close-popup').addEventListener('click', closePopup);
      backdrop.addEventListener('click', closePopup);
      
      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    };

    // Use setTimeout to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      initializeShapes();
      setTimeout(addInteractivity, 100); // Add interactivity after shapes are created
    }, 500);
    
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
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'scale(1.05)',
      },
      cursor: 'pointer',
      '&:active': {
        transform: 'scale(0.95)',
      },
    },
    shapeBox20: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
    },
    svgContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      margin: '0 auto',
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
          <div style={styles.grid3}>
            <div>
              <h3>🔵 Point</h3>
              <div id="point-demo" style={styles.svgContainer}></div>
              <p>An exact location with no size</p>
            </div>
            <div>
              <h3>📏 Line</h3>
              <div id="line-demo" style={styles.svgContainer}></div>
              <p>Goes on forever in both directions</p>
            </div>
            <div>
              <h3>📏 Line Segment</h3>
              <div id="line-segment-demo" style={styles.svgContainer}></div>
              <p>Has two endpoints and a definite length</p>
            </div>
            <div>
              <h3>➡️ Ray</h3>
              <div id="ray-demo" style={styles.svgContainer}></div>
              <p>Starts at a point and goes on forever in one direction</p>
            </div>
            <div>
              <h3>📐 Angle</h3>
              <div id="angle-demo" style={styles.svgContainer}></div>
              <p>Formed when two rays meet at a point</p>
            </div>
          </div>
        </div>
        
        <div style={styles.tip}>
          <span style={styles.emoji}>🎯</span><strong>Memory Tip:</strong> A ray is like a flashlight beam - it starts somewhere and keeps going!
        </div>

        <h2 style={styles.h2}>↔️ Parallel & Perpendicular Lines</h2>
        <p>Lines can have special relationships with each other. Let's learn about two important ones!</p>

        <div style={styles.geometryVisual}>
          <div style={styles.grid}>
            {/* Parallel Lines */}
            <div style={styles.shapeBox20}>
              <h3 style={styles.h3}>Parallel Lines ∥</h3>
              <p>Lines that go in the <strong>same direction</strong> and <strong>never cross</strong>, no matter how far they go!</p>
              <div style={styles.svgContainer}>
                <svg width="200" height="120" viewBox="0 0 200 120">
                  {/* Top line with arrows */}
                  <line x1="20" y1="35" x2="180" y2="35" stroke="#2196f3" strokeWidth="3" />
                  <polygon points="180,35 170,30 170,40" fill="#2196f3" />
                  <polygon points="20,35 30,30 30,40" fill="#2196f3" />
                  {/* Bottom line with arrows */}
                  <line x1="20" y1="75" x2="180" y2="75" stroke="#2196f3" strokeWidth="3" />
                  <polygon points="180,75 170,70 170,80" fill="#2196f3" />
                  <polygon points="20,75 30,70 30,80" fill="#2196f3" />
                  {/* Tick marks showing equal distance */}
                  <line x1="90" y1="32" x2="90" y2="28" stroke="#2196f3" strokeWidth="2" />
                  <line x1="95" y1="32" x2="95" y2="28" stroke="#2196f3" strokeWidth="2" />
                  <line x1="90" y1="78" x2="90" y2="82" stroke="#2196f3" strokeWidth="2" />
                  <line x1="95" y1="78" x2="95" y2="82" stroke="#2196f3" strokeWidth="2" />
                  {/* Distance markers */}
                  <line x1="55" y1="38" x2="55" y2="72" stroke="#999" strokeWidth="1" strokeDasharray="4,3" />
                  <line x1="145" y1="38" x2="145" y2="72" stroke="#999" strokeWidth="1" strokeDasharray="4,3" />
                  <text x="100" y="60" textAnchor="middle" fontSize="11" fill="#666" fontFamily="Comic Sans MS, cursive">same distance</text>
                  {/* Labels */}
                  <text x="100" y="110" textAnchor="middle" fontSize="13" fill="#2196f3" fontWeight="bold" fontFamily="Comic Sans MS, cursive">Always the same distance apart!</text>
                </svg>
              </div>
              <p style={{fontSize: '0.9em', color: '#555'}}>🛤️ Railroad tracks &nbsp; 📓 Lines on paper &nbsp; = Equals sign</p>
            </div>

            {/* Perpendicular Lines */}
            <div style={styles.shapeBox20}>
              <h3 style={styles.h3}>Perpendicular Lines ⊥</h3>
              <p>Lines that cross each other at a <strong>right angle (90°)</strong>, making a perfect corner!</p>
              <div style={styles.svgContainer}>
                <svg width="200" height="120" viewBox="0 0 200 120">
                  {/* Horizontal line with arrows */}
                  <line x1="30" y1="65" x2="170" y2="65" stroke="#e91e63" strokeWidth="3" />
                  <polygon points="170,65 160,60 160,70" fill="#e91e63" />
                  <polygon points="30,65 40,60 40,70" fill="#e91e63" />
                  {/* Vertical line with arrows */}
                  <line x1="100" y1="10" x2="100" y2="110" stroke="#e91e63" strokeWidth="3" />
                  <polygon points="100,10 95,20 105,20" fill="#e91e63" />
                  <polygon points="100,110 95,100 105,100" fill="#e91e63" />
                  {/* Right angle square marker */}
                  <rect x="100" y="52" width="13" height="13" fill="none" stroke="#ff9800" strokeWidth="2" />
                  {/* 90° label */}
                  <text x="120" y="50" fontSize="12" fill="#ff9800" fontWeight="bold" fontFamily="Comic Sans MS, cursive">90°</text>
                </svg>
              </div>
              <p style={{fontSize: '0.9em', color: '#555'}}>➕ Plus sign &nbsp; 🪟 Window corners &nbsp; 🏁 Crossroads</p>
            </div>
          </div>
        </div>

        <div style={styles.example}>
          <strong>🔍 Spot the Difference:</strong>
          <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px'}}>
            <div style={{textAlign: 'center', margin: '10px'}}>
              <svg width="90" height="70" viewBox="0 0 90 70">
                <line x1="10" y1="20" x2="80" y2="20" stroke="#2196f3" strokeWidth="3" />
                <line x1="10" y1="50" x2="80" y2="50" stroke="#2196f3" strokeWidth="3" />
              </svg>
              <br/><strong>Parallel</strong>
              <br/><span style={{fontSize: '0.85em'}}>Never cross</span>
            </div>
            <div style={{textAlign: 'center', margin: '10px'}}>
              <svg width="90" height="70" viewBox="0 0 90 70">
                <line x1="10" y1="35" x2="80" y2="35" stroke="#e91e63" strokeWidth="3" />
                <line x1="45" y1="5" x2="45" y2="65" stroke="#e91e63" strokeWidth="3" />
                <rect x="45" y="25" width="10" height="10" fill="none" stroke="#ff9800" strokeWidth="1.5" />
              </svg>
              <br/><strong>Perpendicular</strong>
              <br/><span style={{fontSize: '0.85em'}}>Cross at 90°</span>
            </div>
            <div style={{textAlign: 'center', margin: '10px'}}>
              <svg width="90" height="70" viewBox="0 0 90 70">
                <line x1="10" y1="55" x2="80" y2="15" stroke="#9c27b0" strokeWidth="3" />
                <line x1="10" y1="15" x2="80" y2="55" stroke="#9c27b0" strokeWidth="3" />
              </svg>
              <br/><strong>Intersecting</strong>
              <br/><span style={{fontSize: '0.85em'}}>Cross, but NOT at 90°</span>
            </div>
          </div>
        </div>

        <div style={styles.tip}>
          <span style={styles.emoji}>💡</span><strong>Memory Trick:</strong> The word "para<strong>ll</strong>el" has two <strong>l</strong>'s right next to each other — just like parallel lines standing side by side, never touching!
        </div>

        <div style={styles.shapeShowcase}>
          <span style={styles.emoji}>🏠</span><strong>Parallel & Perpendicular Lines Are Everywhere!</strong>
          <div style={{...styles.grid3, marginTop: '10px'}}>
            <div style={styles.shapeBox}>
              <strong>🛤️ Railroad Tracks</strong><br/>
              The rails are <em>parallel</em> — they stay the same distance apart forever!
            </div>
            <div style={styles.shapeBox}>
              <strong>➕ Plus Sign</strong><br/>
              The two lines in a plus sign are <em>perpendicular</em> — they meet at 90°!
            </div>
            <div style={styles.shapeBox}>
              <strong>📐 Graph Paper</strong><br/>
              Horizontal lines are <em>parallel</em> to each other, and <em>perpendicular</em> to the vertical lines!
            </div>
          </div>
        </div>

        <h2 style={styles.h2}>🔺 Classifying Triangles</h2>
        <p>Triangles can be classified by their sides and by their angles!</p>
        
        <div style={styles.shapeShowcase}>
          <h3>By Sides:</h3>
          <div style={styles.grid3}>
            <div style={styles.shapeBox}>
              <strong>Equilateral</strong><br/>
              All 3 sides equal<br/>
              <div id="equilateral-triangle" style={styles.svgContainer}></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Isosceles</strong><br/>
              2 sides equal<br/>
              <div id="isosceles-triangle" style={styles.svgContainer}></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Scalene</strong><br/>
              All sides different<br/>
              <div id="scalene-triangle" style={styles.svgContainer}></div>
            </div>
          </div>
          
          <h3>By Angles:</h3>
          <div style={styles.grid3}>
            <div style={styles.shapeBox}>
              <strong>Right Triangle</strong><br/>
              Has one 90° angle<br/>
              <div id="right-triangle" style={styles.svgContainer}></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Acute Triangle</strong><br/>
              All angles less than 90°<br/>
              <div id="acute-triangle" style={styles.svgContainer}></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Obtuse Triangle</strong><br/>
              One angle greater than 90°<br/>
              <div id="obtuse-triangle" style={styles.svgContainer}></div>
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
              <div id="square-quadrilateral" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>📱 Rectangle</strong><br/>
              • Opposite sides equal<br/>
              • All angles are 90°<br/>
              • Opposite sides parallel<br/>
              <div id="rectangle-quadrilateral" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔶 Rhombus</strong><br/>
              • All sides equal<br/>
              • Opposite angles equal<br/>
              • Opposite sides parallel<br/>
              <div id="rhombus-quadrilateral" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔧 Parallelogram</strong><br/>
              • Opposite sides equal<br/>
              • Opposite angles equal<br/>
              • Opposite sides parallel<br/>
              <div id="parallelogram-quadrilateral" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🪂 Trapezoid</strong><br/>
              • Exactly one pair of parallel sides<br/>
              • Can have different shapes<br/>
              <div id="trapezoid-quadrilateral" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🏠 Quadrilateral</strong><br/>
              • Any four-sided shape<br/>
              • General term for all 4-sided figures<br/>
              <div id="general-quadrilateral" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
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
              <div id="butterfly-symmetry" style={styles.svgContainer}></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Square ⬜</strong><br/>
              4 lines of symmetry<br/>
              (2 diagonal, 2 through sides)<br/>
              <div id="square-symmetry" style={styles.svgContainer}></div>
            </div>
            <div style={styles.shapeBox}>
              <strong>Circle ⭕</strong><br/>
              Infinite lines of symmetry<br/>
              (any line through center)<br/>
              <div id="circle-symmetry" style={styles.svgContainer}></div>
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
              <div id="acute-angle" style={styles.svgContainer}></div>
            </div>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Right Angle</strong><br/>
              Exactly 90°<br/>
              <div id="right-angle" style={styles.svgContainer}></div>
            </div>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Obtuse Angle</strong><br/>
              Between 90° and 180°<br/>
              <div id="obtuse-angle" style={styles.svgContainer}></div>
            </div>
            <div style={{...styles.angleVisual, textAlign: 'center', padding: '15px', border: '2px solid #ddd', borderRadius: '8px'}}>
              <strong>Straight Angle</strong><br/>
              Exactly 180°<br/>
              <div id="straight-angle" style={styles.svgContainer}></div>
            </div>
          </div>
        </div>
        
        <div style={styles.example}>
          <strong>Real Life Angles:</strong>
          <br/>• Corner of a book = 90° (right angle)
          <br/>• Open scissors = obtuse angle
          <br/>• Laptop half-open = acute angle
          <br/>• Flat table = 180° (straight angle)
        </div>

        <h2 style={styles.h2}>🧩 Area & Perimeter of Composite Shapes</h2>
        <p>
          A <strong>composite shape</strong> is a figure that you can split into smaller
          rectangles (or squares). The figures in your quiz will show the length of every
          side in units. Use those numbers to find either the <strong>perimeter</strong>
          (the distance all the way around) or the <strong>area</strong> (how much space
          is inside).
        </p>

        <div style={styles.tip}>
          <span style={styles.emoji}>📏</span>
          <strong>Perimeter:</strong> add up the lengths of <em>every</em> side along the
          outside of the figure.
          <br/>
          <span style={styles.emoji}>🟦</span>
          <strong>Area:</strong> split the figure into rectangles, find the area of each
          rectangle (length × width), then add the areas together.
        </div>

        <div style={styles.geometryVisual}>
          <h3 style={styles.h3}>Example 1: L-shape</h3>
          <div style={styles.svgContainer}>
            <img
              src={exampleLShapeUri}
              alt="L-shape with sides labeled 3, 6, 6, 3, 9, 9"
              style={{maxWidth: '320px', height: 'auto'}}
            />
          </div>
          <div style={styles.grid}>
            <div style={styles.shapeBox20}>
              <strong>🚶 Perimeter — walk around the shape:</strong>
              <br/>3 + 6 + 6 + 3 + 9 + 9 = <strong>36 units</strong>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🟦 Area — split into 2 rectangles:</strong>
              <br/>• Tall rectangle: 3 × 9 = 27
              <br/>• Bottom rectangle: 6 × 3 = 18
              <br/>Total area = 27 + 18 = <strong>45 square units</strong>
            </div>
          </div>
          <p style={{fontSize: '0.95em', color: '#555'}}>
            <strong>Tip:</strong> The two shorter sides on the inside of the L (the 6 and
            the 6) are <em>not</em> on the outside, so they don't get added when you walk
            around the perimeter — but they do help you split the shape into rectangles
            for area!
          </p>
        </div>

        <div style={styles.geometryVisual}>
          <h3 style={styles.h3}>Example 2: T-shape</h3>
          <div style={styles.svgContainer}>
            <img
              src={exampleTShapeUri}
              alt="T-shape with sides labeled in units of 2"
              style={{maxWidth: '320px', height: 'auto'}}
            />
          </div>
          <div style={styles.grid}>
            <div style={styles.shapeBox20}>
              <strong>🚶 Perimeter — add every outside side:</strong>
              <br/>8 + 4 + 2 + 4 + 4 + 4 + 2 + 4 = <strong>32 units</strong>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🟦 Area — split into a top bar and a stem:</strong>
              <br/>• Top bar: 8 × 4 = 32
              <br/>• Stem (sticking down): 4 × 4 = 16
              <br/>Total area = 32 + 16 = <strong>48 square units</strong>
            </div>
          </div>
        </div>

        <div style={styles.example}>
          <strong>🧠 Step-by-Step Strategy:</strong>
          <ol style={{margin: '8px 0 0 18px', padding: 0}}>
            <li>Look at the picture and read the side labels carefully.</li>
            <li>For <strong>perimeter</strong>, trace your finger around the outside and
              add every side length you cross.</li>
            <li>For <strong>area</strong>, draw a line to split the figure into 2 (or
              more) rectangles. Find <em>length × width</em> for each rectangle and add
              them together.</li>
            <li>Double-check your units: perimeter is in <em>units</em>, area is in
              <em> square units</em>.</li>
          </ol>
        </div>

        <div style={styles.tip}>
          <span style={styles.emoji}>⚠️</span>
          <strong>Common Mistake:</strong> Don't add the <em>inside</em> side lengths
          when finding the perimeter — only the sides on the outside count. And don't
          forget the units: a perimeter answer ends in <em>units</em>, but an area answer
          ends in <em>square units</em>.
        </div>

        <h2 style={styles.h2}>🎨 Interactive Shape Gallery</h2>
        <p>Explore different geometric shapes and their properties!</p>
        
        <div style={styles.shapeShowcase}>
          <h3>Basic Quadrilaterals with Properties:</h3>
          <div style={styles.grid}>
            <div style={styles.shapeBox20}>
              <strong>🟦 Square</strong><br/>
              • 4 equal sides<br/>
              • 4 right angles (90°)<br/>
              • 4 lines of symmetry<br/>
              • Opposite sides parallel<br/>
              <div id="square-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>👆 Click me!</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>📱 Rectangle</strong><br/>
              • Opposite sides equal<br/>
              • 4 right angles (90°)<br/>
              • 2 lines of symmetry<br/>
              • Opposite sides parallel<br/>
              <div id="rectangle-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Longer than it is wide</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔶 Rhombus</strong><br/>
              • 4 equal sides<br/>
              • Opposite angles equal<br/>
              • 2 lines of symmetry<br/>
              • Opposite sides parallel<br/>
              <div id="rhombus-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Like a tilted square</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔧 Parallelogram</strong><br/>
              • Opposite sides equal<br/>
              • Opposite angles equal<br/>
              • No right angles<br/>
              • Opposite sides parallel<br/>
              <div id="parallelogram-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Leaning rectangle</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🪂 Trapezoid</strong><br/>
              • 4 sides<br/>
              • Exactly 1 pair parallel sides<br/>
              • Can have different angles<br/>
              • May have line symmetry<br/>
              <div id="trapezoid-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Like a pyramid base</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔺 Triangle</strong><br/>
              • 3 sides<br/>
              • 3 angles<br/>
              • Sum of angles = 180°<br/>
              • Can be many types<br/>
              <div id="triangle-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Simplest polygon</small>
            </div>
          </div>
        </div>
        
        <div style={styles.shapeShowcase}>
          <h3>Other Important Shapes:</h3>
          <div style={styles.grid3}>
            <div style={styles.shapeBox20}>
              <strong>⭕ Circle</strong><br/>
              • All points equal distance from center<br/>
              • No sides or angles<br/>
              • Infinite lines of symmetry<br/>
              • Circumference and diameter<br/>
              <div id="circle-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Perfectly round</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>🔷 Pentagon</strong><br/>
              • 5 equal sides<br/>
              • 5 equal angles<br/>
              • 5 lines of symmetry<br/>
              • Sum of angles = 540°<br/>
              <div id="pentagon-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Like home plate</small>
            </div>
            <div style={styles.shapeBox20}>
              <strong>⬡ Hexagon</strong><br/>
              • 6 equal sides<br/>
              • 6 equal angles<br/>
              • 6 lines of symmetry<br/>
              • Sum of angles = 720°<br/>
              <div id="hexagon-demo" style={{ ...styles.svgContainer, marginTop: '10px' }}></div>
              <small style={{color: '#666', fontStyle: 'italic'}}>Like a honeycomb</small>
            </div>
          </div>
        </div>

        <div style={styles.example}>
          <strong>🎮 Interactive Features:</strong>
          <br/>• <strong>CLICK any shape</strong> to see detailed properties in a popup!
          <br/>• <strong>HOVER</strong> over shapes to see them grow and glow
          <br/>• Properties are listed for each shape
          <br/>• Compare different shapes side by side
          <br/>• Look for patterns in similar shapes
        </div>

        <div style={styles.tip}>
          <span style={styles.emoji}>🔍</span><strong>Shape Detective Challenge:</strong> Click on each shape to discover their secrets! Can you find which shapes have parallel sides? Which ones have right angles? Count the lines of symmetry!
        </div>

        <div style={styles.shapeShowcase}>
          <span style={styles.emoji}>🌟</span><strong>You're a Geometry Expert!</strong> Shapes are everywhere around us - from the buildings we see to the patterns in nature!
        </div>
    </div>
  );
};

export default GeometryExplanation;
