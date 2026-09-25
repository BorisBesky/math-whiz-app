import {
  buildLShape,
  buildStaircase,
  buildUShape,
  computePerimeterUnits,
  getOutlineSides,
  isHorizontal,
  planHiddenSides,
  randomRectilinearFigure,
  solveSideLengths,
} from '../rectilinearShapes';

const sumByDir = (sides, dir) => sides.filter((s) => s.dir === dir).reduce((a, s) => a + s.length, 0);

describe('rectilinear figure builders', () => {
  test.each(['top-right', 'top-left', 'bottom-right', 'bottom-left'])(
    'L-shape with a %s notch: area = W×H − notch, perimeter = 2(W+H), 6 sides',
    (corner) => {
      const cells = buildLShape({ width: 9, height: 7, notchWidth: 4, notchHeight: 3, corner });
      expect(cells).toHaveLength(9 * 7 - 4 * 3);
      expect(computePerimeterUnits(cells)).toBe(2 * (9 + 7));
      expect(getOutlineSides(cells)).toHaveLength(6);
    }
  );

  test('U-shape adds the two inner walls to the perimeter', () => {
    const cells = buildUShape({ width: 10, height: 6, notchWidth: 3, notchHeight: 4, notchOffset: 3 });
    expect(cells).toHaveLength(10 * 6 - 3 * 4);
    expect(computePerimeterUnits(cells)).toBe(2 * (10 + 6) + 2 * 4);
    expect(getOutlineSides(cells)).toHaveLength(8);
  });

  test('staircase is three columns stepping down to the right', () => {
    const cells = buildStaircase({ width: 9, height: 8, stepXs: [3, 6], stepTops: [2, 5] });
    expect(cells).toHaveLength(3 * 8 + 3 * 6 + 3 * 3);
    expect(computePerimeterUnits(cells)).toBe(2 * (9 + 8));
    expect(getOutlineSides(cells)).toHaveLength(8);
  });
});

describe('randomRectilinearFigure', () => {
  test('every figure is a closed outline with sides of at least 2 units', () => {
    for (let i = 0; i < 600; i += 1) {
      const figure = randomRectilinearFigure([0.5, 0.75, 0.9, 1][i % 4]);
      const { sides } = figure;
      sides.forEach((s) => expect(s.length).toBeGreaterThanOrEqual(2));
      expect(sumByDir(sides, 'R')).toBe(sumByDir(sides, 'L'));
      expect(sumByDir(sides, 'D')).toBe(sumByDir(sides, 'U'));
      expect(sumByDir(sides, 'R')).toBe(figure.width);
      expect(figure.area).toBe(figure.cells.length);
      expect(figure.area).toBeLessThan(figure.width * figure.height);
      expect(figure.perimeter).toBe(sides.reduce((a, s) => a + s.length, 0));
    }
  });

  test('families unlock with difficulty', () => {
    const familiesAt = (difficulty) => new Set(
      Array.from({ length: 300 }, () => randomRectilinearFigure(difficulty).family)
    );
    expect([...familiesAt(0.5)]).toEqual(['L-shape']);
    expect(familiesAt(0.75)).toEqual(new Set(['L-shape', 'U-shape']));
    expect(familiesAt(0.95)).toEqual(new Set(['L-shape', 'U-shape', 'staircase']));
  });
});

describe('hidden sides are always solvable', () => {
  test('hides at most one horizontal and one vertical side, and they can be recovered exactly', () => {
    for (let i = 0; i < 800; i += 1) {
      const { sides } = randomRectilinearFigure(0.5 + (i % 6) * 0.1);
      const hideCount = i % 3;
      const hidden = planHiddenSides(sides, hideCount);
      expect(hidden).toHaveLength(hideCount);
      expect(hidden.filter((idx) => isHorizontal(sides[idx])).length).toBeLessThanOrEqual(1);
      expect(hidden.filter((idx) => !isHorizontal(sides[idx])).length).toBeLessThanOrEqual(1);

      const known = sides.map((s, idx) => (hidden.includes(idx) ? null : s.length));
      expect(solveSideLengths(sides, known)).toEqual(sides.map((s) => s.length));
    }
  });

  test('two hidden sides on the same axis are reported as unsolvable', () => {
    const sides = getOutlineSides(buildUShape({ width: 10, height: 6, notchWidth: 3, notchHeight: 4, notchOffset: 3 }));
    const horizontal = sides.map((s, i) => (isHorizontal(s) ? i : -1)).filter((i) => i >= 0);
    const known = sides.map((s, i) => (i === horizontal[0] || i === horizontal[1] ? null : s.length));
    expect(solveSideLengths(sides, known)).toBeNull();
  });
});
