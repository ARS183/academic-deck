#!/usr/bin/env node
'use strict';

/**
 * prepare-template.js — create a clean deck skeleton from the vendored theme template.
 *
 * Usage:
 *   node scripts/prepare-template.js [index.html] [--theme name] [--force]
 *
 * The vendored deck-template.html is a 20-slide French demo. It is never edited in
 * place. This script copies the head, styles, navigation, and scaling script, then
 * replaces the demo slides with two empty slides: a title slide and one content slide.
 * It then applies the theme (--theme, else deck.config.json "theme", else tudelft) and
 * writes the footers, so the skeleton already looks like the theme in a browser.
 *
 * Refuses to overwrite an existing deck unless --force is passed.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const force = args.includes('--force');
const themeFlag = args.indexOf('--theme') >= 0 ? args[args.indexOf('--theme') + 1] : null;
const target = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--theme') || 'index.html');
const template = path.resolve(__dirname, '..', 'themes', 'metropolis', 'reference', 'deck-template.html');

if (!fs.existsSync(template)) {
  console.error(`template not found: ${template}`);
  process.exit(2);
}
if (fs.existsSync(target) && !force) {
  console.error(`${path.basename(target)} exists; refusing to overwrite. Use --force to rebuild the skeleton.`);
  process.exit(1);
}

let html = fs.readFileSync(template, 'utf8');

// Each rewrite must match. If vendor.sh brings a changed template, fail instead of silently
// shipping French UI text or the upstream 72px margins.
const rewrites = [
  ['<html lang="fr">', '<html lang="en">'],
  [/<title>[\s\S]*?<\/title>/, '<title>Academic Deck</title>'],
  ['padding:50px 72px 60px;', 'padding:56px 64px 48px;'],
  ['left:72px; right:72px; bottom:24px;', 'left:64px; right:64px; bottom:20px;'],
  [/Précédent/g, 'Previous'],
  [/Suivant/g, 'Next'],
  [/← → naviguer · F plein écran · P imprimer \/ PDF/g, '← → navigate · F fullscreen · P print / PDF'],
  // THEME.md allows paper, ink, orange and neutrals only. Map the template's extra hues onto
  // neutrals, and define the chart neutrals THEME.md names but the template lacks.
  ['--blue:#1f77b4;', '--blue:#5b7a80;'],
  ['--infosoft:#e8f1f7;', '--infosoft:#eff1ee;'],
  ['--amber:#8a6a1a;', '--amber:#5b7a80;'],
  ['--ambersoft:#f7efdb;', '--ambersoft:#eff1ee;'],
  ['fill="#1f77b4"/></marker>', 'fill="#5b7a80"/></marker>'],
  ['--stage-w:1280px;', '--neutral-1:#c3ccce; --neutral-2:#5b7a80;\n  --stage-w:1280px;'],
];
const missing = rewrites.filter(([from]) => !(typeof from === 'string' ? html.includes(from) : from.test(html)));
if (missing.length) {
  console.error(`template changed upstream; update prepare-template.js for: ${missing.map(([f]) => String(f)).join(' | ')}`);
  process.exit(2);
}
for (const [from, to] of rewrites) html = html.replace(from, to);

const startTag = '<div id="stage">';
const start = html.indexOf(startTag);
const end = html.indexOf('</div><!-- /stage -->');
if (start < 0 || end < 0) {
  console.error('unexpected template structure: stage markers not found');
  process.exit(2);
}

const slides = `
<!-- 1 ============ TITLE ============ -->
<section class="slide active" data-role="title">
  <div class="pad single title-page">
    <h2 class="title">Paper title, verbatim</h2>
    <p class="tp-authors">Author One, Author Two</p>
    <p class="tp-affil">Affiliation</p>
    <p class="tp-date">Venue, date</p>
  </div>
</section>

<!-- 2 ============ CONTENT ============ -->
<section class="slide" data-role="content">
  <div class="pad">
    <div class="head">
      <h2 class="title">Slide title states the takeaway</h2>
      <div class="rule"></div>
    </div>
    <div class="col-text">
      <ul class="points">
        <li><b>Term</b>: one orientation cue.</li>
      </ul>
    </div>
    <div class="col-fig"></div>
  </div>
  <div class="foot"></div>
</section>
`;

html = `${html.slice(0, start + startTag.length)}${slides}${html.slice(end)}`;

fs.writeFileSync(target, html);

const themeArgs = themeFlag ? ['--theme', themeFlag] : [];
for (const script of ['inject-theme-css.js', 'footers.js']) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), target, ...themeArgs], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}
console.log(`skeleton written: ${path.basename(target)} (2 slides, no demo content)`);
