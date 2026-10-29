# TU Delft Theme

The default theme. A LaTeX beamer look measured from `my_TU_Delft_template.pdf`: white slides, a
40px TU Delft blue sidebar, blue frame titles, circled-chevron bullets, rounded shadowed blocks, and
a blue footline bar. Computer Modern Sans throughout, so text and MathJax equations look like the
beamer original.

This theme yields to the content standard: titles are still claims, the deck still ends on
Conclusions, and there is no "Thanks!" or "Q&A" slide, although the reference deck has them.

## Tokens

Set in `theme.css`; the shared beamer look is `themes/shared/beamer.css`.

| Token | Value | Usage |
|---|---|---|
| `--bm-blue` | `#0180C7` | frame titles, bullets, sidebar, block titles, emphasis |
| `--bm-bar` | `#2793CF` | footline bar |
| `--bm-alert` | `#FF0000` | alerted text (`<span class="alert">`), at most one phrase per slide |
| `--bm-block-head` | `#CCE5F4` | block and theorem title bar |
| `--bm-block-body` | `#E6F2F9` | block and theorem body |
| body text | `#000` | all running text |

The metropolis token names (`--orange`, `--ink`, `--field`, ...) are remapped onto these, so
diagram and chart classes from the template still work: the accent becomes blue, ink becomes black.

## Typography

Sizes are beamer's 11pt sizes at 1280×720 (1 pt = 2.822 px).

| Element | Size | Notes |
|---|---|---|
| Frame title | 39.5px, blue | one or two lines; set as 40.6px (`\Large`) narrowed to CMSS12 widths |
| Section subtitle | 25.4px, blue | optional `<p class="subtitle">` under the title, e.g. the section name |
| Body, level-1 bullet | 31px | circled chevron |
| Level-2 bullet | 31px | thin chevron, nested `<ul>` inside the `<li>` |
| Block title | 31px, blue | |
| Source note, caption | 22.6px | `<span class="lbl">Figure:</span>` prints the label in blue |
| References | 25.4px | |
| Footline | 17px, white | author, short title, date, `n/N` |

Body text is never smaller than 22.6px, the theme's caption size. The density word ceilings
(25 / 40 / 60) are content rules and apply unchanged.

## Layout grammar

- Sidebar 0–40px, full height above the footline. Footline bar 24px at the bottom.
- Title left edge 64px, top 22px. Content and blocks start at 76px; bullets at 108px, their text at
  150px. Right margin 37px.
- Body content is vertically centred between the title and the footline, as beamer does.
- Title slide: centred title at the frame-title size, author 31px, institute 23.9px. The date is in
  the footline, not on the slide. `tp-project` is hidden.
- Optional running-header style from the reference: wrap words in `<span class="dim">` to print them
  grey (`#B2B2B2`) while the claim stays blue. Use it only for a short context prefix; the claim
  itself must stay blue, because grey on white fails contrast.

## Footer

Written by `scripts/footers.js` from `deck.config.json`:

```json
"footer": { "author": "J. Chen (TU Delft)", "short": "Layman's Talk", "date": "July 02, 2025" }
```

Fields: author (centred at 213px), short title (centred), date (centred at 1041px), `n/N`
(right). The title slide has the footline and is counted.

## Components

- Blocks: `<div class="block"><p class="block__title">Key insight</p><div class="block__body">…</div></div>`.
  Rounded corners, light-blue title bar, pale-blue body, drop shadow. Theorem environments use the
  same box, with the label in the title bar.
- Equations: `.formula` is plain centred display math, no card. Equation numbers sit at the right.
- Tables: booktabs rules (heavy top and bottom, light under the header), no fills.
- Diagrams: black strokes, white or block-colour fills, black 14px+ labels.

## Do not

- Add a logo; the reference deck has none.
- Colour-code theorem types; type is signalled by the label word.
- Use `--bm-alert` red for more than one phrase per slide.
- Put a "Thanks!" or "Q&A" slide at the end.
