#!/usr/bin/env node
'use strict';

/**
 * inject-theme-css.js — place theorem.css and the active theme's CSS inside a deck's <style> block.
 *
 * Usage:
 *   node scripts/inject-theme-css.js index.html [--theme name] [--css themes/metropolis/theorem.css]
 *
 * The theme comes from --theme, else deck.config.json beside index.html, else tudelft.
 * Theme CSS may reference an image as asset(key); it is inlined as a data URI from theme.json
 * "assets". The <html> element gets data-theme="<name>" so lint can detect a stale build.
 *
 * Idempotent: each injected region is delimited by markers and replaced in place, so re-running
 * after a theme switch or a theme refresh cannot duplicate rules.
 */

const fs = require('fs');
const path = require('path');
const { loadTheme } = require('./theme');

const THM = ['/* === theorem.css (injected by academic-deck; do not edit) === */', '/* === end theorem.css === */'];
const THEME = ['/* === theme (injected by academic-deck; do not edit) === */', '/* === end theme === */'];
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && !['--css', '--theme'].includes(args[i - 1]));
const flag = (name) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : null);
const cssPath = flag('--css')
  ? path.resolve(flag('--css'))
  : path.resolve(__dirname, '..', 'themes', 'metropolis', 'theorem.css');

if (!file) {
  console.error('usage: node scripts/inject-theme-css.js index.html [--theme name] [--css path]');
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

let theme;
try {
  theme = loadTheme(path.dirname(path.resolve(file)), flag('--theme'));
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

function dataUri(key) {
  const p = theme.assets[key];
  if (!p || !fs.existsSync(p)) {
    console.error(`theme ${theme.name}: asset "${key}" not found (${p || 'not in theme.json'})`);
    process.exit(1);
  }
  const mime = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
  return `"data:${mime};base64,${fs.readFileSync(p).toString('base64')}"`;
}

const themeCss = theme.css.map((p) => {
  if (!fs.existsSync(p)) {
    console.error(`theme ${theme.name}: css not found: ${p}`);
    process.exit(1);
  }
  return `/* ${path.relative(path.join(theme.dir, '..'), p)} */\n${fs.readFileSync(p, 'utf8').trim()}`;
}).join('\n').replace(/asset\(([\w-]+)\)/g, (_, k) => dataUri(k));

let html = fs.readFileSync(file, 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function inject(markers, body) {
  const block = `${markers[0]}\n${body}\n${markers[1]}`;
  const region = new RegExp(`${esc(markers[0])}[\\s\\S]*?${esc(markers[1])}`);
  if (region.test(html)) {
    html = html.replace(region, () => block);
    return;
  }
  const close = html.lastIndexOf('</style>');
  if (close < 0) {
    console.error('no </style> block found; inject the CSS manually');
    process.exit(1);
  }
  html = `${html.slice(0, close)}${block}\n${html.slice(close)}`;
}

// Order matters: the theme comes last so it can restyle theorem blocks.
inject(THM, fs.readFileSync(cssPath, 'utf8').trim());
inject(THEME, themeCss);

html = html.replace(/<html\b([^>]*)>/i, (m, attrs) => {
  const rest = attrs.replace(/\s+data-theme="[^"]*"/i, '');
  return `<html${rest} data-theme="${theme.name}">`;
});

fs.writeFileSync(file, html);
console.log(`theorem.css and theme "${theme.name}" injected into ${path.basename(file)}`);
