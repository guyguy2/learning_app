/**
 * newContentSchedule - pure recognition-pool scheduler
 */

/**
 * Checks if a chunk's family has at least one verb that is not yet mastered in progress.words.
 *
 * @param {Object} progress - The current progress state
 * @param {Array} progress.words - Array of word status entries (e.g. { id, status, streak_count })
 * @param {Array} vocab - The complete vocabulary array
 * @param {string} chunkId - The family identifier (e.g., 'ar', 'er', 'ir')
 * @returns {boolean} true if at least one verb in the family is not mastered
 */
export function familyVerbsRemaining(progress, vocab, chunkId) {
  const words = progress?.words || []
  const familyVerbs = vocab.filter((w) => w.pos === 'verb' && w.family === chunkId)
  if (familyVerbs.length === 0) {
    return false
  }
  return familyVerbs.some((verb) => {
    const progressWord = words.find((w) => w.id === verb.id)
    return !progressWord || progressWord.status !== 'mastered'
  })
}

/**
 * Decides which vocab subset recognition should draw from.
 *
 * @param {Object} progress - The current progress state
 * @param {Array} vocab - The complete vocabulary array
 * @param {string} chunkId - The family identifier (e.g., 'ar', 'er', 'ir')
 * @returns {Array} A filtered copy of vocab matching the active subset
 */
export function recognitionPool(progress, vocab, chunkId) {
  if (familyVerbsRemaining(progress, vocab, chunkId)) {
    return vocab.filter((w) => w.pos === 'verb' && w.family === chunkId)
  } else {
    return vocab.filter((w) => w.pos !== 'verb')
  }
}
