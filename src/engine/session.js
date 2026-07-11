import { dueChunks } from './review.js'
import { selectChunkForSession } from './sessionPlan.js'

/**
 * Assemble one learning session: review block first, then new-content work (ticket 17).
 * Pure — caller supplies `today` (ISO YYYY-MM-DD) and `sessionNumber` rather than the
 * engine reading the clock. Does not mutate progressState.
 *
 * @returns {{ reviewChunkIds: string[], newChunkId: string|null, phase: 'review'|'new'|'done' }}
 */
export function buildSession(progressState, { sessionNumber, today, reviewCap = 8 }) {
  const reviewChunkIds = dueChunks(progressState.chunks, today, reviewCap).map((c) => c.id)
  const newChunkId = selectChunkForSession(progressState, sessionNumber)

  let phase
  if (reviewChunkIds.length > 0) {
    phase = 'review'
  } else if (newChunkId != null) {
    phase = 'new'
  } else {
    phase = 'done'
  }

  return { reviewChunkIds, newChunkId, phase }
}

/** Ordered chunk-id sequence for the session: review block, then the new chunk (if any). */
export function sessionOrder(progressState, opts) {
  const { reviewChunkIds, newChunkId } = buildSession(progressState, opts)
  return newChunkId == null ? reviewChunkIds : [...reviewChunkIds, newChunkId]
}
