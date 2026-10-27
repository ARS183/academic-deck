#!/usr/bin/env node
'use strict';

/**
 * prepare-template.js — create a clean deck skeleton from the vendored theme template.
 *
 * Usage:
 *   node scripts/prepare-template.js [index.html] [--force]
 *
 * The vendored deck-template.html is a 20-slide French demo. It is never edited in
 * place. This script copies the head, styles, navigation, and scaling script, then
 * replaces the demo slides with two empty slides: a title slide and one content slide.
 *
 * Refuses to overwrite an existing deck unless --force is passed.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const force = args.includes('--force');
const target = path.resolve(args.find((a) => !a.startsWith('--')) || 'index.html');
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

html = html
  .replace('<html lang="fr">', '<html lang="en">')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Academic Deck</title>')
  .replace('padding:50px 72px 60px;', 'padding:56px 64px 48px;')
  .replace('left:72px; right:72px; bottom:24px;', 'left:64px; right:64px; bottom:20px;')
  .replace(/Précédent/g, 'Previous')
  .replace(/Suivant/g, 'Next')
  .replace(/← → naviguer · F plein écran · P imprimer \/ PDF/g, '← → navigate · F fullscreen · P print / PDF');

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
  <div class="pad single">
    <div class="col-text">
      <h2 class="title">Deck title states the claim</h2>
      <p class="lead">Author · Affiliation · Venue · Date</p>
    </div>
  </div>
</section>

<!-- 2 ============ CONTENT ============ -->
<section class="slide" data-role="content">
  <div class="pad">
    <div class="col-text">
      <h2 class="title">Slide title states the takeaway</h2>
      <div class="rule"></div>
      <ul class="points">
        <li><b>Term</b>: one orientation cue.</li>
      </ul>
    </div>
    <div class="col-fig"></div>
  </div>
  <div class="foot"><span>Short title</span><span class="snum">02</span></div>
</section>
`;

html = `${html.slice(0, start + startTag.length)}${slides}${html.slice(end)}`;

fs.writeFileSync(target, html);
console.log(`skeleton written: ${path.basename(target)} (2 slides, 64px margins, no demo content)`);
