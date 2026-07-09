#!/usr/bin/env node
/**
 * Grade scaffold (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 4).
 *
 *   npm run new:grade -- --key G5 --label "5th Grade" [--short 5th]
 *
 * Creates src/content/<id>/grade.json with enabled: false (safe staging —
 * a disabled grade is invisible everywhere) and regenerates the registry.
 * Add topics with npm run new:topic, then flip "enabled": true; every grade
 * toggle, portal tab, class form, validation list and AI prompt picks the
 * grade up from the manifest with no code changes.
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
  console.error(`new:grade: ${message}`);
  process.exit(1);
};

const { key, label, short } = parseArgs();

if (!key || !label) {
  fail('usage: npm run new:grade -- --key G5 --label "5th Grade" [--short 5th]');
}
if (!/^G[0-9]+$/.test(key)) fail(`key "${key}" must look like G5`);

const ordinal = Number.parseInt(key.slice(1), 10);
const id = key.toLowerCase();
const gradeDir = path.join(CONTENT_DIR, id);
if (fs.existsSync(gradeDir)) fail(`${gradeDir} already exists`);

const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[ordinal % 100 > 10 && ordinal % 100 < 14 ? 0 : ordinal % 10] || 'th';
const shortLabel = short || `${ordinal}${suffix}`;

fs.mkdirSync(gradeDir, { recursive: true });
fs.writeFileSync(
  path.join(gradeDir, 'grade.json'),
  `${JSON.stringify({
    $schema: '../grade.schema.json',
    id,
    key,
    label,
    shortLabel,
    ordinal,
    description: `${label} mathematics topics`,
    default: false,
    enabled: false,
    ai: {
      storyRequirements: [
        `- Keep the story age-appropriate for ${shortLabel} graders`,
        '- Use engaging, realistic scenarios',
        '- Make the math problem clear and solvable',
        '- End with a clear question',
        '- Provide the answer on a new line in the format "Answer: [your answer]"',
        '- Keep the story to one paragraph',
        `- Use only topics and concepts appropriate for ${shortLabel} grade math`,
      ],
    },
    standards: {},
  }, null, 2)}\n`
);
console.log(`created src/content/${id}/grade.json (enabled: false)`);

execFileSync('node', [path.join(__dirname, 'build-content-registry.js')], { stdio: 'inherit' });

console.log(`
Grade ${key} scaffolded (disabled — invisible until you flip "enabled": true).

Next steps:
  1. Add topics: npm run new:topic -- --grade ${id} --id <topic-id> --name "<Topic Name>"
  2. Review grade.json (storyRequirements wording, standards).
  3. Flip "enabled": true and rerun npm run generate:content when the grade is ready.

See docs/CONTENT_AUTHORING.md for the full guide.`);
