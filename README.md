# Academic Deck

A Claude Code skill for academic presentations: conference talks, seminars, thesis defenses, grant
briefings, and job talks. Output is one self-contained 16:9 HTML file plus a PDF built from it.

The skill merges two upstream projects:

- **Content standards** from [`Gabberflast/academic-pptx-skill`](https://github.com/Gabberflast/academic-pptx-skill):
  action titles, ghost deck test, one exhibit per results slide, on-slide citations, conclusions
  that stay on screen.
- **HTML engine and visual theme** from [`Redaelm47/claude-presentation-skills`](https://github.com/Redaelm47/claude-presentation-skills):
  the metropolis template, MathJax equations, native SVG diagrams, full chart anatomy, the
  screenshot QA loop, and PDF export.

On top of both, this skill adds: a config-driven contract, an academic English standard, theorem
environments with generated numbering and cross-references, and a linter that enforces the whole
thing.

## Requirements

- Node.js 20 or newer
- Chromium (through Playwright) for visual QA and PDF export
- `npm i mathjax@3 playwright-core --no-audit --no-fund` in the deck workspace, or globally

## Install

**Project scope** — inside the paper repository:

```bash
mkdir -p .claude/skills
cp -r /path/to/academic-deck/skills/academic-deck .claude/skills/
```

**Personal scope** — available in every project:

```bash
cp -r /path/to/academic-deck/skills/academic-deck ~/.claude/skills/
```

**As a plugin** — the repository already carries `.claude-plugin/plugin.json`:

```bash
claude plugin install /path/to/academic-deck
```

## Quick start

```bash
mkdir my-talk && cd my-talk
cp -r ~/.claude/skills/academic-deck/themes .
cp ~/.claude/skills/academic-deck/scripts .
```

Then in Claude Code:

> Make my conference talk from paper.pdf. I have 15 minutes.

Claude asks the nine intake questions, writes `deck.config.json`, builds `index.html`, and runs:

```bash
node scripts/number-theorems.js index.html
node scripts/lint-text.js index.html
node scripts/qa.js index.html qa/ $(seq 1 N)
node scripts/pdf.js index.html deck.pdf 1-N
```

`node scripts/build.js .` runs all of it in order.

## What is inside

```
skills/academic-deck/
├── SKILL.md                     orchestrator, authority order, seven steps
├── content/
│   ├── argument.md              what is said: claim, spine, action titles, exhibits
│   ├── slide-patterns.md        eleven slide patterns with slots and failure modes
│   └── english-style.md         academic English contract, both citation modes
├── themes/metropolis/
│   ├── THEME.md                 tokens, typography, layout grammar, chart grammar
│   ├── theorem.css              theorem and proof styling
│   ├── reference/               deck-template.html, canvas example
│   └── fonts/                   Fira Sans (OFL 1.1)
├── scripts/
│   ├── number-theorems.js       numbering, ids, cross-reference resolution
│   ├── inject-theme-css.js      idempotent theorem.css injection
│   ├── lint-text.js             language, citations, density, structure, theorems
│   ├── build.js                 one-command build
│   └── mkfonts · tex2svg · render · qa · pdf   (upstream, unmodified)
└── reference/
    ├── intake.md                the nine questions, budget and density tables
    ├── theorem.md               markup contract
    └── deck-checklist.md        A1–A15 acceptance tests
```

## Design decisions

**Authority order is explicit.** Content beats language beats visuals beats process. A layout rule
never deletes an argument step; the layout re-flows instead.

**Configuration is a file, not a conversation.** `deck.config.json` records purpose, duration,
citation style, spelling variant, density, and theorem settings. The linter fails the build when the
deck contradicts it, so the intake decisions survive a long editing session.

**Numbering is generated.** Theorem numerals and cross-references are written by
`number-theorems.js`, never typed. Hand-typed numbers drift the first time a slide is inserted.

**Theorem types are not colour-coded.** The palette is paper, ink, orange. Type is signalled by the
label word. Colour-coding categories is how decks acquire a fourth, fifth, and sixth colour.

**Density is capped.** 25 / 40 / 60 body words per slide. The `dense` mode is only legal for
handouts and defense decks, which prevents the common failure of shrinking type to fit content.

## Verification

```bash
# in a deck directory
node scripts/number-theorems.js index.html --config deck.config.json
node scripts/lint-text.js index.html --config deck.config.json
```

`number-theorems.js` is idempotent: a second run produces byte-identical output.
`lint-text.js` exits zero only when the deck satisfies the content, language, citation, theorem, and
budget contracts.

## Upstream refresh

```bash
bash vendor.sh            # re-download template, fonts, and upstream scripts
```

The script records the upstream commit hashes in `NOTICE.local`. Check the upstream diffs before
accepting a refresh: the theme template is the canonical CSS and changes to it can break the
theorem styles appended by this skill.

## Licence

MIT for the skill. Bundled Fira Sans fonts are under the SIL Open Font License 1.1. See `NOTICE`
for full upstream attributions.
