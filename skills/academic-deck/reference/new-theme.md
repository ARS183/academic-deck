# New theme from a template or example deck

Use this when the author gives a template or an example deck (PDF, PPTX, beamer `.sty`) and no
theme in `themes/` matches it. The goal is a theme that reproduces the reference's chrome,
typography, colours, and geometry closely enough that the two decks cannot be told apart at a
glance, while the content rules stay unchanged.

The reference supplies the look. It never overrides `content/`: topic-label titles, "Thank you"
slides, and logo walls in the reference are not copied.

## 1. Render the reference at deck scale

```bash
mkdir -p ref
pdfinfo reference.pdf | grep 'Page size'          # width in pt
pdftoppm -r <dpi> -png reference.pdf ref/p        # dpi = 92160 / width_pt; beamer 16:9 -> 203.2
```

Every page is then 1280×720, the deck canvas, so pixel positions transfer one to one. For a PPTX,
convert to PDF first (`soffice --headless --convert-to pdf template.pptx`). If the reference is not
16:9, stop and tell the author: the deck canvas is fixed at 1280×720.

## 2. Measure; do not eyeball

Record each value in the new `theme.css` with a comment saying where it was measured.

| What | How |
|---|---|
| Fonts | `pdffonts reference.pdf`. Beamer `CMSS*` = Computer Modern Sans: use `themes/shared/cmu-sans`. Otherwise find an OFL or metric-compatible font (Calibri -> Carlito, Arial -> Liberation Sans). |
| Colours | `magick ref/p-02.png -crop WxH+X+Y -format %c histogram:info:- \| sort -rn \| head` on the title, bullet, bar, and block regions. |
| Text boxes | `magick ref/p-02.png -crop WxH+X+Y -fuzz 10% -trim info:` gives the ink box of a region: title, first bullet, footer, logo. |
| Font size | for a single line with capitals and descenders, ink height ≈ 0.94 × font size. Check against the width of the same string in the deck. |
| Logos | `pdfimages -list reference.pdf`, then `pdfimages -f 2 -l 2 -png reference.pdf ref/img`. Combine an image with its soft mask: `magick img-000.png img-001.png -alpha off -compose CopyOpacity -composite logo.png`; trim with `-trim +repage`. |
| Footer | locate each field's horizontal extent and record its centre (or right edge for the number). |

Measure at least: the title slide, a bullet slide with two levels, a slide with a block or box, and
a slide whose content is vertically centred.

## 3. Write the theme

```
themes/<name>/
  theme.json      name, label, aliases, source, fonts, css list, assets, footer
  theme.css       tokens and chrome; reference images as url(asset(key))
  THEME.md        tokens, typography, layout grammar, footer, components, do-not list
  assets/         logos (PNG or SVG), inlined at build time
```

- Start `css` with `../shared/layout.css`. For any LaTeX beamer reference, add
  `../shared/beamer.css` and set its `--bm-*` variables; most beamer themes need only chrome on top.
- Keep the markup contract: `.slide`, `.pad`, `.head > h2.title`, `.subtitle`, `.col-text`,
  `.col-fig`, `ul.points`, `.block`, `.thm`, `.formula`, `.source`, `.foot`, and the title-page
  fields `tp-project`, `tp-authors`, `tp-affil`, `tp-date`. A theme restyles these; it never asks
  for different HTML, so any deck can switch theme by changing one config field.
- `footer.fields` lists the footer fields in order from `author`, `short`, `date`, `num`. `num` is a
  pattern with `{n}`, `{N}`, or `{nn}` (zero-padded). `onTitle` and `countTitle` follow the reference.
- `aliases` holds the words an author would use to ask for the theme ("geoheat", "geo heat").

## 4. Compare until it matches

Build a scratch deck that copies the text of three or four reference pages into the theme's markup,
then:

```bash
node scripts/build.js . --skip-pdf     # applies theme, fonts, footers; lint may stop a scratch deck
node scripts/compare-theme.js index.html ref 1:1,2:2,3:5 compare
```

Read every `compare/cmp-NN.png`: reference top left, deck top right, difference bottom left. Then
re-measure the same regions in `compare/deck-NN.png` and in the reference. Tune until title, body,
footer, and logo boxes agree within 3px in position and 2% in width. Text that is consistently wider
or narrower means the font size is off, not the margin.

## 5. Register

- Add the theme to the table in `SKILL.md`, Step 0 (Theme).
- State in the delivery note which reference the theme was measured from, and anything that could
  not be reproduced (a missing font, a non-16:9 page, PPTX effects).
