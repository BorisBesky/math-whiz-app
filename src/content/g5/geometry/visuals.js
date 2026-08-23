import React from 'react';

// Inline SVG teaching visuals for the Geometry 5th "Explain" screen.
// Kept in this topic folder (not shared) so the topic stays a self-contained
// plug-in. `coordinate-grid.js` renders the data-URI grids that ship *inside*
// generated questions; these are the annotated, walk-through versions that
// only the Explanation uses.

const AXIS = '#334155';
const GRID = '#cbd5f5';
const LABEL = '#475569';

/**
 * First-quadrant coordinate grid with optional dashed "run then climb"
 * guides and labeled segments. Whole-number coordinates from 0 to `max`.
 */
export const CoordinateGrid = ({
  max = 6,
  points = [],
  guides = [],
  segments = [],
  width = 360,
  height = 320,
  title = 'Coordinate grid',
}) => {
  const left = 44;
  const right = 26;
  const top = 22;
  const bottom = 40;
  const xScale = (width - left - right) / max;
  const yScale = (height - top - bottom) / max;
  const xFor = (x) => left + x * xScale;
  const yFor = (y) => height - bottom - y * yScale;
  const values = Array.from({ length: max + 1 }, (_, value) => value);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <marker id="g5-geo-axis" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={AXIS} />
        </marker>
        <marker id="g5-geo-guide" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
        </marker>
      </defs>

      <rect width={width} height={height} rx="12" fill="#f8fbff" />

      {values.map((value) => (
        <g key={`grid-${value}`}>
          <line x1={xFor(value)} y1={top} x2={xFor(value)} y2={yFor(0)} stroke={GRID} strokeWidth="1" />
          <line x1={left} y1={yFor(value)} x2={width - right} y2={yFor(value)} stroke={GRID} strokeWidth="1" />
        </g>
      ))}

      <line x1={left} y1={yFor(0)} x2={width - right + 10} y2={yFor(0)} stroke={AXIS} strokeWidth="2.5" markerEnd="url(#g5-geo-axis)" />
      <line x1={left} y1={yFor(0)} x2={left} y2={top - 8} stroke={AXIS} strokeWidth="2.5" markerEnd="url(#g5-geo-axis)" />

      {values.map((value) => (
        <g key={`tick-${value}`}>
          <text x={xFor(value)} y={yFor(0) + 18} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill={LABEL}>
            {value}
          </text>
          {value !== 0 && (
            <text x={left - 12} y={yFor(value) + 4} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fill={LABEL}>
              {value}
            </text>
          )}
        </g>
      ))}

      <text x={width - right + 14} y={yFor(0) + 6} fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" fill={AXIS}>x</text>
      <text x={left - 6} y={top - 12} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" fill={AXIS}>y</text>

      {/* dashed run-then-climb guides */}
      {guides.map(({ x, y, runLabel, climbLabel }, index) => (
        <g key={`guide-${index}`}>
          <line x1={xFor(0)} y1={yFor(0)} x2={xFor(x)} y2={yFor(0)} stroke="#dc2626" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#g5-geo-guide)" />
          <line x1={xFor(x)} y1={yFor(0)} x2={xFor(x)} y2={yFor(y)} stroke="#dc2626" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#g5-geo-guide)" />
          {runLabel && (
            <text x={xFor(x / 2)} y={yFor(0) - 8} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#dc2626">
              {runLabel}
            </text>
          )}
          {climbLabel && (
            <text x={xFor(x) + 8} y={yFor(y / 2)} fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#dc2626">
              {climbLabel}
            </text>
          )}
        </g>
      ))}

      {/* labeled distance segments between two points */}
      {segments.map(({ from, to, label, color = '#7c3aed' }, index) => {
        const midX = xFor((from.x + to.x) / 2);
        const midY = yFor((from.y + to.y) / 2);
        const isVertical = from.x === to.x;
        return (
          <g key={`segment-${index}`}>
            <line x1={xFor(from.x)} y1={yFor(from.y)} x2={xFor(to.x)} y2={yFor(to.y)} stroke={color} strokeWidth="3" />
            {label && (
              <text
                x={isVertical ? midX + 10 : midX}
                y={isVertical ? midY : midY - 10}
                textAnchor={isVertical ? 'start' : 'middle'}
                fontFamily="Arial, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill={color}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {points.map(({ x, y, label, color = '#2563eb' }, index) => (
        <g key={`point-${index}`}>
          <circle cx={xFor(x)} cy={yFor(y)} r="6.5" fill={color} stroke="#ffffff" strokeWidth="2" />
          {label && (
            <text
              x={xFor(x) + (x >= max - 1 ? -10 : 10)}
              y={yFor(y) + (y >= max - 1 ? 20 : -10)}
              textAnchor={x >= max - 1 ? 'end' : 'start'}
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fontWeight="700"
              fill={color}
            >
              {label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

const FigureCaption = ({ children }) => (
  <div style={{ fontSize: '0.8em', fontWeight: 700, color: '#334155', marginTop: '4px' }}>{children}</div>
);

const FigureRow = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>{children}</div>
);

const Figure = ({ caption, children, note }) => (
  <div style={{ textAlign: 'center', minWidth: '110px' }}>
    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '6px' }}>{children}</div>
    <FigureCaption>{caption}</FigureCaption>
    {note && <div style={{ fontSize: '0.72em', color: '#64748b' }}>{note}</div>}
  </div>
);

// A short tick mark drawn across the middle of a side, used to show which
// sides are equal in length.
const sideTicks = (ax, ay, bx, by, count, color) => {
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  return Array.from({ length: count }, (_, index) => {
    const offset = (index - (count - 1) / 2) * 5;
    const cx = midX + ux * offset;
    const cy = midY + uy * offset;
    return (
      <line
        key={`tick-${ax}-${ay}-${bx}-${by}-${index}`}
        x1={cx - nx * 5}
        y1={cy - ny * 5}
        x2={cx + nx * 5}
        y2={cy + ny * 5}
        stroke={color}
        strokeWidth="2"
      />
    );
  });
};

// Small square drawn in the corner at vertex B, marking a 90° angle.
const rightAngleMark = (ax, ay, bx, by, cx, cy, color) => {
  const size = 11;
  const u1 = Math.hypot(ax - bx, ay - by) || 1;
  const u2 = Math.hypot(cx - bx, cy - by) || 1;
  const p1x = bx + ((ax - bx) / u1) * size;
  const p1y = by + ((ay - by) / u1) * size;
  const p2x = bx + ((cx - bx) / u2) * size;
  const p2y = by + ((cy - by) / u2) * size;
  const p3x = p1x + p2x - bx;
  const p3y = p1y + p2y - by;
  return <polyline points={`${p1x},${p1y} ${p3x},${p3y} ${p2x},${p2y}`} fill="none" stroke={color} strokeWidth="2" />;
};

const ShapeSvg = ({ label, children }) => (
  <svg width="118" height="104" viewBox="0 0 118 104" role="img" aria-label={label}>
    <title>{label}</title>
    {children}
  </svg>
);

/** The five quadrilateral families, drawn with parallel-side and equal-side marks. */
export const QuadrilateralGallery = () => {
  const stroke = '#047857';
  const fill = '#a7f3d0';
  return (
    <FigureRow>
      <Figure caption="Trapezoid" note="exactly 1 pair parallel">
        <ShapeSvg label="Trapezoid with exactly one pair of parallel sides">
          <polygon points="8,84 110,84 88,22 32,22" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <polyline points="52,84 62,84" stroke={stroke} strokeWidth="3" />
          <polyline points="55,22 65,22" stroke={stroke} strokeWidth="3" />
        </ShapeSvg>
      </Figure>
      <Figure caption="Parallelogram" note="2 pairs parallel">
        <ShapeSvg label="Parallelogram with two pairs of parallel sides">
          <polygon points="8,84 78,84 110,26 40,26" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <polyline points="38,84 48,84" stroke={stroke} strokeWidth="3" />
          <polyline points="70,26 80,26" stroke={stroke} strokeWidth="3" />
        </ShapeSvg>
      </Figure>
      <Figure caption="Rectangle" note="4 right angles">
        <ShapeSvg label="Rectangle with four right angles">
          <polygon points="12,26 106,26 106,84 12,84" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {rightAngleMark(12, 26, 12, 84, 106, 84, stroke)}
          {rightAngleMark(106, 26, 106, 84, 12, 84, stroke)}
        </ShapeSvg>
      </Figure>
      <Figure caption="Rhombus" note="4 equal sides">
        <ShapeSvg label="Rhombus with four equal sides">
          <polygon points="59,14 108,55 59,92 10,55" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {sideTicks(59, 14, 108, 55, 1, stroke)}
          {sideTicks(108, 55, 59, 92, 1, stroke)}
          {sideTicks(59, 92, 10, 55, 1, stroke)}
          {sideTicks(10, 55, 59, 14, 1, stroke)}
        </ShapeSvg>
      </Figure>
      <Figure caption="Square" note="both at once!">
        <ShapeSvg label="Square with four equal sides and four right angles">
          <polygon points="24,20 96,20 96,90 24,90" fill="#6ee7b7" stroke={stroke} strokeWidth="2.5" />
          {rightAngleMark(24, 20, 24, 90, 96, 90, stroke)}
          {sideTicks(24, 20, 96, 20, 1, stroke)}
          {sideTicks(96, 20, 96, 90, 1, stroke)}
          {sideTicks(96, 90, 24, 90, 1, stroke)}
          {sideTicks(24, 90, 24, 20, 1, stroke)}
        </ShapeSvg>
      </Figure>
    </FigureRow>
  );
};

/** Triangles classified by side lengths. */
export const TrianglesBySides = () => {
  const stroke = '#1d4ed8';
  const fill = '#bfdbfe';
  return (
    <FigureRow>
      <Figure caption="Equilateral" note="3 equal sides">
        <ShapeSvg label="Equilateral triangle with three equal sides">
          <polygon points="59,14 100,86 18,86" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {sideTicks(59, 14, 100, 86, 1, stroke)}
          {sideTicks(100, 86, 18, 86, 1, stroke)}
          {sideTicks(18, 86, 59, 14, 1, stroke)}
        </ShapeSvg>
      </Figure>
      <Figure caption="Isosceles" note="exactly 2 equal">
        <ShapeSvg label="Isosceles triangle with exactly two equal sides">
          <polygon points="59,14 96,88 22,88" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {sideTicks(59, 14, 96, 88, 2, stroke)}
          {sideTicks(22, 88, 59, 14, 2, stroke)}
        </ShapeSvg>
      </Figure>
      <Figure caption="Scalene" note="no equal sides">
        <ShapeSvg label="Scalene triangle with no equal sides">
          <polygon points="20,20 108,52 38,88" fill={fill} stroke={stroke} strokeWidth="2.5" />
        </ShapeSvg>
      </Figure>
    </FigureRow>
  );
};

/** Triangles classified by angle size. */
export const TrianglesByAngles = () => {
  const stroke = '#b45309';
  const fill = '#fde68a';
  return (
    <FigureRow>
      <Figure caption="Right" note="one 90° angle">
        <ShapeSvg label="Right triangle with one ninety degree angle">
          <polygon points="22,18 22,86 100,86" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {rightAngleMark(22, 18, 22, 86, 100, 86, stroke)}
        </ShapeSvg>
      </Figure>
      <Figure caption="Acute" note="all angles < 90°">
        <ShapeSvg label="Acute triangle with all angles less than ninety degrees">
          <polygon points="59,18 104,86 16,86" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <path d="M 47,86 A 14 14 0 0 1 52,74" fill="none" stroke={stroke} strokeWidth="2" />
        </ShapeSvg>
      </Figure>
      <Figure caption="Obtuse" note="one angle > 90°">
        <ShapeSvg label="Obtuse triangle with one angle greater than ninety degrees">
          <polygon points="10,84 110,84 42,40" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <path d="M 34,51 A 15 15 0 0 0 56,50" fill="none" stroke="#dc2626" strokeWidth="2.5" />
        </ShapeSvg>
      </Figure>
    </FigureRow>
  );
};

/**
 * The quadrilateral family tree. Properties flow DOWN the arrows, which is
 * exactly the reasoning 5.G.B.4 asks students to do.
 */
export const ShapeHierarchyTree = () => {
  const width = 400;
  const height = 250;
  const box = (x, y, label, fill, stroke, w = 116) => (
    <g key={label}>
      <rect x={x - w / 2} y={y - 16} width={w} height="32" rx="9" fill={fill} stroke={stroke} strokeWidth="2" />
      <text x={x} y={y + 5} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#0f172a">
        {label}
      </text>
    </g>
  );
  const link = (x1, y1, x2, y2, key) => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#059669" strokeWidth="2" markerEnd="url(#g5-tree-arrow)" />
  );

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width, height: 'auto' }}
      role="img"
      aria-label="Quadrilateral family tree: quadrilateral splits into trapezoid and parallelogram; parallelogram splits into rectangle and rhombus; square is both a rectangle and a rhombus"
    >
      <title>Quadrilateral family tree</title>
      <defs>
        <marker id="g5-tree-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#059669" />
        </marker>
      </defs>
      <rect width={width} height={height} rx="12" fill="#f0fdf4" />

      {link(200, 42, 96, 78, 'q-trap')}
      {link(200, 42, 282, 78, 'q-para')}
      {link(282, 110, 190, 148, 'p-rect')}
      {link(282, 110, 340, 148, 'p-rhom')}
      {link(190, 180, 244, 208, 'rect-sq')}
      {link(340, 180, 276, 208, 'rhom-sq')}

      {box(200, 26, 'Quadrilateral', '#d1fae5', '#059669', 130)}
      {box(96, 94, 'Trapezoid', '#ecfdf5', '#10b981', 104)}
      {box(282, 94, 'Parallelogram', '#d1fae5', '#059669', 132)}
      {box(190, 164, 'Rectangle', '#ecfdf5', '#10b981', 104)}
      {box(340, 164, 'Rhombus', '#ecfdf5', '#10b981', 100)}
      {box(260, 224, 'Square', '#6ee7b7', '#047857', 100)}

      <text x={20} y={214} fontFamily="Arial, sans-serif" fontSize="11" fill="#047857">
        Follow an arrow down:
      </text>
      <text x={20} y={230} fontFamily="Arial, sans-serif" fontSize="11" fill="#047857">
        every square is BOTH.
      </text>
    </svg>
  );
};
