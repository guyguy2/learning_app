import spanish from '../subjects/spanish/index.js'
import { exerciseFor } from '../subjects/contract.js'

// Spanish vocabulary stimulus picker, kept here for existing callers.
export { getNextStimulus } from '../subjects/spanish/recognition.js'

/**
 * Apply one attempt: `(progressState, attempt) -> { progress, next }`, dispatched to the
 * subject's exercise for `attempt.type`. Each exercise owns what an attempt updates
 * (item mastery for Spanish recognition, the chunk gate for conjugation drills).
 */
export function applyAttempt(progressState, attempt, contentPool, today, subject = spanish) {
  return exerciseFor(subject, attempt.type).apply(progressState, attempt, contentPool, today)
}
