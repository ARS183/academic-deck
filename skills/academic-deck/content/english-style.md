# Academic English Contract

This file governs wording. It yields to the argument standard and overrides the visual layer.
Deck content is English even when the conversation with the author is in another language, unless
the author explicitly asks for a different output language.

## 1. Register

Formal academic prose for a spoken talk: precise, plain, and compact. Not written-paper prose
(too dense to hear), not marketing prose (claims without evidence).

- One idea per sentence. If a sentence has three clauses, split it.
- Prefer the concrete noun to the abstraction: "error rate", not "performance degradation
  phenomenon".
- Prefer the verb to the nominalisation: "we analyse", not "we perform an analysis of".
- Cut intensifiers. "Significant" means statistically significant or it does not appear.
- No rhetorical questions on slides. They read as filler when projected.

## 2. Tense by section

| Section | Tense | Example |
|---|---|---|
| Established knowledge | present | "Token frequency follows a power law." |
| What a figure shows | present | "Figure 2 shows the error rising below 8 bits." |
| What you did | past | "We held out twelve domains." |
| What you found | past, or present for standing results | "Accuracy dropped by 4.1 points." |
| Interpretation | present + hedge | "This suggests domain shift dominates." |
| Outlook | future, sparingly | "We will test generation next." |

Do not mix past and present within one bullet.

## 3. Hedging calibration

| Evidence | Allowed verb |
|---|---|
| Direct experimental result | shows, reduces, increases, outperforms |
| Correlational or indirect | suggests, indicates, is consistent with, correlates with |
| Single case or anecdote | illustrates, is consistent with |
| Formal proof | proves, implies, follows from |
| Nothing yet | do not write the sentence |

Banned as evidence substitutes: clearly, obviously, of course, it is well known that, dramatically,
significantly (unless statistical), very, extremely, highly.

## 4. Voice and person

- Active voice by default: "We evaluate on twelve domains."
- Passive is acceptable in methods where the actor is irrelevant: "Models were trained for 40k steps."
- "We" for multi-author work. "I" only for a single-author talk in a field where that is normal.
- Never "the authors" in a talk; the audience is looking at you.
- Avoid "one" as a pronoun; it reads as an essay.

## 5. Terminology consistency

- One term per concept for the whole deck. Pick "domain shift" or "distribution shift", not both.
- Define each acronym at its first on-slide use: "low-resource machine translation (LRMT)".
  After that, the acronym alone. Do not redefine on later slides.
- Do not introduce a synonym for variety. Variety is a virtue in prose and a defect in slides.
- Keep a `glossary.md` next to the deck when the work has more than ten domain terms.

## 6. Numbers and units

- Space between value and unit: `12.4 mm`, `3.1 s`, `40k steps`.
- No space before percent or degree: `12.4%`, `37°C`.
- One decimal convention per metric across the entire deck. If accuracy is reported to one decimal,
  it is one decimal everywhere, including in the conclusions.
- Thousands separators according to the spelling variant: `1,200` (US), `1 200` or `1,200` (UK,
  follow the venue).
- Spell out a number at the start of a sentence.
- Ranges use an en dash with no spaces: `2019–2024`, `0.4–0.9`.
- Use `×` for multiplication in dimensions, not `x`: `1280×720`.
- Effect sizes carry units or are explicitly standardised: "4.1 points", "d = 0.6".

## 7. Citations

One style per deck, chosen at intake and recorded in `deck.config.json`. Never mix, including in
figure captions and the appendix.

### 7.1 Author-year (default)

- Parenthetical: `(Smith et al., 2023)`.
- Two authors: `(Smith & Lee, 2023)`. In Chicago narrative prose, `and`; inside parentheses, `&`.
- Narrative: `Smith et al. (2023) report ...`.
- Three or more authors collapse to `et al.`; italicise `et al.` and keep the period.
- Multiple sources, alphabetical, semicolon-separated: `(Lee, 2021; Smith et al., 2023)`.
- Same author and year: `(Smith, 2023a, 2023b)`.
- `APA7` and `Chicago` differ in reference-list punctuation and in `&`/`and`. Pick one; do not blend.
- References slide: alphabetical by first author surname, hanging indent, no numerals.

### 7.2 Numeric

- Bracketed numerals in order of first appearance: `[1]`, `[2]`, ranges as `[3]–[5]`.
- Place the bracket before terminal punctuation: "as shown in [3]."
- Vancouver on slides uses brackets rather than superscripts, for legibility at projection size.
- References slide: numbered in citation order, matching the brackets exactly.
- Adding a source mid-deck forces renumbering. Above 25 citations, number by section and say so on
  the References slide.

### 7.3 All modes

- Cite at the point of use. A References slide does not discharge the obligation.
- Borrowed figure: `Adapted from Smith et al. (2023)` or `Source: [3]`, directly under the figure.
- Never invent a reference. Missing metadata is `[TODO: source]` and blocks delivery.
- Do not cite a paper you have not read for the specific claim you attribute to it.

## 8. Punctuation

- **Em dash is banned.** Use a colon, a semicolon, parentheses, or a comma.
- En dash only for ranges: `2019–2024`, `pp. 12–18`, `95% CI 0.4–0.9`.
- Hyphen for compounds: `state-of-the-art`, `within-subject`, `eight-bit`.
- Serial comma: use it consistently (US default: yes).
- No terminal period on titles or bullets.
- One space after a period, never two.
- Quotation marks: curly if the theme supports them, straight otherwise. Never mix.
- Do not use `!` anywhere.

## 9. Spelling variant

Chosen at intake, enforced globally by `scripts/lint-text.js`.

| US | UK |
|---|---|
| analyze, organize | analyse, organise |
| behavior, color | behaviour, colour |
| modeling, labeled | modelling, labelled |
| center | centre |
| program (software) | programme (plan) |
| toward | towards |

Mixed variants anywhere in the deck are a build failure, including in copied figure captions.

## 10. Titles and bullets

- Title: declarative clause, at most 14 words, no terminal period, no colon unless the second half
  is a consequence.
- Bullet: at most two lines at the theme's body size. If it needs three, it is a paragraph and
  belongs in the talk track, not on the slide.
- Parallel grammatical form within a bullet list: all verb phrases or all noun phrases.
- Bold the one operator term per slide, then a colon, then the explanation:
  `<b>Threshold</b>: accuracy is stable to 8 bits.`

## 11. Banned list

Words that mark a slide as machine-written or marketing-written:

revolutionary, game-changing, cutting-edge, state-of-the-art (unless reporting a benchmark result
with a citation), seamless, robust (unless statistically defined), novel (unless you justify what is
new in the same sentence), leverage, utilize, delve, unlock, empower, holistic, paradigm shift,
dramatically, significantly (unless statistical), very, extremely, incredibly.

Replacements:

| Banned | Use |
|---|---|
| utilize | use |
| leverage | use, build on |
| novel | new (then say what is new) |
| robust | stable, or the actual robustness metric |
| dramatically | the number |
| delve into | examine |

## 12. Captions

- Figure caption: one sentence stating what the figure shows, then the source.
- Format: `Figure 2. Error against bit width. Shaded band: 95% CI. Source: [3].`
- Table caption above the table; figure caption below the figure.
- Captions are sentences: they end with a period, unlike titles.

## 13. Editing pass

Before delivery, read the deck aloud once and fix:

1. Any sentence you cannot say in one breath.
2. Any bullet that repeats its title.
3. Any transition that says "next" or "as you can see".
4. Any claim that survives without its citation.
5. Any tense shift inside a bullet.
