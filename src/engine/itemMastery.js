/**
 * Subject-free item mastery (SPEC ticket 05): an atomic item (a Spanish word, for example)
 * is mastered after MASTERY_STREAK correct answers in a row; any miss resets its streak to 0;
 * a mastered item never decays back to learning. Items live in progress.words.
 */
export const MASTERY_STREAK = 2

export function itemStatus(itemId, words) {
  return words.find((w) => w.id === itemId)?.status ?? 'learning'
}

/**
 * Record one attempt against an item. Pure: returns a new progress object.
 * @returns {{ progress: object, justMastered: boolean }}
 */
export function recordItemAttempt(progressState, itemId, correct) {
  const words = progressState.words.map((w) => ({ ...w }))
  let word = words.find((w) => w.id === itemId)
  if (!word) {
    word = { id: itemId, status: 'learning', streak_count: 0 }
    words.push(word)
  }

  let justMastered = false
  if (correct) {
    if (word.status !== 'mastered') {
      word.streak_count += 1
      if (word.streak_count >= MASTERY_STREAK) {
        word.status = 'mastered'
        justMastered = true
      }
    }
  } else {
    word.streak_count = 0
  }

  return { progress: { ...progressState, words }, justMastered }
}
