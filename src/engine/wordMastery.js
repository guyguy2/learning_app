import { applyProductionAttempt } from '../subjects/spanish/conjugation.js'
import { applyRoleTaggingAttempt } from '../subjects/spanish/roleTagging.js'

const MASTERY_STREAK = 2

function statusOf(wordId, words) {
  return words.find((w) => w.id === wordId)?.status ?? 'learning'
}

function pickStimulus(vocabPool, words, preferredId) {
  const unmastered = vocabPool.filter((v) => statusOf(v.id, words) !== 'mastered')
  if (unmastered.length === 0) return null
  const preferred = unmastered.find((v) => v.id === preferredId)
  return { type: 'recognition', word: preferred ?? unmastered[0] }
}

export function getNextStimulus(progressState, vocabPool) {
  return pickStimulus(vocabPool, progressState.words, null)
}

export function applyAttempt(progressState, attempt, contentPool, today) {
  if (attempt.type === 'production') {
    return applyProductionAttempt(progressState, attempt, contentPool, today)
  }
  if (attempt.type === 'role-tagging') {
    return applyRoleTaggingAttempt(progressState, attempt, contentPool, today)
  }

  const vocabPool = contentPool
  const { wordId, correct } = attempt
  const words = progressState.words.map((w) => ({ ...w }))
  let word = words.find((w) => w.id === wordId)
  if (!word) {
    word = { id: wordId, status: 'learning', streak_count: 0 }
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

  const progress = { ...progressState, words }
  const next = pickStimulus(vocabPool, words, justMastered ? null : wordId)
  return { progress, next }
}
