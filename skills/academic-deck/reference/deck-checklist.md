# Deck Checklist

Every item is binary. Do not deliver until all pass.

## Content

- [ ] **A1 Ghost deck.** Extract the content-slide titles in order. They read as one coherent paragraph; every title is a claim, not a label.
- [ ] **A2 Density.** `node scripts/lint-text.js index.html` reports zero `BODY_WORDS`.
- [ ] **A3 Exhibits.** Every results slide has exactly one exhibit, with the key finding annotated on the figure.
- [ ] **A4 Attribution.** Every borrowed figure has an on-slide source line; every citation resolves to a References entry.
- [ ] **A8 Ending.** The last content slide is Conclusions; no thank-you or blank slide.
- [ ] **A14 Budget.** Content-slide count is inside the band for the declared `talkMinutes`.

## Language

- [ ] **A5 Style.** Zero em dashes; en dashes only in ranges; one spelling variant; zero banned words; `et al` with a period.
- [ ] **A11 Citation purity.** One mode only. Author-year resolves to References; numeric is ascending and complete.
- [ ] **A13 Config fidelity.** `deck.config.json` matches the intake answers, and lint passes against it.
- [ ] **A15 Density legality.** `dense` only with `handout` or `defense`; body ceiling matches the mode.

## Theorems

- [ ] **A12 Theorem integrity.** Numbers consecutive; every `thm-ref` resolves; no empty labels; `∎` right-aligned and above the footer; no block crosses a slide boundary; no overflow.

## Visual

- [ ] **A6 Visual QA.** All N slides screenshotted and inspected: no overflow, clipping, contrast failure, footer collision, or orphaned heading.
- [ ] **A7 PDF.** Page count equals slide count (`scripts/build.js` checks it); 16:9; fonts embedded.
- [ ] **A9 Equations.** Every equation renders; no missing glyphs; SVG inherits colour; baseline aligns with body text; no equation number from the paper, only the deck's own `(n)`.
- [ ] **A10 Portability.** `index.html` opens offline from a clean directory, no network, fonts inlined (lint reports `OFFLINE`).

## Commands

```bash
node scripts/build.js .
```

It runs fonts, equations, theme CSS, asset injection, footers, numbering, lint, visual QA, the
layout check, and PDF in order;
the individual commands are in `SKILL.md` Step 6.

## Manual pass

- [ ] Read the deck aloud once; fix any sentence you cannot say in one breath.
- [ ] Every bullet earns its line; delete the ones that only restate the title.
- [ ] Every number on a slide traces to the paper or the data.
- [ ] No `[TODO: source]` remains.
- [ ] Projector test: stand 1.5 m from the screen; every label is legible.
