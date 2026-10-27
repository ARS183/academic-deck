# Theorem Environments — Markup Contract

Numbering and cross-references are generated. Never type a numeral or a reference label by hand.

## Markup

```html
<div class="thm" data-kind="theorem" data-name="Convergence rate">
  <p class="thm__label"></p>
  <div class="thm__body">
    <p>Let <i>f</i> be <i>L</i>-smooth. Then the iterates satisfy</p>
    <div class="formula">{{EQ:thm1}}</div>
  </div>
</div>
```

```html
<div class="proof">
  <span class="proof__runin">Proof.</span>
  By descent on the objective and the bound above,
  <a class="thm-ref" data-ref="thm-convergence-rate">Theorem 1</a> follows.
  <span class="proof__qed">&#8718;</span>
</div>
```

```html
<div class="thm thm--remark" data-kind="remark">
  <p class="thm__label"></p>
  <div class="thm__body"><p>Assumption (A2) is not needed for the rate.</p></div>
</div>
```

Rules:

- `data-kind` is required and must be one of: `theorem`, `lemma`, `proposition`, `corollary`,
  `definition`, `remark`, `example`, `assumption`.
- `data-name` is optional. When present it is rendered in parentheses after the numeral.
- `.thm__label` must be present and empty in the source. `scripts/number-theorems.js` fills it.
- `id` is optional in the source. With `data-name`, the script assigns a stable slug id
  (`thm-precision-threshold`) that survives inserting a theorem earlier in the deck. Without
  `data-name` it assigns a positional id (`thm-3`) marked `data-auto-id="number"`.
- A theorem that is referenced must have `data-name` or an explicit `id`. A `thm-ref` aimed at a
  positional id is a hard error, because numbering shifts as soon as a slide is inserted.
- A `thm` block must not be nested inside another `thm` block.
- `a.thm-ref` must carry `data-ref` pointing at a theorem id. Its text is replaced by the resolved
  label, so the source text is a placeholder that must nevertheless be human-readable.
- Proofs are unnumbered. A proof follows the statement it proves, on the same slide.

## Rendered labels

| Kind | Rendered |
|---|---|
| theorem, named | `Theorem 1 (Convergence rate).` |
| theorem, unnamed | `Theorem 2.` |
| definition | `Definition 3.` |
| remark | `Remark 4.` |

The numeral sits in `.thm__num` and takes the orange accent. The label word and the name are ink.
Label ends with a period. No colon after the label.

## Numbering modes

- `continuous` (default): one counter across the deck, `Theorem 1 … Theorem 7`.
- `section`: two-level, `Theorem 2.3`, where the first component is the enclosing
  `<section class="slide" data-section="2">` index. Dividers and non-sectioned slides inherit the
  last seen section index; a theorem before the first sectioned slide is an error.

## Equation numbering

The audience does not have the paper, so its equation numbers mean nothing on a slide. Show the
equation, and if another slide refers back to it, give it a label so the deck numbers it.

```html
<div class="formula" data-label="crim-inverse">{{EQ:crim_inverse}}</div>
...
Inverting <a class="eq-ref" data-ref="crim-inverse">Eq.</a> at each frequency gives the porosity.
```

- `data-label` on a `.formula` makes it numbered: `(1)`, `(2)`, … continuous in document order,
  with id `eq-<label>`. Unlabelled equations stay unnumbered.
- `a.eq-ref[data-ref]` resolves to `Eq. (n)`. An unknown label is a hard error.
- Never type `Eq. (5)` or `Equation 5` by hand. `scripts/lint-text.js` reports it as `SOURCE_EQ_REF`. Do not copy `\tag{}` or `\eqref{}`
  from the paper's LaTeX into `eqs.json`; lint reports it as `SOURCE_EQ_TAG`.

## `number-theorems.js`

Usage:

```bash
node scripts/number-theorems.js index.html
node scripts/number-theorems.js index.html --config deck.config.json
```

Behaviour:

1. Strip any previous `<span class="thm__num">…</span>` so the run is idempotent.
2. Walk `.thm[data-kind]` in document order.
3. Validate kind; unknown kinds are a hard error.
4. Assign numbers per the config mode.
5. Write the label: numeral span, optional ` (Name)`, period.
6. Assign `id` when absent. Duplicate explicit ids are a hard error.
7. Resolve every `a.thm-ref[data-ref]`: replace text with the target label and set `href`.
8. Report counts; exit non-zero on any error, with one line per problem.

Output must be byte-identical on a second run. The script never touches `.proof` blocks.

## Slide fit

A theorem slide has at most:

- one statement block, or
- one statement block plus its proof, or
- two short definition/remark blocks.

If the statement plus proof exceeds the content area, move the proof to the next slide and repeat
the statement in one line at the top, or shorten the surrounding prose. Never shrink the theorem
body below 17px and never split a statement across slides.

## QA checks

- No empty `.thm__label` after the build.
- Numbers consecutive with no gaps or repeats in the declared mode.
- No literal `Theorem ?` or unresolved `data-ref` anywhere in the output.
- `∎` (U+220E) sits on the last line of the proof, right-aligned, above the footer.
- No theorem block crosses a slide boundary.
- An equation inside a theorem aligns with the body baseline and is not clipped.
- If `theorem.enabled` is false, zero `.thm` elements exist.
- If `theorem.proofs` is false, zero `.proof` elements exist.
