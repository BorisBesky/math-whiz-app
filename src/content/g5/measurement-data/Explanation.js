import React from 'react';
import {
  createUnitCubePrismImage,
  createLabeledPrismImage,
  createCompositePrismImage,
  createLinePlotImage,
  createMetricLadderImage,
} from './visuals';

// Shown when a student taps "Explain" on a Measurement & Data 5th question.
// Follows the kid-friendly inline-style pattern of the other Explanations.
// The figures come from the same ./visuals.js builders the question generator
// uses, so what a student studies here looks exactly like what they're asked.

const Figure = ({ built, children }) => (
  <div
    style={{
      background: '#ffffff',
      padding: '16px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
      textAlign: 'center',
    }}
  >
    <img src={built.data} alt={built.description} style={{ maxWidth: '100%', height: 'auto' }} />
    {children && (
      <div style={{ fontSize: '0.95em', color: '#475569', marginTop: '10px' }}>{children}</div>
    )}
  </div>
);

const MeasurementData5thExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#d97706',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#b45309',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #b45309',
      paddingBottom: '10px',
    },
    example: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      borderLeft: '5px solid #d97706',
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
      <h1 style={styles.h1}>📦 Measure It, Convert It, Fill It!</h1>

      <h2 style={styles.h2}>🔄 Converting units</h2>
      <p>
        Converting means trading one unit for another. Going from <strong>big to small</strong>{' '}
        units? Multiply. From <strong>small to big</strong>? Divide.
      </p>
      <div style={styles.visual}>
        3 feet × 12 = <strong>36 inches</strong> · 2 hours × 60 = <strong>120 minutes</strong>
        <br />
        In metric, the decimal point just slides: 5 cm = 5 ÷ 100 = <strong>0.05 m</strong> ✨
      </div>
      <Figure built={createMetricLadderImage()}>
        Every step down the ladder is <strong>× 10</strong>, <strong>× 100</strong>, or{' '}
        <strong>× 1000</strong>. Going back up? Do the opposite and <strong>divide</strong>.
      </Figure>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Tip:</strong> smaller units mean MORE of them — 36 inches is the same length as 3
        feet, just counted in smaller steps.
      </div>

      <h2 style={styles.h2}>📊 Line plots with fractions</h2>
      <p>
        A line plot stacks an ✕ for every measurement. In 5th grade the measurements are often
        fractions like 1/4, 1/2, and 3/4.
      </p>
      <Figure
        built={createLinePlotImage({
          ticks: [
            { label: '0' },
            { label: '1/4', count: 2 },
            { label: '1/2', count: 5 },
            { label: '3/4', count: 3 },
            { label: '1' },
          ],
          axisLabel: 'Ribbon length (feet)',
          title: 'Line plot of ribbon lengths',
        })}
      >
        Each <strong>✕</strong> is one ribbon. Count the marks in a stack to see how many ribbons
        share that length.
      </Figure>
      <div style={styles.example}>
        <span style={styles.emoji}>🎀</span>
        Say 2 ribbons measure 1/4 ft, 5 measure 1/2 ft, and 3 measure 3/4 ft. That's{' '}
        <strong>10 ribbons</strong>, the most common length is <strong>1/2 foot</strong>, and the
        1/2-foot ribbons total 5 × 1/2 = <strong>2 1/2 feet</strong>.
      </div>

      <h2 style={styles.h2}>🧊 What is volume?</h2>
      <p>
        Volume measures the space <strong>inside</strong> a 3-D shape — how many{' '}
        <strong>unit cubes</strong> fit with no gaps or overlaps. That's why volume always uses{' '}
        <strong>cubic</strong> units!
      </p>
      <Figure
        built={createUnitCubePrismImage({
          length: 4,
          width: 3,
          height: 2,
          highlightBottomLayer: true,
          label: 'one layer = 4 × 3 = 12 cubes',
        })}
      >
        The <strong>shaded bottom layer</strong> holds 4 × 3 = <strong>12 cubes</strong>. Stack{' '}
        <strong>2 layers</strong> and you get 12 × 2 = <strong>24 cubic units</strong>.
      </Figure>
      <div style={styles.visual}>
        A prism 4 cubes long, 3 wide, 2 tall:
        <br />
        one layer = 4 × 3 = 12 cubes, and 2 layers = <strong>24 cubic units</strong>
      </div>

      <h2 style={styles.h2}>📐 The volume formula</h2>
      <div style={styles.visual}>
        V = length × width × height (or V = base area × height)
      </div>
      <Figure built={createLabeledPrismImage({ length: 5, width: 4, height: 3, unit: 'centimeters' })}>
        5 × 4 × 3 = <strong>60 cubic centimeters</strong>. The base (5 × 4 = 20 sq cm) is one
        layer, and it repeats 3 times.
      </Figure>
      <div style={styles.example}>
        <span style={styles.emoji}>📏</span>A box 5 cm × 4 cm × 3 cm holds 5 × 4 × 3 ={' '}
        <strong>60 cubic centimeters</strong>. And if you know V = 60 and the base is 20 square
        cm, the height must be 60 ÷ 20 = <strong>3 cm</strong>.
      </div>

      <h2 style={styles.h2}>🏗️ Volume is additive</h2>
      <p>
        An L-shaped figure is just <strong>two boxes glued together</strong> — find each volume
        and add.
      </p>
      <Figure built={createCompositePrismImage({ first: [4, 2, 3], second: [2, 2, 2] })}>
        Split the figure, find each volume, then add: 24 + 8 = <strong>32 cubic units</strong>.
      </Figure>
      <div style={styles.example}>
        <span style={styles.emoji}>🧱</span>A 4 × 2 × 3 prism (24) plus a 2 × 2 × 2 prism (8) make{' '}
        <strong>32 cubic units</strong> in all.
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span>
        <strong>Remember:</strong> length is 1-D, area is 2-D (square units), volume is 3-D (cubic
        units)!
      </div>
    </div>
  );
};

export default MeasurementData5thExplanation;
