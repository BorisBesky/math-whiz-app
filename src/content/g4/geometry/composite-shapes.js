// Utilities for generating composite (polyomino) shape diagrams used in
// area/perimeter questions. Each shape is described as a set of unit cells
// on a grid; the helpers compute the outline, aggregate collinear edges into
// labeled sides, and render the shape as an SVG data URI.

// All templates are constructed so that every side of the outline spans
// at least 2 grid cells. This guarantees that side-length labels are
// physically far enough apart at concave corners to render without
// overlapping each other.
export const COMPOSITE_SHAPE_TEMPLATES = [
  {
    // 3x3 with top-right 2x2 removed (small L)
    name: 'small-L',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    // 4x4 with top-right 3x3 removed (big L)
    name: 'big-L',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  },
  {
    // 5x4 L-shape with thicker stem
    name: 'thick-L',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
    ],
  },
  {
    // U-shape, notch is 2 cells wide and 2 cells deep
    name: 'U-shape',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [3, 1],
      [3, 0],
    ],
  },
  {
    // Wide U with thicker walls so all sides are at least 2 cells long
    name: 'wide-U',
    cells: [
      [0, 0],
      [1, 0],
      [4, 0],
      [5, 0],
      [0, 1],
      [1, 1],
      [4, 1],
      [5, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
    ],
  },
  {
    // Two-step staircase, each step 2 cells wide and 2 cells deep
    name: 'two-step staircase',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
      [5, 4],
      [0, 5],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
    ],
  },
  {
    // Z / S shape made of three 2x2 blocks
    name: 'Z-shape',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
      [4, 4],
      [5, 4],
    ],
  },
  {
    // Rectangle with a 2x2 corner notch removed
    name: 'rectangle with corner notch',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [0, 2],
      [1, 2],
      [0, 3],
      [1, 3],
    ],
  },
];

/**
 * Returns directed boundary edges for the given polyomino. Edges are oriented
 * so that walking them in order traces the outline clockwise in SVG (y-down)
 * coordinates, which keeps the interior on the right of each edge.
 */
function computeOutlineEdges(cells) {
  const cellSet = new Set(cells.map(([c, r]) => `${c},${r}`));
  const has = (c, r) => cellSet.has(`${c},${r}`);
  const edges = [];

  for (const [c, r] of cells) {
    if (!has(c, r - 1)) edges.push({ x1: c, y1: r, x2: c + 1, y2: r, dir: 'R' });
    if (!has(c + 1, r)) edges.push({ x1: c + 1, y1: r, x2: c + 1, y2: r + 1, dir: 'D' });
    if (!has(c, r + 1)) edges.push({ x1: c + 1, y1: r + 1, x2: c, y2: r + 1, dir: 'L' });
    if (!has(c - 1, r)) edges.push({ x1: c, y1: r + 1, x2: c, y2: r, dir: 'U' });
  }
  return edges;
}

function chainEdgesIntoLoop(edges) {
  if (edges.length === 0) return [];
  const startMap = new Map();
  for (const e of edges) startMap.set(`${e.x1},${e.y1}`, e);

  // Begin at the topmost-leftmost vertex for determinism.
  const sorted = edges.slice().sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1);
  const visited = new Set();
  const loop = [];
  let cur = sorted[0];
  while (cur) {
    const key = `${cur.x1},${cur.y1}`;
    if (visited.has(key)) break;
    visited.add(key);
    loop.push(cur);
    cur = startMap.get(`${cur.x2},${cur.y2}`);
  }
  return loop;
}

/**
 * Combine consecutive collinear unit edges into single sides, each labeled
 * with how many unit edges it spans.
 */
function aggregateSides(loop) {
  if (loop.length === 0) return [];
  const sides = [];
  let cur = { ...loop[0], length: 1 };
  for (let i = 1; i < loop.length; i++) {
    const e = loop[i];
    if (e.dir === cur.dir) {
      cur.x2 = e.x2;
      cur.y2 = e.y2;
      cur.length += 1;
    } else {
      sides.push(cur);
      cur = { ...e, length: 1 };
    }
  }
  // If the closing edge continues the first side, merge them.
  if (sides.length > 0 && cur.dir === sides[0].dir) {
    sides[0].x1 = cur.x1;
    sides[0].y1 = cur.y1;
    sides[0].length += cur.length;
  } else {
    sides.push(cur);
  }
  return sides;
}

export function getOutlineSides(cells) {
  const edges = computeOutlineEdges(cells);
  const loop = chainEdgesIntoLoop(edges);
  return aggregateSides(loop);
}

export function computePerimeterUnits(cells) {
  return computeOutlineEdges(cells).length;
}

function svgToDataUri(svg) {
  if (typeof btoa === 'function') {
    const utf8 = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_m, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return `data:image/svg+xml;base64,${btoa(utf8)}`;
  }
  // Fallback for environments without btoa (e.g., older Node).
  // eslint-disable-next-line no-undef
  const buf = Buffer.from(svg, 'utf-8');
  return `data:image/svg+xml;base64,${buf.toString('base64')}`;
}

/**
 * Renders the given polyomino as an SVG data URI with side-length labels.
 * Each side label shows the side's length in `unitLength` units.
 */
export function createCompositeShapeSVG(cells, unitLength, options = {}) {
  const cellPx = options.cellPx || 50;
  const padding = options.padding || 40;
  const fill = options.fill || '#bfdbfe';
  const stroke = options.stroke || '#2563eb';
  const strokeWidth = options.strokeWidth || 3;
  const labelOffset = options.labelOffset || 14;
  const labelFill = options.labelFill || '#1f2937';
  const fontSize = options.fontSize || 16;

  let minC = Infinity;
  let maxC = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;
  for (const [c, r] of cells) {
    if (c < minC) minC = c;
    if (c + 1 > maxC) maxC = c + 1;
    if (r < minR) minR = r;
    if (r + 1 > maxR) maxR = r + 1;
  }

  const widthCells = maxC - minC;
  const heightCells = maxR - minR;
  const svgWidth = widthCells * cellPx + 2 * padding;
  const svgHeight = heightCells * cellPx + 2 * padding;

  const toX = (c) => (c - minC) * cellPx + padding;
  const toY = (r) => (r - minR) * cellPx + padding;

  const sides = getOutlineSides(cells);

  const polyPoints = sides.map((s) => `${toX(s.x1)},${toY(s.y1)}`).join(' ');

  const labels = sides
    .map((s) => {
      const midC = (s.x1 + s.x2) / 2;
      const midR = (s.y1 + s.y2) / 2;
      let lx = toX(midC);
      let ly = toY(midR);
      let textAnchor = 'middle';
      let dy = fontSize / 3;

      if (s.dir === 'R') {
        ly -= labelOffset;
        dy = 0;
      } else if (s.dir === 'L') {
        ly += labelOffset;
        dy = fontSize - 4;
      } else if (s.dir === 'D') {
        lx += labelOffset;
        textAnchor = 'start';
      } else if (s.dir === 'U') {
        lx -= labelOffset;
        textAnchor = 'end';
      }

      const labelValue = s.length * unitLength;
      return `<text x="${lx}" y="${ly + dy}" text-anchor="${textAnchor}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${labelFill}">${labelValue}</text>`;
    })
    .join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">` +
    `<polygon points="${polyPoints}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />` +
    labels +
    `</svg>`;

  return svgToDataUri(svg);
}
