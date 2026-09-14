# Subject plugins

The pedagogy engine (`src/engine/`) knows how to run a session: review first, then new
content, the advancement gate (3 correct in a row spanning at least 2 exercise types), the
1 / 3 / 7 / 14 / 30 day review ladder, worked example to guided to independent fading, and
misconception repair. It does not know what is being learned. Everything subject-specific
lives behind the contract described here and in JSDoc form in [`contract.js`](contract.js).

Two subjects are registered:

| id | Chunks | Exercise types | Content |
|---|---|---|---|
| `spanish` (default) | `ar`, `er`, `ir` verb families | `recognition`, `production`, `role-tagging` | `content/spanish/` |
| `programming` | `scope`, `closures`, `iteration`, `off-by-one`, `references`, `equality`, `async` | `recognition`, `completion` | `content/programming/` |

The Desk overview and summary cards show a picker listing every registered subject by
`displayName` (`listSubjects()` in `index.js`). The subject opens from the `?subject=` query
parameter (for example `http://localhost:5173/?subject=programming`), else the last picked
subject remembered in localStorage, else Spanish. Unknown ids are skipped.

## Files

Each subject is split in two so the engine never imports React:

- `<subject>/index.js`: the framework-free subject module (default export). The engine
  imports Spanish from here as its default subject.
- `<subject>/ui.jsx`: the Desk UI for the subject (default export).
- `<subject>/seeds.js`: seed scenario builders. It must not import JSON, because the Node
  server loads it directly; it exports `scenarios` and the `contentFiles` the builders read.
- `index.js` (this directory): the registry. `getSubject(id)` joins a subject module with its
  UI into one Subject object and validates its content on first lookup.

## The contract

A subject module exports:

| Field | Purpose |
|---|---|
| `id`, `displayName` | Registry key and a human name. |
| `exerciseTypes` | Ordered new-content rotation. The runner cycles through these, skipping types with no stimulus. |
| `reviewTypes` | Types alternated during review. They must advance the chunk gate and there must be at least two, or the review gate can never clear. Spanish leaves out `recognition`, which feeds word mastery instead. |
| `scaffoldType` | The type that fades worked example -> guided -> independent (Spanish `production`, programming `completion`), or `null`. |
| `chunks(content)` | Ordered `{ id, label }` list: the units the gate and ladder track. Session one works through them in this order. |
| `firstExerciseType(progress, chunkId, content)` | Optional. Where the rotation starts for a chunk. Default: the first exercise type. |
| `scaffoldReady(progress, chunkId, content)` | Optional. From session two, whether a chunk still on its worked example can be introduced. Default: `true`, which introduces every waiting chunk back to back. Spanish waits until a verb in the family is mastered; programming waits until every earlier chunk is mastered, so one worked example arrives at a time. |
| `exercises[type]` | One entry per exercise type, see below. |
| `content` | The default content pool. |
| `validate(content)` | Throws an `Error` naming the first malformed entry. |
| `techniques` | Badge map: `{ techniqueName, explanation }` per exercise type, plus `review` and `repair`. |
| `seeds` | Seed scenario name -> `(content, { referenceDate }) => progress`, from `seeds.js`. `fresh` is required (reset writes it) and `review-due` is expected. Spanish adds `mid`; programming adds `mid` and `late`. |

Each `exercises[type]` provides:

| Function | Purpose |
|---|---|
| `nextStimulus(progress, chunkId, content)` | The next stimulus of this type, or `null` if none is available now. A stimulus has `type` equal to the exercise type. |
| `apply(progress, attempt, content, today)` | Applies a graded attempt and returns `{ progress, next, gateCleared }`. The exercise decides what the attempt updates: the chunk gate streak, item mastery, or the scaffold phase (`action: 'worked_example_ack'`). |
| `grade(attempt, stimulus)` | Whether `attempt.given` answers the stimulus. Desk cards call it to set `attempt.correct`. The runner trusts `attempt.correct` and does not regrade. |
| `feedback({ correct, attempt }, stimulus)` | One-line text for the correct-answer strip and for a miss with no named misconception. |
| `expectedAnswer(stimulus)` | The answer to re-show on a miss, or `null` when it is not one string (Spanish role tagging). |
| `repairFor(attempt, stimulus, content)` | Optional. `{ misconception, notionalMachine }` when a wrong answer matches a seeded distractor, else `null`. |

The joined Subject also carries `ui`:

| Field | Purpose |
|---|---|
| `cards[type]` | Desk card component per exercise type. Props: `{ stimulus, attemptCount, onSubmit, technique }`. Define these at module level so React keeps their identity. |
| `repairDetails[type]` | Optional component shown in the named-misconception repair panel. Props: `{ repair, lastAttempt, family }`. |
| `chunkColor(chunkId)` | Optional card accent colour. |
| `chunkOf(stimulus)` | Optional chunk id for stimuli that do not carry `chunkId` (Spanish vocabulary words). |
| `copy` | Optional overrides for the Desk start, summary, and repair wording (see `src/desk/copy.js`). |

## Progress

Progress is the SPEC ticket 05 shape (`session_number`, `words`, `chunks`). Chunk ids come
from `chunks(content)`. Spanish keeps vocabulary mastery in `words`; programming keeps one
entry per item there (with an `attempts` count) so it can serve each chunk's least-practised
item and rotate through the whole pool. The scaffold phase is stored in `chunk.production_phase` for every
subject; the name predates the contract and is kept so existing `progress.json` files stay
valid. `src/engine/chunkProgress.js` has the shared chunk helpers (`initialProgress`,
`recordChunkAttempt`, `acknowledgeWorkedExample`) and `src/engine/itemMastery.js` the shared
item-mastery rule, so a new subject rarely writes its own streak logic.

The server keeps Spanish in `progress.json` and any other subject in `progress.<id>.json`
(`GET`/`POST /api/progress?subject=<id>`). A subject with no saved file starts from
`initialProgress` of its own chunks. `POST /api/progress/reset?subject=<id>` writes the
subject's `fresh` seed and `POST /api/progress/seed?subject=<id>` writes one of its scenarios.

## Adding a subject

1. Add content under `content/<id>/` and a `validate` that rejects malformed entries.
2. Write `src/subjects/<id>/index.js` implementing the contract and `ui.jsx` with its cards.
3. Write `src/subjects/<id>/seeds.js` with at least `fresh` and `review-due`, expose its
   `scenarios` as the module's `seeds`, and add the file to `SUBJECT_SEEDS` in `server/seeds.js`.
4. Register the module and UI in `src/subjects/index.js`. The Desk picker lists it automatically.
5. `src/subjects/contract.test.js` runs its conformance checks against every registered
   subject automatically, including its seeds; `server/seeds.test.js` fails if the server
   has no seeds for a registered subject. Add grading and end-to-end session tests alongside the subject, as
   `programming/programming.test.js` does.
