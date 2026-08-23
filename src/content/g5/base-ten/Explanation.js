import React from 'react';
import { PlaceValueChart, DecimalSlide, RoundingNumberLine, PartialProductsBox } from './visuals';

// Shown when a student taps "Explain" on a Base Ten 5th question.
// Follows the kid-friendly inline-style pattern of the other Explanations.
const BaseTen5thExplanation = () => {
  const styles = {
    container: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      lineHeight: 1.6,
      color: '#333',
      padding: '0',
      margin: '0',
    },
    h1: {
      color: '#4f46e5',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#4338ca',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #4338ca',
      paddingBottom: '10px',
    },
    example: {
      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
      padding: '20px',
      borderRadius: '15px',
      margin: '20px 0',
      borderLeft: '5px solid #4f46e5',
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
    figure: {
      background: '#ffffff',
      padding: '16px',
      borderRadius: '15px',
      margin: '20px 0',
      border: '3px solid #3498db',
      textAlign: 'center',
    },
    caption: {
      fontSize: '0.95em',
      color: '#475569',
      marginTop: '10px',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>🔢 Decimals & Big Numbers!</h1>

      <h2 style={styles.h2}>🏠 Decimal place value</h2>
      <p>
        Every digit lives in a <strong>place</strong>, and each place is worth{' '}
        <strong>10 times</strong> the place to its right (and 1/10 of the place to its left).
      </p>
      <div style={styles.figure}>
        <PlaceValueChart digits="347.916" />
        <div style={styles.caption}>
          Step <strong style={{ color: '#dc2626' }}>left</strong> and a place is worth{' '}
          <strong>10 times</strong> as much. Step <strong style={{ color: '#2563eb' }}>right</strong>{' '}
          and it's worth <strong>one tenth</strong> as much.
        </div>
      </div>
      <div style={styles.visual}>
        3 4 7 <strong>.</strong> 9 1 6
        <br />
        hundreds · tens · ones <strong>·</strong> tenths · hundredths · thousandths
      </div>
      <div style={styles.example}>
        <span style={styles.emoji}>🔍</span>
        In 347.916, the 9 means <strong>9 tenths</strong> and the 6 means{' '}
        <strong>6 thousandths</strong>. And 340 is <strong>100 times</strong> as large as 3.4!
      </div>

      <h2 style={styles.h2}>✍️ Three ways to write the same number</h2>
      <p>
        Every decimal can be written three ways, and they all mean exactly the same thing.
      </p>
      <div style={styles.visual}>
        <strong>Digits:</strong> 347.916
        <br />
        <strong>Number name:</strong> three hundred forty-seven <em>and</em> nine hundred sixteen
        thousandths
        <br />
        <strong>Expanded form:</strong> 3 × 100 + 4 × 10 + 7 × 1 + 9 × (1/10) + 1 × (1/100) + 6 ×
        (1/1000)
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Two big tips:</strong> the word <strong>"and"</strong> is how you say the decimal
        point — so 5.4 is "five <em>and</em> four tenths", never "five and four". And the{' '}
        <strong>last place you reach</strong> names the whole decimal part: 0.916 is "nine hundred
        sixteen <strong>thousandths</strong>" because the 6 sits in the thousandths place.
      </div>
      <div style={styles.example}>
        <span style={styles.emoji}>🕳️</span>
        <strong>Watch the placeholder zeros!</strong> 0.407 is "four hundred <strong>seven</strong>{' '}
        thousandths" — the 0 holds the hundredths place open. Drop it and you'd get 0.47, a
        completely different number.
      </div>

      <h2 style={styles.h2}>🚀 Powers of ten</h2>
      <p>
        Multiplying or dividing by 10, 100, or 1000 just <strong>slides the decimal point</strong>{' '}
        — one place per zero.
      </p>
      <div style={styles.figure}>
        <DecimalSlide digits="487" startGap={1} endGap={3} caption="4.87 × 100 = 487" />
        <div style={styles.caption}>
          <strong>× 100</strong> has two zeros, so the point takes <strong>two hops right</strong>.
        </div>
      </div>
      <div style={styles.figure}>
        <DecimalSlide digits="0487" startGap={4} endGap={1} caption="487 ÷ 1000 = 0.487" />
        <div style={styles.caption}>
          Dividing sends the point the other way — <strong>three hops left</strong> for{' '}
          <strong>÷ 1000</strong> (write a 0 in front to hold the ones place).
        </div>
      </div>
      <div style={styles.visual}>
        4.87 × 100 = <strong>487</strong> (point slides right 2 places ➡️)
        <br />
        487 ÷ 1000 = <strong>0.487</strong> (point slides left 3 places ⬅️)
      </div>

      <h2 style={styles.h2}>⚖️ Comparing and rounding decimals</h2>
      <p>
        To compare, line up the decimal points and check place by place from the left. Watch out:{' '}
        <strong>0.45 &gt; 0.405</strong>, because 5 hundredths beats 0 hundredths!
      </p>
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span>
        <strong>Tip:</strong> extra zeros on the end change nothing: 0.5 = 0.50 = 0.500.
      </div>
      <div style={styles.figure}>
        <RoundingNumberLine low="3.27" high="3.28" value="3.276" position={0.6} />
        <div style={styles.caption}>
          Rounding is really asking <strong>"which end is closer?"</strong> — 3.276 sits past the
          halfway mark, so it's nearer to 3.28.
        </div>
      </div>
      <div style={styles.example}>
        <span style={styles.emoji}>🎯</span>
        To round 3.276 to the nearest hundredth, look one place further right: the 6 says "round
        up", so 3.276 → <strong>3.28</strong>.
      </div>

      <h2 style={styles.h2}>✖️ Multiplying big numbers</h2>
      <p>Break the problem into friendly pieces, then add the pieces.</p>
      <div style={styles.figure}>
        <PartialProductsBox topParts={[200, 30, 4]} sideParts={[50, 6]} />
        <div style={styles.caption}>
          Split <strong>234</strong> into 200 + 30 + 4 and <strong>56</strong> into 50 + 6. Every
          box is one easy multiplication — then add all six.
        </div>
      </div>
      <div style={styles.visual}>
        234 × 56 = 234 × 50 + 234 × 6
        <br />
        = 11700 + 1404 = <strong>13104</strong>
      </div>

      <h2 style={styles.h2}>➗ Dividing by two-digit numbers</h2>
      <p>
        Ask: "How many groups of the divisor fit?" Multiples of 10 are your friends.
      </p>
      <div style={styles.example}>
        <span style={styles.emoji}>🧗</span>
        1248 ÷ 24 → 24 × 50 = 1200, and 48 ÷ 24 = 2, so the answer is <strong>52</strong>.
      </div>

      <h2 style={styles.h2}>🪙 Decimal arithmetic</h2>
      <p>
        Adding or subtracting? <strong>Line up the decimal points.</strong> Multiplying? Multiply
        as whole numbers, then place the point. Dividing by a whole number? The point in the
        answer sits right above the point in the dividend.
      </p>
      <div style={styles.visual}>
        3.45 + 2.8 = <strong>6.25</strong> · 7.2 − 3.45 = <strong>3.75</strong>
        <br />
        0.25 × 4 = <strong>1</strong> · 4.5 ÷ 5 = <strong>0.9</strong>
      </div>
      <div style={styles.tip}>
        <span style={styles.emoji}>🌟</span>
        <strong>Remember:</strong> decimals are just place value continued past the point — the
        same rules you already know keep working!
      </div>
    </div>
  );
};

export default BaseTen5thExplanation;
