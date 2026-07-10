const GRID_COLORS = ['#2563eb', '#dc2626', '#059669', '#7c3aed'];

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const createSvgDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Creates a labeled first-quadrant coordinate grid for generated questions.
 * Point labels intentionally identify the object, not its ordered pair, so
 * students still read the coordinates from the numbered axes.
 */
export const createCoordinateGridImage = ({ points = [] }) => {
  const largestCoordinate = Math.max(
    6,
    ...points.flatMap(({ x, y }) => [Number(x) || 0, Number(y) || 0])
  );
  const maxCoordinate = Math.min(12, largestCoordinate);
  const width = 440;
  const height = 360;
  const left = 52;
  const right = 30;
  const top = 28;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xScale = plotWidth / maxCoordinate;
  const yScale = plotHeight / maxCoordinate;
  const xFor = (x) => left + x * xScale;
  const yFor = (y) => height - bottom - y * yScale;

  const gridLines = Array.from({ length: maxCoordinate + 1 }, (_, value) => (
    `<line x1="${xFor(value)}" y1="${top}" x2="${xFor(value)}" y2="${height - bottom}" stroke="#dbeafe" stroke-width="1" />` +
    `<line x1="${left}" y1="${yFor(value)}" x2="${width - right}" y2="${yFor(value)}" stroke="#dbeafe" stroke-width="1" />`
  )).join('');

  const axisLabels = Array.from({ length: maxCoordinate + 1 }, (_, value) => (
    `<text x="${xFor(value)}" y="${height - bottom + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#475569">${value}</text>` +
    (value === 0
      ? ''
      : `<text x="${left - 14}" y="${yFor(value) + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#475569">${value}</text>`)
  )).join('');

  const pointMarkup = points.map(({ x, y, label }, index) => {
    const pointX = xFor(x);
    const pointY = yFor(y);
    const color = GRID_COLORS[index % GRID_COLORS.length];
    const isNearRightEdge = x >= maxCoordinate - 1;
    const isNearTopEdge = y >= maxCoordinate - 1;
    const labelX = pointX + (isNearRightEdge ? -9 : 9);
    const labelY = pointY + (isNearTopEdge ? 18 : -9);
    const anchor = isNearRightEdge ? 'end' : 'start';

    return (
      `<circle cx="${pointX}" cy="${pointY}" r="6" fill="${color}" stroke="#ffffff" stroke-width="2" />` +
      `<text x="${labelX}" y="${labelY}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${color}">${escapeXml(label)}</text>`
    );
  }).join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Coordinate grid with labeled axes and points">` +
    `<defs><marker id="axis-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#334155" /></marker></defs>` +
    `<rect width="${width}" height="${height}" rx="12" fill="#f8fbff" />` +
    gridLines +
    `<line x1="${left}" y1="${height - bottom}" x2="${width - right + 12}" y2="${height - bottom}" stroke="#334155" stroke-width="2.5" marker-end="url(#axis-arrow)" />` +
    `<line x1="${left}" y1="${height - bottom}" x2="${left}" y2="${top - 10}" stroke="#334155" stroke-width="2.5" marker-end="url(#axis-arrow)" />` +
    axisLabels +
    `<text x="${width - right + 18}" y="${height - bottom + 6}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#334155">x</text>` +
    `<text x="${left - 6}" y="${top - 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#334155">y</text>` +
    pointMarkup +
    `</svg>`;

  return createSvgDataUri(svg);
};
