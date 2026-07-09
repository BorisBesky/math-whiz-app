#!/usr/bin/env node
/**
 * Topic scaffold (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 4).
 *
 *   npm run new:topic -- --grade g4 --id algebra --name "Algebra" [--theme violet] [--icon 🅧]
 *
 * Creates src/content/<grade>/<id>/ with a schema-valid manifest.json, a
 * contract-passing sample generator, an Explanation component, a starter
 * test, and the index.js loader module — then regenerates the registry.
 * The folder IS the registration: after this script the topic exists
 * everywhere (student picker, portal, question bank, AI functions).
 *
 * Authoring rules live in docs/CONTENT_AUTHORING.md. The one to remember:
 * "name" is a Firestore storage key — NEVER rename it after students use it.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');

const parseArgs = () => {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
};

const fail = (message) => {
  console.error(`new:topic: ${message}`);
  process.exit(1);
};

const toCamelCase = (kebab) => kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const { grade: gradeId, id, name, theme = 'violet', icon = '📚' } = parseArgs();

if (!gradeId || !id || !name) {
  fail('usage: npm run new:topic -- --grade g4 --id algebra --name "Algebra" [--theme violet] [--icon 🅧]');
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`id "${id}" must be kebab-case`);

const gradePath = path.join(CONTENT_DIR, gradeId, 'grade.json');
if (!fs.existsSync(gradePath)) {
  fail(`grade folder "${gradeId}" has no grade.json — create the grade first (npm run new:grade)`);
}
const grade = JSON.parse(fs.readFileSync(gradePath, 'utf8'));

const topicDir = path.join(CONTENT_DIR, gradeId, id);
if (fs.existsSync(topicDir)) fail(`${topicDir} already exists`);

// Globally unique storage name + next display order within the grade
let maxOrder = 0;
for (const dirent of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  const gDir = path.join(CONTENT_DIR, dirent.name);
  for (const sub of fs.readdirSync(gDir, { withFileTypes: true })) {
    const manifestPath = path.join(gDir, sub.name, 'manifest.json');
    if (!sub.isDirectory() || !fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.name === name) fail(`topic name "${name}" already exists (${dirent.name}/${sub.name}) — names are global storage keys`);
    if (dirent.name === gradeId) maxOrder = Math.max(maxOrder, manifest.order);
  }
}

const camelId = toCamelCase(id);
const write = (file, content) => {
  fs.writeFileSync(path.join(topicDir, file), content);
  console.log(`created ${path.relative(process.cwd(), path.join(topicDir, file))}`);
};

fs.mkdirSync(path.join(topicDir, '__tests__'), { recursive: true });

write('manifest.json', `${JSON.stringify({
  $schema: '../../manifest.schema.json',
  id,
  name,
  grade: grade.key,
  order: maxOrder + 1,
  description: `TODO: one-line description of ${name}`,
  standards: [],
  subtopics: ['sample questions'],
  objectives: [`TODO: learning objectives for ${name}`],
  ui: { icon, theme },
  ai: {
    guidelines: `TODO: one-line guidance for AI question generation about ${name}`,
  },
  legacyExplanationHtml: null,
  aliases: [],
  enabled: false,
  version: 1,
}, null, 2)}\n`);

write('index.js', `// ${grade.label} ${name} Topic Module
// Metadata lives in manifest.json; heavy imports (questions.js, Explanation.js)
// load on demand when a quiz starts or an explanation opens.
import manifest from './manifest.json';

export const ${camelId} = {
  ...manifest,
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
};

export default ${camelId};
`);

write('questions.js', `// ${name} question generator.
// Contract (enforced by src/content/__tests__/topicContracts.test.js):
// generateQuestion(difficulty [0..1], allowedSubtopics | null) returns a
// question object — or null when the restriction can't be satisfied.
import { QUESTION_TYPES } from '../../../constants/shared-constants.js';
import manifest from './manifest.json';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSampleQuestion = (difficulty) => {
  // TODO: replace this placeholder family with real ${name} content.
  const limit = 10 + Math.round(difficulty * 90);
  const a = randomInt(2, limit);
  const b = randomInt(2, limit);
  const correctAnswer = String(a + b);
  const options = new Set([correctAnswer]);
  while (options.size < 4) {
    options.add(String(a + b + randomInt(-10, 10) || a + b + 1));
  }

  return {
    question: \`What is \${a} + \${b}?\`,
    correctAnswer,
    options: [...options].sort(() => Math.random() - 0.5),
    questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
    hint: 'Add the two numbers together.',
    standard: '',
    concept: manifest.name,
    grade: manifest.grade,
    subtopic: 'sample questions',
  };
};

// One generator per subtopic; extend as you add subtopics to the manifest.
const GENERATORS_BY_SUBTOPIC = {
  'sample questions': generateSampleQuestion,
};

export const generateQuestion = (difficulty, allowedSubtopics = null) => {
  const candidates = manifest.subtopics.filter(
    (subtopic) =>
      GENERATORS_BY_SUBTOPIC[subtopic] &&
      (!allowedSubtopics || allowedSubtopics.includes(subtopic))
  );
  if (candidates.length === 0) return null;

  const subtopic = candidates[randomInt(0, candidates.length - 1)];
  return GENERATORS_BY_SUBTOPIC[subtopic](difficulty);
};

export default { generateQuestion };
`);

write('Explanation.js', `import React from 'react';

// Shown when a student taps "Explain" on a ${name} question.
const Explanation = () => (
  <div className="p-4 space-y-3">
    <h2 className="text-2xl font-display font-bold">${name}</h2>
    <p>TODO: teach the concept with worked examples and visuals.</p>
  </div>
);

export default Explanation;
`);

write(path.join('__tests__', 'questions.test.js'), `// Topic-specific tests for ${name}.
// The shared generator contract already runs for this topic via
// src/content/__tests__/topicContracts.test.js — put edge cases here.
import { generateQuestion } from '../questions';

describe('${name} questions', () => {
  test('sample generator produces an answerable question', () => {
    const question = generateQuestion(0.5, null);
    expect(question.options).toContain(question.correctAnswer);
  });
});
`);

execFileSync('node', [path.join(__dirname, 'build-content-registry.js')], { stdio: 'inherit' });

console.log(`
Topic scaffolded at src/content/${gradeId}/${id}/ (enabled: false — invisible to students).

Next steps:
  1. Fill in manifest.json (description, standards, subtopics, ai.guidelines).
  2. Replace the placeholder generator in questions.js (one generator per subtopic).
  3. Write Explanation.js.
  4. npm test — the shared contract suite covers this topic automatically.
  5. Flip "enabled": true and rerun npm run generate:content when ready.

See docs/CONTENT_AUTHORING.md for the full guide.`);
