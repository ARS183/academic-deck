#!/usr/bin/env node
'use strict';

/**
 * lint-text.js — enforce the academic deck contract.
 *
 * Usage:
 *   node scripts/lint-text.js index.html [--config deck.config.json] [--allow-todo]
 *
 * --allow-todo (drafts only, passed by build.js --allow-unverified): [TODO: ...] is reported
 * as a warning instead of an error, so a draft with honest markers can still be rendered.
 *
 * v1.0.2: understands the metropolis template (.foot/.snum), decodes HTML entities,
 * rejects unresolved placeholders, supports split reference slides and citation
 * ranges, and exempts title and divider slides from content rules.
 */

const fs = require('fs');
const path = require('path');

const BANNED = [
  'revolutionary', 'game-changing', 'cutting-edge', 'seamless', 'leverage', 'utilize',
  'delve', 'unlock', 'empower', 'holistic', 'paradigm shift', 'dramatically',
  'very', 'extremely', 'incredibly', 'highly', 'obviously', 'clearly', 'of course',
];

const US_FORMS = ['analyze', 'analyzed', 'analyzing', 'organize', 'organized', 'organizing',
  'behavior', 'behaviors', 'color', 'colors', 'modeling', 'modeled', 'labeling', 'labeled',
  'center', 'centers', 'defense', 'gray', 'toward'];
const UK_FORMS = ['analyse', 'analysed', 'analysing', 'organise', 'organised', 'organising',
  'behaviour', 'behaviours', 'colour', 'colours', 'modelling', 'modelled', 'labelling', 'labelled',
  'centre', 'centres', 'defence', 'grey', 'towards'];

// Structural slides may carry a plain title. Content slides may not.
const BARE_LABELS = /^(methods?|results?|discussion|data|limitations?|introduction|background|motivation|related work|experiments?|evaluation|outline|agenda)$/i;

const BUDGET = [
  [5, 3, 5], [7, 4, 7], [10, 8, 10], [15, 12, 15], [20, 15, 18], [30, 22, 26], [45, 30, 34], [60, 36, 42],
];

const DENSITY = { sparse: 25, standard: 40, dense: 60 };

const ENTITIES = {
  '&mdash;': '\u2014', '&ndash;': '\u2013', '&nbsp;': ' ', '&amp;': '&',
  '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&rsquo;': '\u2019', '&lsquo;': '\u2018', '&ldquo;': '\u201c', '&rdquo;': '\u201d',
  '&hellip;': '\u2026', '&middot;': '\u00b7', '&times;': '\u00d7',
};

const issues = [];
const add = (slide, rule, msg) => issues.push({ slide, rule, msg });

function parseArgs(argv) {
  const out = { file: null, config: null, allowTodo: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--config') out.config = argv[++i];
    else if (a === '--allow-todo') out.allowTodo = true;
    else if (!a.startsWith('--') && !out.file) out.file = a;
  }
  return out;
}

function loadConfig(p) {
  const d = {
    purpose: 'conference', talkMinutes: 15, citationStyle: 'author-year', citationStandard: 'APA7',
    spelling: 'US', density: 'standard', handout: false,
    theorem: { enabled: true, numbering: 'continuous', proofs: true },
    appendix: true,
  };
  if (!p || !fs.existsSync(p)) return { cfg: d, raw: d, found: false };
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { cfg: { ...d, ...raw, theorem: { ...d.theorem, ...(raw.theorem || {}) } }, raw, found: true };
}

function decodeEntities(s) {
  let out = s;
  for (const [k, v] of Object.entries(ENTITIES)) out = out.split(k).join(v);
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

function textOf(html, { collapse = true } = {}) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    // Block boundaries separate words ("title</h2><li>Eq" must not read "titleEq"). A newline,
    // not a space, so DOUBLE_SPACE does not fire on markup indentation. Inline tags join.
    .replace(/<\/?(?:p|li|ul|ol|div|h[1-6]|br|section|footer|table|tr|td|th|figure|figcaption|blockquote|text|tspan)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return collapse ? s.replace(/\s+/g, ' ').trim() : s;
}

const words = (text) => text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

function hasClass(tag, cls) {
  const c = attr(tag, 'class') || '';
  return c.split(/\s+/).includes(cls);
}

function removeChrome(inner, titleTag) {
  let s = inner;
  s = s.replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ');
  // Chart and equation SVG is exhibit, not body text (content/argument.md §7).
  s = s.replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ');
  s = s.replace(/<div\b[^>]*class="[^"]*\bfoot\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ');
  s = s.replace(
    /<(p|div|span|ul|ol|li)\b[^>]*class="[^"]*\b(source|caption|references?|refs?|thm__label|kicker|snum)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi,
    ' ',
  );
  if (titleTag) s = s.replace(titleTag, ' ');
  return s;
}

function extractSlides(html) {
  const re = /<section\b[^>]*>[\s\S]*?<\/section>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const open = m[0].match(/^<section\b[^>]*>/i)[0];
    const inner = m[0].slice(open.length, m[0].length - '</section>'.length);
    const titleMatch = inner.match(/<h[12]\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>[\s\S]*?<\/h[12]>/i)
      || inner.match(/<h[12]\b[^>]*>[\s\S]*?<\/h[12]>/i);
    const title = titleMatch ? textOf(titleMatch[0]) : '';
    const hasFoot = /<footer\b/i.test(inner) || /\bclass="[^"]*\bfoot\b[^"]*"/i.test(inner);
    const index = out.length + 1;
    out.push({
      index,
      open,
      inner,
      title,
      titleTag: titleMatch ? titleMatch[0] : '',
      text: textOf(inner),
      // An inline equation is a word in the sentence; without this, "of <eq> at" reads "of  at".
      rawText: textOf(inner.replace(/<span class="eq"[^>]*>\s*<svg\b[\s\S]*?<\/svg>\s*<\/span>/gi, 'EQ'), { collapse: false }),
      bodyText: textOf(removeChrome(inner, titleMatch ? titleMatch[0] : '')),
      hasFoot,
      role: (attr(open, 'data-role') || '').toLowerCase(),
      section: attr(open, 'data-section'),
      isTitle: hasClass(open, 'title-slide') || (attr(open, 'data-role') || '').toLowerCase() === 'title',
      isDivider: hasClass(open, 'divider') || (attr(open, 'data-role') || '').toLowerCase() === 'divider',
    });
  }
  return out;
}

function isAYPart(part) {
  return /^[A-Z][A-Za-z'\u2019.\-]+(?:\s+(?:et\s+al\.?|&\s*[A-Z][A-Za-z'\u2019.\-]+))?\s*,\s*(?:19|20)\d{2}[a-z]?$/.test(part);
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
  const scanHtml = html.replace(/<!--[\s\S]*?-->/g, '');

  // \tag{5} copied from the paper renders "(5)" as glyphs that text checks cannot see.
  const eqsPath = path.join(path.dirname(file), 'eqs.json');
  if (fs.existsSync(eqsPath)) {
    let eqs = {};
    try { eqs = JSON.parse(fs.readFileSync(eqsPath, 'utf8')); } catch (e) { add(0, 'EQS_JSON', `cannot parse eqs.json: ${e.message}`); }
    for (const [name, tex] of Object.entries(eqs)) {
      if (/\\(?:tag|eqref|ref)\b/.test(String(tex))) add(0, 'SOURCE_EQ_TAG', `${name}: \\tag or \\ref carries the paper's numbering; remove it and use data-label`);
    }
  }

  // A10 portability: the deck must open offline.
  const remote = scanHtml.match(/<(?:script|img|iframe|source|video|audio)\b[^>]*\bsrc\s*=\s*"(?:https?:)?\/\/[^"]*"|<link\b[^>]*\bhref\s*=\s*"(?:https?:)?\/\/[^"]*"|url\(\s*['"]?(?:https?:)?\/\/[^)]*\)|@import\s+(?:url\()?['"]?(?:https?:)?\/\//gi) || [];
  if (remote.length) add(0, 'OFFLINE', `${remote.length} network resource(s), e.g. ${remote[0].slice(0, 80)}; inline them`);
  const { cfg, raw, found } = loadConfig(args.config || path.join(path.dirname(file), 'deck.config.json'));
  if (!found) add(0, 'CONFIG_MISSING', 'deck.config.json not found; intake must run first');

  // --- config --------------------------------------------------------------
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
  if (Object.prototype.hasOwnProperty.call(raw, 'maxBodyWords') && raw.maxBodyWords !== ceiling) {
    add(0, 'CONFIG_DENSITY', `maxBodyWords ${raw.maxBodyWords} != ${cfg.density} ceiling ${ceiling}`);
  }

  // --- unresolved placeholders ---------------------------------------------
  const opens = (scanHtml.match(/\{\{/g) || []).length;
  if (opens) add(0, 'PLACEHOLDER', `${opens} unresolved {{...}} placeholder(s); run inject-assets.js`);
  const todos = [...scanHtml.matchAll(/\[TODO[^\]]*\]/gi)];
  if (todos.length && args.allowTodo) {
    console.error(`warning [TODO] ${todos.length} unresolved ${todos[0][0]} (allowed for a draft; blocks delivery)`);
  } else if (todos.length) {
    add(0, 'TODO', `${todos.length} unresolved ${todos[0][0]}`);
  }

  const slides = extractSlides(html);
  if (!slides.length) add(0, 'NO_SLIDES', 'no <section class="slide"> elements found');
  if (slides.length && !slides.some((s) => s.isTitle)) {
    add(1, 'TITLE_SLIDE_MISSING', 'no slide has data-role="title"; the deck opens with a title slide (content/slide-patterns.md §1)');
  }
  const allText = textOf(html);

  const refSlides = slides.filter((s) => /^references\b/i.test(s.title));
  const refsText = refSlides.map((s) => s.text).join(' ');
  const refsInner = refSlides.map((s) => s.inner).join(' ');
  let citeText = allText;
  for (const s of refSlides) if (s.text) citeText = citeText.split(s.text).join(' ');

  // --- per-slide -----------------------------------------------------------
  for (const s of slides) {
    const t = s.text;
    const structural = /^references\b/i.test(s.title) || /^appendix\b/i.test(s.title);

    // The audience does not have the paper: "Eq. (5)" must be the deck's own a.eq-ref.
    // Appendix slides are shown during Q&A, so only the reference list is exempt.
    if (!/^references\b/i.test(s.title)) {
      const own = textOf(s.inner.replace(/<a\b[^>]*class="[^"]*\beq-ref\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ' '));
      const src = own.match(/\b(?:Eqs?\.|Equations?)\s*\(?\d+/i);
      if (src) add(s.index, 'SOURCE_EQ_REF', `"${src[0]}" cites a number the audience cannot see; show the equation with data-label and refer to it with a.eq-ref`);
    }

    // Only the title slide may omit the footer (content/slide-patterns.md).
    if (!s.isTitle && !s.hasFoot) add(s.index, 'FOOTER_MISSING', 'no footer (.foot or <footer>); only the title slide may omit it');

    if (t.includes('\u2014')) add(s.index, 'EM_DASH', `${(t.match(/\u2014/g) || []).length} em dash(es); use a colon, semicolon, or parentheses`);
    if (/[A-Za-z0-9] {2,}[A-Za-z0-9]/.test(s.rawText)) add(s.index, 'DOUBLE_SPACE', 'double space');

    // Banned words apply to author-written prose, including the appendix; not to the title slide's
    // quoted paper title or to reference entries.
    if (!s.isTitle && !/^references\b/i.test(s.title)) {
      for (const w of BANNED) {
        const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (re.test(t)) add(s.index, 'BANNED_WORD', `"${w}"`);
      }
    }

    if (/\bet al(?![.\u2019])/i.test(t)) add(s.index, 'ETAL_PERIOD', '"et al" without a period');

    const us = US_FORMS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
    const uk = UK_FORMS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
    if (us.length && uk.length) add(s.index, 'SPELLING_MIX', `mixed variants: ${us[0]} / ${uk[0]}`);
    else if (cfg.spelling === 'UK' && us.length) add(s.index, 'SPELLING_VARIANT', `US form "${us[0]}" in a UK deck`);
    else if (cfg.spelling === 'US' && uk.length) add(s.index, 'SPELLING_VARIANT', `UK form "${uk[0]}" in a US deck`);

    if (!s.isTitle && s.title) {
      if (/[.]$/.test(s.title)) add(s.index, 'TITLE_PERIOD', `title ends with a period: "${s.title}"`);
      if (BARE_LABELS.test(s.title)) add(s.index, 'TITLE_LABEL', `bare label title "${s.title}"`);
      const tw = words(s.title).length;
      if (tw > 14) add(s.index, 'TITLE_LONG', `${tw} words; limit 14`);
    }

    if (!s.isTitle && !structural && !s.isDivider) {
      const bw = words(s.bodyText).length;
      if (bw > ceiling) add(s.index, 'BODY_WORDS', `${bw} body words > ${ceiling} (${cfg.density})`);
    }
  }

  // --- citations -----------------------------------------------------------
  const norm = citeText.replace(/\]\s*[\u2013-]\s*\[/g, '\u2013');
  const numCites = [...norm.matchAll(/\[(\d+)(?:\s*[\u2013-]\s*(\d+))?\]/g)];

  const ayCites = [];
  for (const m of citeText.matchAll(/\(([^()]*?(?:19|20)\d{2}[a-z]?)\)/g)) {
    for (const part of m[1].split(';').map((p) => p.trim())) {
      if (isAYPart(part)) ayCites.push(part);
    }
  }

  if (cfg.citationStyle === 'numeric') {
    if (ayCites.length) add(0, 'CITATION_MIX', `${ayCites.length} author-year citation(s) in a numeric deck`);
    if (numCites.length) {
      if (!refSlides.length) add(0, 'REFS_MISSING', 'numeric citations but no References slide');
      const refEntries = (refsInner.match(/<li\b/gi) || []).length;
      const nums = [];
      for (const m of numCites) {
        const a = Number(m[1]);
        const b = m[2] ? Number(m[2]) : a;
        for (let n = a; n <= b; n += 1) nums.push(n);
      }
      const max = Math.max(...nums);
      if (refEntries && max > refEntries) add(0, 'CITATION_UNRESOLVED', `[${max}] exceeds ${refEntries} reference entries`);
      const seen = new Set();
      for (const n of nums) {
        if (!seen.has(n)) {
          if (n !== seen.size + 1) add(0, 'CITATION_ORDER', `first appearance of [${n}] is out of order (expected [${seen.size + 1}])`);
          seen.add(n);
        }
      }
    }
  } else {
    if (numCites.length) add(0, 'CITATION_MIX', `${numCites.length} numeric citation(s) in an author-year deck`);
    if (ayCites.length && !refSlides.length) add(0, 'REFS_MISSING', 'citations but no References slide');
    const missing = new Set();
    for (const part of ayCites) {
      const surname = part.split(',')[0].trim().split(/\s+/)[0];
      if (!surname) continue;
      if (refsText && !new RegExp(surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(refsText)) {
        missing.add(surname);
      }
    }
    if (missing.size) add(0, 'CITATION_UNRESOLVED', `not in References: ${[...missing].join(', ')}`);
  }

  // --- theorem state -------------------------------------------------------
  const thmCount = (html.match(/<div\b[^>]*class="[^"]*\bthm\b[^"]*"/gi) || []).length;
  if (!cfg.theorem.enabled && thmCount) add(0, 'THM_DISABLED', `${thmCount} .thm block(s) but theorem.enabled=false`);
  if (!cfg.theorem.proofs && /class="[^"]*\bproof\b/.test(html)) add(0, 'THM_PROOFS', '.proof present but theorem.proofs=false');

  const emptyLabels = (html.match(/<p\b[^>]*class="[^"]*thm__label[^"]*"[^>]*>\s*<\/p>/gi) || []).length;
  if (emptyLabels) add(0, 'THM_EMPTY', `${emptyLabels} unnumbered theorem label(s); run number-theorems.js`);

  const nums = [...html.matchAll(/class="thm__num">([^<]+)</g)].map((m) => m[1].trim());
  if (cfg.theorem.numbering === 'section') {
    for (const n of nums) if (!/^\d+\.\d+$/.test(n)) add(0, 'THM_SEQ', `section numbering expected, got "${n}"`);
  } else {
    nums.forEach((n, i) => { if (n !== String(i + 1)) add(0, 'THM_SEQ', `expected theorem ${i + 1}, got ${n}`); });
  }
  if (/Theorem\s*\?/.test(allText)) add(0, 'THM_LITERAL', 'literal "Theorem ?" in the output');

  // --- structure -----------------------------------------------------------
  const content = slides.filter((s) => !s.isTitle && !s.isDivider
    && !/^references\b/i.test(s.title) && !/^appendix\b/i.test(s.title));

  if (content.length) {
    const last = content[content.length - 1];
    if (/thank\s*you|thanks!|any questions\?/i.test(last.text)) {
      add(last.index, 'THANK_YOU', 'deck ends on a thank-you slide; end on Conclusions');
    }
    const isConclusions = last.role === 'conclusions' || /conclusion/i.test(last.title);
    if (!isConclusions) add(last.index, 'ENDING', `last content slide is "${last.title}", not Conclusions`);
  }

  if (slides[1] && /^(outline|agenda)$/i.test(slides[1].title)) add(2, 'OUTLINE_SLIDE', 'outline/agenda slide; cut it');

  const band = BUDGET.find(([min]) => cfg.talkMinutes <= min) || BUDGET[BUDGET.length - 1];
  if (content.length && (content.length < band[1] || content.length > band[2])) {
    add(0, 'BUDGET', `${content.length} content slides outside ${band[1]}\u2013${band[2]} for ${cfg.talkMinutes} min`);
  }

  // --- report --------------------------------------------------------------
  if (!issues.length) {
    console.log(`lint clean: ${slides.length} slides, ${content.length} content, ${thmCount} theorem block(s), ${cfg.citationStyle}/${cfg.citationStandard}, ${cfg.spelling}`);
    return;
  }
  for (const i of issues) {
    console.error(`${i.slide ? `slide ${i.slide}` : 'deck'}  [${i.rule}]  ${i.msg}`);
  }
  console.error(`\n${issues.length} issue(s).`);
  process.exit(1);
}

main();
