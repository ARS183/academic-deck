---
name: academic-deck
description: Build conference, seminar, and thesis-defense slide decks as a single self-contained 16:9 HTML file plus a matching PDF. Use when the user asks for an academic presentation, to turn a paper into slides, a thesis defense deck, a seminar talk, or a grant briefing. Enforces action titles, one exhibit per results slide, on-slide citations, academic English, theorem environments, and a mandatory visual QA pass.
---

# Academic Deck

Produce one self-contained 16:9 HTML deck, its assets, and a PDF built from that HTML.
Content standards are non-negotiable; visual style is a skin over them.

## Authority order

When two rules conflict, resolve in this order and state the conflict in one line at the end of
the run:

1. `content/argument.md` and `content/slide-patterns.md` — what is said, and in what order
2. `content/english-style.md` — how it is worded
3. `themes/metropolis/THEME.md` — how it looks
4. The process rules below — how it is built, rendered, and checked

Never let a layout constraint delete an argument step. Re-flow the layout instead.

## Prerequisites (once per deck workspace)

```bash
npm i mathjax@3 playwright-core --no-audit --no-fund
npx playwright install chromium        # or export CHROMIUM_PATH=/path/to/chrome
```

Scripts run from the deck directory. `build.js` exports `NODE_PATH` to `<deck>/node_modules` for
child processes, so a local install is enough. Verify before Step 6:

```bash
node -e "require('playwright-core')"   # must not throw
```

Missing dependencies are a hard failure. `--allow-unverified` exists for drafting only, and the
build then prints `NOT VERIFIED`.

## Step 0 — Intake (blocking)

Ask the nine questions in `reference/intake.md`, in one message, before writing any slide.
Do not proceed until every question is answered or the author explicitly delegates the choice.

Write the answers to `deck.config.json` at the deck root, then confirm them back in one short
paragraph: purpose, duration, audience, citation style, spelling, theorem kinds, numbering,
density. If any default was applied because the author delegated, say which default and why.

`deck.config.json` is the contract. `scripts/lint-text.js` fails the build when the deck
contradicts it.

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
- Title length: at most 14 words, fits the theme's title box on one line at 46px. If it wraps to
  three lines, cut the claim, not the font size.
- Section dividers are permitted only when the deck exceeds 15 slides. They carry no argument and
  are excluded from the ghost deck test.

Example of the transformation:

| Weak (label) | Strong (claim) |
|---|---|
| Results | Quantization preserves accuracy above 8 bits |
| Methods | We fine-tune on 12 domains with held-out evaluation |
| Discussion | Domain shift, not model size, drives the failure |

## Step 3 — Build

- Create the skeleton with `node scripts/prepare-template.js index.html`. It copies the vendored
  template and removes the French demo, the kicker markup, and the closing slide, and normalises
  margins to 64px. Never edit `deck-template.html` in place: `vendor.sh` overwrites it.
- Run `node scripts/inject-assets.js index.html` before lint. It inlines `fonts.css` and every
  `{{EQ:name}}` equation. `build.js` does this automatically.
- Never rewrite the CSS architecture; extend it only through the documented tokens.
- One slide is one `<section class="slide">` at 1280×720 with the template's scaling.
- Fill `/*FONTS*/` and every `{{EQ...}}` placeholder. No `{{` may survive into the output.
- Body text follows the density mode: 25 words (`sparse`), 40 (`standard`), 60 (`dense`).
- Footer carries the short title on the left and the slide number on the right.

## Step 4 — Exhibits, equations, diagrams

- Results slides carry exactly one exhibit, and the key finding is annotated on the figure itself,
  not only in the bullet.
- Every exhibit has a source note. Borrowed figures carry an on-slide attribution:
  `Adapted from Smith et al. (2023)`.
- Charts use full anatomy: axes, ticks, axis titles, value labels, source, and an explicit notice
  when the scale is truncated. See `themes/metropolis/THEME.md` for the chart grammar.
- Equations are real LaTeX compiled at build time through `scripts/tex2svg.js`, injected inline as
  SVG inheriting `currentColor`. No bitmap equations, no unicode approximations.
- Diagrams are native SVG: labels at least 14px in the viewBox, orthogonal routing, contrast
  checked against the fill, nothing touching the slide edge or the footer.

## Step 5 — Theorems

When `theorem.enabled` is true:

- Use the markup in `reference/theorem.md`. Write `data-kind` and `data-name`; never type the
  numeral or the cross-reference text by hand.
- `scripts/inject-theme-css.js index.html` must run before numbering. `build.js` does this
  automatically; run it by hand only if you assemble the HTML yourself. The injection is
  idempotent and survives a theme refresh.
- Run `node scripts/number-theorems.js index.html` after content assembly and before equation
  injection. It assigns numbers, ids, and resolves `a.thm-ref`.
- Theorem types are not colour-coded. The palette is paper, ink, orange; type is signalled by the
  label word alone.
- A theorem block must not cross a slide boundary. If it does not fit, split the surrounding
  prose, not the statement.
- Proofs use a run-in italic `Proof.` and a right-aligned `∎` (U+220E).

## Step 6 — QA (mandatory, no sampling)

1. `node scripts/build.js .` runs the full pipeline. The individual steps, if you need them:

```bash
node scripts/inject-theme-css.js index.html
node scripts/inject-assets.js index.html
node scripts/number-theorems.js index.html
node scripts/lint-text.js index.html
node scripts/qa.js index.html qa/ $(seq 1 N)
node scripts/pdf.js index.html deck.pdf 1-N
```

## Step 7 — Deliver

Deliver `index.html`, `assets/`, `deck.pdf`, and a one-paragraph note listing: the applied intake
answers, the citation style, the spelling variant, every `[TODO: source]` that remains, and any
slide where the content forced a layout compromise.

## Hard rules

- Deck content is English unless the author explicitly asks for another language, even when the
  conversation is in another language.
- No em dash anywhere. En dash only for ranges. See `content/english-style.md`.
- One citation style per deck. Never mix author-year and numeric, including in captions.
- Never invent a citation, a number, or a result.
- The last content slide is Conclusions. No "Thank You" slide, no blank slide.
- A References slide is required whenever any work is cited.
- Do not add decorative icons, shadows, or gradients. Flat, three colours, one typeface family.

## File map

| Read | When |
|---|---|
| `reference/intake.md` | Step 0, every time |
| `content/argument.md` | Step 1, before writing the spine |
| `content/slide-patterns.md` | Step 1, when choosing slide patterns |
| `content/english-style.md` | Step 2 and every editing pass |
| `themes/metropolis/THEME.md` | Step 3, before writing markup |
| `reference/theorem.md` | Step 5, if theorems are enabled |
| `reference/deck-checklist.md` | Step 6, before delivery |
