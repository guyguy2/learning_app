import { describe, expect, it } from 'vitest'
import { applyAttempt, getNextStimulus } from './wordMastery.js'

const VOCAB = [
  { id: 'hablar', word: 'hablar', meaning: 'to speak', pos: 'verb', family: 'ar' },
  { id: 'comer', word: 'comer', meaning: 'to eat', pos: 'verb', family: 'er' },
]

const EMPTY_PROGRESS = { words: [], chunks: [] }

describe('applyAttempt — word mastery', () => {
  it('flips a word from learning to mastered after 2 consecutive correct answers', () => {
    const attempt1 = { type: 'recognition', wordId: 'hablar', correct: true }
    const { progress: afterFirst } = applyAttempt(EMPTY_PROGRESS, attempt1, VOCAB)
    const wordAfterFirst = afterFirst.words.find((w) => w.id === 'hablar')
    expect(wordAfterFirst.status).toBe('learning')
    expect(wordAfterFirst.streak_count).toBe(1)

    const attempt2 = { type: 'recognition', wordId: 'hablar', correct: true }
    const { progress: afterSecond } = applyAttempt(afterFirst, attempt2, VOCAB)
    const wordAfterSecond = afterSecond.words.find((w) => w.id === 'hablar')
    expect(wordAfterSecond.status).toBe('mastered')
    expect(wordAfterSecond.streak_count).toBe(2)
  })

  it('resets streak_count to 0 on a wrong answer, regardless of prior streak length', () => {
    const wrongAttempt = { type: 'recognition', wordId: 'hablar', correct: false }

    const { progress: fromFreshStreak } = applyAttempt(EMPTY_PROGRESS, wrongAttempt, VOCAB)
    expect(fromFreshStreak.words.find((w) => w.id === 'hablar').streak_count).toBe(0)

    const oneCorrectFirst = applyAttempt(
      EMPTY_PROGRESS,
      { type: 'recognition', wordId: 'hablar', correct: true },
      VOCAB,
    ).progress
    expect(oneCorrectFirst.words.find((w) => w.id === 'hablar').streak_count).toBe(1)

    const { progress: afterMiss } = applyAttempt(oneCorrectFirst, wrongAttempt, VOCAB)
    const wordAfterMiss = afterMiss.words.find((w) => w.id === 'hablar')
    expect(wordAfterMiss.streak_count).toBe(0)
    expect(wordAfterMiss.status).toBe('learning')
  })

  it('does not decay a mastered word back to learning on a later miss', () => {
    const mastered = applyAttempt(
      applyAttempt(EMPTY_PROGRESS, { type: 'recognition', wordId: 'hablar', correct: true }, VOCAB)
        .progress,
      { type: 'recognition', wordId: 'hablar', correct: true },
      VOCAB,
    ).progress

    const { progress: afterMiss } = applyAttempt(
      mastered,
      { type: 'recognition', wordId: 'hablar', correct: false },
      VOCAB,
    )
    expect(afterMiss.words.find((w) => w.id === 'hablar').status).toBe('mastered')
  })

  it('returns the next unmastered word as the stimulus, retrying the same word after a correct-but-not-yet-mastered answer', () => {
    const { progress, next } = applyAttempt(
      EMPTY_PROGRESS,
      { type: 'recognition', wordId: 'hablar', correct: true },
      VOCAB,
    )
    expect(next).toEqual({ type: 'recognition', word: VOCAB[0] })
    expect(progress.words.find((w) => w.id === 'hablar').streak_count).toBe(1)
  })

  it('rotates to the next unmastered word once the current word is mastered', () => {
    const afterFirst = applyAttempt(
      EMPTY_PROGRESS,
      { type: 'recognition', wordId: 'hablar', correct: true },
      VOCAB,
    ).progress
    const { next } = applyAttempt(
      afterFirst,
      { type: 'recognition', wordId: 'hablar', correct: true },
      VOCAB,
    )
    expect(next).toEqual({ type: 'recognition', word: VOCAB[1] })
  })

  it('returns null once every word in the pool is mastered', () => {
    const singleWordVocab = [VOCAB[0]]
    const mastered = applyAttempt(
      applyAttempt(
        EMPTY_PROGRESS,
        { type: 'recognition', wordId: 'hablar', correct: true },
        singleWordVocab,
      ).progress,
      { type: 'recognition', wordId: 'hablar', correct: true },
      singleWordVocab,
    ).progress

    expect(getNextStimulus(mastered, singleWordVocab)).toBeNull()
  })
})

describe('getNextStimulus', () => {
  it('returns the first unmastered word when no attempts have been made yet', () => {
    expect(getNextStimulus(EMPTY_PROGRESS, VOCAB)).toEqual({ type: 'recognition', word: VOCAB[0] })
  })
})
