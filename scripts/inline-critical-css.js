#!/usr/bin/env node

/**
 * Post-build script: converts CRA's render-blocking CSS <link> to a
 * non-render-blocking preload, and inlines minimal critical CSS so
 * the page can paint before the full stylesheet loads.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'build', 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('build/index.html not found — run npm run build first');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Critical above-fold CSS (body, fonts, basic layout for first paint)
const criticalCSS = `
body{margin:0;font-family:'Nunito','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.font-display{font-family:'Baloo 2','Fredoka','Comic Sans MS',cursive}
#root{min-height:100vh}
`.trim();

// Find the CRA-injected CSS link tag: <link href="/static/css/main.HASH.css" rel="stylesheet">
const cssLinkRe = /<link\s+href="(\/static\/css\/main\.[^"]+\.css)"\s+rel="stylesheet"\s*\/?>/;
const match = html.match(cssLinkRe);

if (!match) {
  console.log('No render-blocking CSS link found — skipping');
  process.exit(0);
}

const cssHref = match[1];
const originalTag = match[0];

// Replace with: inline critical CSS + async-load the full stylesheet
const replacement = [
  `<style>${criticalCSS}</style>`,
  `<link rel="preload" href="${cssHref}" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
  `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`,
].join('\n');

html = html.replace(originalTag, replacement);

fs.writeFileSync(htmlPath, html);
console.log(`Inlined critical CSS and async-loaded ${cssHref}`);
