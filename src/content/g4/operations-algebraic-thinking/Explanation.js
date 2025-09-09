import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const OperationsAlgebraicThinkingExplanation = () => {
  const divisionRef1 = useRef(null);
  const divisionRef2 = useRef(null);

  useEffect(() => {
    const longDivisionWithRemainder = `
      \\begin{array}{c|c}
        & 7 \\text{ R } 1 \\\\
        \\hline
        5 & 36 \\\\
        & \\underline{35} \\\\
        & 1
      \\end{array}
    `;

    const longDivisionNoRemainder = `
      \\begin{array}{c|c}
        & 21 \\\\
        \\hline
        4 & 84 \\\\
        & \\underline{8}\\phantom{4} \\\\
        & 04 \\\\
        & \\underline{4} \\\\
        & 0
      \\end{array}
    `;

    if (divisionRef1.current && divisionRef2.current) {
      try {
        katex.render(longDivisionWithRemainder, divisionRef1.current, {
          throwOnError: false,
          displayMode: true
        });
        katex.render(longDivisionNoRemainder, divisionRef2.current, {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        console.error("KaTeX rendering failed", e);
      }
    }
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
      color: '#4a90e2',
      textAlign: 'center',
      fontSize: '2.5em',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    },
    h2: {
      color: '#e74c3c',
      fontSize: '1.8em',
      marginTop: '30px',
      borderBottom: '3px solid #e74c3c',
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
    funFact: {
      background: 'linear-gradient(135deg, #dda0dd 0%, #98d8c8 100%)',
      padding: '15px',
      borderRadius: '10px',
      margin: '15px 0',
      borderLeft: '5px solid #6c5ce7',
    },
    emoji: {
      fontSize: '1.5em',
      marginRight: '10px',
    },
  };

  return (
    <div style={styles.container} className="operations-algebraic-container">
      <h1 style={styles.h1}>🧮 Operations & Algebraic Thinking (4.OA)</h1>
      
      <h2 style={styles.h2}>🔍 Multiplicative Comparisons</h2>
      <p>Learn to compare quantities using multiplication! When we say "3 times as many," we multiply to find the answer.</p>
      
      <div style={styles.example}>
        <strong>Example:</strong> Sarah has 4 stickers. Tom has 3 times as many stickers as Sarah. How many stickers does Tom have?
        <br/><strong>Solution:</strong> 4 × 3 = 12 stickers
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>💡</span><strong>Tip:</strong> Look for phrases like "times as many," "times as much," or "times larger" - these mean multiplication!
      </div>

      <h2 style={styles.h2}>🔢 Prime and Composite Numbers</h2>
      <p>Numbers can be organized into special groups based on their factors!</p>
      
      <div style={styles.example}>
        <strong>Prime Numbers:</strong> Have exactly 2 factors (1 and themselves)
        <br/>Examples: 2, 3, 5, 7, 11, 13, 17, 19...
        <br/><br/>
        <strong>Composite Numbers:</strong> Have more than 2 factors
        <br/>Examples: 4, 6, 8, 9, 10, 12, 14, 15...
      </div>
      
      <div style={styles.funFact}>
        <span style={styles.emoji}>🎯</span><strong>Fun Fact:</strong> The number 1 is neither prime nor composite - it's special!
      </div>

      <h2 style={styles.h2}>⚡ Factors and Multiples</h2>
      <p>Factors divide evenly into a number, while multiples are what you get when you multiply!</p>
      
      <div style={styles.example}>
        <strong>Factors of 12:</strong> 1, 2, 3, 4, 6, 12 (these all divide into 12 evenly)
        <br/><strong>Multiples of 5:</strong> 5, 10, 15, 20, 25, 30... (keep adding 5!)
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎮</span><strong>Memory Trick:</strong> Factors are smaller (they fit inside), multiples are bigger (they multiply up)!
      </div>

      <h2 style={styles.h2}>🔄 Number Patterns</h2>
      <p>Discover the rules that make number sequences work!</p>
      
      <div style={styles.example}>
        <strong>Pattern:</strong> 3, 6, 9, 12, 15, ?
        <br/><strong>Rule:</strong> Add 3 each time
        <br/><strong>Next number:</strong> 18
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🕵️</span><strong>Pattern Detective:</strong> Look at the difference between numbers to find the rule!
      </div>

      <h2 style={styles.h2}>✖️ Two-Digit × One-Digit Multiplication</h2>
      <p>Learn to multiply bigger numbers step by step!</p>
      
      <div style={styles.example}>
        <strong>Example: 64 × 8</strong>
        <br/>
        <div style={{fontFamily: 'monospace', fontSize: '1.2em', margin: '10px 0'}}>
          {'    64'}
          <br/>{'  ×  8'}
          <br/>{'_____'}
        </div>
        <strong>Step 1:</strong> Multiply the ones: 4 × 8 = 32
        <br/>Write down 2, carry the 3
        <br/><br/>
        <strong>Step 2:</strong> Multiply the tens: 6 × 8 = 48
        <br/>Add the carried 3: 48 + 3 = 51
        <br/><br/>
        <div style={{fontFamily: 'monospace', fontSize: '1.2em', margin: '10px 0'}}>
          {'    64'}
          <br/>{'  ×  8'}
          <br/>{'_____'}
          <br/>{'   512'}
        </div>
        <strong>Answer: 64 × 8 = 512</strong>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>📝</span><strong>Multiplication Tip:</strong> Always start with the ones place and remember to carry over!
      </div>

      <h2 style={styles.h2}>➗ Long Division</h2>
      <p>Break down big division problems into smaller steps!</p>
      
      <div style={styles.example}>
        <strong>Example: 36 ÷ 5</strong>
        <br/>
        <div ref={divisionRef1} style={{textAlign: 'center', margin: '20px 0'}} />
        <strong>Step 1:</strong> How many 5s go into 36?
        <br/>5 × 7 = 35 (closest without going over)
        <br/><br/>
        <strong>Step 2:</strong> Subtract: 36 - 35 = 1
        <br/>Since 1 is less than 5, it becomes our remainder
        <br/><br/>
        <strong>Answer: 36 ÷ 5 = 7 remainder 1</strong>
      </div>
      
      <div style={styles.example}>
        <strong>Division without remainder: 84 ÷ 4</strong>
        <br/>
        <div ref={divisionRef2} style={{textAlign: 'center', margin: '20px 0'}} />
        <strong>Answer: 84 ÷ 4 = 21</strong>
      </div>
      
      <div style={styles.tip}>
        <span style={styles.emoji}>🎯</span><strong>Division Tip:</strong> Think "How many times does this number fit?" and always check your work by multiplying back!
      </div>

      <div style={styles.funFact}>
        <span style={styles.emoji}>🌟</span><strong>You're Amazing!</strong> 4th grade math helps you think like a mathematician. Keep exploring patterns and relationships in numbers!
      </div>
    </div>
  );
};

export default OperationsAlgebraicThinkingExplanation;
