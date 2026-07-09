#!/usr/bin/env node
/**
 * Content registry codegen (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 1).
 *
 * Scans src/content/<grade>/grade.json and src/content/<grade>/<topic>/manifest.json,
 * validates every manifest against the JSON Schemas plus cross-file invariants,
 * and emits two committed files:
 *
 *   src/content/registry.generated.js         — static imports of every topic module,
 *                                               grouped by grade (client registry input)
 *   src/content/content-manifest.generated.json — pure-data aggregate consumed by
 *                                               shared-constants.js and Netlify functions
 *
 * The folder IS the registration: adding a topic folder with a manifest.json (plus
 * questions.js / Explanation.js / index.js) and rerunning this script is all it takes.
 *
 * Usage:
 *   node scripts/build-content-registry.js            # regenerate (also runs on prestart/prebuild)
 *   node scripts/build-content-registry.js --check    # fail if committed output is stale
 *
 * Freshness of the committed files is enforced by src/__tests__/content-registry-drift.test.js,
 * which runs this module's buildOutputs() and compares against disk. There is deliberately
 * no pretest hook: regenerating before tests would mask staleness in CI.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');

// Mirrors src/utils/firebaseHelpers.sanitizeTopicName (ESM, so not requirable here).
// Topic names become Firestore field-path segments; collisions silently merge stats.
const sanitizeTopicName = (topicName) =>
  topicName
    .replace(/[().&\s]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const toCamelCase = (kebab) => kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
};

const stripSchemaKey = (obj) => {
  const { $schema, ...rest } = obj;
  return rest;
};

const fail = (messages) => {
  const list = Array.isArray(messages) ? messages : [messages];
  throw new Error(`Content registry validation failed:\n  - ${list.join('\n  - ')}`);
};

const collectContent = () => {
  const ajv = new Ajv({ allErrors: true });
  const validateGrade = ajv.compile(readJson(path.join(CONTENT_DIR, 'grade.schema.json')));
  const validateTopic = ajv.compile(readJson(path.join(CONTENT_DIR, 'manifest.schema.json')));
  const errors = [];

  const gradeDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(CONTENT_DIR, name, 'grade.json')))
    .sort();

  if (gradeDirs.length === 0) fail('no grade folders (containing grade.json) found');

  const grades = gradeDirs.map((gradeDir) => {
    const gradePath = path.join(CONTENT_DIR, gradeDir, 'grade.json');
    const grade = readJson(gradePath);

    if (!validateGrade(grade)) {
      errors.push(`${gradePath}: ${ajv.errorsText(validateGrade.errors)}`);
    }
    if (grade.id !== gradeDir) {
      errors.push(`${gradePath}: id "${grade.id}" must equal folder name "${gradeDir}"`);
    }

    const topicDirs = fs
      .readdirSync(path.join(CONTENT_DIR, gradeDir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => fs.existsSync(path.join(CONTENT_DIR, gradeDir, name, 'manifest.json')))
      .sort();

    const topics = topicDirs.map((topicDir) => {
      const manifestPath = path.join(CONTENT_DIR, gradeDir, topicDir, 'manifest.json');
      const manifest = readJson(manifestPath);

      if (!validateTopic(manifest)) {
        errors.push(`${manifestPath}: ${ajv.errorsText(validateTopic.errors)}`);
      }
      if (manifest.id !== topicDir) {
        errors.push(`${manifestPath}: id "${manifest.id}" must equal folder name "${topicDir}"`);
      }
      if (manifest.grade !== grade.key) {
        errors.push(`${manifestPath}: grade "${manifest.grade}" must equal grade key "${grade.key}"`);
      }
      for (const required of ['index.js', 'questions.js', 'Explanation.js']) {
        if (!fs.existsSync(path.join(CONTENT_DIR, gradeDir, topicDir, required))) {
          errors.push(`${manifestPath}: topic folder is missing ${required}`);
        }
      }
      Object.entries(manifest.subtopicAliases || {}).forEach(([alias, target]) => {
        if (!manifest.subtopics.includes(target)) {
          errors.push(
            `${manifestPath}: subtopicAliases["${alias}"] points at "${target}", which is not in subtopics`
          );
        }
      });
      return manifest;
    });

    if (topics.length === 0 && grade.enabled) {
      // A disabled grade may sit empty (freshly scaffolded, staging); an
      // enabled one would render an empty student topic picker.
      errors.push(`${gradePath}: enabled grade has no topic folders with a manifest.json`);
    }

    // Per-grade invariants
    const orders = topics.map((t) => t.order);
    if (new Set(orders).size !== orders.length) {
      errors.push(`${gradeDir}: topic "order" values must be unique (got ${orders.join(', ')})`);
    }
    const sanitized = topics.map((t) => sanitizeTopicName(t.name));
    if (new Set(sanitized).size !== sanitized.length) {
      errors.push(`${gradeDir}: sanitized topic names collide (${sanitized.join(', ')})`);
    }

    return { dir: gradeDir, grade, topics: topics.sort((a, b) => a.order - b.order) };
  });

  // Cross-grade invariants
  const gradeKeys = grades.map((g) => g.grade.key);
  if (new Set(gradeKeys).size !== gradeKeys.length) {
    errors.push(`grade keys must be unique (got ${gradeKeys.join(', ')})`);
  }
  const ordinals = grades.map((g) => g.grade.ordinal);
  if (new Set(ordinals).size !== ordinals.length) {
    errors.push(`grade ordinals must be unique (got ${ordinals.join(', ')})`);
  }
  const defaults = grades.filter((g) => g.grade.enabled && g.grade.default);
  if (defaults.length !== 1) {
    errors.push(`exactly one enabled grade must set "default": true (found ${defaults.length})`);
  }
  const allNames = grades.flatMap((g) => g.topics.map((t) => t.name));
  if (new Set(allNames).size !== allNames.length) {
    errors.push(`topic names must be globally unique — they are Firestore storage keys (got duplicates among: ${allNames.join(', ')})`);
  }

  if (errors.length > 0) fail(errors);

  return grades.sort((a, b) => a.grade.ordinal - b.grade.ordinal);
};

const buildOutputs = () => {
  const grades = collectContent();

  const aggregate = {
    grades: grades.map(({ grade, topics }) => ({
      ...stripSchemaKey(grade),
      topics: topics.map(stripSchemaKey),
    })),
  };
  const aggregateJson = `${JSON.stringify(aggregate, null, 2)}\n`;

  const importLines = [];
  const gradeEntries = [];
  grades.forEach(({ dir, topics }) => {
    const gradeIdent = `${toCamelCase(dir)}Grade`;
    importLines.push(`import ${gradeIdent} from './${dir}/grade.json';`);
    const topicIdents = topics.map((topic) => {
      const ident = toCamelCase(`${dir}-${topic.id}`);
      importLines.push(`import ${ident} from './${dir}/${topic.id}';`);
      return ident;
    });
    gradeEntries.push(
      `  {\n    manifest: ${gradeIdent},\n    topics: [${topicIdents.join(', ')}],\n  },`
    );
  });

  const registryJs = [
    '// @generated by scripts/build-content-registry.js — DO NOT EDIT.',
    '// Regenerate with: node scripts/build-content-registry.js',
    '// Grades sorted by ordinal; topics sorted by manifest "order".',
    '/* eslint-disable */',
    ...importLines,
    '',
    'export const grades = [',
    ...gradeEntries,
    '];',
    '',
    'export default grades;',
    '',
  ].join('\n');

  return {
    files: {
      [path.join(CONTENT_DIR, 'content-manifest.generated.json')]: aggregateJson,
      [path.join(CONTENT_DIR, 'registry.generated.js')]: registryJs,
    },
  };
};

const main = () => {
  const checkMode = process.argv.includes('--check');
  const { files } = buildOutputs();
  const stale = [];

  for (const [filePath, expected] of Object.entries(files)) {
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
    if (current !== expected) {
      if (checkMode) {
        stale.push(path.relative(process.cwd(), filePath));
      } else {
        fs.writeFileSync(filePath, expected);
        console.log(`wrote ${path.relative(process.cwd(), filePath)}`);
      }
    }
  }

  if (checkMode) {
    if (stale.length > 0) {
      console.error(
        `Generated content registry is stale: ${stale.join(', ')}\n` +
          'Run "node scripts/build-content-registry.js" and commit the result.'
      );
      process.exit(1);
    }
    console.log('Generated content registry is up to date.');
  } else if (Object.keys(files).length > 0) {
    console.log('Content registry OK.');
  }
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { buildOutputs };
