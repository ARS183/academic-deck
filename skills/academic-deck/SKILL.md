---
name: academic-deck
description: Build conference, seminar, and thesis-defense slide decks as a single self-contained 16:9 HTML file plus a matching PDF. Use when the user asks for an academic presentation or conference talk, to turn a paper into slides, a thesis defense deck, a seminar or group-meeting talk, or a grant briefing. Output is HTML and PDF, not PowerPoint; use a .pptx skill when the user asks for a .pptx file. Matches a house style (TU Delft by default, GeoHEAT on request, e.g. "use geoheat style") or a template or example deck the user supplies. Enforces action titles, one exhibit per results slide, on-slide citations, academic English, theorem environments, and a mandatory visual QA pass.
---

# Academic Deck

Produce one self-contained 16:9 HTML deck, its assets, and a PDF built from that HTML.
Content standards are non-negotiable; visual style is a skin over them.

## Authority order

When two rules conflict, resolve in this order and state the conflict in one line at the end of
the run:

1. `content/argument.md` and `content/slide-patterns.md` — what is said, and in what order
2. `content/english-style.md` — how it is worded
3. `themes/<theme>/THEME.md` for the theme in `deck.config.json` — how it looks
4. The process rules below — how it is built, rendered, and checked

Never let a layout constraint delete an argument step. Re-flow the layout instead.

## Prerequisites (once per deck workspace)

```bash
npm i mathjax@3 playwright-core --no-audit --no-fund
npx playwright install chromium        # or export CHROMIUM_PATH=/path/to/chrome
```

Scripts live in this skill's `scripts/` folder; run them with that full path, from the deck
directory. They resolve `mathjax` and `playwright-core` from `<deck>/node_modules`, so a local
install is enough. Verify before Step 6:

```bash
node -e "require('playwright-core')"   # must not throw
```

Missing dependencies are a hard failure. `--allow-unverified` exists for drafting only, and the
build then prints `NOT VERIFIED`.

## Step 0 — Intake (blocking)

Ask the nine questions in `reference/intake.md`, in one message, before writing any slide.
Do not proceed until every question is answered or the author explicitly delegates the choice.
If you propose answers (for example from an existing `deck.config.json`), they need an explicit
"ok" or corrections. A reply to a different question, such as where to write the output, is not
acceptance; ask again.

Write the answers to `deck.config.json` at the deck root, then confirm them back in one short
paragraph: purpose, duration, audience, citation style, spelling, theorem kinds, numbering,
density, theme. If any default was applied because the author delegated, say which default and why.

`deck.config.json` is the contract. `scripts/lint-text.js` fails the build when the deck
contradicts it.

### Theme

The theme is not one of the nine questions; take it from the request and confirm it in the
paragraph. Write it as `"theme"` in `deck.config.json`, with the footer fields the theme shows:

```json
"theme": "tudelft",
"footer": { "author": "J. Chen (TU Delft)", "short": "Layman's Talk", "date": "July 02, 2025" }
```

| Theme | Use when | Look |
|---|---|---|
| `tudelft` | default; "TU Delft style" | beamer: blue sidebar and footline bar, CM Sans |
| `geoheat` | "geoheat style", a GeoHEAT project talk | beamer: GeoHEAT and EU logo top right, grey footline |
| `metropolis` | "metropolis style" | paper, teal ink, one orange accent, Fira Sans |

Match the author's words against each `themes/*/theme.json` `aliases`. If the author supplies a
template or example deck that no theme matches, build a theme from it with `reference/new-theme.md`
before Step 3, and say so in the confirmation. Switching theme later is a config change and a
rebuild; the HTML does not change.

## Step 1 — Extract, do not summarize

- Read the source paper in full. Pull the research question, the central claim, the evidence for
  it, and the limitation, using the paper's own numbers.
- Build the argument spine before any HTML: one sentence per slide, in order, no visuals.
- Run the ghost deck test on the spine: read the sentences in sequence. They must form a coherent
  paragraph that states a problem, delivers evidence, and lands a conclusion.
- Map the spine onto the deck architecture in `content/slide-patterns.md`. Slide count comes from
  the duration band in `reference/intake.md`, not from a fixed template.

If the paper is missing a number you need, write `[TODO: source]` and tell the author. Never
estimate a value that will appear on a slide.

## Step 2 — Titles

- Every content slide title is a complete sentence stating the takeaway.
- No terminal period. No topic labels: "Methods", "Results", "Discussion" are failures.
- One clause if possible; two only when the second clause carries the consequence.
- Title length: at most 14 words, at most two lines in the theme's title box (size in the active
  `THEME.md`). If it wraps to three lines, cut the claim, not the font size.
- Section dividers are permitted only when the deck exceeds 15 content slides. They carry no argument and
  are excluded from the ghost deck test.

Example of the transformation:

| Weak (label) | Strong (claim) |
|---|---|
| Results | Quantization preserves accuracy above 8 bits |
| Methods | We fine-tune on 12 domains with held-out evaluation |
| Discussion | Domain shift, not model size, drives the failure |

## Step 3 — Build

- Create the skeleton with `node scripts/prepare-template.js index.html --theme <theme>`. It copies
  the vendored engine (stage, navigation, print CSS), replaces the demo with a title slide and one
  content slide, and applies the theme. Never edit `themes/metropolis/reference/deck-template.html`
  in place: `vendor.sh` overwrites it.
- Keep the skeleton's markup: the title in `<div class="head">` above the columns, title-slide
  fields `tp-project` (optional), `tp-authors`, `tp-affil`, `tp-date`, and an empty
  `<div class="foot">`. `scripts/footers.js` writes every footer from the config; do not type them.
- Run `node scripts/inject-assets.js index.html` before lint. It inlines `fonts.css` and every
  `{{EQ:name}}` equation. `scripts/build.js` does this automatically.
- Never rewrite the CSS architecture; extend it only through the documented tokens.
- One slide is one `<section class="slide">` at 1280×720 with the template's scaling.
- Fill `/*FONTS*/` and every `{{EQ...}}` placeholder. No `{{` may survive into the output.
- Body text follows the density mode: 25 words (`sparse`), 40 (`standard`), 60 (`dense`).
- The theme decides the footer fields and their order; `scripts/footers.js` fills them.

## Step 4 — Exhibits, equations, diagrams

- Results slides carry exactly one exhibit, and the key finding is annotated on the figure itself,
  not only in the bullet.
- Every exhibit has a source note. Borrowed figures carry an on-slide attribution:
  `Adapted from Smith et al. (2023)`.
- Charts use full anatomy: axes, ticks, axis titles, value labels, source, and an explicit notice
  when the scale is truncated. See `themes/metropolis/THEME.md` for the chart grammar.
- Equations are real LaTeX compiled at build time through `scripts/tex2svg.js`, injected inline as
  SVG inheriting `currentColor`. No bitmap equations, no unicode approximations.
- Never cite the paper's equation numbers; the audience cannot see them. Number equations the deck
  refers back to with `data-label` and `a.eq-ref` (see `reference/theorem.md`, Equation numbering).
- Diagrams are native SVG: labels at least 14px in the viewBox, orthogonal routing, contrast
  checked against the fill, nothing touching the slide edge or the footer.

## Step 5 — Theorems

When `theorem.enabled` is true:

- Use the markup in `reference/theorem.md`. Write `data-kind` and `data-name`; never type the
  numeral or the cross-reference text by hand.
- `scripts/inject-theme-css.js index.html` must run before numbering. `scripts/build.js` does this
  automatically; run it by hand only if you assemble the HTML yourself. The injection is
  idempotent and survives a theme refresh.
- Run `node scripts/number-theorems.js index.html` after content assembly and after
  `scripts/inject-assets.js`, as `scripts/build.js` does. It assigns theorem and equation numbers, ids, and
  resolves `a.thm-ref` and `a.eq-ref`.
- Theorem types are not colour-coded. Every kind uses the theme's one theorem box; type is
  signalled by the label word alone.
- A theorem block must not cross a slide boundary. If it does not fit, split the surrounding
  prose, not the statement.
- Proofs use a run-in italic `Proof.` and a right-aligned `∎` (U+220E).

## Step 6 — QA (mandatory, no sampling)

1. `node scripts/build.js .` runs the full pipeline. The individual steps, if you need them:

```bash
# scripts/ and themes/ are in this skill's folder; run from the deck directory
node scripts/mkfonts.js <fonts manifest named in themes/<theme>/theme.json> fonts.css
node scripts/tex2svg.js eqs.json assets/eq          # if the deck has equations
node scripts/inject-theme-css.js index.html         # theme from deck.config.json
node scripts/inject-assets.js index.html
node scripts/footers.js index.html
node scripts/number-theorems.js index.html
node scripts/lint-text.js index.html
node scripts/qa.js index.html qa/ $(seq 1 N)
node scripts/layout-check.js index.html             # text vs footer, logo, slide edge
node scripts/pdf.js index.html deck.pdf 1-N
```

## Step 7 — Deliver

Deliver `index.html`, `assets/`, `deck.pdf`, and a one-paragraph note listing: the applied intake
answers, the citation style, the spelling variant, any slide where the content forced a layout
compromise, and each rule conflict resolved under the authority order, one line each.

An unresolved `[TODO: source]` blocks delivery (`content/english-style.md` §7.3). Until the author
supplies it, the deck is a draft: build it with `--allow-unverified` and list every TODO in the note.

## Hard rules

- Deck content is English unless the author explicitly asks for another language, even when the
  conversation is in another language.
- No em dash anywhere. En dash only for ranges. See `content/english-style.md`.
- One citation style per deck. Never mix author-year and numeric, including in captions.
- Never invent a citation, a number, or a result.
- The last content slide is Conclusions. No "Thank You" slide, no blank slide.
- A References slide is required whenever any work is cited.
- Add no decoration the active theme's `THEME.md` does not define: no extra icons, shadows,
  gradients, colours, or typefaces.

## File map

| Read | When |
|---|---|
| `reference/intake.md` | Step 0, every time |
| `content/argument.md` | Step 1, before writing the spine |
| `content/slide-patterns.md` | Step 1, when choosing slide patterns |
| `content/english-style.md` | Step 2 and every editing pass |
| `themes/<theme>/THEME.md` | Step 3, before writing markup |
| `reference/new-theme.md` | Step 0, when the author supplies a template no theme matches |
| `reference/theorem.md` | Step 4 if a slide refers back to an equation; Step 5 if theorems are enabled |
| `reference/deck-checklist.md` | Step 6, before delivery |
