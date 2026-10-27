#!/usr/bin/env node
'use strict';

/**
 * inject-assets.js — make the deck self-contained.
 *
 * Usage:
 *   node scripts/inject-assets.js index.html [--fonts fonts.css] [--eqdir assets/eq]
 *
 * 1. Replaces /*FONTS* / (or a previous injection) with base64 @font-face CSS.
 * 2. Replaces {{EQ:name}} with the inline SVG at <eqdir>/name.svg.
 *
 * Fails loudly when a font block or equation is requested but missing: a deck with
 * placeholder glyphs must never reach QA.
 */

const fs = require('fs');
const path = require('path');

const FONT_START = '/* === fonts.css (injected by academic-deck) === */';
const FONT_END = '/* === end fonts.css === */';

const args = process.argv.slice(2);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const file = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--fonts'
  && args[args.indexOf(a) - 1] !== '--eqdir');

if (!file) {
  console.error('usage: node scripts/inject-assets.js index.html [--fonts fonts.css] [--eqdir assets/eq]');
  process.exit(2);
}
if (!fs.existsSync(file)) {
  console.error(`not found: ${file}`);
  process.exit(2);
}

const deckDir = path.dirname(path.resolve(file));
const fontsPath = path.resolve(valueOf('--fonts') || path.join(deckDir, 'fonts.css'));
const eqDir = path.resolve(valueOf('--eqdir') || path.join(deckDir, 'assets', 'eq'));

let html = fs.readFileSync(file, 'utf8');
const errors = [];

// --- fonts ---------------------------------------------------------------
const fontRegion = new RegExp(
  `${FONT_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${FONT_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);

if (fs.existsSync(fontsPath)) {
  const css = fs.readFileSync(fontsPath, 'utf8').trim();
  const block = `${FONT_START}\n${css}\n${FONT_END}`;
  if (fontRegion.test(html)) html = html.replace(fontRegion, block);
  else if (html.includes('/*FONTS*/')) html = html.replace('/*FONTS*/', block);
  else html = html.replace('</style>', `${block}\n</style>`);
} else if (html.includes('/*FONTS*/')) {
  errors.push(`no fonts at ${fontsPath}; run mkfonts.js first or pass --fonts`);
}

// --- equations -----------------------------------------------------------
// Both a fresh {{EQ:name}} and an equation injected by an earlier build are (re)filled from
// <eqdir>/name.svg, so editing eqs.json and rebuilding updates the deck.
let eqCount = 0;
const svgFor = (name) => {
  const p = path.join(eqDir, `${name}.svg`);
  if (!fs.existsSync(p)) {
    errors.push(`missing equation ${name}.svg in ${eqDir}`);
    return null;
  }
  eqCount += 1;
  return `<span class="eq" data-eq="${name}">${fs.readFileSync(p, 'utf8')}</span>`;
};

function closeSpan(s, from) {
  const re = /<\/?span\b[^>]*>/gi;
  re.lastIndex = from;
  let depth = 0;
  let m;
  while ((m = re.exec(s))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}

const injected = /<span class="eq" data-eq="([A-Za-z0-9_-]+)">/g;
let out = '';
let last = 0;
let m;
while ((m = injected.exec(html))) {
  const end = closeSpan(html, m.index);
  if (end < 0) {
    errors.push(`unclosed injected equation ${m[1]}`);
    break;
  }
  const fresh = svgFor(m[1]);
  out += html.slice(last, m.index) + (fresh || html.slice(m.index, end));
  last = end;
  injected.lastIndex = end;
}
html = out + html.slice(last);

html = html.replace(/\{\{EQ:([A-Za-z0-9_-]+)\}\}/g, (whole, name) => svgFor(name) || whole);

if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s); file not written.`);
  process.exit(1);
}

fs.writeFileSync(file, html);
console.log(`assets injected: fonts ${fs.existsSync(fontsPath) ? 'yes' : 'no'}, equations ${eqCount}`);
