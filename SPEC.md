# Meta-learning app — SPEC

Status: ready-for-agent

This document compiles decisions made across the `wayfinder` map at
`.scratch/learning-app/map.md` (tickets 01-08, all closed). Each section below cites the ticket
it came from; consult the ticket for the full reasoning behind a decision. Published in place
at `learning_app/SPEC.md` rather than under `.scratch/learning-app/spec.md` — the wayfinder
effort named this path as its destination directly, and the tracker's own tickets already live
alongside it under `.scratch/learning-app/`.

## Problem Statement

The user wants to learn a new skill (starting with Spanish vocab and basic conjugation) using
spaced repetition and deliberate practice, the way cognitive science says learning actually
sticks — chunking, worked examples before independent recall, misconceptions caught and
corrected by name, review timed to calendar forgetting curves. Existing apps (Duolingo, Anki,
etc.) either hide their pedagogy entirely or implement only one technique (e.g. bare spaced
repetition) without the surrounding scaffolding *The Programmer's Brain* describes for
programming education. There's no personal tool that applies that book's full technique set to
a non-programming subject and shows its work.

## Solution

A personal, single-user web app that runs a subject-agnostic "pedagogy engine" — chunked
content, I-do/We-do/You-do sequencing, seeded-misconception detection and repair, and a
calendar-driven review ladder — proven first against one small, general subject (Spanish vocab +
regular present-tense conjugation) before any other subject is attempted. Every screen names the
cognitive-science technique it's using via an expandable badge, so the pedagogy stays visible
rather than hidden inside the UI.

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

## User Stories

**Session structure and learning loop**

1. As a learner, I want each new-content session to teach one verb family at a time, so that I'm never juggling more than one notional machine at once.
2. As a learner, I want to see a fully worked example (I-do) before I'm asked to practice, so that I understand the mechanism before being tested on it.
3. As a learner, I want guided practice with hints (We-do) between the worked example and independent recall, so that the difficulty ramps up gradually.
4. As a learner, I want a final independent-recall step (You-do) with no hints, so that I know whether I've actually internalized the pattern.
5. As a learner, I want 2-3 different exercise types per session (recognition, production, role-tagging), so that my working memory isn't overloaded by a single repetitive drill.
6. As a learner, I want conjugation drills to only use vocab I've already mastered, so that each exercise tests exactly one new thing at a time.
7. As a learner, I want a session to end when I've clearly demonstrated mastery of the current chunk, not after a fixed number of questions or a timer, so that the session length matches how quickly I actually learn.
8. As a learner, I want verb families introduced one at a time (blocked) in my first session, then mixed together (interleaved) from my second session onward, so that I build a solid foundation before being asked to discriminate between families.

**Misconception detection and repair**

9. As a learner, I want wrong answers that match a known misconception (e.g. a false cognate, or overgeneralizing a regular pattern) to be recognized as that specific misconception, not just marked "wrong," so that I understand *why* I got it wrong.
10. As a learner, I want feedback that names my misconception and re-shows the correct notional machine, so that I can correct my mental model, not just memorize the right answer.
11. As a learner, I want to be re-tested on a similar item shortly after a misconception correction, so that I (and the app) can confirm the correction actually held.
12. As a learner, when I miss an item during review, I want the same named-misconception repair flow as during initial learning, so that a resurfacing misconception gets the same quality of correction as a first-time one.

**Progress gating and advancement**

13. As a learner, I want to advance from one verb family to the next only after answering correctly several times across at least two different exercise types, so that I can't game advancement by only ever practicing my strongest exercise type.
14. As a learner, I want any wrong answer to reset my current streak toward the next gate, so that mastery reflects consistent, current performance rather than an average over time.
15. As a learner, I want all three verb families available to start from day one (no artificial locking), so that "learn one family at a time" is guidance for how I structure a session, not a hard restriction on what I'm allowed to touch.

**Review and retention**

16. As a learner, I want a review block at the start of every session covering whatever content is actually due by calendar time, so that review timing tracks real forgetting rather than how often I happen to open the app.
17. As a learner, I want successfully-reviewed content to move to a longer interval before its next review (1, then 3, then 7, then 14, then 30 days), so that well-retained material is reviewed less often over time.
18. As a learner, I want a missed review item to reset fully to the shortest interval, so that content I'm clearly still shaky on gets revisited soon, not just one step sooner.
19. As a learner, I want review capped at roughly 5-8 items per session, so that a backlog day doesn't crowd out all my new-content learning.
20. As a learner, I want overflow review items (beyond the cap) to roll into future sessions in most-overdue-first order, so that nothing due gets silently dropped.
21. As a learner, I want review exercises to be drawn from the same mix of exercise types as new content (not recognition-only), so that review actually tests whether I can still produce the form, not just recognize it.
22. As a learner, I want mastered vocab to keep showing up as an ingredient inside later conjugation drills, so that words I've learned don't silently fade from practice even without a dedicated vocab review schedule.

**Technique transparency**

23. As a learner, I want to see a small badge on every screen naming the cognitive-science technique currently in play (e.g. "Notional machine," "Retrieval practice"), so that I understand the pedagogy behind what I'm doing.
24. As a learner, I want that badge collapsed by default and expandable on demand, so that the explanation doesn't clutter the screen when I don't want it.
25. As a learner, I want the same badge pattern used consistently across the worked example, guided practice, independent recall, and misconception-repair screens, so that I always know where to look for it.

**Content and persistence**

26. As a learner, I want my progress (which words/chunks I've mastered, current streaks, review due dates) to persist across browser sessions and survive clearing browser data, so that I don't lose progress by accident.
27. As a learner, I want the app to run entirely on my own machine with no account or login, so that using it has zero setup friction and no data leaves my machine.
28. As a developer of this app, I want v1 Spanish content (vocab, distractors, worked examples, misconception seeds) authored once via LLM generation plus manual review and shipped as static version-controlled files, so that content quality is checked before it reaches a learner without needing to build authoring tooling for a single-subject proof.

## Implementation Decisions

### Proof subject: Spanish (ticket 02)

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

### Core learning loop (ticket 03)

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

### Review scheduling (ticket 04)

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

### Progress / mastery data model (ticket 05)

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

### UI: technique transparency (ticket 06)

**Pattern — corner badge (Variant A):** a small expandable pill, top-right of each screen, naming
the active technique (e.g. "Notional machine", "Retrieval practice", "Named-error feedback").
Collapsed by default; tap/click expands a one-line explanation. Same pattern reused across all
four session-flow screens (worked example, guided practice, independent recall, misconception
repair) — single-column layout, nothing narrated unless the learner opens it.

Two other variants (margin rail, moment-only prose) were prototyped and rejected — see
`prototype/session-flow-technique-transparency.PROTOTYPE.html` for the comparison; only the
corner-badge pattern carries into the build.

### Content authoring (ticket 07)

v1 Spanish content (vocab pool, distractor sets, worked examples, misconception seeds) is
generated via LLM at build time, then fully manually reviewed before use — not hand-authored from
scratch, not generated at runtime. Reviewed content is saved as static data files in the repo
(e.g. `content/spanish/vocab.json`), version-controlled and diffable. No database, no CMS, no
authoring UI.

Future content work (fixing v1 content, adding a subject beyond Spanish) repeats this same
generate-then-review-then-edit-static-files process ad hoc — no authoring tooling is built now,
deferred until a second subject actually demands it.

### Tech stack / architecture (ticket 08)

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

#### Suggested repo layout

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

## Testing Decisions

**Seam: the pedagogy engine, as plain functions — no DOM, no HTTP, no filesystem.** Confirmed
with the user when this spec was written (over UI-component tests and Express integration
tests as alternatives) as the single highest-value seam: one framework-free module of pure
functions, `(progress state, attempt) -> (new progress state, next exercise stimulus)`, that the
React frontend and Express backend both wrap thinly. This is a proof-of-concept build with no
code written yet, so there's no existing seam to prefer — this is the seam to establish going
forward.

**What a good test looks like here:** assert on the engine's external behavior — the state
transition and the next stimulus it returns for a given input — never on internal representation
of that state. Concretely:

- Advancement gate: given a sequence of correct/incorrect attempts across exercise types, does
  the chunk's `mastered` flag flip at exactly the point the gate rule (3-in-a-row, >=2 types)
  is satisfied, and not before?
- Streak reset: does any single miss reset `streak_count` and `types_in_streak` to zero,
  regardless of how long the prior streak was?
- Misconception mapping: given a wrong answer matching a seeded distractor, does the engine
  return the specific misconception it matches (not a generic "incorrect")?
- Review-due queries: given a set of chunks with varying `last_reviewed_date`/`ladder_step`,
  does the engine select the correct due set, in most-overdue-first order, capped at the
  session limit?
- Ladder advancement/reset: does a successful review advance exactly one ladder step, and a
  missed review reset fully to step 1?

**Modules tested:** the engine functions covering advancement gating, streak/miss handling,
misconception detection, and review-due scheduling (tickets 03-05). React components and Express
routes are thin wrappers around this engine and are not tested directly in v1 — a bug there
would show up as the engine receiving/returning the wrong shape, not as engine logic error.

**Prior art:** none — this is a from-scratch repo with no test suite yet. The first ticket that
touches the engine establishes the pattern (a plain unit-test runner against pure functions;
Vitest is the natural fit given the Vite frontend, but the runner choice itself is an
implementation detail for `/to-tickets` and `/implement` to settle, not fixed by this spec).

## Out of scope (this proof)

- Auth, accounts, monetization, social/multiplayer features, native mobile — excluded by the
  destination itself (standing constraints), not by a closed ticket.
- Irregular verbs, tenses/moods beyond present, and any subject beyond Spanish.
- Content-authoring tooling (an authoring UI or script) — deferred until a second subject demands
  it.
- Cloud hosting / deployment / multi-device sync.

## Further Notes

**Provenance:** every decision above traces to a closed ticket under
`.scratch/learning-app/issues/`; the tickets hold the full reasoning and rejected alternatives
this spec omits for brevity. The wayfinder map itself (`.scratch/learning-app/map.md`) is the
index.

**Numeric specifics are starting defaults, not validated constants** (see Pedagogical
foundation above) — chunk capacity, retention-decay figures, and review cadences were reported
consistently across research but never confirmed against the book's primary text. Revisit if v1
usage suggests they're off.

**Known non-blocking limitation:** a review round can run arbitrarily long if the learner keeps
missing the same items — the same open-ended-until-gate-clear behavior already accepted for
new-content sessions (ticket 05).
