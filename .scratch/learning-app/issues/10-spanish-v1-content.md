# 10 — Spanish v1 content

**What to build:** the static, version-controlled Spanish v1 content files per
[SPEC.md](../../../SPEC.md)'s content-authoring decision (ticket 07): core vocab pool
(~50-100 words), distractor sets (false cognates + regular-vs-irregular overgeneralization),
worked examples for all three verb families, and misconception seeds — generated via LLM at
build time, then fully manually reviewed before use.

**Blocked by:** None — can start immediately (parallel to 09).

**Status:** ready-for-agent

- [ ] `content/spanish/vocab.json` — ~50-100 words, each with the fields later tickets need
      (id, word, meaning, at minimum)
- [ ] `content/spanish/distractors.json` — false-cognate and overgeneralization distractor sets,
      each tagged with the specific misconception it represents
- [ ] `content/spanish/worked_examples.json` — one worked example per verb family (-ar, -er, -ir)
      showing the stem + ending swap explicitly
- [ ] `content/spanish/misconceptions.json` — named misconception catalog (id, name,
      explanation/correction text) that distractors reference by id
- [ ] Every generated item has been manually reviewed for correctness (no unreviewed LLM output
      shipped)
- [ ] Content covers only regular present-tense -ar/-er/-ir verbs — no irregulars, no other
      tenses/moods (out of scope per SPEC)
