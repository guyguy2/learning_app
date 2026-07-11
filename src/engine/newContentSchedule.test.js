import { describe, expect, it } from 'vitest'
import { familyVerbsRemaining, recognitionPool } from './newContentSchedule'
import realVocab from '../../content/spanish/vocab.json'

const MOCK_VOCAB = [
  { id: 'hablar', word: 'hablar', pos: 'verb', family: 'ar' },
  { id: 'caminar', word: 'caminar', pos: 'verb', family: 'ar' },
  { id: 'comer', word: 'comer', pos: 'verb', family: 'er' },
  { id: 'embarazada', word: 'embarazada', pos: 'adjective' },
  { id: 'libro', word: 'libro', pos: 'noun' },
]

describe('newContentSchedule', () => {
  describe('familyVerbsRemaining', () => {
    it('returns true when a family verb is unmastered', () => {
      const progress = {
        words: [
          { id: 'hablar', status: 'mastered' },
          // 'caminar' is not in progress.words list, meaning it is unmastered
        ],
      }
      expect(familyVerbsRemaining(progress, MOCK_VOCAB, 'ar')).toBe(true)
    })

    it('returns false when every verb in the family is mastered', () => {
      const progress = {
        words: [
          { id: 'hablar', status: 'mastered' },
          { id: 'caminar', status: 'mastered' },
        ],
      }
      expect(familyVerbsRemaining(progress, MOCK_VOCAB, 'ar')).toBe(false)
    })
  })

  describe('recognitionPool', () => {
    it('returns family verbs only when some family verbs are unmastered', () => {
      const progress = {
        words: [
          { id: 'hablar', status: 'mastered' },
        ],
      }
      const pool = recognitionPool(progress, MOCK_VOCAB, 'ar')
      expect(pool).toEqual([
        { id: 'hablar', word: 'hablar', pos: 'verb', family: 'ar' },
        { id: 'caminar', word: 'caminar', pos: 'verb', family: 'ar' },
      ])
    })

    it('returns non-verb words only when all family verbs are mastered', () => {
      const progress = {
        words: [
          { id: 'hablar', status: 'mastered' },
          { id: 'caminar', status: 'mastered' },
        ],
      }
      const pool = recognitionPool(progress, MOCK_VOCAB, 'ar')
      expect(pool).toEqual([
        { id: 'embarazada', word: 'embarazada', pos: 'adjective' },
        { id: 'libro', word: 'libro', pos: 'noun' },
      ])
    })

    it('does not mutate the input vocab array', () => {
      const progress = { words: [] }
      const vocabCopy = [...MOCK_VOCAB]
      recognitionPool(progress, MOCK_VOCAB, 'ar')
      expect(MOCK_VOCAB).toEqual(vocabCopy)
    })
  })

  describe('integration with real vocab', () => {
    it('proves false-cognate reachability when all ar verbs are mastered', () => {
      // Find all 'ar' verbs in the real vocab
      const arVerbs = realVocab.filter((w) => w.pos === 'verb' && w.family === 'ar')

      // Mark all of them as mastered
      const progress = {
        words: arVerbs.map((v) => ({ id: v.id, status: 'mastered' })),
      }

      const pool = recognitionPool(progress, realVocab, 'ar')

      // Assert it contains only non-verbs
      const verbsInPool = pool.filter((w) => w.pos === 'verb')
      expect(verbsInPool.length).toBe(0)

      // Assert it contains the false-cognate word 'embarazada' proving reachability
      const hasEmbarazada = pool.some((w) => w.id === 'embarazada')
      expect(hasEmbarazada).toBe(true)
    })
  })
})
