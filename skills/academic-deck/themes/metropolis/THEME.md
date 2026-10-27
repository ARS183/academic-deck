# Metropolis Theme

The modern engineer's beamer. Off-white paper, dark teal ink, a single orange accent, Fira Sans,
flat surfaces. Rigorous rather than expressive: the deck should look like it was typeset, not
designed.

This theme yields to the content standard. Where the original theme imposed a fixed page count,
mandatory separator pages, and a closing slide, those rules have been removed.

## Tokens

| Token | Value | Usage |
|---|---|---|
| `--paper` | `#FAFAF8` | slide background, flat, never a gradient |
| `--ink` | `#23373b` | text, box strokes, main axis |
| `--orange` | `#EB811B` | the single accent: title rule, key element, highlighted series |
| `--deep` | `#c8690f` | darker accent variant, small text only |
| `--field` | `#eff1ee` | neutral fill for remark and callout blocks |
| `--light` | `#e4e6e2` | rules and dividers |
| `--muted` | `#8b9a9e` | secondary text, de-emphasised series |
| `--neutral-1` | `#c3ccce` | comparison bars, baseline series |
| `--neutral-2` | `#5b7a80` | secondary data series |

Three colours carry meaning: paper, ink, orange. Neutrals are structural, not semantic. Do not
introduce a fourth hue. In particular, do not colour-code theorem types, methods, or categories.

`--blue` and `--green` exist in the vendored template for chart series and the K/V bridge. They are
chart-only neutrals: never use them for theorem types, categories, or emphasis on text.

## Typography

| Element | Size | Weight | Notes |
|---|---|---|---|
| Title | 46px | 600 | one or two lines, no terminal period |
| Body | 18px | 400 | 20px in `sparse`, 16px in `dense` |
| Bullet lead-in | 18px | 700 | bold term, colon, explanation |
| Footer | 12px | 400 | muted, short title left, number right |
| Source note | 12.5px | 400 | muted, directly under the exhibit |
| Theorem label | 17px | 700 | label word bold, numeral in orange |
| Theorem body | 18px | 400 | line-height 1.45 |
| Reference list | 16px | 400 | hanging indent |
| Chart labels | ≥ 12px | 400 | ≥ 14px in the viewBox for diagrams |

Fira Sans throughout. No second typeface. No letter-spacing on body text; the only tracked text is
an optional section label.

## Layout grammar

- 1280×720 canvas, scaled to the viewport by the template's transform.
- Margins: 64px left/right, 56px top, 48px above the footer.
- Title block: title on one or two lines, then a 2px orange rule spanning the content width.
  The rule is the theme's signature; it appears on every content slide and never on the title slide.
- Footer: short title left, slide number right, separated from the body by the slide's bottom margin.
- Two-column pattern: text 40%, exhibit 55%, 5% gutter. Text column never exceeds four cues.
- Nothing is centred except the title slide and a standalone equation.
- Square corners or radius ≤ 9px. No shadows, no gradients, no pills, no glass effects.

## What was removed from the upstream theme

- The fixed twenty-slide architecture.
- Mandatory separator pages (now allowed only above 15 slides).
- The closing "end" slide (the deck ends on Conclusions).
- The orange uppercase kicker above titles. It duplicated the title's job and consumed vertical
  space that results slides need. If a section label is required, use the optional breadcrumb bar.

## Charts

- Axes drawn, ticks outward, tick labels at 12px minimum.
- Axis titles with units: `Bit width`, `Accuracy (%)`.
- Gridlines only horizontal, `--light`, 1px.
- One highlighted series in `--orange`; all others in `--neutral-1` / `--neutral-2`.
- Value labels on the points that carry the claim, not on every point.
- Source note under the chart: `Source: Smith et al. (2023)` or `Source: [3]`.
- If the value axis does not start at zero, state it: `Axis truncated at 60%`.
- One series means no legend. Two or more series means a legend, placed inside the plot area.

## Equations

- Compiled to SVG at build time by `scripts/tex2svg.js`; never an image, never unicode.
- Injected inline, inheriting `currentColor`.
- Display equations sit in a `.formula` card: white background, `--light` rule, radius 4px, no shadow.
- Key symbols may be coloured through `\textcolor[RGB]{235,129,27}{...}`; use this at most once per
  slide, for the term the sentence is about.
- Do not put accented characters inside `\text{}`; put annotations in HTML below the equation.

## Diagrams

- Native SVG, `viewBox` around 540 wide for a half-width figure.
- Labels ≥ 14px in the viewBox; boxes about 50px tall; arrows with a head of at least 24px.
- Orthogonal routing only: vertical and horizontal segments with elbows. No diagonal approximations.
- Shared arrow markers defined once in the template's hidden `<svg id="defs-svg">`.
- Fill and stroke come from tokens. Never light text on a light fill.
- If a diagram looks cramped in the screenshot, enlarge the boxes and the labels, not the viewBox.

## Theorem environments

See `theorem.css` in this directory and `reference/theorem.md` at the skill root.

- All theorem-like blocks share a 2px ink left rule and white background.
- Type is signalled by the label word, never by colour.
- `remark` uses the neutral `--field` background and a muted left rule.
- Proofs use an italic run-in head and a right-aligned `∎`.

## Do not

- Add a logo to every slide. One mark on the title slide is enough.
- Use stock photography.
- Animate bullet reveals without a reason the audience can perceive.
- Use a coloured band behind the title, a sidebar, or a decorative header strip.
- Set body text below 16px, ever.
- Put the deck's title in the footer at full length; use a short form.
