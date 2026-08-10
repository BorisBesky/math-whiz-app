import fs from 'fs';
import path from 'path';

const explanationSrc = fs.readFileSync(
  path.join(__dirname, '..', 'Explanation.js'),
  'utf8'
);

describe('G4 base-ten Explanation: covers every declared subtopic', () => {
  it('teaches multi-digit comparison', () => {
    expect(explanationSrc).toMatch(/Comparing Multi-Digit Numbers/i);
  });

  it('teaches multi-digit addition and subtraction', () => {
    expect(explanationSrc).toMatch(/Adding\s*(&amp;|and)\s*Subtracting/i);
  });

  it('teaches multi-step word problems', () => {
    expect(explanationSrc).toMatch(/Multi-Step Word Problems/i);
  });
});

describe('G4 base-ten Explanation: well-formed table markup', () => {
  // React auto-inserts a <tbody> around <tr> children of a <table>, but it
  // emits a console warning. More importantly, the first (place-value)
  // table historically had an inline `style={{background: …}}` on the
  // header row that shadowed styles.tableHeader's cell background in
  // browsers that render `tr` background differently. Every table row
  // should live inside an explicit <tbody> so styling is predictable.
  it('every <table> wraps its <tr> children inside a <tbody>', () => {
    // Find all <table ...> blocks and check none have a bare <tr>
    // directly after them.
    const badTables = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
    let match;
    while ((match = tableRegex.exec(explanationSrc)) !== null) {
      const body = match[1];
      // Look for a <tr> that appears before the first <tbody>.
      const firstTbody = body.indexOf('<tbody');
      const firstTr = body.indexOf('<tr');
      if (firstTr !== -1 && (firstTbody === -1 || firstTr < firstTbody)) {
        badTables.push(match[0].slice(0, 120));
      }
    }
    expect(badTables).toEqual([]);
  });
});
