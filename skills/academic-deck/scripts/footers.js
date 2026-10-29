#!/usr/bin/env node
'use strict';

/**
 * footers.js — write every slide's footer from deck.config.json and the active theme.
 *
 * Usage:
 *   node scripts/footers.js index.html [--theme name]
 *
 * The theme's theme.json "footer" says which fields appear, in which order, how the slide number
 * is written ({n}, {N}, {nn} = zero-padded n), whether the title slide has a footer, and whether
 * it is counted. Field values come from deck.config.json "footer": {author, short, date}. When
 * "short" is missing, the slide's existing footer text is kept, so hand-written decks survive.
 *
 * Idempotent: the footer is rebuilt from the same inputs on every run.
 */

const fs = require('fs');
const path = require('path');
const { loadTheme } = require('./theme');

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--theme');
const themeFlag = args.indexOf('--theme') >= 0 ? args[args.indexOf('--theme') + 1] : null;

if (!file || !fs.existsSync(file)) {
  console.error('usage: node scripts/footers.js index.html [--theme name]');
  process.exit(2);
}

const deckDir = path.dirname(path.resolve(file));
let theme;
try {
  theme = loadTheme(deckDir, themeFlag);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
const cfgPath = path.join(deckDir, 'deck.config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
const values = cfg.footer || {};

const esc = (s) => String(s).replace(/&(?![#\w]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FOOT = /<div\b[^>]*class="[^"]*\bfoot\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*/i;
const SLIDE = /<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>[\s\S]*?<\/section>/gi;

function isTitle(open) {
  return /\bdata-role="title"/i.test(open) || /class="[^"]*\btitle-slide\b/i.test(open);
}

function oldShort(foot) {
  // First span that is not the slide number: the short title in every template so far.
  const spans = [...foot.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi)];
  const s = spans.find((m) => !/\bsnum\b/.test(m[1]) && !/\bf-(author|date)\b/.test(m[1]));
  return s ? s[2].trim() : '';
}

let html = fs.readFileSync(file, 'utf8');
const slides = html.match(SLIDE) || [];
if (!slides.length) {
  console.error('no slides found');
  process.exit(2);
}

const counted = (s) => theme.footer.countTitle || !isTitle(s.slice(0, s.indexOf('>') + 1));
const total = slides.filter(counted).length;
let n = 0;
let written = 0;
const blank = new Set();

html = html.replace(SLIDE, (slide) => {
  const open = slide.slice(0, slide.indexOf('>') + 1);
  if (counted(slide)) n += 1;
  const existing = slide.match(FOOT);
  const stripped = existing ? slide.replace(FOOT, '') : slide;
  if (isTitle(open) && !theme.footer.onTitle) return stripped;

  const num = theme.footer.num
    .replace('{nn}', String(n).padStart(2, '0'))
    .replace('{n}', String(n))
    .replace('{N}', String(total));
  const field = {
    author: values.author || '',
    short: values.short || (existing ? oldShort(existing[0]) : ''),
    date: values.date || '',
  };
  for (const f of theme.footer.fields) if (f !== 'num' && !field[f]) blank.add(f);
  const spans = theme.footer.fields.map((f) => (f === 'num'
    ? `<span class="snum">${esc(num)}</span>`
    : `<span class="f-${f}">${field[f] ? esc(field[f]) : ''}</span>`)).join('');
  const foot = `<div class="foot">${spans}</div>\n`;
  written += 1;
  const close = stripped.lastIndexOf('</section>');
  return `${stripped.slice(0, close).replace(/\s*$/, '\n  ')}${foot}${stripped.slice(close)}`;
});

fs.writeFileSync(file, html);
console.log(`footers: ${written} slide(s), theme ${theme.name}, numbering ${theme.footer.num}`);
if (blank.size) console.log(`note: footer ${[...blank].join(', ')} blank; set them in deck.config.json "footer"`);
