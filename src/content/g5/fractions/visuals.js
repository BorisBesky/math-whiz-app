import React from 'react';

// Inline SVG teaching figures for the Fractions 5th "Explain" screen.
// Fifth-grade fraction work (5.NF) is built on models — bars for unlike
// denominators, an area model for multiplication, a number line for scaling —
// so each idea in Explanation.js gets the picture that goes with it.

const STROKE = '#9f1239';
const EMPTY = '#ffffff';

/** One fraction bar cut into `denominator` equal pieces, `shaded` filled. */
export const FractionBar = ({
  denominator,
  shaded,
  width = 250,
  height = 42,
  fill = '#fb7185',
  label = null,
  highlightIndex = null,
}) => {
  const pieceWidth = width / denominator;
  return (
    <div style={{ textAlign: 'center', margin: '4px 0' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${width + 4} ${height + 4}`}
        style={{ maxWidth: width + 4, height: 'auto' }}
        role="img"
        aria-label={`Bar split into ${denominator} equal pieces with ${shaded} shaded`}
      >
        <title>{`${shaded} out of ${denominator}`}</title>
        {Array.from({ length: denominator }, (_, index) => (
          <rect
            key={index}
            x={2 + index * pieceWidth}
            y={2}
            width={pieceWidth}
            height={height}
            fill={index === highlightIndex ? '#7c3aed' : index < shaded ? fill : EMPTY}
            stroke={STROKE}
            strokeWidth="2"
          />
        ))}
      </svg>
      {label && (
        <div style={{ fontSize: '0.85em', fontWeight: 700, color: '#9f1239' }}>{label}</div>
      )}
    </div>
  );
};

const Row = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '18px', alignItems: 'flex-end' }}>
    {children}
  </div>
);

const Step = ({ heading, children }) => (
  <div style={{ margin: '10px 0' }}>
    <div style={{ fontSize: '0.85em', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>{heading}</div>
    {children}
  </div>
);

/**
 * Why unlike denominators have to be rewritten: the pieces are different
 * sizes until both bars are cut the same way.
 */
export const UnlikeDenominatorsDemo = () => (
  <div>
    <Step heading="① Different-size pieces — you can't add them yet">
      <Row>
        <FractionBar denominator={2} shaded={1} width={210} label="1/2" />
        <FractionBar denominator={3} shaded={1} width={210} label="1/3" fill="#60a5fa" />
      </Row>
    </Step>
    <Step heading="② Cut BOTH into sixths — now every piece matches">
      <Row>
        <FractionBar denominator={6} shaded={3} width={210} label="3/6" />
        <FractionBar denominator={6} shaded={2} width={210} label="2/6" fill="#60a5fa" />
      </Row>
    </Step>
    <Step heading="③ Now just add the pieces">
      <FractionBar denominator={6} shaded={5} width={210} label="3/6 + 2/6 = 5/6" fill="#a78bfa" />
    </Step>
  </div>
);

/**
 * Area model for 2/3 x 4/5: shade 4 of 5 columns one way and 2 of 3 rows the
 * other. The double-shaded overlap is the product — 8 of 15 squares.
 */
export const MultiplicationAreaModel = ({
  numerator1 = 2,
  denominator1 = 3,
  numerator2 = 4,
  denominator2 = 5,
}) => {
  const size = 210;
  const cellWidth = size / denominator2;
  const cellHeight = size / denominator1;
  const product = numerator1 * numerator2;
  const total = denominator1 * denominator2;

  const cells = [];
  for (let row = 0; row < denominator1; row += 1) {
    for (let col = 0; col < denominator2; col += 1) {
      const inColumns = col < numerator2;
      const inRows = row < numerator1;
      const fill = inColumns && inRows ? '#7c3aed' : inColumns ? '#bfdbfe' : inRows ? '#fecdd3' : EMPTY;
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={2 + col * cellWidth}
          y={2 + row * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill={fill}
          stroke="#334155"
          strokeWidth="1.5"
        />
      );
    }
  }

  const label = `${numerator1}/${denominator1} × ${numerator2}/${denominator2} = ${product}/${total}`;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${size + 4} ${size + 4}`}
        style={{ maxWidth: size + 4, height: 'auto' }}
        role="img"
        aria-label={`Area model showing ${label}: ${product} of ${total} squares are double shaded`}
      >
        <title>{label}</title>
        {cells}
      </svg>
      <div style={{ fontSize: '0.9em', fontWeight: 700, color: '#5b21b6' }}>{label}</div>
    </div>
  );
};

/**
 * Scaling on a number line (5.NF.B.5): multiplying by a fraction less than 1
 * lands left of the starting number, greater than 1 lands right, exactly 1
 * stays put.
 */
export const ScalingNumberLine = ({ start = 60, max = 100 }) => {
  const width = 400;
  const height = 150;
  const left = 30;
  const right = 30;
  const axisY = 96;
  const xFor = (value) => left + (value / max) * (width - left - right);
  const marks = [
    { value: Math.round(start * 0.8), label: '4/5 × 60 = 48', color: '#0284c7', note: 'smaller' },
    { value: start, label: '60', color: '#334155', note: 'start' },
    { value: Math.round(start * 1.4), label: '7/5 × 60 = 84', color: '#dc2626', note: 'bigger' },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: width, height: 'auto' }}
        role="img"
        aria-label="Number line showing 4/5 of 60 landing at 48 to the left of 60, and 7/5 of 60 landing at 84 to the right of 60"
      >
        <title>Multiplying by a fraction scales a number</title>
        <rect width={width} height={height} rx="12" fill="#fff1f2" />
        <line x1={left - 14} y1={axisY} x2={width - right + 14} y2={axisY} stroke="#334155" strokeWidth="2.5" />
        {[0, 20, 40, 60, 80, 100].map((value) => (
          <g key={value}>
            <line x1={xFor(value)} y1={axisY - 5} x2={xFor(value)} y2={axisY + 5} stroke="#334155" strokeWidth="2" />
            <text x={xFor(value)} y={axisY + 22} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#64748b">
              {value}
            </text>
          </g>
        ))}
        {marks.map(({ value, label, color, note }, index) => (
          <g key={label}>
            <circle cx={xFor(value)} cy={axisY} r="6" fill={color} stroke="#ffffff" strokeWidth="2" />
            <text
              x={xFor(value)}
              y={index === 1 ? axisY + 44 : 30 + index * 14}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontSize="12"
              fontWeight="700"
              fill={color}
            >
              {label}
            </text>
            <text
              x={xFor(value)}
              y={index === 1 ? axisY + 58 : 44 + index * 14}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontSize="10"
              fill={color}
            >
              {note}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/** 1/3 ÷ 4: one third, split 4 ways, makes pieces that are twelfths. */
export const UnitFractionSharedDemo = () => (
  <div>
    <Step heading="Start with 1/3 of a whole">
      <FractionBar denominator={3} shaded={1} width={240} label="1/3" fill="#fb7185" />
    </Step>
    <Step heading="Split that third into 4 equal pieces — the WHOLE is now in twelfths">
      <FractionBar denominator={12} shaded={0} highlightIndex={0} width={240} label="1/3 ÷ 4 = 1/12" />
    </Step>
  </div>
);

/** 4 ÷ 1/3: how many thirds fit in 4 wholes? Count them. */
export const UnitFractionFitDemo = () => (
  <div>
    <div style={{ fontSize: '0.85em', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
      How many 1/3-pieces fit in 4 wholes?
    </div>
    <Row>
      {[1, 2, 3, 4].map((whole) => (
        <FractionBar key={whole} denominator={3} shaded={3} width={110} height={34} fill="#34d399" label={`whole ${whole}`} />
      ))}
    </Row>
    <div style={{ fontSize: '0.9em', fontWeight: 700, color: '#065f46', marginTop: '8px' }}>
      3 thirds per whole × 4 wholes = <span style={{ fontSize: '1.1em' }}>12</span> pieces, so 4 ÷ 1/3 = 12
    </div>
  </div>
);

/**
 * The benchmark number line (5.NF.A.2): 0, 1/2 and 1 with the "closest to"
 * zones shaded, so rounding a fraction to a benchmark becomes a question of
 * which band it lands in.
 */
export const BenchmarkNumberLine = ({
  marks = [
    { label: '1/8', value: 0.125 },
    { label: '5/9', value: 0.5556 },
    { label: '7/8', value: 0.875 },
  ],
}) => {
  const width = 420;
  const height = 172;
  const left = 40;
  const right = 40;
  const axisY = 104;
  const span = width - left - right;
  const xFor = (value) => left + value * span;
  const zones = [
    { from: 0, to: 0.25, label: 'closest to 0', fill: '#dbeafe', color: '#1d4ed8' },
    { from: 0.25, to: 0.75, label: 'closest to 1/2', fill: '#fce7f3', color: '#be185d' },
    { from: 0.75, to: 1, label: 'closest to 1', fill: '#dcfce7', color: '#15803d' },
  ];
  const benchmarks = [
    { at: 0, label: '0' },
    { at: 0.5, label: '1/2' },
    { at: 1, label: '1' },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: width, height: 'auto' }}
        role="img"
        aria-label={`Number line from 0 to 1 with benchmark zones, showing ${marks.map((mark) => mark.label).join(', ')} placed in the zone each is closest to`}
      >
        <title>Benchmark fractions on a number line</title>
        <rect width={width} height={height} rx="12" fill="#fff1f2" />

        {zones.map((zone) => (
          <g key={zone.label}>
            <rect x={xFor(zone.from)} y={axisY - 26} width={xFor(zone.to) - xFor(zone.from)} height="52" fill={zone.fill} />
            <text
              x={(xFor(zone.from) + xFor(zone.to)) / 2}
              y={axisY + 46}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontSize="11"
              fontWeight="700"
              fill={zone.color}
            >
              {zone.label}
            </text>
          </g>
        ))}

        <line x1={xFor(0) - 16} y1={axisY} x2={xFor(1) + 16} y2={axisY} stroke="#334155" strokeWidth="2.5" />

        {[0.25, 0.75].map((at) => (
          <line key={at} x1={xFor(at)} y1={axisY - 26} x2={xFor(at)} y2={axisY + 26} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
        ))}

        {benchmarks.map(({ at, label }) => (
          <g key={label}>
            <line x1={xFor(at)} y1={axisY - 12} x2={xFor(at)} y2={axisY + 12} stroke="#334155" strokeWidth="3" />
            <text x={xFor(at)} y={axisY + 30} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#334155">
              {label}
            </text>
          </g>
        ))}

        {marks.map(({ label, value }) => (
          <g key={label}>
            <circle cx={xFor(value)} cy={axisY} r="6" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
            <text x={xFor(value)} y={axisY - 22} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#e11d48">
              {label}
            </text>
          </g>
        ))}

        <text x={width / 2} y={22} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#9f1239">
          Round each fraction to the benchmark whose band it lands in
        </text>
      </svg>
    </div>
  );
};
