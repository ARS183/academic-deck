#!/usr/bin/env node
'use strict';

/**
 * build.js — one-command build for an academic deck.
 *
 * Usage:
 *   node scripts/build.js [deck-dir] [--skip-qa] [--skip-pdf]
 *
 * Steps: number theorems -> lint -> fonts -> equations -> visual QA -> PDF.
 * Optional steps are skipped when their inputs or upstream scripts are absent.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const here = __dirname;
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const deckDir = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
const index = path.join(deckDir, 'index.html');

if (!fs.existsSync(index)) {
  console.error(`no index.html in ${deckDir}`);
  process.exit(2);
}

function step(name, fn) {
  process.stdout.write(`\n== ${name}\n`);
  const code = fn();
  if (code !== 0) {
    console.error(`\nbuild stopped at: ${name}`);
    process.exit(code || 1);
  }
}

function node(script, argv, opts = {}) {
  const p = path.join(here, script);
  if (!fs.existsSync(p)) {
    if (opts.optional) {
      console.log(`skip: ${script} not installed`);
      return 0;
    }
    console.error(`missing: ${script}`);
    return 1;
  }
  const r = spawnSync(process.execPath, [p, ...argv], { stdio: 'inherit', cwd: deckDir });
  return r.status === null ? 1 : r.status;
}

const html = fs.readFileSync(index, 'utf8');
const slideCount = (html.match(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"/gi) || []).length;
if (!slideCount) {
  console.error('no slides found');
  process.exit(2);
}

step('theme css', () => node('inject-theme-css.js', [index]));
step('number theorems', () => node('number-theorems.js', [index, '--config', path.join(deckDir, 'deck.config.json')]));
step('lint', () => node('lint-text.js', [index, '--config', path.join(deckDir, 'deck.config.json')]));

if (fs.existsSync(path.join(deckDir, 'fonts.manifest.json'))) {
  step('fonts', () => node('mkfonts.js', [
    path.join(deckDir, 'fonts.manifest.json'), path.join(deckDir, 'fonts.css'),
  ], { optional: true }));
}

if (fs.existsSync(path.join(deckDir, 'eqs.json'))) {
  step('equations', () => node('tex2svg.js', [
    path.join(deckDir, 'eqs.json'), path.join(deckDir, 'assets/eq'),
  ], { optional: true }));
}

if (!flags.has('--skip-qa')) {
  step('visual qa', () => node('qa.js', [
    index, path.join(deckDir, 'qa'), ...Array.from({ length: slideCount }, (_, i) => String(i + 1)),
  ], { optional: true }));
}

if (!flags.has('--skip-pdf')) {
  step('pdf', () => node('pdf.js', [
    index, path.join(deckDir, 'deck.pdf'), `1-${slideCount}`,
  ], { optional: true }));
}

console.log(`\ndone: ${slideCount} slides`);
