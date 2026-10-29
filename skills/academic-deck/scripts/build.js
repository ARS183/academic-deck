#!/usr/bin/env node
'use strict';

/**
 * build.js — one-command build for an academic deck.
 *
 * Usage:
 *   node scripts/build.js [deck-dir] [--skip-qa] [--skip-pdf] [--allow-unverified]
 *
 * Pipeline:
 *   mkfonts -> tex2svg -> inject-theme-css -> inject-assets -> footers -> number-theorems
 *   -> lint -> visual QA -> layout check -> PDF
 *
 * The theme (fonts, CSS, logos, footer layout) comes from deck.config.json "theme"; default tudelft.
 *
 * Missing dependencies are a hard failure unless --allow-unverified is passed.
 * An unverified build says so and exits 0 only because the author asked for it.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const here = __dirname;
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const deckDir = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
const index = path.join(deckDir, 'index.html');
const allowUnverified = flags.has('--allow-unverified');
const skipped = [];

if (!fs.existsSync(index)) {
  console.error(`no index.html in ${deckDir}`);
  process.exit(2);
}

const html = fs.readFileSync(index, 'utf8');
const slideCount = (html.match(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"/gi) || []).length;
if (!slideCount) {
  console.error('no slides found');
  process.exit(2);
}

function hasModule(name) {
  try {
    require.resolve(name, { paths: [deckDir, path.join(deckDir, 'node_modules'), process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

function nodeEnv() {
  const local = path.join(deckDir, 'node_modules');
  const parts = [local, process.env.NODE_PATH].filter(Boolean);
  return { ...process.env, NODE_PATH: parts.join(path.delimiter) };
}

function step(name, fn) {
  process.stdout.write(`\n== ${name}\n`);
  const code = fn();
  if (code !== 0) {
    console.error(`\nbuild stopped at: ${name}`);
    process.exit(code || 1);
  }
}

function run(script, argv) {
  const p = path.join(here, script);
  if (!fs.existsSync(p)) {
    console.error(`missing script: ${script}`);
    return 1;
  }
  const r = spawnSync(process.execPath, [p, ...argv], {
    stdio: 'inherit',
    cwd: deckDir,
    env: nodeEnv(),
  });
  return r.status === null ? 1 : r.status;
}

function requireOrSkip(what, mod, installHint, neededFor) {
  if (!mod || hasModule(mod)) return true;
  const msg = `${what} unavailable (${mod} not resolvable from ${deckDir}).\n  fix: ${installHint}`;
  if (!allowUnverified) {
    console.error(`\nprerequisite missing: ${msg}`);
    console.error(`  or re-run with --allow-unverified to build without ${neededFor}`);
    process.exit(1);
  }
  console.error(`\nwarning: ${msg}`);
  console.error(`  continuing unverified; ${neededFor} will NOT run`);
  skipped.push(neededFor);
  return false;
}

const hasChromium = fs.existsSync(path.join(here, 'chromium.js'));
if (!hasChromium) {
  console.error('prerequisite missing: scripts/chromium.js (run: bash vendor.sh)');
  process.exit(1);
}

let theme;
try {
  theme = require('./theme').loadTheme(deckDir);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
console.log(`theme: ${theme.name}`);

// A deck-local manifest overrides the theme's fonts.
const fontsManifest = [
  path.join(deckDir, 'fonts.manifest.json'),
  theme.fonts,
].find((p) => p && fs.existsSync(p));

const eqsPath = path.join(deckDir, 'eqs.json');
const wantEq = fs.existsSync(eqsPath);
let eqEnabled = wantEq;
let qaEnabled = !flags.has('--skip-qa');
let pdfEnabled = !flags.has('--skip-pdf');

if (wantEq) {
  if (!requireOrSkip('mathjax', 'mathjax', 'npm i mathjax@3', 'equation rendering')) eqEnabled = false;
}
if (qaEnabled || pdfEnabled) {
  if (!requireOrSkip('playwright-core', 'playwright-core', 'npm i playwright-core && npx playwright install chromium', 'visual QA and PDF export')) {
    qaEnabled = false;
    pdfEnabled = false;
  }
}

step('fonts', () => {
  if (!fontsManifest) {
    console.log('skip: no fonts.manifest.json');
    return 0;
  }
  return run('mkfonts.js', [fontsManifest, path.join(deckDir, 'fonts.css')]);
});

step('equations', () => {
  if (!eqEnabled) {
    console.log('skip: equation rendering');
    return 0;
  }
  fs.mkdirSync(path.join(deckDir, 'assets', 'eq'), { recursive: true });
  return run('tex2svg.js', [eqsPath, path.join(deckDir, 'assets', 'eq')]);
});

step('theme css', () => run('inject-theme-css.js', [index]));
step('assets', () => run('inject-assets.js', [index, '--fonts', path.join(deckDir, 'fonts.css'), '--eqdir', path.join(deckDir, 'assets', 'eq')]));
step('footers', () => run('footers.js', [index]));
step('number theorems', () => run('number-theorems.js', [index, '--config', path.join(deckDir, 'deck.config.json')]));
step('lint', () => {
  const lintArgs = [index, '--config', path.join(deckDir, 'deck.config.json')];
  if (allowUnverified) {
    const todos = (fs.readFileSync(index, 'utf8').match(/\[TODO[^\]]*\]/gi) || []).length;
    if (todos) skipped.push(`${todos} [TODO: source] unresolved`);
    lintArgs.push('--allow-todo');
  }
  return run('lint-text.js', lintArgs);
});

if (qaEnabled) {
  // Remove screenshots from an earlier, longer build so no stale slide is inspected.
  const qaDir = path.join(deckDir, 'qa');
  if (fs.existsSync(qaDir)) {
    for (const f of fs.readdirSync(qaDir)) if (/^s\d+\.png$/.test(f)) fs.unlinkSync(path.join(qaDir, f));
  }
  step('visual qa', () => run('qa.js', [
    index, path.join(deckDir, 'qa'), ...Array.from({ length: slideCount }, (_, i) => String(i + 1)),
  ]));
  step('layout', () => run('layout-check.js', [index]));
} else {
  console.log('\nskip: visual qa');
  skipped.push('visual QA');
}

if (pdfEnabled) {
  const pdfPath = path.join(deckDir, 'deck.pdf');
  step('pdf', () => run('pdf.js', [index, pdfPath, `1-${slideCount}`]));
  step('pdf page count', () => {
    const pages = (fs.readFileSync(pdfPath).toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
    if (pages !== slideCount) {
      console.error(`deck.pdf has ${pages} page(s), expected ${slideCount}`);
      return 1;
    }
    console.log(`${pages} pages = ${slideCount} slides`);
    return 0;
  });
} else {
  console.log('\nskip: pdf');
  skipped.push('PDF export');
}

console.log(`\ndone: ${slideCount} slides`);
if (skipped.length) {
  console.log(`NOT VERIFIED: ${[...new Set(skipped)].join(', ')}`);
  console.log('Run the checklist in reference/deck-checklist.md before delivery.');
}
