# 02 - Choose proof subject

Type: grilling
Assignee: claude
Status: resolved

## Question

Which subject should the engine be proven on first? Must be small enough in scope to spec and
build quickly, but general-purpose enough that the pedagogy mechanics it exercises (chunking,
misconception repair, notional machines, working-memory management) generalize to most other
subjects later — not something with idiosyncratic requirements that won't transfer.

## Answer

**Spanish** — core vocab (~50-100 words) + regular present-tense conjugation (-ar/-er/-ir verbs
only, no irregulars in v1).

Chosen over music theory, elementary math, and programming fundamentals: natural-language
vocab/grammar is maximally distinct from programming (the book's own domain), so proving the
engine here is the strongest test that the mechanics actually generalize rather than just
re-deriving the book's examples. Spanish specifically over French/Japanese: regular-enough verb
morphology to model the notional machine cleanly, rich false-cognate material for misconception
repair, and a large learner-resource base if the app sees real use beyond the proof.

Scope reasoning: vocab-only would leave the notional-machine mechanic unexercised (no hidden
mechanism to model). Vocab + full present tense incl. irregulars would give richer
misconception-repair material but adds authoring load not needed to prove the mechanics work at
all. Regular present-tense conjugation is the minimum that exercises all four target mechanics:

- **Chunking** — verb families (-ar/-er/-ir) as reusable patterns, not memorized per-verb.
- **Notional machine** — the regular conjugation rule (stem + ending swap) as the hidden mechanism.
- **Roles of variables (analog)** — word/sentence-role tagging (subject, verb stem, ending,
  object) as the roles taxonomy.
- **Misconceptions** — false cognates (embarazada, etc.) and regular-vs-irregular overgeneralization
  as the error patterns to detect/repair (irregulars deliberately excluded from v1 content, but the
  overgeneralization error itself is still observable against regular verbs).

Irregulars, additional tenses, and moods stay out of the proof subject's v1 scope — candidates for
later expansion once the pedagogy engine is proven, not part of this decision.
