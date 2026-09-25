// Rectilinear ("made of rectangles") figures on a unit grid, shared by the
// G4 composite-area questions and the G5 composite-prism volume questions.
//
// A figure is a set of unit cells [col, row] (row grows downward, as in SVG).
// The outline is traced clockwise, so the interior is always on the right of
// each side and every side has a direction: R (top edges), D (right edges),
// L (bottom edges), U (left edges).
//
// Why hiding sides is always fair: walking once around any rectilinear
// outline you travel as far right as left and as far down as up. So the R
// lengths sum to the L lengths and the D lengths sum to the U lengths, and any
// ONE unlabeled horizontal side (plus any ONE unlabeled vertical side) can be
// worked out from the others. planSideLabels never hides more than that.

export const isHorizontal = (side) => side.dir === 'R' || side.dir === 'L';

/** Directed unit boundary edges of a cell set, oriented clockwise. */
export function computeOutlineEdges(cells) {
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

/** Merge consecutive collinear unit edges into sides with a `length`. */
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
  return aggregateSides(chainEdgesIntoLoop(computeOutlineEdges(cells)));
}

export function computePerimeterUnits(cells) {
  return computeOutlineEdges(cells).length;
}

/* ------------------------------------------------------------------ */
/* Figure builders                                                     */
/* ------------------------------------------------------------------ */

const rectCells = (x, y, w, h) => {
  const cells = [];
  for (let c = x; c < x + w; c++) {
    for (let r = y; r < y + h; r++) cells.push([c, r]);
  }
  return cells;
};

const unionCells = (...groups) => {
  const seen = new Map();
  groups.flat().forEach(([c, r]) => seen.set(`${c},${r}`, [c, r]));
  return Array.from(seen.values());
};

const subtractCells = (cells, removed) => {
  const gone = new Set(removed.map(([c, r]) => `${c},${r}`));
  return cells.filter(([c, r]) => !gone.has(`${c},${r}`));
};

/** width × height rectangle with a notchWidth × notchHeight corner removed. */
export function buildLShape({ width, height, notchWidth, notchHeight, corner = 'top-right' }) {
  const nx = corner.endsWith('right') ? width - notchWidth : 0;
  const ny = corner.startsWith('bottom') ? height - notchHeight : 0;
  return subtractCells(rectCells(0, 0, width, height), rectCells(nx, ny, notchWidth, notchHeight));
}

/** width × height rectangle with a notch cut down into the middle of its top. */
export function buildUShape({ width, height, notchWidth, notchHeight, notchOffset }) {
  return subtractCells(rectCells(0, 0, width, height), rectCells(notchOffset, 0, notchWidth, notchHeight));
}

/**
 * Three columns stepping down to the right: column k spans x from its start
 * to the next column's start and rises from `tops[k]` to the bottom.
 */
export function buildStaircase({ width, height, stepXs, stepTops }) {
  const xs = [0, ...stepXs, width];
  const tops = [0, ...stepTops];
  return unionCells(
    ...tops.map((top, k) => rectCells(xs[k], top, xs[k + 1] - xs[k], height - top))
  );
}

/* ------------------------------------------------------------------ */
/* Random figures                                                      */
/* ------------------------------------------------------------------ */

const randomInt = (min, max, rng) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (items, rng) => items[randomInt(0, items.length - 1, rng)];

export const FIGURE_FAMILIES = ['L-shape', 'U-shape', 'staircase'];
const L_CORNERS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

/**
 * A random rectilinear figure sized for elementary arithmetic. Every side is
 * at least 2 units long so side labels never crowd each other at a corner.
 * L-shapes at every difficulty; U-shapes from 0.7; staircases from 0.85.
 */
export function randomRectilinearFigure(difficulty = 0.5, { family, rng = Math.random } = {}) {
  const maxDim = 7 + Math.round(Math.max(0, Math.min(1, difficulty)) * 5); // 7..12
  const families = difficulty >= 0.85 ? FIGURE_FAMILIES : difficulty >= 0.7 ? ['L-shape', 'U-shape'] : ['L-shape'];
  const chosen = family || pick(families, rng);

  let cells;
  let width;
  let height;
  if (chosen === 'U-shape') {
    width = randomInt(6, maxDim + 2, rng);
    height = randomInt(4, maxDim, rng);
    const notchOffset = randomInt(2, width - 4, rng);
    const notchWidth = randomInt(2, width - notchOffset - 2, rng);
    const notchHeight = randomInt(2, height - 2, rng);
    cells = buildUShape({ width, height, notchWidth, notchHeight, notchOffset });
  } else if (chosen === 'staircase') {
    width = randomInt(6, maxDim + 2, rng);
    height = randomInt(6, maxDim + 2, rng);
    const x1 = randomInt(2, width - 4, rng);
    const x2 = randomInt(x1 + 2, width - 2, rng);
    const t1 = randomInt(2, height - 4, rng);
    const t2 = randomInt(t1 + 2, height - 2, rng);
    cells = buildStaircase({ width, height, stepXs: [x1, x2], stepTops: [t1, t2] });
  } else {
    width = randomInt(4, maxDim, rng);
    height = randomInt(4, maxDim, rng);
    const notchWidth = randomInt(2, width - 2, rng);
    const notchHeight = randomInt(2, height - 2, rng);
    cells = buildLShape({ width, height, notchWidth, notchHeight, corner: pick(L_CORNERS, rng) });
  }

  const sides = getOutlineSides(cells);
  return {
    family: chosen,
    cells,
    width,
    height,
    sides,
    area: cells.length,
    perimeter: computePerimeterUnits(cells),
  };
}

/**
 * Chooses which sides to leave unlabeled: up to `hideCount` sides, at most one
 * horizontal and one vertical, so every hidden length can be deduced.
 * Returns the hidden side indices.
 */
export function planHiddenSides(sides, hideCount = 0, rng = Math.random) {
  const hidden = [];
  const horizontal = sides.map((s, i) => (isHorizontal(s) ? i : -1)).filter((i) => i >= 0);
  const vertical = sides.map((s, i) => (isHorizontal(s) ? -1 : i)).filter((i) => i >= 0);
  const axes = rng() < 0.5 ? [horizontal, vertical] : [vertical, horizontal];
  for (const axis of axes.slice(0, Math.min(2, hideCount))) {
    hidden.push(pick(axis, rng));
  }
  return hidden;
}

/**
 * Recovers every side length using only the labeled sides (null = hidden),
 * via the opposite-direction balance rule. Returns null if a length can't be
 * determined — which planHiddenSides guarantees never happens.
 */
export function solveSideLengths(sides, knownLengths) {
  const solved = [...knownLengths];
  const balance = (plus, minus) => {
    const unknown = solved
      .map((value, i) => (value === null && (sides[i].dir === plus || sides[i].dir === minus) ? i : -1))
      .filter((i) => i >= 0);
    if (unknown.length > 1) return false;
    if (unknown.length === 0) return true;
    const sum = (dir) => solved.reduce((acc, v, i) => (sides[i].dir === dir && v !== null ? acc + v : acc), 0);
    const i = unknown[0];
    solved[i] = sides[i].dir === plus ? sum(minus) - sum(plus) : sum(plus) - sum(minus);
    return true;
  };
  return balance('R', 'L') && balance('D', 'U') ? solved : null;
}
