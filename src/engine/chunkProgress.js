import { checkGate, todayIso } from './advancement.js'

/**
 * Subject-free chunk progress helpers. A chunk is whatever unit a subject's gate and
 * review ladder track (Spanish: a verb family; programming: a concept group).
 *
 * `production_phase` is the persisted scaffold-fading field (worked_example -> guided ->
 * independent) for whichever exercise type a subject marks as its `scaffoldType`. The name
 * predates the subject contract and is kept so existing progress.json files stay valid.
 */

export const GATE_STREAK_CAP = 3

export function findChunk(chunks, chunkId) {
  return chunks.find((c) => c.id === chunkId)
}

export function scaffoldPhase(chunk) {
  return chunk?.production_phase ?? 'worked_example'
}

/** A fresh, never-attempted chunk in the persisted progress shape (SPEC ticket 05). */
export function defaultChunk(id) {
  return {
    id,
    mastered: false,
    mastered_date: null,
    streak_count: 0,
    types_in_streak: [],
    ladder_step: null,
    last_reviewed_date: null,
    next_due_date: null,
    production_phase: 'worked_example',
  }
}

/** Fresh progress for an ordered list of chunk ids. */
export function initialProgress(chunkIds) {
  return {
    session_number: 1,
    words: [],
    chunks: chunkIds.map(defaultChunk),
  }
}

/**
 * Record a graded attempt against a chunk's gate streak: a correct answer extends the
 * streak (capped) and adds the exercise type; a miss resets both. With `advanceScaffold`,
 * an attempt made in the guided phase moves the chunk to independent recall.
 * Pure: returns new progress. Does not mutate the input.
 *
 * @returns {{ progress: object, gateCleared: boolean }}
 */
export function recordChunkAttempt(
  progressState,
  chunkId,
  exerciseType,
  correct,
  today = todayIso(),
  { advanceScaffold = false } = {},
) {
  const chunks = progressState.chunks.map((c) => ({ ...c, types_in_streak: [...(c.types_in_streak ?? [])] }))
  const chunkIndex = chunks.findIndex((c) => c.id === chunkId)
  const chunk = chunks[chunkIndex]
  const phaseBefore = scaffoldPhase(chunk)

  if (correct) {
    chunk.streak_count = Math.min((chunk.streak_count ?? 0) + 1, GATE_STREAK_CAP)
    if (!chunk.types_in_streak.includes(exerciseType)) {
      chunk.types_in_streak.push(exerciseType)
    }
  } else {
    chunk.streak_count = 0
    chunk.types_in_streak = []
  }
  if (advanceScaffold && phaseBefore === 'guided') {
    chunk.production_phase = 'independent'
  }

  const gated = checkGate(chunk, today)
  chunks[chunkIndex] = gated.chunk
  return { progress: { ...progressState, chunks }, gateCleared: gated.gateCleared }
}

/** The learner finished studying the worked example: move the chunk to guided practice. */
export function acknowledgeWorkedExample(progressState, chunkId) {
  return {
    ...progressState,
    chunks: progressState.chunks.map((c) =>
      c.id === chunkId ? { ...c, production_phase: 'guided' } : c,
    ),
  }
}
