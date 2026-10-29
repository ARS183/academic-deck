# Slide Patterns

Layout patterns for an HTML academic deck. Each pattern states its job, the title form, the slots,
and the failure mode it is meant to prevent. Slot names refer to the markup that
`scripts/prepare-template.js` writes; every theme styles the same classes.

## Global defaults

- Canvas 1280×720, one `<section class="slide">` per slide.
- Title at the top in `<div class="head">`, full content width. Rule, bar, or logo per the theme.
- Footer fields and the title slide's footer per the theme; `scripts/footers.js` writes them.
- Body copy left-aligned. Nothing centred except the title slide and standalone equations.
- Margins per the active theme's `THEME.md`.
- One exhibit maximum per slide unless the pattern says otherwise.

## 1. Title slide

**Job:** identify the work and the occasion.
**Title form:** the paper title, verbatim. No action-title rule here.
**Slots:** title, authors, affiliation, venue and date, optional arXiv or DOI line.
**Markup:** `data-role="title"` on the section; `h2.title`, then `p.tp-authors`, `p.tp-affil`,
`p.tp-date`, and an optional `p.tp-project` line above the title. The linter exempts only this
slide from the action-title, footer, and word rules.
**Rules:** no bullets, no abstract, no logo wall. One optional visual motif is allowed if it carries
meaning; decorative stock imagery is not.
**Failure it prevents:** the "hero slide" that spends the audience's first thirty seconds on branding.

## 2. Motivation / context

**Job:** establish the situation and why the gap matters.
**Title form:** a claim about the state of the field ("Current benchmarks assume uniform token
frequency").
**Slots:** title, one short paragraph or three cues, one exhibit (a trend chart, a diagram, or a
representative example).
**Rules:** cite the sources of the situation. Do not preview your method here.
**Failure it prevents:** starting with related work as a literature review.

## 3. Research question

**Job:** state the exact question, in one sentence the audience can repeat.
**Title form:** the question itself, or a claim that the question is open.
**Slots:** title, the question in a callout block, one line on why it is hard.
**Rules:** one question. If there are two, the deck has two arguments.
**Failure it prevents:** a vague "we study X" that gives the audience nothing to test the results against.

## 4. Methods

**Job:** give the audience exactly enough to trust the results.
**Title form:** what the design buys you ("Held-out domains isolate transfer, not memorisation").
**Slots:** title, a pipeline or architecture diagram, two or three cues naming the key choices.
**Rules:** no hyperparameter tables on the main line; push them to the appendix. Name the baseline.
State the evaluation protocol in one line.
**Failure it prevents:** the recipe slide that lists every setting and explains none.

## 5. Results

**Job:** deliver one finding with its evidence.
**Title form:** the finding, quantified where possible ("Error grows only below 8 bits").
**Slots:** title, one exhibit occupying 55–65% of the content area, one to three cues, a source note,
an annotation on the exhibit marking the finding.
**Rules:** one exhibit. Axis labels and units always. If the y-axis is truncated, say so on the slide.
Highlight the series or bar that carries the claim; leave the rest neutral.
**Failure it prevents:** the screenshot dump with no stated takeaway.

## 6. Discussion / implications

**Job:** state what the finding means and what it does not mean.
**Title form:** the implication ("The bottleneck is domain shift, not precision").
**Slots:** title, two or three cues, optional small schematic.
**Rules:** separate "what we show" from "what we infer". Hedging belongs here; see `content/english-style.md`.
**Failure it prevents:** overclaiming that the audience will challenge in Q&A.

## 7. Conclusions

**Job:** leave three statements on screen for the rest of the session.
**Title form:** "Conclusions" is acceptable here, because the slide's job is structural. A claim
title is better if it can carry all three statements.
**Slots:** title, at most three numbered statements, contact line or QR code.
**Markup:** with a claim title, add `data-role="conclusions"` to the section so the linter knows
this is the ending.
**Rules:** no new evidence. No "Thank You". This is the last content slide and it stays visible
during Q&A.
**Failure it prevents:** ending on a blank slide while the audience formulates questions.

## 8. Section divider (decks over 15 content slides)

**Job:** orient. Nothing else.
**Title form:** the section name, plus an optional one-line claim.
**Slots:** large numeral, section label, at most four items in the section.
**Rules:** excluded from the ghost deck test. Never more than four dividers in a 30-minute talk.
**Markup:** `data-role="divider"` on the section, so the linter leaves it out of the slide budget
and the title rules.
**Failure it prevents:** losing the audience in a long results section.

## 9. Breadcrumb bar (optional, long talks)

**Job:** tell the audience where they are without a divider.
**Implementation:** a 10px strip under the title rule with the current section in ink and the others
in the muted neutral.
**Rules:** only when the deck exceeds 20 slides; never animate it.

## 10. References

**Job:** make every citation resolvable.
**Title form:** "References".
**Slots:** the reference list in the deck's citation style, 16px minimum, hanging indent.
**Markup:** one `<li>` per entry, in an `<ol>` (numeric) or `<ul>` (author-year), so the linter can
match citations to entries.
**Rules:** only works cited on slides. Split across two slides rather than shrinking below 16px.
Do not include uncited background reading.
**Failure it prevents:** the unverifiable claim.

## 11. Appendix

**Job:** hold material that supports but does not belong to the argument.
**Title form:** "Appendix: <topic>".
**Slots:** any pattern above, reused.
**Rules:** clearly labelled as appendix; excluded from the slide budget; never referenced as if it
were part of the main line.

## Quick checks before delivery

- Every content slide matches exactly one pattern above.
- Every pattern's required slots are present.
- No slide combines two patterns (a results slide with a conclusions paragraph is two slides).
- Every slide except the title slide has a footer; the theme decides whether the title slide has one.
- The conclusions slide is the last slide before references and appendix.
