import React from 'react';

// Inline SVG teaching figures for the Base Ten 5th "Explain" screen.
// Place value, the decimal-point slide, rounding and partial products are all
// spatial ideas; these give Explanation.js the picture for each one.

const INK = '#312e81';
const RULE = '#a5b4fc';
const PANEL = '#eef2ff';

/**
 * A decimal place-value chart with the x10 (leftward) and divide-by-10
 * (rightward) relationships drawn between neighbouring places — 5.NBT.A.1.
 */
export const PlaceValueChart = ({ digits = '347.916' }) => {
  const [wholePart, decimalPart = ''] = digits.split('.');
  const wholeNames = ['hundreds', 'tens', 'ones'].slice(-wholePart.length);
  const decimalNames = ['tenths', 'hundredths', 'thousandths'].slice(0, decimalPart.length);

  const columns = [
    ...wholePart.split('').map((digit, index) => ({ digit, name: wholeNames[index], kind: 'place' })),
    { kind: 'point' },
    ...decimalPart.split('').map((digit, index) => ({ digit, name: decimalNames[index], kind: 'place' })),
  ];

  const colWidth = 74;
  const pointWidth = 24;
  const padding = 18;
  const topBand = 46;
  const headerHeight = 34;
  const digitHeight = 50;
  const bottomBand = 46;

  const xs = [];
  let cursor = padding;
  columns.forEach((column) => {
    const w = column.kind === 'point' ? pointWidth : colWidth;
    xs.push({ x: cursor, w });
    cursor += w;
  });
  const width = cursor + padding;
  const height = topBand + headerHeight + digitHeight + bottomBand;
  const headerY = topBand;
  const digitY = topBand + headerHeight;

  const centerOf = (index) => xs[index].x + xs[index].w / 2;
  const placeIndexes = columns
    .map((column, index) => (column.kind === 'place' ? index : null))
    .filter((index) => index !== null);

  const arc = (fromIndex, toIndex, y, sweep) => {
    const x1 = centerOf(fromIndex);
    const x2 = centerOf(toIndex);
    const lift = 26;
    return `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + (sweep ? lift : -lift)} ${x2} ${y}`;
  };

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`Place value chart for ${digits}, showing each place is ten times the place to its right`}
    >
      <title>{`Place value chart for ${digits}`}</title>
      <defs>
        <marker id="g5-bt-left" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
        <marker id="g5-bt-right" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#2563eb" />
        </marker>
      </defs>
      <rect width={width} height={height} rx="12" fill={PANEL} />

      {/* x10 going left, above the chart */}
      {placeIndexes.slice(1).map((index, n) => {
        const from = index;
        const to = placeIndexes[n];
        return (
          <g key={`up-${index}`}>
            <path d={arc(from, to, headerY - 6, false)} fill="none" stroke="#dc2626" strokeWidth="2" markerEnd="url(#g5-bt-left)" />
            <text x={(centerOf(from) + centerOf(to)) / 2} y={headerY - 26} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#dc2626">
              × 10
            </text>
          </g>
        );
      })}

      {columns.map((column, index) =>
        column.kind === 'point' ? (
          <text key={index} x={centerOf(index)} y={digitY + 40} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="34" fontWeight="700" fill="#dc2626">
            .
          </text>
        ) : (
          <g key={index}>
            <rect x={xs[index].x} y={headerY} width={xs[index].w} height={headerHeight} fill="#c7d2fe" stroke={RULE} strokeWidth="1.5" />
            <text x={centerOf(index)} y={headerY + 22} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill={INK}>
              {column.name}
            </text>
            <rect x={xs[index].x} y={digitY} width={xs[index].w} height={digitHeight} fill="#ffffff" stroke={RULE} strokeWidth="1.5" />
            <text x={centerOf(index)} y={digitY + 36} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill={INK}>
              {column.digit}
            </text>
          </g>
        )
      )}

      {/* divide by 10 going right, below the chart */}
      {placeIndexes.slice(0, -1).map((index, n) => {
        const to = placeIndexes[n + 1];
        return (
          <g key={`down-${index}`}>
            <path d={arc(index, to, digitY + digitHeight + 6, true)} fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#g5-bt-right)" />
            <text x={(centerOf(index) + centerOf(to)) / 2} y={digitY + digitHeight + 42} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#2563eb">
              ÷ 10
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/**
 * The decimal point hopping places when you multiply or divide by a power of
 * ten — 5.NBT.A.2. One hop per zero.
 */
export const DecimalSlide = ({
  digits = '487',
  startGap = 1,
  endGap = 3,
  caption = '4.87 × 100 = 487',
}) => {
  const spacing = 42;
  const padding = 40;
  const width = padding * 2 + digits.length * spacing;
  const height = 120;
  const digitY = 74;
  const xForDigit = (index) => padding + index * spacing + spacing / 2;
  // A "gap" g sits just before digit index g.
  const xForGap = (gap) => padding + gap * spacing;
  const goingRight = endGap > startGap;
  const hops = Math.abs(endGap - startGap);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`${caption}: the decimal point moves ${hops} place${hops === 1 ? '' : 's'} to the ${goingRight ? 'right' : 'left'}`}
    >
      <title>{caption}</title>
      <defs>
        <marker id="g5-bt-hop" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
      </defs>
      <rect width={width} height={height} rx="12" fill={PANEL} />

      {digits.split('').map((digit, index) => (
        <text key={index} x={xForDigit(index)} y={digitY} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="700" fill={INK}>
          {digit}
        </text>
      ))}

      <circle cx={xForGap(startGap)} cy={digitY + 4} r="5" fill="#94a3b8" />
      <circle cx={xForGap(endGap)} cy={digitY + 4} r="6" fill="#dc2626" />

      {Array.from({ length: hops }, (_, n) => {
        const from = xForGap(goingRight ? startGap + n : startGap - n);
        const to = xForGap(goingRight ? startGap + n + 1 : startGap - n - 1);
        const mid = (from + to) / 2;
        return (
          <path
            key={n}
            d={`M ${from} ${digitY - 22} Q ${mid} ${digitY - 54} ${to} ${digitY - 22}`}
            fill="none"
            stroke="#dc2626"
            strokeWidth="2.5"
            markerEnd="url(#g5-bt-hop)"
          />
        );
      })}

      <text x={width / 2} y={26} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#dc2626">
        {`${hops} hop${hops === 1 ? '' : 's'} ${goingRight ? 'right' : 'left'}`}
      </text>
      <text x={width / 2} y={height - 10} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill={INK}>
        {caption}
      </text>
    </svg>
  );
};

/**
 * Rounding on a zoomed-in number line: is the value past the halfway mark?
 * Answers "why does 3.276 round to 3.28" without any rule-memorising.
 */
export const RoundingNumberLine = ({
  low = '3.27',
  high = '3.28',
  value = '3.276',
  position = 0.6,
}) => {
  const width = 400;
  const height = 132;
  const left = 44;
  const right = 44;
  const axisY = 74;
  const xFor = (fraction) => left + fraction * (width - left - right);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`Number line from ${low} to ${high} showing ${value} past the halfway mark, so it rounds to ${high}`}
    >
      <title>{`Rounding ${value}`}</title>
      <rect width={width} height={height} rx="12" fill={PANEL} />
      <line x1={xFor(0)} y1={axisY} x2={xFor(1)} y2={axisY} stroke={INK} strokeWidth="2.5" />

      {[
        { at: 0, label: low, bold: true },
        { at: 0.5, label: 'halfway', bold: false },
        { at: 1, label: high, bold: true },
      ].map(({ at, label, bold }) => (
        <g key={label}>
          <line
            x1={xFor(at)}
            y1={axisY - (bold ? 12 : 8)}
            x2={xFor(at)}
            y2={axisY + (bold ? 12 : 8)}
            stroke={bold ? INK : '#94a3b8'}
            strokeWidth={bold ? 2.5 : 2}
            strokeDasharray={bold ? undefined : '4 3'}
          />
          <text x={xFor(at)} y={axisY + 32} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight={bold ? '700' : '400'} fill={bold ? INK : '#64748b'}>
            {label}
          </text>
        </g>
      ))}

      <circle cx={xFor(position)} cy={axisY} r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
      <text x={xFor(position)} y={axisY - 20} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#dc2626">
        {value}
      </text>
      <text x={width / 2} y={height - 10} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill={INK}>
        {`Past halfway → round up to ${high}`}
      </text>
    </svg>
  );
};

/**
 * Partial-products box for multi-digit multiplication (5.NBT.B.5): break both
 * factors into place-value chunks and add the pieces.
 */
export const PartialProductsBox = ({ topParts = [200, 30, 4], sideParts = [50, 6] }) => {
  const cellWidth = 92;
  const cellHeight = 54;
  const headerSize = 54;
  const padding = 14;
  const width = padding * 2 + headerSize + topParts.length * cellWidth;
  const totalLine = 30;
  const height = padding * 2 + headerSize + sideParts.length * cellHeight + totalLine;
  const gridX = padding + headerSize;
  const gridY = padding + headerSize;

  const total = topParts.reduce((sum, t) => sum + t, 0) * sideParts.reduce((sum, s) => sum + s, 0);
  const topTotal = topParts.reduce((sum, t) => sum + t, 0);
  const sideTotal = sideParts.reduce((sum, s) => sum + s, 0);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`Area model for ${topTotal} times ${sideTotal}: each cell is one partial product and they add to ${total}`}
    >
      <title>{`${topTotal} × ${sideTotal} partial products`}</title>
      <rect width={width} height={height} rx="12" fill={PANEL} />

      {topParts.map((part, col) => (
        <text key={`top-${part}`} x={gridX + col * cellWidth + cellWidth / 2} y={gridY - 16} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#dc2626">
          {part}
        </text>
      ))}
      {sideParts.map((part, row) => (
        <text key={`side-${part}`} x={gridX - 14} y={gridY + row * cellHeight + cellHeight / 2 + 6} textAnchor="end" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#2563eb">
          {part}
        </text>
      ))}

      {sideParts.map((side, row) =>
        topParts.map((top, col) => (
          <g key={`${row}-${col}`}>
            <rect
              x={gridX + col * cellWidth}
              y={gridY + row * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill="#ffffff"
              stroke={RULE}
              strokeWidth="2"
            />
            <text
              x={gridX + col * cellWidth + cellWidth / 2}
              y={gridY + row * cellHeight + cellHeight / 2 + 6}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontSize="16"
              fontWeight="700"
              fill={INK}
            >
              {(top * side).toLocaleString('en-US')}
            </text>
          </g>
        ))
      )}

      <text x={width / 2} y={height - padding} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill={INK}>
        {`Add every box: ${topTotal} × ${sideTotal} = ${total.toLocaleString('en-US')}`}
      </text>
    </svg>
  );
};
