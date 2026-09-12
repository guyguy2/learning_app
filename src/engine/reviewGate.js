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

// Fallback for callers that pass no types (the unit tests); the session runner always
// passes the active subject's reviewTypes.
const DEFAULT_REVIEW_TYPES = ['production', 'role-tagging']

/**
 * Cycle through the subject's review types so a review spans >=2 types.
 * Spanish: production <-> role-tagging. null/undefined or an unknown type starts at the first.
 *
 * @param {string | null | undefined} lastType
 * @param {string[]} [types] the subject's reviewTypes
 * @returns {string}
 */
export function nextReviewDrillType(lastType, types = DEFAULT_REVIEW_TYPES) {
  const index = types.indexOf(lastType)
  return types[(index + 1) % types.length]
}
