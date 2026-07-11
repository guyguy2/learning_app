/**
 * Pure helpers for cross-session review as a re-run of the advancement gate.
 * Review reuses chunk.streak_count / chunk.types_in_streak (double duty). A just-mastered
 * chunk still carries streak_count === 3 with >=2 types, so review resets those on entry,
 * then requires a fresh 3-in-a-row spanning >=2 exercise types to clear.
 *
 * checkGate cannot be used here: it is guarded by !mastered and never fires for mastered
 * chunks. No clock reads; no mutation of inputs.
 */

/**
 * Reset streak fields when entering a chunk's review so the prior mastery streak
 * does not insta-clear the review gate.
 *
 * @param {object} chunk
 * @returns {object} new chunk with streak_count 0 and empty types_in_streak
 */
export function resetReviewStreak(chunk) {
  return {
    ...chunk,
    streak_count: 0,
    types_in_streak: [],
  }
}

/**
 * Whether a mastered chunk under review has cleared the review gate
 * (3-in-a-row spanning >=2 types). Reads fields directly — not checkGate.
 *
 * @param {object} chunk
 * @returns {boolean}
 */
export function isReviewGateCleared(chunk) {
  return (
    chunk.streak_count === 3 && (chunk.types_in_streak?.length ?? 0) >= 2
  )
}

/**
 * Alternate between the two producible drill types so a review spans >=2 types.
 * production <-> role-tagging; null/undefined starts at production.
 *
 * @param {string | null | undefined} lastType
 * @returns {'production' | 'role-tagging'}
 */
export function nextReviewDrillType(lastType) {
  if (lastType === 'production') return 'role-tagging'
  return 'production'
}
