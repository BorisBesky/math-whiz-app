import fs from 'fs';
import path from 'path';

// A regrouping example in g4/base-ten once shipped with literal U+0003 (ETX)
// characters wedged between its digits, so students saw a garbled subtraction
// walk-through. Nothing caught it: the file still parsed, still rendered, and
// no test looked at the characters themselves. Control characters have no
// business in curriculum text, so fail the build if any reappear.

const CONTENT_ROOT = path.join(__dirname, '..');

// C0/C1 controls, excluding tab, line feed and carriage return. Built from a
// string so this file itself stays free of literal control characters.
// no-control-regex is exactly what this test is for, so it is disabled on the
// pattern itself rather than worked around.
const CONTROL_CHARS = new RegExp(
  // eslint-disable-next-line no-control-regex
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]',
  'g'
);

const collectFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectFiles(full);
    }
    return entry.name.endsWith('.js') || entry.name.endsWith('.json') ? [full] : [];
  });

const contentFiles = collectFiles(CONTENT_ROOT);

describe('curriculum content hygiene', () => {
  it('finds content files to check', () => {
    expect(contentFiles.length).toBeGreaterThan(20);
  });

  it('contains no stray control characters', () => {
    const offenders = [];
    for (const file of contentFiles) {
      const text = fs.readFileSync(file, 'utf8');
      text.split('\n').forEach((line, index) => {
        const found = line.match(CONTROL_CHARS);
        if (!found) return;
        const codes = found.map(
          (character) => `U+${character.charCodeAt(0).toString(16).padStart(4, '0')}`
        );
        offenders.push(
          `${path.relative(CONTENT_ROOT, file)}:${index + 1} ${codes.join(',')}`
        );
      });
    }
    expect(offenders).toEqual([]);
  });

  it('indents with spaces, never tabs', () => {
    // Mixed tabs and spaces hid a missing `)}` in AdminPortal.js for long
    // enough that the file stopped compiling without anyone noticing.
    const offenders = contentFiles
      .filter((file) => /\t/.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(CONTENT_ROOT, file));
    expect(offenders).toEqual([]);
  });
});
