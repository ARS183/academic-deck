# GeoHEAT Theme

Project theme for GeoHEAT talks, measured from `geoheat_template/GeoHEAT_talk_example.pdf`: white
slides, blue frame titles, the GeoHEAT logo with the "Funded by the European Union" mark at the top
right of every slide, circled-chevron bullets, rounded shadowed blocks, and a light grey footline
without a bar. Computer Modern Sans throughout.

Select it with `"theme": "geoheat"` in `deck.config.json`, or when the author asks for the GeoHEAT
style. It shares the beamer look with the TU Delft theme (`themes/shared/beamer.css`); only the
chrome differs.

Where the reference deck breaks the content standard (topic-label titles such as "Project
Overview", a "Thank You" slide), the content standard wins.

## Tokens

| Token | Value | Usage |
|---|---|---|
| `--bm-blue` | `#0180C7` | frame titles, bullets, block titles |
| `--bm-alert` | `#FF0000` | alerted text, at most one phrase per slide |
| `--bm-block-head` | `#CCE5F4` | block and theorem title bar |
| `--bm-block-body` | `#E6F2F9` | block and theorem body |
| `--bm-foot-fg` | `#808080` | footline text |
| body text | `#000` | all running text |

The `.sty` in the template folder names more GeoHEAT colours (teal `#39C1CD`, orange `#F58220`,
slate `#44546A`). The example deck does not use them; neither does this theme.

## Typography

| Element | Size | Notes |
|---|---|---|
| Frame title | 39.5px, blue | at most 960px wide: the logo owns the top-right corner |
| Body, level-1 bullet | 31px | circled chevron |
| Level-2 bullet | 28.2px | thin chevron |
| Source note, caption | 22.6px | |
| Footline | 15px, grey | date, short title, author, `n / N` |
| Title-slide title | 54px, blue | centred, two lines at most |
| Title-slide authors / date | 28.2px | |
| Title-slide affiliations | 21px | one line per affiliation, `<br>` between them |

## Layout grammar

- Logo 225×97px at (1024, 23) on every slide, title slide included. It is part of the theme;
  never add it by hand.
- Title left edge 24px, top 46px. Content and blocks start at 36px; bullets at 66px, text at 105px.
- Body content is vertically centred between the title and the footline.
- Title slide: optional project line (`<p class="tp-project">Task 5.1 – Georadar Data Processing and
  Modeling</p>`) where frame titles sit, then the centred title, authors with superscript markers,
  affiliations, and date. No footline on the title slide.

## Footer

```json
"footer": { "author": "J. Chen (TU Delft)", "short": "T5.1: Georadar Simulation", "date": "June 2026" }
```

Fields: date (centred at 191px), short title (centred), author (centred at 1023px), `n / N` (right
edge 1214px). The title slide carries no footline and is not counted, so the first content slide
is `1 / N`.

## Components

Blocks, theorem boxes, equations, tables, and diagrams are as in the TU Delft theme
(`themes/tudelft/THEME.md`, Components).

## Do not

- Add the EU or SERI funding logos elsewhere; the top-right mark already carries the EU line.
- Put text under the logo: titles wrap at 960px for that reason.
- End on "Thank You"; the deck ends on Conclusions.
