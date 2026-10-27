# Argument Standard

Format-agnostic. Applies to HTML, PDF, or any future renderer. Derived from the academic
presentation content standard; the mechanics have been re-expressed for an HTML deck.

## 1. One argument per deck

A deck makes one claim. Everything on every slide either supports that claim, delimits it, or
shows what it cost. If a slide does none of the three, delete it.

Write the claim in one sentence before starting:

> Quantization below 8 bits, not model size, causes the accuracy loss we observe in low-resource
> translation.

If the sentence needs an "and", you have two decks. Pick one.

## 2. Lead with the research question

The first two content slides establish, in this order:

1. What is not known, and why it matters.
2. The exact question this work answers, phrased so a non-specialist can repeat it.

Do not open with "Outline", "Agenda", or a table of contents. The audience can see the structure
from the titles.

## 3. Narrative spine

Use situation → complication → resolution:

| Beat | Content | Typical slides |
|---|---|---|
| Situation | What the field currently assumes or does | 1–2 |
| Complication | The observation that breaks it | 1 |
| Resolution | Your method, the evidence, and its boundary | 4–12 |
| Consequence | What the audience should now believe or do | 1 |

The IMRaD mapping is a projection of this spine, not a substitute for it. Methods are the
complication's answer, not a ritual section.

## 4. Each slide has one job

One job means one of: establish context, state the question, explain a mechanism, show evidence,
pre-empt an objection, state a boundary, conclude.

If you cannot name the job in three words, the slide is doing two jobs. Split it or cut it.

## 5. Action titles

A title is a claim, not a label.

- Complete sentence, no terminal period.
- Contains a verb and a specific object. "Accuracy degrades below 8 bits", not "Accuracy".
- A reader who sees only the titles must be able to reconstruct the argument. This is the ghost
  deck test; it is checked mechanically by `scripts/lint-text.js` for bare labels and semantically
  by the author for coherence.
- Titles are declarative even for methods and limitations: "We hold out 12 domains to test
  transfer", not "Experimental setup".

Weak → strong:

| Weak | Strong |
|---|---|
| Background | Prior work assumes uniform token frequency |
| Data | Twelve held-out domains expose the failure |
| Results | Quantization error grows only below 8 bits |
| Limitations | Our evaluation covers translation, not generation |

## 6. Exhibit discipline

- **One exhibit per results slide.** Two figures on one slide means the audience reads neither.
- **Every exhibit earns its place.** It must be referenced in the spoken text and carry a claim in
  its caption or annotation. Decorative images are prohibited.
- **Annotate the key finding on the figure.** An arrow, a bracket, a highlighted series, a circled
  region. The annotation is the sentence you would otherwise say out loud.
- **Self-sufficient slide test.** If the audience photographs this slide and reads it a week later,
  the takeaway must still be visible without the talk. That means: action title + annotated exhibit
  + one-line takeaway.
- **The audience does not have the paper.** Never cite the paper's equation numbers ("Eq. (5)").
  Put the equation on the slide; if a later slide refers back to it, use the deck's own number.
  Markup in `reference/theorem.md`, Equation numbering.
- **Prefer graphs to tables for results.** Tables are for exact values the audience must compare
  digit by digit, or for method configuration.
- **Rebuild figures from your paper** rather than screenshotting them: projection legibility,
  consistent typography, and the ability to annotate.
- **Never include an exhibit you will not discuss.** It reads as padding.

## 7. Text discipline

- Body ceiling follows the density mode: 25 / 40 / 60 words per slide (`sparse` / `standard` /
  `dense`). The ceiling counts all visible body text, including callouts, excluding title, footer,
  source note, and reference list.
- Bullets are orientation cues, not information transfer. The sentence you speak carries the
  information; the bullet anchors it.
- Telegraphic fragments are acceptable on slides ("8-bit threshold", "12 held-out domains") where a
  full sentence would be read rather than heard.
- Minimum body size is set by the theme (18px at 1280×720, equivalent to 20pt projected). Never go
  below it to fit text. Cut text instead.
- Bold for the one term that matters per slide. Italic for variables and established terms. Never
  bold a whole bullet, never underline for emphasis.

## 8. Citations

- Cite on the slide, at the point of use. A References slide alone does not discharge the
  obligation.
- Every borrowed figure carries an attribution line under it.
- Every claim that is not yours and not common knowledge carries a citation.
- One citation style for the whole deck, chosen at intake. See `english-style.md` §7.

## 9. Deck architecture

| Slot | Slides | Notes |
|---|---|---|
| Title | 1 | title, authors, affiliation, venue, date |
| Motivation / context | 1–2 | the situation and why it matters |
| Research question | 1 | one sentence, repeated verbatim from the spine |
| Methods | 1–2 | only what is needed to trust the results |
| Results | as needed | one finding per slide, one exhibit per slide |
| Discussion / implications | 1–2 | what it means, what it does not |
| Conclusions | 1 | three statements maximum; stays on screen for Q&A |
| References | 1 | only works cited on slides |
| Appendix | optional | clearly labelled, never part of the argument |

Section dividers are permitted only above 15 content slides. They are unnumbered in the argument
and carry no claim.

## 10. Timing

Allocate minutes, not slides:

| Segment | Share of talk |
|---|---|
| Motivation and question | 20% |
| Methods | 15% |
| Results | 45% |
| Discussion and conclusions | 20% |

If the deck runs long, cut methods detail first, then context, never results.

## 11. Anti-patterns

- The outline slide.
- The "Thank You" slide. End on Conclusions.
- A methods slide that lists every hyperparameter.
- A results slide with two figures and no annotation.
- A limitations slide that apologises instead of delimiting the claim.
- A conclusion that repeats the results verbatim without stating the consequence.
- Animations that reveal evidence sequentially without a reason.
- Reading the slide aloud word for word.
