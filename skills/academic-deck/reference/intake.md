# Intake

Ask these nine questions in one message before writing any slide. Do not proceed until every
question is answered, or the author explicitly says "you choose" for that line. Record the answers
in `deck.config.json` at the deck root and confirm them back in one paragraph.

## The questions

```text
Before I build the deck, I need nine answers. One line each is fine.

1. Venue and talk length (e.g. "NeurIPS spotlight, 12 min").
2. Purpose: conference talk / seminar / group meeting or progress report / thesis defense /
   grant briefing / lecture / job talk.
3. Audience: specialist in your subfield, adjacent field, or general scientific.
4. Citation style: author-year (APA 7 or Chicago) or numeric (IEEE, ACM, Vancouver).
   If you have no preference, I will use author-year, APA 7.
5. Spelling: US or UK English. Default: US.
6. Source material: paper PDF, LaTeX source, figure files, or an outline.
7. Theorem-like blocks needed on slides: theorem, lemma, proposition, corollary,
   definition, remark, example, assumption. List the ones you need.
   Proofs are controlled separately (theorem.proofs), not listed as a kind.
8. Numbering: continuous across the deck, or per section? Default: continuous.
9. Is this also a handout or a recorded talk? This changes text density.
```

## Delegation rule

If the author says "you choose", apply the default for that line **and say so explicitly** in the
confirmation paragraph. Silent defaults are a defect: the author must be able to see every choice
that was made on their behalf.

Defaults:

| Field | Default |
|---|---|
| talkMinutes | 15 |
| purpose | conference |
| audience | specialist |
| citationStyle / citationStandard | author-year / APA7 |
| spelling | US |
| density | standard |
| theorem.numbering | continuous |
| appendix | true |
| handout | false |
| theme | tudelft (not asked; taken from the request, see SKILL.md Step 0, Theme) |

## Duration to slide budget

Content slides only: title, references, appendix, and dividers are excluded.

| Talk length | Content slides | Exhibits | Notes |
|---|---|---|---|
| ≤ 5 min | 3–5 | 1–2 | lightning talk: one claim, one exhibit carries it |
| 6–7 min | 4–7 | 2–3 | progress report: one claim, no methods detail |
| 8–10 min | 8–10 | 3–4 | one claim, no methods detail |
| 12–15 min | 12–15 | 5–7 | conference default |
| 20 min | 15–18 | 7–9 | |
| 30 min | 22–26 | 10–13 | seminar |
| 45 min | 30–34 | 13–16 | job talk, defense |
| 60 min | 36–42 | 16–20 | lecture |

If the author's paper forces more results than the band allows, cut context and methods detail
before cutting a result. State the overrun in the delivery note.

## Density modes

| Mode | Body ceiling | Body size (metropolis) | Title (metropolis) | Valid when |
|---|---|---|---|---|
| `sparse` | 25 words | 20px | 46px | live talk, large room, low light |
| `standard` | 40 words | 18px | 46px | default |
| `dense` | 60 words | 16px | 40px | `handout: true` or `purpose: defense` only |

The word ceilings hold in every theme. Sizes are the theme's: the beamer themes (`tudelft`,
`geoheat`) keep beamer's 31px body and 39.5px titles in every mode, so a `dense` slide there needs
the same cuts as any other.

`dense` is a deliberate exception to the 40-word ceiling. `scripts/lint-text.js` fails the build if
`density: dense` is used without `handout: true` or `purpose: defense`.

## Config schema

```json
{
  "venue": "string",
  "purpose": "conference | seminar | progress | defense | grant | lecture | jobtalk",
  "talkMinutes": 15,
  "audience": "specialist | adjacent | general",
  "citationStyle": "author-year | numeric",
  "citationStandard": "APA7 | Chicago | IEEE | ACM | Vancouver",
  "spelling": "US | UK",
  "density": "sparse | standard | dense",
  "theorem": {
    "enabled": true,
    "kinds": ["theorem", "lemma", "proposition", "corollary", "definition", "remark", "example", "assumption"],
    "proofs": true,
    "numbering": "continuous | section"
  },
  "appendix": true,
  "handout": false,
  "maxBodyWords": 40,
  "theme": "tudelft | geoheat | metropolis | <any folder in themes/ with a theme.json>",
  "footer": { "author": "J. Chen (TU Delft)", "short": "Short title", "date": "July 02, 2025" }
}
```

Validity:

- `citationStyle: author-year` requires `citationStandard` in `{APA7, Chicago}`.
- `citationStyle: numeric` requires `citationStandard` in `{IEEE, ACM, Vancouver}`.
- `maxBodyWords` must equal the density ceiling: 25 / 40 / 60.
- `theorem.kinds` may only contain the eight kinds listed in the markup contract.
- If `theorem.enabled` is false, the deck must contain zero `.thm` elements.
- `theme` must name a folder in `themes/` that has a `theme.json`.
- `footer` fields the theme does not show are ignored; fields it shows but the config lacks are
  left blank, and `scripts/footers.js` says which.
