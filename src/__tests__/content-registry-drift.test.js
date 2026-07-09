/**
 * Guards the generated content registry (docs/PLUGGABLE_CONTENT_PLAN.md).
 *
 * buildOutputs() re-scans src/content/<grade>/grade.json and
 * src/content/<grade>/<topic>/manifest.json, validates every manifest against
 * the JSON Schemas and cross-file invariants (unique orders, unique storage
 * names, exactly one default grade, required code files present), and returns
 * the expected generated-file contents. Comparing against what is committed
 * on disk catches both invalid manifests and stale generated files.
 *
 * There is intentionally no pretest hook regenerating these files — doing so
 * would mask staleness in CI. If this test fails after a content edit, run:
 *
 *   npm run generate:content
 *
 * and commit the result.
 */
const fs = require('fs');
const path = require('path');
const { buildOutputs } = require('../../scripts/build-content-registry');

test('manifests are valid and committed generated files are up to date', () => {
  // Throws with a per-file error list if any manifest is invalid.
  const { files } = buildOutputs();

  expect(Object.keys(files).length).toBeGreaterThan(0);

  for (const [filePath, expected] of Object.entries(files)) {
    const relative = path.relative(path.join(__dirname, '..', '..'), filePath);
    expect(fs.existsSync(filePath)).toBe(true);

    const committed = fs.readFileSync(filePath, 'utf8');
    if (committed !== expected) {
      throw new Error(
        `${relative} is stale. Run "npm run generate:content" and commit the result.`
      );
    }
  }
});
