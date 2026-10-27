#!/usr/bin/env node
'use strict';

/**
 * lint-text.js — enforce the academic deck contract.
 *
 * Usage:
 *   node scripts/lint-text.js index.html [--config deck.config.json] [--strict]
 *
 * Reads deck.config.json, checks language, citations, structure, theorem state,
 * body-word ceilings, and the slide budget. Exit 1 on any error.
 */

const fs = require('fs');
const path = require('path');

const BANNED = [
  'revolutionary', 'game-changing', 'cutting-edge', 'seamless', 'leverage', 'utilize',
  'delve', 'unlock', 'empower', 'holistic', 'paradigm shift', 'dramatically',
  'very', 'extremely', 'incredibly', 'obviously', 'clearly', 'of course',
];

const US_FORMS = ['analyze', 'analyzed', 'analyzing', 'organize', 'organized', 'organizing',
  'behavior', 'behaviors', 'color', 'colors', 'modeling', 'modeled', 'labeling', 'labeled',
  'center', 'centers', 'defense', 'gray'];
const UK_FORMS = ['analyse', 'analysed', 'analysing', 'organise', 'organised', 'organising',
  'behaviour', 'behaviours', 'colour', 'colours', 'modelling', 'modelled', 'labelling', 'labelled',
  'centre', 'centres', 'defence', 'grey'];

// Structural slides (Conclusions, References, Appendix) are allowed to carry a plain title.
const BARE_LABELS = /^(methods?|results?|discussion|introduction|background|motivation|related work|experiments?|evaluation|outline|agenda)$/i;

const BUDGET = [
  [10, 8, 10], [15, 12, 15], [20, 15, 18], [30, 22, 26], [45, 30, 34], [60, 36, 42],
];

const DENSITY = { sparse: 25, standard: 40, dense: 60 };

const issues = [];
const add = (slide, rule, msg) => issues.push({ slide, rule, msg });

function parseArgs(argv) {
  const out = { file: null, config: null, strict: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--config') out.config = argv[++i];
    else if (a === '--strict') out.strict = true;
    else if (!a.startsWith('--') && !out.file) out.file = a;
  }
  return out;
}

function loadConfig(p) {
  const d = {
    purpose: 'conference', talkMinutes: 15, citationStyle: 'author-year', citationStandard: 'APA7',
    spelling: 'US', density: 'standard', handout: false,
    theorem: { enabled: true, numbering: 'continuous', proofs: true },
    maxBodyWords: 40, appendix: true,
  };
  if (!p || !fs.existsSync(p)) return { cfg: d, found: false };
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return {
    cfg: { ...d, ...raw, theorem: { ...d.theorem, ...(raw.theorem || {}) } },
    found: true,
  };
}

function stripHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8718;/g, '∎')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text) {
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

function hasClass(tag, cls) {
  const c = attr(tag, 'class') || '';
  return c.split(/\s+/).includes(cls);
}

function extractSlides(html) {
  const re = /<section\b[^>]*>[\s\S]*?<\/section>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const open = m[0].match(/^<section\b[^>]*>/i)[0];
    let inner = m[0].slice(open.length, m[0].length - '</section>'.length);
    const titleMatch = inner.match(/<h[12]\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>[\s\S]*?<\/h[12]>/i)
      || inner.match(/<h[12]\b[^>]*>[\s\S]*?<\/h[12]>/i);
    const title = titleMatch ? stripHtml(titleMatch[0]) : '';
    let bodyHtml = inner
      .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<(p|div|span)\b[^>]*class="[^"]*\b(thm__label|source|caption|refs?|reference|footer)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, ' ');
    if (titleMatch) bodyHtml = bodyHtml.replace(titleMatch[0], ' ');
    out.push({
      index: out.length + 1,
      open,
      html: m[0],
      inner,
      title,
      titleTag: titleMatch ? titleMatch[0] : '',
      text: stripHtml(inner),
      bodyText: stripHtml(bodyHtml),
      section: attr(open, 'data-section'),
    });
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('usage: node scripts/lint-text.js index.html [--config deck.config.json]');
    process.exit(2);
  }
  const file = path.resolve(args.file);
  if (!fs.existsSync(file)) {
    console.error(`not found: ${file}`);
    process.exit(2);
  }
  const html = fs.readFileSync(file, 'utf8');
  const { cfg, found } = loadConfig(args.config || path.join(path.dirname(file), 'deck.config.json'));
  if (!found) add(0, 'CONFIG_MISSING', 'deck.config.json not found; intake must run first');

  // --- config validity -----------------------------------------------------
  const ay = ['APA7', 'Chicago'];
  const num = ['IEEE', 'ACM', 'Vancouver'];
  if (cfg.citationStyle === 'author-year' && !ay.includes(cfg.citationStandard)) {
    add(0, 'CONFIG_CITATION', `author-year requires APA7 or Chicago, got ${cfg.citationStandard}`);
  }
  if (cfg.citationStyle === 'numeric' && !num.includes(cfg.citationStandard)) {
    add(0, 'CONFIG_CITATION', `numeric requires IEEE, ACM, or Vancouver, got ${cfg.citationStandard}`);
  }
  const ceiling = DENSITY[cfg.density] || 40;
  if (cfg.density === 'dense' && !(cfg.handout || cfg.purpose === 'defense')) {
    add(0, 'DENSE_ILLEGAL', 'density=dense requires handout=true or purpose=defense');
  }
  if (cfg.maxBodyWords !== ceiling) {
    add(0, 'CONFIG_DENSITY', `maxBodyWords ${cfg.maxBodyWords} != ${cfg.density} ceiling ${ceiling}`);
  }

  const slides = extractSlides(html);
  if (!slides.length) add(0, 'NO_SLIDES', 'no <section class="slide"> elements found');
  const allText = stripHtml(html);
  const refsSlide = slides.find((s) => /^references$/i.test(s.title));
  const refsText = refsSlide ? refsSlide.text : '';

  // --- per-slide checks ----------------------------------------------------
  for (const s of slides) {
    const t = s.text;

    const em = (t.match(/—/g) || []).length;
    if (em) add(s.index, 'EM_DASH', `${em} em dash(es); use a colon, semicolon, or parentheses`);

    if (/[^\s] {2,}[^\s]/.test(t)) add(s.index, 'DOUBLE_SPACE', 'double space');

    for (const w of BANNED) {
      const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (re.test(t)) add(s.index, 'BANNED_WORD', `"${w}"`);
    }

    if (/\bet al(?![.\u2019])/i.test(t)) add(s.index, 'ETAL_PERIOD', '"et al" without a period');

    const us = US_FORMS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
    const uk = UK_FORMS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
    if (us.length && uk.length) {
      add(s.index, 'SPELLING_MIX', `mixed variants: ${us[0]} / ${uk[0]}`);
    } else if (cfg.spelling === 'UK' && us.length) {
      add(s.index, 'SPELLING_VARIANT', `US form "${us[0]}" in a UK deck`);
    } else if (cfg.spelling === 'US' && uk.length) {
      add(s.index, 'SPELLING_VARIANT', `UK form "${uk[0]}" in a US deck`);
    }

    if (s.title) {
      if (/[.]$/.test(s.title)) add(s.index, 'TITLE_PERIOD', `title ends with a period: "${s.title}"`);
      if (BARE_LABELS.test(s.title)) add(s.index, 'TITLE_LABEL', `bare label title "${s.title}"`);
      const tw = words(s.title).length;
      if (tw > 14) add(s.index, 'TITLE_LONG', `${tw} words; limit 14`);
    }

    const bw = words(s.bodyText).length;
    const structural = /^references$/i.test(s.title) || /^appendix\b/i.test(s.title);
    if (!structural && bw > ceiling) add(s.index, 'BODY_WORDS', `${bw} body words > ${ceiling} (${cfg.density})`);
  }

  // --- citations -----------------------------------------------------------
  // Citation scanning excludes the reference list itself, which contains bare years.
  const citeText = refsSlide && refsSlide.text ? allText.split(refsSlide.text).join(' ') : allText;
  const numCites = [...citeText.matchAll(/\[(\d+)(?:\s*[–-]\s*(\d+))?\]/g)];
  const ayCites = [...citeText.matchAll(/\(([^()]*?(?:19|20)\d{2}[a-z]?)\)/g)];

  if (cfg.citationStyle === 'numeric') {
    if (ayCites.length) add(0, 'CITATION_MIX', `${ayCites.length} author-year citation(s) in a numeric deck`);
    if (numCites.length) {
      if (!refsSlide) add(0, 'REFS_MISSING', 'numeric citations but no References slide');
      const refEntries = refsSlide ? (refsSlide.inner.match(/<li\b/gi) || []).length : 0;
      const nums = [];
      for (const m of numCites) {
        const a = Number(m[1]);
        const b = m[2] ? Number(m[2]) : a;
        for (let n = a; n <= b; n += 1) nums.push(n);
      }
      const max = Math.max(...nums);
      if (refEntries && max > refEntries) {
        add(0, 'CITATION_UNRESOLVED', `[${max}] exceeds ${refEntries} reference entries`);
      }
      const seen = new Set();
      for (const n of nums) {
        if (!seen.has(n)) {
          if (n !== seen.size + 1) {
            add(0, 'CITATION_ORDER', `first appearance of [${n}] is out of order (expected [${seen.size + 1}])`);
          }
          seen.add(n);
        }
      }
    }
  } else {
    if (numCites.length) add(0, 'CITATION_MIX', `${numCites.length} numeric citation(s) in an author-year deck`);
    if (ayCites.length && !refsSlide) add(0, 'REFS_MISSING', 'citations but no References slide');
    const missing = new Set();
    for (const m of ayCites) {
      for (const part of m[1].split(';')) {
        const surname = part.trim().split(/[,\s]/)[0];
        if (!surname || /^(e\.g|i\.e|cf|see|Fig|Table)$/i.test(surname)) continue;
        if (refsText && !new RegExp(surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(refsText)) {
          missing.add(surname);
        }
      }
    }
    if (missing.size) add(0, 'CITATION_UNRESOLVED', `not in References: ${[...missing].join(', ')}`);
  }

  if (refsSlide) {
    const rw = words(refsSlide.bodyText).length;
    if (rw && rw < 12) add(refsSlide.index, 'REFS_THIN', 'references slide looks empty');
  }

  // --- theorem state -------------------------------------------------------
  const thmCount = (html.match(/<div\b[^>]*class="[^"]*\bthm\b[^"]*"/gi) || []).length;
  if (!cfg.theorem.enabled && thmCount) {
    add(0, 'THM_DISABLED', `${thmCount} .thm block(s) but theorem.enabled=false`);
  }
  if (!cfg.theorem.proofs && /class="[^"]*\bproof\b/.test(html)) {
    add(0, 'THM_PROOFS', '.proof present but theorem.proofs=false');
  }
  const emptyLabels = (html.match(/<p\b[^>]*class="[^"]*thm__label[^"]*"[^>]*>\s*<\/p>/gi) || []).length;
  if (emptyLabels) add(0, 'THM_EMPTY', `${emptyLabels} unnumbered theorem label(s); run number-theorems.js`);

  const nums = [...html.matchAll(/class="thm__num">([^<]+)</g)].map((m) => m[1].trim());
  if (cfg.theorem.numbering === 'section') {
    for (const n of nums) {
      if (!/^\d+\.\d+$/.test(n)) add(0, 'THM_SEQ', `section numbering expected, got "${n}"`);
    }
  } else {
    nums.forEach((n, i) => {
      if (n !== String(i + 1)) add(0, 'THM_SEQ', `expected theorem ${i + 1}, got ${n}`);
    });
  }
  if (/Theorem\s*\?/.test(allText)) add(0, 'THM_LITERAL', 'literal "Theorem ?" in the output');

  // --- structure -----------------------------------------------------------
  const content = slides.filter((s) => {
    if (!s.title) return false;
    if (/^references$/i.test(s.title)) return false;
    if (/^appendix\b/i.test(s.title)) return false;
    if (!/<footer\b/i.test(s.inner)) return false;
    return true;
  });
  if (content.length) {
    const last = content[content.length - 1];
    if (/thank\s*you|thanks!|any questions\?/i.test(last.text)) {
      add(last.index, 'THANK_YOU', 'deck ends on a thank-you slide; end on Conclusions');
    }
    if (!/conclusion/i.test(last.title)) {
      add(last.index, 'ENDING', `last content slide is "${last.title}", not Conclusions`);
    }
  }
  if (/^(outline|agenda)$/i.test(slides[1] ? slides[1].title : '')) {
    add(2, 'OUTLINE_SLIDE', 'outline/agenda slide; cut it');
  }

  const band = BUDGET.find(([min]) => cfg.talkMinutes <= min) || BUDGET[BUDGET.length - 1];
  if (content.length && (content.length < band[1] || content.length > band[2])) {
    add(0, 'BUDGET', `${content.length} content slides outside ${band[1]}–${band[2]} for ${cfg.talkMinutes} min`);
  }

  // --- report --------------------------------------------------------------
  if (!issues.length) {
    console.log(`lint clean: ${slides.length} slides, ${content.length} content, ${thmCount} theorem block(s), ${cfg.citationStyle}/${cfg.citationStandard}, ${cfg.spelling}`);
    return;
  }
  for (const i of issues) {
    const where = i.slide ? `slide ${i.slide}` : 'deck';
    console.error(`${where}  [${i.rule}]  ${i.msg}`);
  }
  const errors = issues.length;
  console.error(`\n${errors} issue(s).`);
  process.exit(1);
}

main();
