import { escapeCsvCell, buildCsvContent } from '../csvExport';

describe('escapeCsvCell', () => {
  test('wraps a plain string in double quotes', () => {
    expect(escapeCsvCell('Alice')).toBe('"Alice"');
  });

  test('doubles embedded quotes and wraps the whole cell', () => {
    expect(escapeCsvCell('She said "hi"')).toBe('"She said ""hi"""');
  });

  test('preserves embedded commas without shifting columns', () => {
    expect(escapeCsvCell('Smith, John')).toBe('"Smith, John"');
  });

  test('preserves embedded newlines', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  test('null and undefined become empty quoted cells', () => {
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });

  test('numbers are stringified and quoted', () => {
    expect(escapeCsvCell(42)).toBe('"42"');
    expect(escapeCsvCell(0)).toBe('"0"');
  });
});

describe('buildCsvContent', () => {
  test('returns an empty string for empty input', () => {
    expect(buildCsvContent([])).toBe('');
    expect(buildCsvContent(null)).toBe('');
    expect(buildCsvContent(undefined)).toBe('');
  });

  test('produces a BOM-prefixed header + row line', () => {
    const csv = buildCsvContent([{ Name: 'Alice', Grade: 3 }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    // Strip BOM for the assertion below
    expect(csv.slice(1)).toBe('"Name","Grade"\n"Alice","3"');
  });

  test('escapes commas, quotes, and newlines in cells', () => {
    const csv = buildCsvContent([
      { Name: 'Doe, Jane', Note: 'She said "hi"\nagain' },
    ]);
    expect(csv.slice(1)).toBe(
      '"Name","Note"\n"Doe, Jane","She said ""hi""\nagain"'
    );
  });

  test('does not throw when a row is missing a column present in the header', () => {
    const csv = buildCsvContent([
      { Name: 'Alice', Accuracy: '80.0' },
      { Name: 'Bob' },
    ]);
    // Bob has no Accuracy — should render as an empty quoted cell.
    const lines = csv.slice(1).split('\n');
    expect(lines[0]).toBe('"Name","Accuracy"');
    expect(lines[1]).toBe('"Alice","80.0"');
    expect(lines[2]).toBe('"Bob",""');
  });

  test('preserves distinct column and row alignment for the student export shape', () => {
    const csv = buildCsvContent([
      {
        'Name': 'Alice, "The Great"',
        'Accuracy (%)': '',
        'Latest Activity': 'Never',
      },
    ]);
    const lines = csv.slice(1).split('\n');
    expect(lines[0]).toBe('"Name","Accuracy (%)","Latest Activity"');
    // Three columns → row has exactly three quoted cells even though one is empty.
    const cellCount = (lines[1].match(/","/g) || []).length + 1;
    expect(cellCount).toBe(3);
    expect(lines[1]).toBe('"Alice, ""The Great""","","Never"');
  });
});
