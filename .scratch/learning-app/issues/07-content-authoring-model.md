# 07 - Content authoring model

Type: grilling
Assignee: claude (session 2026-07-10)
Status: closed
Blocked by: (none)

## Question

How does new subject content (vocab pool, distractor sets, worked examples, misconception
seeds) get created and maintained — hand-authored, generated, or hybrid? Personal single-user
tool, one proof subject (Spanish) first, but the answer shapes whether the app needs an authoring
UI, how distractors/misconceptions get sourced with pedagogical validity, and what the tech-stack
ticket needs to design storage/tooling against.

## Resolution

Generate v1 Spanish content (vocab pool, distractor sets, worked examples, misconception seeds)
via LLM at build time — not hand-authored from scratch, not runtime generation. Full manual
review of every generated item before it's used (small set — ~50-100 words, 3 verb families —
makes this tractable; a personal single-user tool can't afford a bad distractor slipping through
unchecked). Reviewed content saved as static data files in the repo (e.g.
`content/spanish/vocab.json`), version-controlled and diffable — no database or CMS. Future
content work (fixing v1 content, adding a new subject beyond Spanish) repeats this same
generate-then-manually-review-then-edit-static-files process ad hoc; no authoring tooling/script
built now — deferred until a second subject actually demands it.
