/* scripts/move-tests.js
   Usage: node scripts/move-tests.js
   This script prints changes and writes moved+patched tests. Review before commit.
*/
const fs = require('fs');
const path = require('path');

const testsDir = path.resolve(__dirname, '..', 'tests');
const srcRoot = path.resolve(__dirname, '..', 'src');

const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') || f.endsWith('.integration.test.js') || f.endsWith('.spec.js'));
if (!files.length) {
  console.log('No test files found in tests/.');
  process.exit(0);
}

files.forEach(file => {
  const srcPath = path.join(testsDir, file);
  let content = fs.readFileSync(srcPath, 'utf8');

  // Heuristics to pick destination:
  // - If imports / requires a path containing "src/components/<subpath>" -> place under src/components/<subpath>/__tests__/
  // - If imports ../App or ../src/App -> place under src/__tests__/
  // - If imports ../content/<path> -> place under src/content/<path>/__tests__/
  // - Fallback: src/__tests__/

  let destDir = path.join(srcRoot, '__tests__'); // default
  const componentMatch = content.match(/['"]\.\.\/src\/components\/((?:[^'"]+))['"]/);
  const contentMatch = content.match(/['"]\.\.\/content\/((?:[^'"]+))['"]/);
  if (componentMatch) {
    const compPath = componentMatch[1]; // e.g., 'portal/PortalLayout'
    const compDir = path.dirname(compPath);
    destDir = path.join(srcRoot, 'components', compDir, '__tests__');
  } else if (contentMatch) {
    const contentSub = contentMatch[1]; // e.g., 'g4/operations-algebraic-thinking/questions.js'
    const contentDir = path.dirname(contentSub);
    destDir = path.join(srcRoot, 'content', contentDir, '__tests__');
  } else if (content.match(/['"]\.\.\/src\/App['"]|['"]\.\.\/App['"]/)) {
    destDir = path.join(srcRoot, '__tests__');
  }

  // Ensure destDir exists
  fs.mkdirSync(destDir, { recursive: true });

  // Fix require/import paths:
  // Replace "../src/components/.../X" => "../.../X" (not exact but works for common patterns)
  content = content.replace(/\.\.\/src\/components\/([^'"]+)/g, (_, p) => {
    // If destination is a sibling components/<subdir>/__tests__, then '../Component' is correct (one up)
    // Compute depth: destDir ends with components/<subdir>/__tests__
    // So we need to step up to the component folder: '../' + basename (if in same folder)
    return `../${p}`;
  });

  // Replace "../src/" => "../../" or "../" depending on dest depth
  if (destDir.includes(path.join('src','components'))) {
    content = content.replace(/\.\.\/src\/constants\//g, '../../constants/');
    content = content.replace(/\.\.\/src\/utils\//g, '../../utils/');
    content = content.replace(/\.\.\/src\/components\//g, '../');
    content = content.replace(/\.\.\/src\//g, '../');
  } else if (destDir.endsWith('__tests__')) {
    // top-level src/__tests__
    content = content.replace(/\.\.\/src\//g, '../');
    content = content.replace(/\.\.\/App/g, '../App');
  } else {
    // fallback
    content = content.replace(/\.\.\/src\//g, '../');
  }

  // Write moved file
  const newPath = path.join(destDir, file);
  fs.writeFileSync(newPath, content, 'utf8');
  console.log(`Moved: ${srcPath} -> ${newPath}`);
  console.log(`  - Review import updates in ${newPath}`);
  console.log('');
});

console.log('Done. Suggested git commands:');
console.log('  git add -A');
console.log('  git commit -m "Move tests under src/*/__tests__ and update imports"');
console.log('  (remove tests/ entries if no longer needed)');