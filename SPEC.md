# Meta-learning app — SPEC

A personal, subject-agnostic web learning app whose pedagogy is grounded in the cognitive-science
techniques from Felienne Hermans' *The Programmer's Brain*. This spec covers a proof-of-concept
build for one subject — Spanish vocab + regular present-tense conjugation. The pedagogy engine
must generalize to other subjects later, but nothing beyond Spanish is built now.

This document compiles decisions made across the `wayfinder` map at
`.scratch/learning-app/map.md` (tickets 01-08, all closed). Each section below cites the ticket
it came from; consult the ticket for the full reasoning behind a decision.

## Standing constraints

- Personal, single-user tool. No auth, no accounts, no monetization, no social/multiplayer
  features.
- Web-only (no native mobile).
- The app surfaces which cognitive-science technique a given screen/exercise is using — the
  pedagogy is visible, not hidden behind the UI.

## Pedagogical foundation

Eight techniques from *The Programmer's Brain*, cataloged and synthesized in
[`docs/research/programmers-brain-techniques-synthesis.md`](docs/research/programmers-brain-techniques-synthesis.md)
(ticket 01): working memory limits, LTM/STM transfer, chunking, notional machines, roles of
variables (Sajaniemi), cognitive load types (intrinsic/extraneous/germane), misconception
patterns, spaced repetition/desirable difficulty.

Structural claims are corroborated across two independent research passes and safe to design
against. **Numeric specifics are not** — chunk capacity (2-6), the "2 days -> 25% LTM retention"
figure, and monthly/10-min-a-day review cadences were consistently reported but never confirmed
against the book's primary text. This spec treats them as starting defaults, not fixed constants
(see Review scheduling below, which adopts its own ladder rather than these numbers).

## Proof subject: Spanish (ticket 02)

**Scope:** core vocab (~50-100 words) + regular present-tense conjugation, -ar/-er/-ir verb
families only. No irregulars, no other tenses/moods in v1.

**Why Spanish:** natural-language vocab/grammar is maximally distinct from programming (the
book's own domain) — proving the engine here is the strongest test that its mechanics
(chunking, misconception repair, notional machines, working-memory management) generalize rather
than just re-deriving the book's own examples.

**Why this scope, not narrower or wider:** vocab-only would leave the notional-machine mechanic
unexercised (no hidden mechanism to model). Regular present-tense conjugation is the minimum
that exercises all four target mechanics:

| Mechanic | Spanish instantiation |
|---|---|
| Chunking | Verb families (-ar/-er/-ir) as reusable patterns, not memorized per-verb |
| Notional machine | The regular conjugation rule (stem + ending swap) as the hidden mechanism |
| Roles (analog) | Word/sentence-role tagging: subject, verb stem, ending, object |
| Misconceptions | False cognates (e.g. *embarazada*) and regular-vs-irregular overgeneralization |

Irregulars, additional tenses, and moods are out of scope for this proof — candidates for later
expansion once the engine is validated.

## Core learning loop (ticket 03)

**Exercise types** (2-3 per session, working-memory limit): recognition (word-meaning match),
production (fill-in conjugation), role-tagging (word/sentence role: subject, stem, ending,
object).

**Sequencing — I-do / We-do / You-do:**
1. Worked example with the notional machine shown explicitly (stem + ending swap).
2. Guided practice with hints.
3. Independent recall.

**Misconception detection:** exercises are seeded with known-misconception distractors (false
cognates, regular-vs-irregular overgeneralization). A wrong answer is mapped to the specific
misconception it matches, not scored as generic "wrong."

**Misconception repair:** immediate feedback names the misconception and re-shows the
notional-machine correction — not just the correct answer. A similar item is re-served
within-session shortly after, to verify the repair held.

**Chunk ordering:** blocked within session one — master -ar fully (all persons, several verbs)
before moving to -er, then -ir. One notional machine at a time for a first-timer. Interleaving
across families starts from session two onward, once each chunk is independently established.

**Advancement gate (chunk -> chunk):** 3 consecutive correct spanning **at least 2 of the 2-3
exercise types** before advancing. A single-type streak is gameable — cross-type correctness is
a closer proxy for the notional machine actually being internalized.

**Vocab gates conjugation:** a small vocab pool (~10-15 words) is mastered via recognition first;
conjugation drills then draw only from the mastered pool, growing alongside conjugation
progress. Keeps each exercise testing exactly one new thing at a time.

**Session boundary:** gate-driven, not fixed-count or time-boxed. A session runs until the
current chunk's advancement gate is hit, or the user quits.

## Review scheduling (ticket 04)

**Trigger — hybrid:** every session opens with a review block, but *which* chunks are due is
decided by real elapsed calendar time since last review, not session count.

**Interval ladder** (fixed, not adaptive — no per-item easiness factors):

```
1 day -> 3 days -> 7 days -> 14 days -> 30 days
```

One successful review advances one step. A miss resets fully to step 1 (not back-one-step).

**Review vs. new-chunk competition:** all-due review, capped at roughly 5-8 items per session so
a backlog day doesn't crowd out new-chunk work. Overflow rolls to the next session,
most-overdue-first. Review runs before new-chunk work.

**Review miss handling:** reuses the core loop's misconception-repair mechanic wholesale — named
feedback plus a within-session recheck — since a review miss may be the original misconception
resurfacing, not simple forgetting.

**Review exercise sourcing:** drawn from the same 2-3 exercise types as the chunk, not
recognition-only — recognizing a form isn't evidence the notional machine still holds under
production.

## Progress / mastery data model (ticket 05)

**Chunk granularity:** one chunk = one whole verb family (-ar, -er, -ir — 3 chunks total for v1).
Vocab words are tracked separately, not as chunks.

**Word mastery:** 2-in-a-row correct, single exercise type sufficient (vocab is atomic, unlike
conjugation — no cross-type requirement).

**Vocab review:** no separate ladder. Once mastered, words are exercised implicitly as
ingredients inside conjugation drills — no per-word decay/reminder mechanic in v1. Accepted risk:
a word that never recurs in later chunk content has no forgetting check.

**Miss behavior:** uniform everywhere — any miss resets the relevant streak to 0 (never
decrements, never partial-resets). Applies to word and chunk streaks alike, during both initial
learning and review.

**Chunk locking:** none. All 3 chunks are open in parallel from the start. "Session one = one
family" (ticket 03) is a session-content-selection rule, not a mastery gate.

**Review success grain:** reuses the exact advancement-gate mechanic (3-in-a-row spanning >=2
types) for every re-review. One live streak/types-seen pair per chunk does double duty: first
gate-clear = initial mastery; every subsequent gate-clear (when due) = a review success that
advances the ladder step.

**State shape:**

```
Word:
  id
  status: "learning" | "mastered"
  streak_count: 0-2          # resets to 0 on miss, mastered at 2

Chunk (3 total: -ar, -er, -ir):
  id
  mastered: bool             # false until first gate-clear
  mastered_date: date | null
  streak_count: 0-3          # resets to 0 on miss; live during both initial learning AND review
  types_in_streak: set<ExerciseType>   # cleared with streak_count; gate clears at count=3 AND |types|>=2
  ladder_step: 0-4 | null    # null until mastered_date set; index into [1,3,7,14,30] days
  last_reviewed_date: date | null
  next_due_date: date | null # = last_reviewed_date + ladder interval; set on mastery (day+1) and after each review clear
```

No separate event log, no per-word ladder, no chunk-lock/prerequisite field. Overdue ordering,
the review queue, and vocab-gates-conjugation are all queries over this state, not stored facts.

*Known limitation, non-blocking:* a review round can run long if the learner keeps missing —
same open-ended-until-clear behavior already accepted for new-content sessions.

## UI: technique transparency (ticket 06)

**Pattern — corner badge (Variant A):** a small expandable pill, top-right of each screen, naming
the active technique (e.g. "Notional machine", "Retrieval practice", "Named-error feedback").
Collapsed by default; tap/click expands a one-line explanation. Same pattern reused across all
four session-flow screens (worked example, guided practice, independent recall, misconception
repair) — single-column layout, nothing narrated unless the learner opens it.

Two other variants (margin rail, moment-only prose) were prototyped and rejected — see
`prototype/session-flow-technique-transparency.PROTOTYPE.html` for the comparison; only the
corner-badge pattern carries into the build.

## Content authoring (ticket 07)

v1 Spanish content (vocab pool, distractor sets, worked examples, misconception seeds) is
generated via LLM at build time, then fully manually reviewed before use — not hand-authored from
scratch, not generated at runtime. Reviewed content is saved as static data files in the repo
(e.g. `content/spanish/vocab.json`), version-controlled and diffable. No database, no CMS, no
authoring UI.

Future content work (fixing v1 content, adding a subject beyond Spanish) repeats this same
generate-then-review-then-edit-static-files process ad hoc — no authoring tooling is built now,
deferred until a second subject actually demands it.

## Tech stack / architecture (ticket 08)

- **Repo:** `learning_app/` is a git repo (initialized as part of this effort).
- **Frontend:** Vite + React, client-only SPA. No SSR, no routing framework beyond simple
  client-side state for session steps and the technique badge.
- **Content delivery:** static files from `content/spanish/*.json` (ticket 07) ship as part of
  the frontend bundle/source — not served by the backend.
- **Progress persistence:** a local `progress.json` file, not `localStorage` — survives
  browser-data clears, portable across browsers on the same machine.
- **Backend:** Node + Express, a handful of minimal REST endpoints (get state, record attempt
  outcome) reading/writing `progress.json`.
- **Hosting:** local-only, no deploy. Runs on the user's own machine (`npm run dev` plus a start
  script for the Express server). No cloud, no self-host — single-user personal tool.

### Suggested repo layout

```
learning_app/
  content/
    spanish/
      vocab.json
      distractors.json
      worked_examples.json
      misconceptions.json
  server/              # Express app: progress.json read/write endpoints
  src/                 # Vite + React frontend
  progress.json         # gitignored — per-user runtime state
  prototype/           # existing technique-transparency prototype (ticket 06)
  docs/research/        # existing technique catalog (ticket 01)
  .scratch/learning-app/ # wayfinder map + tickets (this spec's provenance)
```

## Out of scope (this proof)

- Auth, accounts, monetization, social/multiplayer features, native mobile — excluded by the
  destination itself (standing constraints), not by a closed ticket.
- Irregular verbs, tenses/moods beyond present, and any subject beyond Spanish.
- Content-authoring tooling (an authoring UI or script) — deferred until a second subject demands
  it.
- Cloud hosting / deployment / multi-device sync.

## Provenance

Every decision above traces to a closed ticket under `.scratch/learning-app/issues/`; the
tickets hold the full reasoning and rejected alternatives this spec omits for brevity. The
wayfinder map itself (`.scratch/learning-app/map.md`) is the index.
