import { describe, expect, it } from 'vitest'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from './roleTagging.js'

const WORKED_EXAMPLES = [
  {
    family: 'ar',
    endings: {
      yo: 'o',
      tu: 'as',
      el_ella_usted: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_ustedes: 'an',
    },
  },
]

const VOCAB = [
  { id: 'hablar', word: 'hablar', meaning: 'to speak', pos: 'verb', family: 'ar' },
  { id: 'caminar', word: 'caminar', meaning: 'to walk', pos: 'verb', family: 'ar' },
  { id: 'bailar', word: 'bailar', meaning: 'to dance', pos: 'verb', family: 'ar' },
  { id: 'libro', word: 'libro', meaning: 'book', pos: 'noun' },
  { id: 'casa', word: 'casa', meaning: 'house', pos: 'noun' },
]

const CONTENT = { vocab: VOCAB, workedExamples: WORKED_EXAMPLES }

function chunk(overrides = {}) {
  return {
    id: 'ar',
    mastered: false,
    mastered_date: null,
    streak_count: 0,
    types_in_streak: [],
    ladder_step: null,
    last_reviewed_date: null,
    next_due_date: null,
    production_phase: 'independent',
    ...overrides,
  }
}

function progressWith(chunkOverrides, words = []) {
  return { words, chunks: [chunk(chunkOverrides)] }
}

const MASTERED_HABLAR = [{ id: 'hablar', status: 'mastered', streak_count: 2 }]
const MASTERED_HABLAR_CAMINAR = [
  { id: 'hablar', status: 'mastered', streak_count: 2 },
  { id: 'caminar', status: 'mastered', streak_count: 2 },
  { id: 'bailar', status: 'learning', streak_count: 1 },
]

describe('getNextRoleTaggingStimulus', () => {
  it('breaks a sentence into subject/stem/ending/object parts for a mastered verb', () => {
    const progress = progressWith({ streak_count: 0 }, MASTERED_HABLAR)
    const next = getNextRoleTaggingStimulus(progress, 'ar', CONTENT)
    expect(next.type).toBe('role-tagging')
    expect(next.parts.stem).toBe('habl')
    expect(next.parts.ending).toBe('o')
    expect(next.parts.subject).toBe('yo')
    expect(['libro', 'casa']).toContain(next.parts.object)
    expect(next.sentence).toContain('hablo')
  })

  it('returns null when no vocab in the family is mastered yet', () => {
    const progress = progressWith({}, [{ id: 'hablar', status: 'learning', streak_count: 0 }])
    expect(getNextRoleTaggingStimulus(progress, 'ar', CONTENT)).toBeNull()
  })
})

describe('vocab-gates-conjugation', () => {
  it('never selects an unmastered word as a drill ingredient', () => {
    for (let streak = 0; streak < 10; streak++) {
      const progress = progressWith({ streak_count: streak }, MASTERED_HABLAR_CAMINAR)
      const next = getNextRoleTaggingStimulus(progress, 'ar', CONTENT)
      expect(next.verb.id).not.toBe('bailar')
      expect(['hablar', 'caminar']).toContain(next.verb.id)
    }
  })
})

describe('applyRoleTaggingAttempt — chunk streak/types state', () => {
  it('adds "role-tagging" to types_in_streak distinctly from production/recognition', () => {
    const progress = progressWith({ streak_count: 1, types_in_streak: ['production'] }, MASTERED_HABLAR)
    const attempt = { type: 'role-tagging', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: true }
    const { progress: after } = applyRoleTaggingAttempt(progress, attempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.streak_count).toBe(2)
    expect(arChunk.types_in_streak).toEqual(['production', 'role-tagging'])
  })

  it('does not duplicate "role-tagging" across repeated correct attempts', () => {
    const progress = progressWith({ streak_count: 1, types_in_streak: ['role-tagging'] }, MASTERED_HABLAR)
    const attempt = { type: 'role-tagging', chunkId: 'ar', wordId: 'hablar', person: 'tu', correct: true }
    const { progress: after } = applyRoleTaggingAttempt(progress, attempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.streak_count).toBe(2)
    expect(arChunk.types_in_streak).toEqual(['role-tagging'])
  })

  it('resets streak_count to 0 and clears types_in_streak on any miss, regardless of prior streak length', () => {
    const progress = progressWith(
      { streak_count: 2, types_in_streak: ['production', 'role-tagging'] },
      MASTERED_HABLAR,
    )
    const attempt = { type: 'role-tagging', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: false }
    const { progress: after } = applyRoleTaggingAttempt(progress, attempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.streak_count).toBe(0)
    expect(arChunk.types_in_streak).toEqual([])
  })

  it('returns the next stimulus after recording the attempt', () => {
    const progress = progressWith({ streak_count: 0 }, MASTERED_HABLAR)
    const attempt = { type: 'role-tagging', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: true }
    const { next } = applyRoleTaggingAttempt(progress, attempt, CONTENT)
    expect(next.type).toBe('role-tagging')
  })
})
