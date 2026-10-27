# Intake

Ask these nine questions in one message before writing any slide. Do not proceed until every
question is answered, or the author explicitly says "you choose" for that line. Record the answers
in `deck.config.json` at the deck root and confirm them back in one paragraph.

## The questions

```text
Before I build the deck, I need nine answers. One line each is fine.

1. Venue and talk length (e.g. "NeurIPS spotlight, 12 min").
2. Purpose: conference talk / seminar / thesis defense / grant briefing / lecture / job talk.
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

## Duration to slide budget

Content slides only: title, references, appendix, and dividers are excluded.

| Talk length | Content slides | Exhibits | Notes |
|---|---|---|---|
| 10 min | 8–10 | 3–4 | one claim, no methods detail |
| 12–15 min | 12–15 | 5–7 | conference default |
| 20 min | 15–18 | 7–9 | |
| 30 min | 22–26 | 10–13 | seminar |
| 45 min | 30–34 | 13–16 | job talk, defense |
| 60 min | 36–42 | 16–20 | lecture |

If the author's paper forces more results than the band allows, cut context and methods detail
before cutting a result. State the overrun in the delivery note.

## Density modes

| Mode | Body ceiling | Body size | Title | Valid when |
|---|---|---|---|---|
| `sparse` | 25 words | 20px | 46px | live talk, large room, low light |
| `standard` | 40 words | 18px | 46px | default |
| `dense` | 60 words | 16px | 40px | `handout: true` or `purpose: defense` only |

`dense` is a deliberate exception to the 40-word ceiling. `scripts/lint-text.js` fails the build if
`density: dense` is used without `handout: true` or `purpose: defense`.

## Config schema

```json
{
  "venue": "string",
  "purpose": "conference | seminar | defense | grant | lecture | jobtalk",
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
  "maxBodyWords": 40
}
```

Validity:

- `citationStyle: author-year` requires `citationStandard` in `{APA7, Chicago}`.
- `citationStyle: numeric` requires `citationStandard` in `{IEEE, ACM, Vancouver}`.
- `maxBodyWords` must equal the density ceiling: 25 / 40 / 60.
- `theorem.kinds` may only contain the eight kinds listed in the markup contract.
- If `theorem.enabled` is false, the deck must contain zero `.thm` elements.
