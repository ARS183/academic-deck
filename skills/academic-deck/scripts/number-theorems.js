#!/usr/bin/env node
'use strict';

/**
 * number-theorems.js — assign theorem numbers, ids, and resolve cross-references.
 *
 * Usage:
 *   node scripts/number-theorems.js index.html [--config deck.config.json]
 *
 * Contract: reference/theorem.md
 * Idempotent: a second run produces byte-identical output.
 */

const fs = require('fs');
const path = require('path');

const KINDS = new Map([
  ['theorem', 'Theorem'],
  ['lemma', 'Lemma'],
  ['proposition', 'Proposition'],
  ['corollary', 'Corollary'],
  ['definition', 'Definition'],
  ['remark', 'Remark'],
  ['example', 'Example'],
  ['assumption', 'Assumption'],
]);

const errors = [];
const fail = (msg) => errors.push(msg);

function parseArgs(argv) {
  const out = { file: null, config: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--config') out.config = argv[++i];
    else if (!a.startsWith('--') && !out.file) out.file = a;
  }
  return out;
}

function loadConfig(p) {
  const defaults = { theorem: { enabled: true, numbering: 'continuous', proofs: true } };
  if (!p || !fs.existsSync(p)) return defaults;
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...defaults, ...raw, theorem: { ...defaults.theorem, ...(raw.theorem || {}) } };
  } catch (e) {
    fail(`cannot parse ${p}: ${e.message}`);
    return defaults;
  }
}

function attrsOf(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = m[2];
  return attrs;
}

const classesOf = (attrs) => (attrs.class || '').split(/\s+/).filter(Boolean);

function findClosingDiv(html, openStart) {
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = openStart;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      depth -= 1;
      if (depth === 0) return m.index + m[0].length;
    } else {
      depth += 1;
    }
  }
  return -1;
}

function findSections(html) {
  const out = [];
  const re = /<section\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const a = attrsOf(m[0]);
    if (!classesOf(a).includes('slide')) continue;
    out.push({ start: m.index, section: a['data-section'] || null });
  }
  return out;
}

function sectionFor(sections, pos) {
  let current = null;
  for (const s of sections) {
    if (s.start >= pos) break;
    if (s.section) current = s.section;
  }
  return current;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('usage: node scripts/number-theorems.js index.html [--config deck.config.json]');
    process.exit(2);
  }
  const file = path.resolve(args.file);
  if (!fs.existsSync(file)) {
    console.error(`not found: ${file}`);
    process.exit(2);
  }

  const cfg = loadConfig(args.config || path.join(path.dirname(file), 'deck.config.json'));
  const numbering = cfg.theorem.numbering === 'section' ? 'section' : 'continuous';
  let html = fs.readFileSync(file, 'utf8');

  // Remove previous numerals so the transform is idempotent.
  html = html.replace(/\s*<span class="thm__num">[^<]*<\/span>/g, '');

  const sections = findSections(html);
  const blocks = [];
  const opener = /<div\b[^>]*>/gi;
  let m;
  while ((m = opener.exec(html))) {
    const a = attrsOf(m[0]);
    if (!classesOf(a).includes('thm')) continue;
    if (!Object.prototype.hasOwnProperty.call(a, 'data-kind')) {
      fail(`offset ${m.index}: .thm without data-kind`);
      continue;
    }
    const end = findClosingDiv(html, m.index);
    if (end < 0) {
      fail(`offset ${m.index}: unclosed .thm block`);
      continue;
    }
    blocks.push({ start: m.index, openEnd: m.index + m[0].length, end, attrs: a, tag: m[0] });
    opener.lastIndex = m.index + m[0].length;
  }

  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = 0; j < blocks.length; j += 1) {
      if (i !== j && blocks[j].start > blocks[i].start && blocks[j].start < blocks[i].end) {
        fail(`nested .thm block at offset ${blocks[j].start}`);
      }
    }
  }

  const idTo = new Map();
  const seenIds = new Set();
  const edits = [];
  let counter = 0;
  const sectionCounters = new Map();

  for (const b of blocks) {
    const kind = String(b.attrs['data-kind'] || '').toLowerCase();
    const word = KINDS.get(kind);
    if (!word) {
      fail(`unknown data-kind "${kind}" at offset ${b.start}`);
      continue;
    }

    let number;
    if (numbering === 'section') {
      const sec = sectionFor(sections, b.start);
      if (!sec) {
        fail(`theorem before the first data-section slide (offset ${b.start})`);
        continue;
      }
      const n = (sectionCounters.get(sec) || 0) + 1;
      sectionCounters.set(sec, n);
      counter += 1;
      number = `${sec}.${n}`;
    } else {
      counter += 1;
      number = String(counter);
    }

    let id = b.attrs.id || `thm-${number.replace(/\./g, '-')}`;
    if (seenIds.has(id)) {
      fail(`duplicate theorem id "${id}"`);
      id = `${id}-dup`;
    }
    seenIds.add(id);

    const name = b.attrs['data-name'] ? ` (${esc(b.attrs['data-name'])})` : '';
    const block = html.slice(b.start, b.end);
    const labelMatch = block.match(/<p\b[^>]*class="[^"]*\bthm__label\b[^"]*"[^>]*>[\s\S]*?<\/p>/);
    if (!labelMatch) {
      fail(`.thm without .thm__label at offset ${b.start}`);
      continue;
    }

    const labelOpen = labelMatch[0].match(/^<p\b[^>]*>/)[0];
    const labelStart = b.start + labelMatch.index;
    const labelText = `${word} <span class="thm__num">${number}</span>${name}.`;
    edits.push({
      start: labelStart,
      end: labelStart + labelMatch[0].length,
      text: `${labelOpen}${labelText}</p>`,
    });

    if (!b.attrs.id) {
      edits.push({
        start: b.start,
        end: b.openEnd,
        text: b.tag.replace(/>$/, ` id="${id}">`),
      });
    }

    idTo.set(id, { word, number });
    idTo.set(String(number), { word, number });
  }

  // Resolve references, replacing the whole anchor in one edit.
  const refRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let r;
  let refCount = 0;
  while ((r = refRe.exec(html))) {
    const a = attrsOf(r[1]);
    if (!classesOf(a).includes('thm-ref')) continue;
    const target = a['data-ref'];
    if (!target) {
      fail('a.thm-ref without data-ref');
      continue;
    }
    const hit = idTo.get(target);
    if (!hit) {
      fail(`a.thm-ref points to unknown id "${target}"`);
      continue;
    }
    const rest = r[1].replace(/\s*href\s*=\s*"[^"]*"/i, '').replace(/\s*$/, '');
    edits.push({
      start: r.index,
      end: r.index + r[0].length,
      text: `<a${rest} href="#${target}">${hit.word} ${hit.number}</a>`,
    });
    refCount += 1;
  }

  for (const e of edits.sort((x, y) => y.start - x.start)) {
    html = html.slice(0, e.start) + e.text + html.slice(e.end);
  }

  if (!cfg.theorem.enabled && blocks.length > 0) {
    fail(`${blocks.length} .thm block(s) present but theorem.enabled is false`);
  }
  if (cfg.theorem.proofs === false && /class="[^"]*\bproof\b/.test(html)) {
    fail('proof block present but theorem.proofs is false');
  }

  if (errors.length) {
    console.error(errors.map((e) => `error: ${e}`).join('\n'));
    console.error(`\n${errors.length} problem(s); file not written.`);
    process.exit(1);
  }

  fs.writeFileSync(file, html);
  console.log(`numbered ${blocks.length} theorem block(s), resolved ${refCount} reference(s) [${numbering}]`);
}

main();
