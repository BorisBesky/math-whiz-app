import React from 'react';

// Inline SVG teaching figures for the Operations & Algebraic Thinking 5th
// "Explain" screen. Order of operations, prime factorization and paired
// patterns are all easier to see than to read, so Explanation.js pairs each
// rule with the picture it comes from.

const INK = '#4c1d95';
const PANEL = '#f5f3ff';

/**
 * Peels a nested expression one grouping at a time (5.OA.A.1). Each character
 * is placed individually so the highlight box lines up exactly, whatever the
 * font falls back to.
 */
export const OrderOfOperationsSteps = ({
  steps = [
    { text: '[4 + (10 - 7)] × 5', highlight: [5, 8], note: 'Parentheses first: 10 - 7 = 3' },
    { text: '[4 + 3] × 5', highlight: [0, 7], note: 'Then the brackets: 4 + 3 = 7' },
    { text: '7 × 5', highlight: [0, 5], note: 'Multiply last' },
    { text: '35', highlight: null, note: 'Answer!' },
  ],
}) => {
  const charWidth = 13;
  const rowHeight = 52;
  const left = 20;
  const noteX = 20;
  const longest = Math.max(...steps.map((step) => step.text.length));
  const exprWidth = longest * charWidth;
  const width = left + exprWidth + 30 + 210;
  const height = steps.length * rowHeight + 24;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`Working ${steps[0].text} from the inside out, one grouping at a time, down to ${steps[steps.length - 1].text}`}
    >
      <title>Order of operations, step by step</title>
      <rect width={width} height={height} rx="12" fill={PANEL} />
      {steps.map((step, row) => {
        const y = 18 + row * rowHeight;
        return (
          <g key={step.text}>
            {step.highlight && (
              <rect
                x={left + step.highlight[0] * charWidth - 3}
                y={y}
                width={step.highlight[1] * charWidth + 6}
                height="34"
                rx="8"
                fill="#ddd6fe"
                stroke="#7c3aed"
                strokeWidth="2"
              />
            )}
            {step.text.split('').map((character, index) => (
              <text
                key={index}
                x={left + index * charWidth + charWidth / 2}
                y={y + 24}
                textAnchor="middle"
                fontFamily="'Courier New', monospace"
                fontSize="21"
                fontWeight="700"
                fill={INK}
              >
                {character}
              </text>
            ))}
            <text
              x={left + exprWidth + 30 + noteX}
              y={y + 23}
              fontFamily="Arial, sans-serif"
              fontSize="13"
              fill="#6d28d9"
            >
              {step.note}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Factor tree (5.OA.A.2.1)                                            */
/* ------------------------------------------------------------------ */

const layoutTree = (node, depth, cursor) => {
  if (!node.children || node.children.length === 0) {
    const laid = { ...node, depth, x: cursor.next, children: [] };
    cursor.next += 1;
    return laid;
  }
  const children = node.children.map((child) => layoutTree(child, depth + 1, cursor));
  const x = children.reduce((sum, child) => sum + child.x, 0) / children.length;
  return { ...node, depth, x, children };
};

const flatten = (node, out = []) => {
  out.push(node);
  node.children.forEach((child) => flatten(child, out));
  return out;
};

/**
 * A factor tree: keep splitting until every leaf is prime. Leaves are drawn
 * filled so "the primes are the ones at the bottom" is visible at a glance.
 */
export const FactorTree = ({
  tree = {
    value: 24,
    children: [
      { value: 4, children: [{ value: 2 }, { value: 2 }] },
      { value: 6, children: [{ value: 2 }, { value: 3 }] },
    ],
  },
  caption = '24 = 2 × 2 × 2 × 3',
}) => {
  const cursor = { next: 0 };
  const laid = layoutTree(tree, 0, cursor);
  const nodes = flatten(laid);
  const columns = cursor.next;
  const colWidth = 72;
  const rowHeight = 72;
  const padding = 24;
  const width = padding * 2 + Math.max(columns * colWidth, 200);
  const depth = Math.max(...nodes.map((node) => node.depth));
  const height = padding * 2 + depth * rowHeight + 60;
  const xFor = (node) => padding + (node.x + 0.5) * colWidth;
  const yFor = (node) => padding + node.depth * rowHeight + 18;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`Factor tree: ${caption}`}
    >
      <title>{`Factor tree for ${tree.value}`}</title>
      <rect width={width} height={height} rx="12" fill={PANEL} />

      {nodes.flatMap((node) =>
        node.children.map((child) => (
          <line
            key={`${node.value}-${node.x}-${child.value}-${child.x}`}
            x1={xFor(node)}
            y1={yFor(node) + 18}
            x2={xFor(child)}
            y2={yFor(child) - 18}
            stroke="#a78bfa"
            strokeWidth="2.5"
          />
        ))
      )}

      {nodes.map((node) => {
        const isPrime = node.children.length === 0;
        return (
          <g key={`${node.value}-${node.x}-${node.depth}`}>
            <circle
              cx={xFor(node)}
              cy={yFor(node)}
              r="19"
              fill={isPrime ? '#7c3aed' : '#ffffff'}
              stroke="#7c3aed"
              strokeWidth="2.5"
            />
            <text
              x={xFor(node)}
              y={yFor(node) + 6}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontSize="16"
              fontWeight="700"
              fill={isPrime ? '#ffffff' : INK}
            >
              {node.value}
            </text>
          </g>
        );
      })}

      <text x={width / 2} y={height - 16} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" fill={INK}>
        {caption}
      </text>
      <text x={width / 2} y={height - 36} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#7c3aed">
        filled circles = prime
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Two related patterns, graphed as ordered pairs (5.OA.B.3)           */
/* ------------------------------------------------------------------ */

/**
 * Plots corresponding terms of two patterns as ordered pairs, which is
 * exactly what 5.OA.B.3 asks for — and makes "every B is twice its A" a
 * straight line you can see.
 */
export const PatternPairsGraph = ({
  pairs = [[0, 0], [3, 6], [6, 12], [9, 18]],
  xMax = 12,
  yMax = 24,
  xStep = 3,
  yStep = 6,
  xLabel = 'Pattern A (add 3)',
  yLabel = 'Pattern B (add 6)',
  relation = 'Every B term is 2 × its matching A term',
}) => {
  const width = 380;
  const height = 320;
  const left = 52;
  const right = 24;
  const top = 40;
  const bottom = 62;
  const xFor = (x) => left + (x / xMax) * (width - left - right);
  const yFor = (y) => height - bottom - (y / yMax) * (height - top - bottom);
  const xTicks = Array.from({ length: Math.floor(xMax / xStep) + 1 }, (_, n) => n * xStep);
  const yTicks = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, n) => n * yStep);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={`Graph of the ordered pairs ${pairs.map(([x, y]) => `(${x}, ${y})`).join(', ')}. ${relation}`}
    >
      <title>Corresponding terms of two patterns</title>
      <rect width={width} height={height} rx="12" fill={PANEL} />

      {xTicks.map((value) => (
        <line key={`vx-${value}`} x1={xFor(value)} y1={top} x2={xFor(value)} y2={yFor(0)} stroke="#ddd6fe" strokeWidth="1" />
      ))}
      {yTicks.map((value) => (
        <line key={`hy-${value}`} x1={left} y1={yFor(value)} x2={width - right} y2={yFor(value)} stroke="#ddd6fe" strokeWidth="1" />
      ))}

      <line x1={left} y1={yFor(0)} x2={width - right} y2={yFor(0)} stroke="#334155" strokeWidth="2.5" />
      <line x1={left} y1={yFor(0)} x2={left} y2={top} stroke="#334155" strokeWidth="2.5" />

      {xTicks.map((value) => (
        <text key={`xt-${value}`} x={xFor(value)} y={yFor(0) + 18} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#475569">
          {value}
        </text>
      ))}
      {yTicks.filter((value) => value !== 0).map((value) => (
        <text key={`yt-${value}`} x={left - 10} y={yFor(value) + 4} textAnchor="end" fontFamily="Arial, sans-serif" fontSize="11" fill="#475569">
          {value}
        </text>
      ))}

      <polyline
        points={pairs.map(([x, y]) => `${xFor(x)},${yFor(y)}`).join(' ')}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeDasharray="6 4"
      />

      {pairs.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={xFor(x)} cy={yFor(y)} r="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="2" />
          <text x={xFor(x) + 8} y={yFor(y) - 8} fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#5b21b6">
            {`(${x}, ${y})`}
          </text>
        </g>
      ))}

      <text x={(width + left) / 2} y={height - 26} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#5b21b6">
        {xLabel}
      </text>
      <text
        x={16}
        y={(top + yFor(0)) / 2}
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="12"
        fontWeight="700"
        fill="#5b21b6"
        transform={`rotate(-90 16 ${(top + yFor(0)) / 2})`}
      >
        {yLabel}
      </text>
      <text x={width / 2} y={22} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill={INK}>
        {relation}
      </text>
    </svg>
  );
};
