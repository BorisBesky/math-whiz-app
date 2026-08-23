// SVG figures for Measurement & Data 5th.
//
// Volume and line plots are *reading* skills — 5.MD.B.2 and 5.MD.C.3/C.4 are
// about interpreting a picture — so these builders are shared: the question
// generators embed them as `images` data URIs, and Explanation.js renders the
// same builders as <img> figures. Keep them string-based (not JSX) so both
// consumers can use them.

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const createSvgDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const round = (value) => Math.round(value * 100) / 100;

/* ------------------------------------------------------------------ */
/* Isometric unit-cube prism (5.MD.C.3, 5.MD.C.4, 5.MD.C.5)            */
/* ------------------------------------------------------------------ */

const TOP_FILL = '#fde68a';
const LEFT_FILL = '#fbbf24';
const RIGHT_FILL = '#f59e0b';
const EDGE = '#92400e';
const CUBE_LINE = '#b45309';

/**
 * Draws a length x width x height prism in isometric view with every unit
 * cube outlined on the three visible faces, so students can literally count
 * the cubes in a layer. Optionally tints the bottom layer to show that
 * volume is "one layer, repeated height times".
 *
 * Only the visible shell is drawn (three faces + grid lines), which keeps the
 * markup small even for a 10 x 5 x 5 prism.
 */
export const createUnitCubePrismSvg = ({
  length,
  width,
  height,
  highlightBottomLayer = false,
  showGrid = true,
  edgeLabels = null,
  label = null,
  maxWidth = 320,
  maxHeight = 230,
}) => {
  const L = Math.max(1, Math.round(length));
  const W = Math.max(1, Math.round(width));
  const H = Math.max(1, Math.round(height));

  // Isometric basis: +i goes right-and-down, +j left-and-down, +k straight up.
  const baseA = 1;
  const baseB = 0.5;
  const baseC = 1.1;
  const rawWidth = (L + W) * baseA;
  const rawHeight = H * baseC + (L + W) * baseB;
  const scale = Math.min(maxWidth / rawWidth, maxHeight / rawHeight, 30);
  const a = baseA * scale;
  const b = baseB * scale;
  const c = baseC * scale;

  // The height label hangs off the left edge and the length/width labels sit
  // below the base, so reserve extra room on those sides when they're drawn.
  const padTop = 16;
  const padLeft = edgeLabels?.height ? 62 : 16;
  const padRight = edgeLabels?.width ? 34 : 16;
  const padBottom = edgeLabels ? 34 : 16;
  const labelSpace = label ? 24 : 0;
  const originX = padLeft + W * a;
  const originY = padTop + H * c;
  const svgWidth = round(rawWidth * scale + padLeft + padRight);
  const svgHeight = round(rawHeight * scale + padTop + padBottom + labelSpace);

  const px = (i, j) => round(originX + (i - j) * a);
  const py = (i, j, k) => round(originY + (i + j) * b - k * c);
  const point = (i, j, k) => `${px(i, j)},${py(i, j, k)}`;

  const face = (points, fill) =>
    `<polygon points="${points}" fill="${fill}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round" />`;

  const line = (from, to, color = CUBE_LINE, opacity = 0.75) =>
    `<line x1="${px(from[0], from[1])}" y1="${py(from[0], from[1], from[2])}" ` +
    `x2="${px(to[0], to[1])}" y2="${py(to[0], to[1], to[2])}" ` +
    `stroke="${color}" stroke-width="1" opacity="${opacity}" />`;

  const topFace = face(
    [point(0, 0, H), point(L, 0, H), point(L, W, H), point(0, W, H)].join(' '),
    TOP_FILL
  );
  // j = W is the lower-left face; i = L is the lower-right face.
  const leftFace = face(
    [point(0, W, H), point(L, W, H), point(L, W, 0), point(0, W, 0)].join(' '),
    LEFT_FILL
  );
  const rightFace = face(
    [point(L, 0, H), point(L, W, H), point(L, W, 0), point(L, 0, 0)].join(' '),
    RIGHT_FILL
  );

  const gridLines = !showGrid ? '' : [
    // top face
    ...Array.from({ length: W - 1 }, (_, n) => line([0, n + 1, H], [L, n + 1, H])),
    ...Array.from({ length: L - 1 }, (_, n) => line([n + 1, 0, H], [n + 1, W, H])),
    // lower-left face (j = W)
    ...Array.from({ length: H - 1 }, (_, n) => line([0, W, n + 1], [L, W, n + 1])),
    ...Array.from({ length: L - 1 }, (_, n) => line([n + 1, W, 0], [n + 1, W, H])),
    // lower-right face (i = L)
    ...Array.from({ length: H - 1 }, (_, n) => line([L, 0, n + 1], [L, W, n + 1])),
    ...Array.from({ length: W - 1 }, (_, n) => line([L, n + 1, 0], [L, n + 1, H])),
  ].join('');

  // Dimension labels drawn along the three visible bottom/side edges, used
  // when the prism stands for a measured box rather than a stack of cubes.
  const edgeLabelMarkup = !edgeLabels ? '' : (() => {
    const text = (x, y, value, anchor) =>
      `<text x="${round(x)}" y="${round(y)}" text-anchor="${anchor}" font-family="Arial, sans-serif" ` +
      `font-size="13" font-weight="700" fill="${EDGE}">${escapeXml(value)}</text>`;
    const parts = [];
    if (edgeLabels.length) {
      parts.push(text((px(0, W) + px(L, W)) / 2, (py(0, W, 0) + py(L, W, 0)) / 2 + 20, edgeLabels.length, 'middle'));
    }
    if (edgeLabels.width) {
      parts.push(text((px(L, 0) + px(L, W)) / 2 + 12, (py(L, 0, 0) + py(L, W, 0)) / 2 + 18, edgeLabels.width, 'start'));
    }
    if (edgeLabels.height) {
      parts.push(text(px(0, W) - 10, (py(0, W, 0) + py(0, W, H)) / 2 + 5, edgeLabels.height, 'end'));
    }
    return parts.join('');
  })();

  const bottomLayerHighlight = highlightBottomLayer
    ? face(
      [point(0, W, 1), point(L, W, 1), point(L, W, 0), point(0, W, 0)].join(' '),
      'rgba(220, 38, 38, 0.35)'
    ) + face(
      [point(L, 0, 1), point(L, W, 1), point(L, W, 0), point(L, 0, 0)].join(' '),
      'rgba(220, 38, 38, 0.35)'
    )
    : '';

  const caption = label
    ? `<text x="${round(svgWidth / 2)}" y="${round(svgHeight - 8)}" text-anchor="middle" ` +
      `font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${EDGE}">${escapeXml(label)}</text>`
    : '';

  const description = edgeLabels
    ? `Rectangular prism labeled ${edgeLabels.length || L} long, ${edgeLabels.width || W} wide, and ${edgeLabels.height || H} tall`
    : `Rectangular prism ${L} unit cubes long, ${W} wide, and ${H} tall`;

  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" ` +
      `viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="${escapeXml(description)}">` +
      `<title>${escapeXml(description)}</title>` +
      `<rect width="${svgWidth}" height="${svgHeight}" rx="12" fill="#fffbeb" />` +
      topFace + leftFace + rightFace + gridLines + bottomLayerHighlight + edgeLabelMarkup + caption +
      `</svg>`,
    description,
  };
};

export const createUnitCubePrismImage = (options) => {
  const { svg, description } = createUnitCubePrismSvg(options);
  return { data: createSvgDataUri(svg), description };
};

/* ------------------------------------------------------------------ */
/* Two prisms side by side, for additive volume (5.MD.C.5c)            */
/* ------------------------------------------------------------------ */

/**
 * Renders the two prisms of a composite figure next to each other with a "+"
 * between them — the decomposition step is the whole skill, so showing the
 * pieces separately is the point.
 */
export const createCompositePrismImage = ({ first, second }) => {
  const partWidth = 220;
  const partHeight = 190;
  const gap = 46;
  const a = createUnitCubePrismSvg({
    length: first[0], width: first[1], height: first[2],
    label: `${first[0]} × ${first[1]} × ${first[2]}`,
    maxWidth: partWidth - 24, maxHeight: partHeight - 50,
  });
  const b = createUnitCubePrismSvg({
    length: second[0], width: second[1], height: second[2],
    label: `${second[0]} × ${second[1]} × ${second[2]}`,
    maxWidth: partWidth - 24, maxHeight: partHeight - 50,
  });

  const inner = (built) => built.svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
  const sizeOf = (built) => {
    const match = built.svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    return { w: Number(match[1]), h: Number(match[2]) };
  };
  const sizeA = sizeOf(a);
  const sizeB = sizeOf(b);

  const totalWidth = sizeA.w + gap + sizeB.w;
  const totalHeight = Math.max(sizeA.h, sizeB.h);
  const offsetAY = round((totalHeight - sizeA.h) / 2);
  const offsetBY = round((totalHeight - sizeB.h) / 2);
  const offsetBX = round(sizeA.w + gap);

  const description =
    `Two separate rectangular prisms: ${first.join(' by ')} units and ${second.join(' by ')} units`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(totalWidth)}" height="${round(totalHeight)}" ` +
    `viewBox="0 0 ${round(totalWidth)} ${round(totalHeight)}" role="img" aria-label="${escapeXml(description)}">` +
    `<title>${escapeXml(description)}</title>` +
    `<g transform="translate(0, ${offsetAY})">${inner(a)}</g>` +
    `<g transform="translate(${offsetBX}, ${offsetBY})">${inner(b)}</g>` +
    `<text x="${round(sizeA.w + gap / 2)}" y="${round(totalHeight / 2 + 12)}" text-anchor="middle" ` +
    `font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#92400e">+</text>` +
    `</svg>`;

  return { data: createSvgDataUri(svg), description };
};

/* ------------------------------------------------------------------ */
/* Line plot with fractional measurements (5.MD.B.2)                   */
/* ------------------------------------------------------------------ */

/**
 * A real line plot: an ✕ stacked for every measurement above a labeled
 * number line. `ticks` is every position on the axis (including the ones
 * with no data), in order.
 */
export const createLinePlotImage = ({ ticks, axisLabel = '', title = 'Line plot' }) => {
  const markSize = 15;
  const maxCount = Math.max(1, ...ticks.map((tick) => tick.count || 0));
  const left = 46;
  const right = 34;
  const spacing = 78;
  const width = left + right + spacing * (ticks.length - 1);
  const axisY = 34 + maxCount * markSize;
  const height = axisY + 56;
  const xFor = (index) => left + index * spacing;

  const marks = ticks.map((tick, index) => {
    const count = tick.count || 0;
    return Array.from({ length: count }, (_, n) => (
      `<text x="${xFor(index)}" y="${axisY - 8 - n * markSize}" text-anchor="middle" ` +
      `font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#b45309">✕</text>`
    )).join('');
  }).join('');

  const tickMarkup = ticks.map((tick, index) => (
    `<line x1="${xFor(index)}" y1="${axisY - 6}" x2="${xFor(index)}" y2="${axisY + 6}" stroke="#334155" stroke-width="2" />` +
    `<text x="${xFor(index)}" y="${axisY + 26}" text-anchor="middle" font-family="Arial, sans-serif" ` +
    `font-size="14" font-weight="700" fill="#334155">${escapeXml(tick.label)}</text>`
  )).join('');

  const description =
    `Line plot with ${ticks.map((tick) => `${tick.count || 0} at ${tick.label}`).join(', ')}` +
    (axisLabel ? ` on a ${axisLabel} scale` : '');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(description)}">` +
    `<title>${escapeXml(title)}</title>` +
    `<rect width="${width}" height="${height}" rx="12" fill="#fffbeb" />` +
    marks +
    `<line x1="${left - 26}" y1="${axisY}" x2="${width - right + 26}" y2="${axisY}" stroke="#334155" stroke-width="2.5" />` +
    tickMarkup +
    (axisLabel
      ? `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Arial, sans-serif" ` +
        `font-size="13" fill="#78716c">${escapeXml(axisLabel)}</text>`
      : '') +
    `</svg>`;

  return { data: createSvgDataUri(svg), description };
};

/* ------------------------------------------------------------------ */
/* Metric conversion ladder (5.MD.A.1)                                 */
/* ------------------------------------------------------------------ */

/** Shows which way to multiply and which way to divide between metric units. */
export const createMetricLadderImage = () => {
  const steps = [
    { label: 'km', name: 'kilometer' },
    { label: 'm', name: 'meter' },
    { label: 'cm', name: 'centimeter' },
    { label: 'mm', name: 'millimeter' },
  ];
  const factors = ['× 1000', '× 100', '× 10'];
  const boxWidth = 92;
  const gap = 34;
  const width = steps.length * boxWidth + (steps.length - 1) * gap + 32;
  const height = 168;
  const boxY = 62;
  const xFor = (index) => 16 + index * (boxWidth + gap);

  const boxes = steps.map((step, index) => (
    `<rect x="${xFor(index)}" y="${boxY}" width="${boxWidth}" height="46" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2" />` +
    `<text x="${xFor(index) + boxWidth / 2}" y="${boxY + 30}" text-anchor="middle" font-family="Arial, sans-serif" ` +
    `font-size="19" font-weight="700" fill="#92400e">${step.label}</text>`
  )).join('');

  const downArrows = factors.map((factor, index) => {
    const from = xFor(index) + boxWidth;
    const to = xFor(index + 1);
    const mid = (from + to) / 2;
    return (
      `<line x1="${from + 4}" y1="${boxY + 14}" x2="${to - 8}" y2="${boxY + 14}" stroke="#dc2626" stroke-width="2.5" marker-end="url(#md-arrow-right)" />` +
      `<text x="${mid}" y="${boxY - 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#dc2626">${factor}</text>` +
      `<line x1="${to - 4}" y1="${boxY + 34}" x2="${from + 8}" y2="${boxY + 34}" stroke="#2563eb" stroke-width="2.5" marker-end="url(#md-arrow-left)" />` +
      `<text x="${mid}" y="${boxY + 62}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#2563eb">${factor.replace('×', '÷')}</text>`
    );
  }).join('');

  const description =
    'Metric ladder from kilometers to millimeters: multiply going toward smaller units, divide going toward larger units';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(description)}">` +
    `<title>Metric conversion ladder</title>` +
    `<defs>` +
    `<marker id="md-arrow-right" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#dc2626" /></marker>` +
    `<marker id="md-arrow-left" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>` +
    `</defs>` +
    `<rect width="${width}" height="${height}" rx="12" fill="#fffbeb" />` +
    `<text x="${width / 2}" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#92400e">` +
    `bigger unit → smaller unit: MULTIPLY</text>` +
    boxes + downArrows +
    `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#1d4ed8">` +
    `smaller unit → bigger unit: DIVIDE</text>` +
    `</svg>`;

  return { data: createSvgDataUri(svg), description };
};

/**
 * The same prism drawn as a measured box: no unit-cube grid, dimensions
 * written along the edges. Used by the V = l x w x h questions, where the
 * sides are lengths in centimeters or feet rather than counts of cubes.
 */
export const createLabeledPrismImage = ({ length, width, height, unit }) => {
  const short = { centimeters: 'cm', inches: 'in', meters: 'm', feet: 'ft' }[unit] || unit;
  const { svg, description } = createUnitCubePrismSvg({
    length,
    width,
    height,
    showGrid: false,
    edgeLabels: {
      length: `${length} ${short}`,
      width: `${width} ${short}`,
      height: `${height} ${short}`,
    },
  });
  return { data: createSvgDataUri(svg), description };
};
