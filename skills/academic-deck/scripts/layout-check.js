#!/usr/bin/env node
'use strict';

/**
 * layout-check.js — fail when slide content collides with the theme's chrome or leaves the slide.
 *
 * Usage:
 *   node scripts/layout-check.js index.html [slide numbers...]
 *
 * For every slide it measures the rendered text lines, images, and SVG ink, and checks them against
 * the footer and the slide's ::before / ::after chrome (sidebar, logo). Switching theme changes
 * sizes and reserved areas, so a deck that fit one theme can collide in another; the screenshots
 * show it, this script makes it a hard failure.
 */

const { chromium } = require('./dep')('playwright-core');
const path = require('path');

const DECK = path.resolve(process.argv[2] || 'index.html');
const only = process.argv.slice(3).map(Number).filter(Boolean);

(async () => {
  const b = await chromium.launch({ executablePath: require('./chromium')(), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(`file://${DECK}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const count = await p.evaluate(() => document.querySelectorAll('.slide').length);
  const list = only.length ? only : Array.from({ length: count }, (_, i) => i + 1);
  const problems = [];

  for (const n of list) {
    await p.evaluate((k) => { location.hash = `#${k}`; }, n);
    await p.waitForTimeout(350);
    const found = await p.evaluate((k) => {
      const slide = document.querySelectorAll('.slide')[k - 1];
      const S = slide.getBoundingClientRect();
      const rel = (r) => ({ l: r.left - S.left, t: r.top - S.top, r: r.right - S.left, b: r.bottom - S.top });
      const reserved = [];
      const foot = slide.querySelector('.foot');
      if (foot) {
        const r = rel(foot.getBoundingClientRect());
        if (r.r > r.l && r.b > r.t) reserved.push({ name: 'footer', ...r });
      }
      for (const pseudo of ['::before', '::after']) {
        const cs = getComputedStyle(slide, pseudo);
        if (cs.content === 'none' || cs.position !== 'absolute' || cs.display === 'none') continue;
        const l = parseFloat(cs.left); const t = parseFloat(cs.top);
        const w = parseFloat(cs.width); const h = parseFloat(cs.height);
        if ([l, t, w, h].every(Number.isFinite) && w > 0 && h > 0) {
          reserved.push({ name: pseudo === '::before' ? 'sidebar/chrome' : 'logo/chrome', l, t, r: l + w, b: t + h });
        }
      }

      const items = [];
      const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim() || (foot && foot.contains(node))) continue;
        if (node.parentElement.closest('svg')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width > 0.5 && r.height > 0.5) items.push({ what: `text "${node.textContent.trim().slice(0, 40)}"`, ...rel(r) });
        }
      }
      for (const el of slide.querySelectorAll('img, canvas, svg')) {
        if (foot && foot.contains(el)) continue;
        if (el.tagName.toLowerCase() === 'svg' && el.parentElement.closest('svg')) continue;
        let box = null;
        const parts = el.tagName.toLowerCase() === 'svg'
          ? el.querySelectorAll('text, path, rect, circle, ellipse, line, polyline, polygon, image, use')
          : [el];
        for (const part of parts) {
          const r = part.getBoundingClientRect();
          if (r.width <= 0 && r.height <= 0) continue;
          box = box
            ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
            : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        }
        if (box) items.push({ what: el.tagName.toLowerCase() === 'svg' ? 'figure (svg)' : el.tagName.toLowerCase(), ...rel(box) });
      }

      const tol = 1;
      const out = [];
      for (const it of items) {
        if (it.l < -tol || it.t < -tol || it.r > 1280 + tol || it.b > 720 + tol) out.push(`${it.what} leaves the slide`);
        for (const z of reserved) {
          if (it.l < z.r - tol && it.r > z.l + tol && it.t < z.b - tol && it.b > z.t + tol) out.push(`${it.what} overlaps the ${z.name}`);
        }
      }
      return [...new Set(out)];
    }, n);
    for (const f of found) problems.push(`slide ${n}  [LAYOUT]  ${f}`);
  }
  await b.close();
  if (problems.length) {
    for (const x of problems) console.error(x);
    console.error(`\n${problems.length} layout problem(s); cut or re-flow the content, never shrink below the theme's sizes`);
    process.exit(1);
  }
  console.log(`layout clean: ${list.length} slides, no overlap with footer or theme chrome`);
})();
