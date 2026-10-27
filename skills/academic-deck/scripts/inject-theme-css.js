#!/usr/bin/env node
'use strict';

/**
 * inject-theme-css.js — place theorem.css inside a deck's <style> block.
 *
 * Usage:
 *   node scripts/inject-theme-css.js index.html [--css themes/metropolis/theorem.css]
 *
 * Idempotent: the injected region is delimited by markers and replaced in place,
 * so re-running after a theme refresh cannot duplicate rules.
 */

const fs = require('fs');
const path = require('path');

const START = '/* === theorem.css (injected by academic-deck; do not edit) === */';
const END = '/* === end theorem.css === */';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const cssFlag = args.indexOf('--css');
const cssPath = cssFlag >= 0
  ? path.resolve(args[cssFlag + 1])
  : path.resolve(__dirname, '..', 'themes', 'metropolis', 'theorem.css');

if (!file) {
  console.error('usage: node scripts/inject-theme-css.js index.html [--css path]');
  process.exit(2);
}
if (!fs.existsSync(file)) {
  console.error(`not found: ${file}`);
  process.exit(2);
}
if (!fs.existsSync(cssPath)) {
  console.error(`not found: ${cssPath}`);
  process.exit(2);
}

const css = fs.readFileSync(cssPath, 'utf8').trim();
const block = `${START}\n${css}\n${END}`;
let html = fs.readFileSync(file, 'utf8');

const escapedStart = START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapedEnd = END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const region = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`);

if (region.test(html)) {
  html = html.replace(region, block);
} else {
  const close = html.lastIndexOf('</style>');
  if (close < 0) {
    console.error('no </style> block found; inject theorem.css manually');
    process.exit(1);
  }
  html = `${html.slice(0, close)}${block}\n${html.slice(close)}`;
}

fs.writeFileSync(file, html);
console.log(`theorem.css injected into ${path.basename(file)}`);
