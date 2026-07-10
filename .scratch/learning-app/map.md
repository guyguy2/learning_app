# Meta-learning web app — map

## Destination

A build-ready `SPEC.md` for a personal, subject-agnostic web learning app whose pedagogy is
grounded in the cognitive-science techniques from Felienne Hermans' *The Programmer's Brain*.
The engine must be proven on one small, general-purpose subject before generalizing to others.
Planning only — this map produces the spec, not app code.

## Notes

- **Domain**: cognitive science of programmer/learner cognition — working memory limits, LTM/STM,
  chunking, notional machines, roles of variables, cognitive load types, misconception patterns.
- **Standing constraints**: personal single-user tool. No auth, no monetization, no
  social/multiplayer features, web-only (no native mobile).
- **Design preference**: the app should surface which technique a given screen/exercise is using,
  not hide the pedagogy — the user wants to see the science at work, not just benefit from it.
- **Skills to consult**: `/research` for the book's science, `/grilling` and `/domain-modeling` for
  open decisions, `/prototype` for UI/behavior questions.
- Standard wayfinder default: plan, don't build — this map's tickets resolve decisions, not code.

## Decisions so far

- [01 - Research: cognitive-science techniques in The Programmer's Brain](issues/01-research-cognitive-techniques.md) —
  8-technique catalog (working memory, LTM/STM, chunking, notional machines, variable roles,
  cognitive load, misconceptions, spaced repetition), synthesized from two independent research
  passes into `docs/research/programmers-brain-techniques-synthesis.md`. Structural claims solid;
  numeric specifics (chunk capacity, retention %, review cadence) flagged as unverified defaults.

- [02 - Choose proof subject](issues/02-choose-proof-subject.md) — Spanish: core vocab (~50-100
  words) + regular present-tense conjugation (-ar/-er/-ir, no irregulars in v1). Exercises
  chunking (verb families), notional machine (conjugation rule), roles (word/sentence-role
  tagging), and misconceptions (false cognates, overgeneralization) without programming's
  domain bias.

- [03 - Core learning loop / session mechanics](issues/03-core-learning-loop.md) — 2-3 exercise
  types per session (recognition, production, role-tagging); I-do/We-do/You-do sequencing;
  misconceptions detected via seeded distractors and repaired with named-error feedback plus a
  within-session recheck; verb families blocked in session one, interleaved from session two;
  advance a chunk on 3-in-a-row correct spanning ≥2 exercise types; vocab gates conjugation
  (~10-15 words mastered before drills draw on them); session ends when the chunk's gate is hit
  (no fixed count/timer).

- [04 - Cross-session review / spaced-repetition scheduling](issues/04-review-scheduling.md) —
  hybrid trigger: every session opens with a review block, but which chunks are due is decided by
  real calendar time elapsed (not session count). Fixed interval ladder (1/3/7/14/30 days), one
  step per success, full reset to step 1 on a miss. All-due chunks reviewed, capped at ~5-8 per
  session (overflow rolls to next session, most-overdue-first); review runs before new-chunk work.
  Review misses reuse ticket 03's misconception-repair mechanic (named feedback + recheck) rather
  than a separate pass/fail path; review items draw from the same 2-3 exercise types as the chunk,
  not recognition-only.

- [05 - Progress / mastery tracking data model](issues/05-progress-data-model.md) — chunk = one
  verb family (3 total); word mastery = 2-in-a-row single-type; vocab has no separate review
  ladder (implicit reuse inside conjugation drills only); any miss resets the relevant streak to
  0; chunks are unlocked in parallel from the start (no prerequisite field); review reuses the
  exact advancement-gate mechanic rather than a separate check. State shape: per-word
  status+streak, per-chunk mastered flag/date + streak/types-in-streak + ladder step/last-
  reviewed/next-due. No event log, no per-word ladder.

- [06 - UI for surfacing techniques transparently](issues/06-technique-transparency-ui.md) —
  corner badge: small expandable pill, top-right of each screen, naming the active technique
  (collapsed by default, tap for a one-line explanation); same pattern reused across worked
  example, guided practice, independent recall, and misconception repair. Prototype (3 variants)
  at `prototype/session-flow-technique-transparency.PROTOTYPE.html`.

- [07 - Content authoring model](issues/07-content-authoring-model.md) — generate v1 Spanish
  content (vocab, distractors, worked examples, misconception seeds) via LLM at build time; full
  manual review of every item before use; store as static, version-controlled data files in the
  repo (no DB/CMS). Future content work (fixes, new subjects) repeats the same ad hoc process —
  no authoring tooling built now.

- [08 - Tech stack / architecture](issues/08-tech-stack-architecture.md) — `learning_app/`
  becomes a real git repo; Vite + React client-only SPA frontend; progress/mastery state (per 05)
  persists to a local `progress.json` file (not localStorage) via a small Node + Express backend
  (minimal REST endpoints); runs local-only, no deploy — no cloud/self-host. Static content from
  07 ships as part of the frontend bundle.

## Not yet specified

(none — fog is clear, no open tickets remain)

## Out of scope

(none yet — see Notes for standing constraints agreed at chart time: auth, monetization, social
features, and native mobile are excluded by the destination itself, not by a closed ticket.)
