// Utilities for generating composite (polyomino) shape diagrams used in
// area/perimeter questions. Each shape is described as a set of unit cells
// on a grid; the outline math lives in utils/rectilinearShapes (shared with
// the G5 composite-prism figures) and this module renders the SVG.
import { computePerimeterUnits, getOutlineSides } from '../../../utils/rectilinearShapes.js';

export { computePerimeterUnits, getOutlineSides };

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

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * Renders the given polyomino as an SVG data URI with side-length labels.
 * Each side label shows the side's length in `unitLength` units.
 *
 * Optional extras (defaults leave the output unchanged):
 * - labelForSide(side, index) → label text, or null to leave a side unlabeled.
 *   A "?" label is drawn in red to mark the side the student must find.
 * - maxWidth / maxHeight → pick the cell size so the figure fits (ignored when
 *   cellPx is given).
 * - description → accessible name (role="img", aria-label and <title>).
 */
export function createCompositeShapeSVG(cells, unitLength, options = {}) {
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
  const sides = getOutlineSides(cells);
  const customLabels = typeof options.labelForSide === 'function';
  const labelForSide = customLabels
    ? options.labelForSide
    : (side) => String(side.length * unitLength);
  const labelTexts = sides.map((s, index) => {
    const value = labelForSide(s, index);
    return value === null || value === undefined ? null : String(value);
  });

  // Custom labels ("12 cm") are wider than the legacy bare numbers, so size
  // the side padding to the widest label instead of the fixed default.
  const textWidth = (text) => text.length * fontSize * 0.6;
  const widestLabel = Math.max(0, ...labelTexts.filter(Boolean).map(textWidth));
  const padX = options.padding || (customLabels
    ? Math.max(padding, Math.ceil(widestLabel + labelOffset + 8))
    : padding);
  const padY = padding;

  const cellPx = options.cellPx || (options.maxWidth || options.maxHeight
    ? Math.floor(Math.min(
      50,
      options.maxWidth ? (options.maxWidth - 2 * padX) / widthCells : Infinity,
      options.maxHeight ? (options.maxHeight - 2 * padY) / heightCells : Infinity
    ))
    : 50);
  const svgWidth = widthCells * cellPx + 2 * padX;
  const svgHeight = heightCells * cellPx + 2 * padY;

  const toX = (c) => (c - minC) * cellPx + padX;
  const toY = (r) => (r - minR) * cellPx + padY;

  const polyPoints = sides.map((s) => `${toX(s.x1)},${toY(s.y1)}`).join(' ');

  // Where a label sits for a side, `t` of the way along it (0.5 = middle).
  const placeLabel = (s, t, text) => {
    let lx = toX(s.x1 + (s.x2 - s.x1) * t);
    let ly = toY(s.y1 + (s.y2 - s.y1) * t);
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

    const w = textWidth(text);
    const left = textAnchor === 'middle' ? lx - w / 2 : textAnchor === 'start' ? lx : lx - w;
    const baseline = ly + dy;
    return {
      lx, ly, dy, textAnchor,
      box: { x1: left - 2, x2: left + w + 2, y1: baseline - fontSize * 0.8 - 2, y2: baseline + fontSize * 0.2 + 2 },
    };
  };
  const overlaps = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

  // Facing walls of a narrow notch (or stacked stair steps) put their labels
  // on top of each other at the midpoint; with custom labels, slide a label
  // along its side until it clears the ones already placed.
  const slideTs = customLabels ? [0.5, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88] : [0.5];
  const placedBoxes = [];
  const labels = sides
    .map((s, index) => {
      const labelValue = labelTexts[index];
      if (labelValue === null) return '';
      const fillForLabel = labelValue === '?' ? '#dc2626' : labelFill;
      const candidates = slideTs.map((t) => placeLabel(s, t, labelValue));
      const spot = candidates.find((c) => placedBoxes.every((box) => !overlaps(c.box, box))) || candidates[0];
      placedBoxes.push(spot.box);
      const { lx, ly, dy, textAnchor } = spot;
      return `<text x="${lx}" y="${ly + dy}" text-anchor="${textAnchor}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${fillForLabel}">${escapeXml(labelValue)}</text>`;
    })
    .join('');

  const a11y = options.description
    ? ` role="img" aria-label="${escapeXml(options.description)}"`
    : '';
  const title = options.description ? `<title>${escapeXml(options.description)}</title>` : '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}"${a11y}>` +
    title +
    `<polygon points="${polyPoints}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />` +
    labels +
    `</svg>`;

  return svgToDataUri(svg);
}
