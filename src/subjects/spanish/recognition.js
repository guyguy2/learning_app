import { itemStatus, recordItemAttempt } from '../../engine/itemMastery.js'
import { recognitionPool } from './newContentSchedule.js'

function pickStimulus(vocabPool, words, preferredId) {
  const unmastered = vocabPool.filter((v) => itemStatus(v.id, words) !== 'mastered')
  if (unmastered.length === 0) return null
  const preferred = unmastered.find((v) => v.id === preferredId)
  return { type: 'recognition', word: preferred ?? unmastered[0] }
}

/** First unmastered word in the pool, as a recognition stimulus. */
export function getNextStimulus(progressState, vocabPool) {
  return pickStimulus(vocabPool, progressState.words, null)
}

/** Recognition stimulus for a chunk: family verbs first, then other vocabulary. */
export function getNextRecognitionStimulus(progressState, chunkId, contentPool) {
  return getNextStimulus(progressState, recognitionPool(progressState, contentPool.vocab, chunkId))
}

/**
 * Spanish recognition feeds word mastery (progress.words), not the chunk gate.
 * `contentPool` is the full content object, or a bare vocab array (the older
 * wordMastery.applyAttempt calling convention).
 */
export function applyRecognitionAttempt(progressState, attempt, contentPool) {
  const vocabPool = Array.isArray(contentPool) ? contentPool : contentPool.vocab
  const { wordId, correct } = attempt
  const { progress, justMastered } = recordItemAttempt(progressState, wordId, correct)
  const next = pickStimulus(vocabPool, progress.words, justMastered ? null : wordId)
  return { progress, next }
}
