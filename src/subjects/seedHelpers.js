/**
 * Helpers shared by the subjects' seed builders (<subject>/seeds.js). Framework-free and free
 * of JSON imports so the Node server can load the seed builders directly.
 */
import { defaultChunk } from '../engine/chunkProgress.js'

export function getYesterdayIso(referenceDate = new Date()) {
  const d = new Date(referenceDate)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** A chunk introduced but not yet mastered: its worked example is done, drills are guided. */
export function guidedChunk(id) {
  return { ...defaultChunk(id), production_phase: 'guided' }
}

/** A chunk mastered on `date` whose first review (ladder step 0) fell due on `date`. */
export function reviewDueChunk(id, date) {
  return {
    ...guidedChunk(id),
    mastered: true,
    mastered_date: date,
    ladder_step: 0,
    last_reviewed_date: date,
    next_due_date: date,
  }
}
