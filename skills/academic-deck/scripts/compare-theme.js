#!/usr/bin/env node
'use strict';

/**
 * compare-theme.js — put deck slides next to reference template pages to tune a theme.
 *
 * Usage:
 *   node scripts/compare-theme.js index.html <ref-dir> <slide:page>[,<slide:page>...] [out-dir]
 *
 *   ref-dir   PNG pages of the reference, 1280×720, named like p-01.png or p-1.png. For a PDF:
 *             pdftoppm -r <dpi> -png reference.pdf ref/p   with dpi = 92160 / page width in pt
 *             (beamer 16:9 is 453.54 pt wide, so -r 203.2).
 *   pairs     deck slide number : reference page number, e.g. 1:1,2:2,3:5
 *   out-dir   default compare/
 *
 * For each pair it writes cmp-<slide>.png: reference top-left, deck top-right, the pixel
 * difference bottom-left (black = identical), and a 50% overlay bottom-right. It prints the share
 * of pixels that differ, so a change can be judged by a number as well as by eye.
 */

const { chromium } = require('./dep')('playwright-core');
const fs = require('fs');
const path = require('path');

const [deckArg, refDir, pairArg, outArg] = process.argv.slice(2);
if (!deckArg || !refDir || !pairArg) {
  console.error('usage: node scripts/compare-theme.js index.html <ref-dir> <slide:page,...> [out-dir]');
  process.exit(2);
}
const DECK = path.resolve(deckArg);
const OUT = path.resolve(outArg || 'compare');
const pairs = pairArg.split(',').map((p) => p.split(':').map(Number));

function refPath(page) {
  const names = fs.readdirSync(refDir).filter((f) => /\.png$/i.test(f));
  const hit = names.find((f) => Number((f.match(/(\d+)\.png$/i) || [])[1]) === page);
  if (!hit) {
    console.error(`no reference PNG for page ${page} in ${refDir}`);
    process.exit(2);
  }
  return path.join(refDir, hit);
}

const uri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: require('./chromium')(), args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const deck = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await deck.goto(`file://${DECK}`, { waitUntil: 'networkidle' });
  await deck.waitForTimeout(400);
  const board = await b.newPage({ viewport: { width: 1280, height: 720 } });

  for (const [slide, page] of pairs) {
    await deck.evaluate((k) => { location.hash = `#${k}`; }, slide);
    await deck.waitForTimeout(450);
    const shot = await deck.screenshot();
    const ref = fs.readFileSync(refPath(page));
    const score = await board.evaluate(async ([a, c]) => {
      const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const [ra, dc] = await Promise.all([load(a), load(c)]);
      const cv = document.createElement('canvas');
      cv.width = 1280; cv.height = 720;
      const g = cv.getContext('2d');
      g.drawImage(ra, 0, 0, 1280, 720);
      const A = g.getImageData(0, 0, 1280, 720).data;
      g.drawImage(dc, 0, 0, 1280, 720);
      const C = g.getImageData(0, 0, 1280, 720).data;
      let diff = 0;
      for (let k = 0; k < A.length; k += 4) {
        if (Math.abs(A[k] - C[k]) + Math.abs(A[k + 1] - C[k + 1]) + Math.abs(A[k + 2] - C[k + 2]) > 96) diff += 1;
      }
      document.body.style.margin = '0';
      document.body.style.background = '#888';
      document.body.innerHTML = `
        <div style="position:relative;width:1280px;height:720px">
          <img src="${a}" style="position:absolute;left:0;top:0;width:638px;height:359px">
          <img src="${c}" style="position:absolute;left:642px;top:0;width:638px;height:359px">
          <div style="position:absolute;left:0;top:361px;width:638px;height:359px;isolation:isolate">
            <img src="${a}" style="position:absolute;inset:0;width:100%;height:100%">
            <img src="${c}" style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:difference">
          </div>
          <div style="position:absolute;left:642px;top:361px;width:638px;height:359px">
            <img src="${a}" style="position:absolute;inset:0;width:100%;height:100%">
            <img src="${c}" style="position:absolute;inset:0;width:100%;height:100%;opacity:.5">
          </div>
        </div>`;
      await new Promise((ok) => setTimeout(ok, 100));
      return diff / (1280 * 720);
    }, [uri(ref), uri(shot)]);
    const name = `cmp-${String(slide).padStart(2, '0')}.png`;
    await board.screenshot({ path: path.join(OUT, name) });
    fs.writeFileSync(path.join(OUT, `deck-${String(slide).padStart(2, '0')}.png`), shot);
    console.log(`slide ${slide} vs page ${page}: ${(score * 100).toFixed(2)}% pixels differ -> ${name}`);
  }
  await b.close();
})();
