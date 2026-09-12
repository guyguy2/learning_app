/**
 * Subject plugin contract. See src/subjects/README.md for the prose version.
 *
 * A subject is split across two files so the pedagogy engine never imports React:
 *   - `<subject>/index.js` (default export): everything below except `ui`. Framework-free.
 *   - `<subject>/ui.jsx`   (default export): the `ui` object (Desk card components).
 * The registry (src/subjects/index.js) joins them into one Subject object.
 *
 * @typedef {Object} Chunk
 * @property {string} id     Stable id persisted in progress.chunks[].id
 * @property {string} label  Display label (Spanish: "-ar"; programming: "Closures")
 *
 * @typedef {Object} AttemptResult
 * @property {object} progress       Updated progress (pure; input not mutated)
 * @property {object|null} next      Stimulus to re-serve after a miss (the repair retest)
 * @property {boolean} [gateCleared] True when this attempt cleared the chunk's advancement gate
 *
 * @typedef {Object} Repair
 * @property {{id: string, name: string, explanation: string}|null} misconception
 *   Catalog entry. null only when a distractor matched but the catalog has no such id.
 * @property {string|null} [notionalMachine]  Correct mental model to re-show, if any
 *
 * @typedef {Object} Exercise
 * @property {(progress: object, chunkId: string, content: object) => object|null} nextStimulus
 *   Next stimulus of this type for the chunk, or null when none is available right now.
 *   A non-null stimulus has `type` equal to the exercise type.
 * @property {(progress: object, attempt: object, content: object, today?: string) => AttemptResult} apply
 *   Apply a graded attempt. Owns what the attempt updates (chunk gate streak, item mastery,
 *   scaffold phase). An attempt with `action: 'worked_example_ack'` acknowledges a worked example.
 * @property {(attempt: object, stimulus: object) => boolean} grade
 *   Whether `attempt.given` answers `stimulus`. UI cards call this to set `attempt.correct`;
 *   the runner trusts `attempt.correct` and does not regrade.
 * @property {(result: {correct: boolean, attempt: object}, stimulus: object) => string} feedback
 *   One-line feedback after a correct attempt, or after a miss with no named misconception.
 * @property {(stimulus: object) => string|null} expectedAnswer
 *   The correct answer to re-show on a miss; null when it is not a single string.
 * @property {(attempt: object, stimulus: object, content: object) => Repair|null} [repairFor]
 *   Named-misconception repair for a wrong attempt, or null for a generic miss.
 *
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} displayName
 * @property {string[]} exerciseTypes
 *   Ordered new-content rotation. Every type here has an entry in `exercises`, `techniques`, `ui.cards`.
 * @property {string[]} reviewTypes
 *   Types alternated during review. These must be types whose `apply` advances the chunk gate,
 *   and there must be at least two, or the review gate (3 in a row over >=2 types) can never clear.
 * @property {string|null} scaffoldType
 *   The exercise type that fades worked example -> guided -> independent (progress field
 *   `production_phase`). null if the subject has no worked examples.
 * @property {(content: object) => Chunk[]} chunks  Ordered chunks (session one is blocked in this order)
 * @property {(progress: object, chunkId: string, content: object) => string} [firstExerciseType]
 *   Where the rotation starts for a chunk when there is no previous type. Default: exerciseTypes[0].
 * @property {(progress: object, chunkId: string, content: object) => boolean} [scaffoldReady]
 *   From session two, whether a chunk still on its worked example can be introduced now. Default: true.
 * @property {Object<string, Exercise>} exercises
 * @property {object} content  Default content pool (the subject's content/<id>/*.json files)
 * @property {(content: object) => void} validate  Throws an Error naming the first malformed entry
 * @property {Object<string, {techniqueName: string, explanation: string}>} techniques
 *   Badge map: one entry per exercise type, plus the engine phases `review` and `repair`.
 * @property {Object<string, (content: object, options?: {referenceDate?: Date}) => object>} seeds
 *   Seed scenario -> progress builder, used by POST /api/progress/seed and /reset. `fresh` is
 *   required (reset writes it); `review-due` is expected. Builders live in `<subject>/seeds.js`,
 *   which must not import JSON so the Node server can load it (see server/seeds.js).
 * @property {SubjectUi} [ui]  Present on subjects returned by the registry
 *
 * @typedef {Object} SubjectUi
 * @property {Object<string, Function>} cards
 *   Exercise type -> Desk card component. Props: { stimulus, attemptCount, onSubmit, technique }.
 * @property {Object<string, Function>} [repairDetails]
 *   Exercise type -> component shown inside the named-misconception repair panel.
 *   Props: { repair, lastAttempt, family }.
 * @property {(chunkId: string) => string} [chunkColor]  CSS color for the card accent
 * @property {(stimulus: object) => string|undefined} [chunkOf]
 *   Chunk id for a stimulus that does not carry `chunkId` (Spanish vocabulary words)
 * @property {Object<string, string>} [copy]  Overrides for Desk start/summary/repair wording
 */

/**
 * Look up an exercise type on a subject. Throws on an unknown type rather than guessing.
 * @param {Subject} subject
 * @param {string} type
 * @returns {Exercise}
 */
export function exerciseFor(subject, type) {
  const exercise = subject.exercises[type]
  if (!exercise) {
    throw new Error(`subject "${subject.id}" has no exercise type "${type}"`)
  }
  return exercise
}

/**
 * Fill any missing content keys from the subject's default content. Keys are the ones the
 * default content defines; a null or undefined value falls back to the default.
 * @param {Subject} subject
 * @param {object} [content]
 */
export function resolveSubjectContent(subject, content) {
  if (!content) return subject.content
  return Object.fromEntries(
    Object.keys(subject.content).map((key) => [key, content[key] ?? subject.content[key]]),
  )
}

/** Ordered chunk ids for a subject's content. */
export function chunkOrder(subject, content) {
  return subject.chunks(content ?? subject.content).map((c) => c.id)
}
