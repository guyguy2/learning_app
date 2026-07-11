import { describe, expect, it } from 'vitest'
import { applyProductionAttempt, getNextProductionStimulus } from './conjugation.js'

const WORKED_EXAMPLES = [
  {
    id: 'we_ar_hablar',
    family: 'ar',
    verb_id: 'hablar',
    infinitive: 'hablar',
    stem: 'habl',
    notional_machine: 'Drop -ar, attach the person ending.',
    endings: {
      yo: 'o',
      tu: 'as',
      el_ella_usted: 'a',
      nosotros: 'amos',
      vosotros: 'áis',
      ellos_ellas_ustedes: 'an',
    },
    paradigm: [{ person: 'yo', ending: 'o', form: 'hablo', swap: 'habl + o → hablo' }],
  },
]

const VOCAB = [
  { id: 'hablar', word: 'hablar', meaning: 'to speak', pos: 'verb', family: 'ar' },
  { id: 'caminar', word: 'caminar', meaning: 'to walk', pos: 'verb', family: 'ar' },
  { id: 'bailar', word: 'bailar', meaning: 'to dance', pos: 'verb', family: 'ar' },
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
    production_phase: 'worked_example',
    ...overrides,
  }
}

function progressWith(chunkOverrides, words = []) {
  return { words, chunks: [chunk(chunkOverrides)] }
}

const MASTERED_HABLAR = [{ id: 'hablar', status: 'mastered', streak_count: 2 }]
const MASTERED_ALL = [
  { id: 'hablar', status: 'mastered', streak_count: 2 },
  { id: 'caminar', status: 'mastered', streak_count: 2 },
  { id: 'bailar', status: 'learning', streak_count: 1 },
]

describe('getNextProductionStimulus — sequencing', () => {
  it('starts at the worked-example phase for a fresh chunk', () => {
    const progress = progressWith({})
    const next = getNextProductionStimulus(progress, 'ar', CONTENT)
    expect(next.phase).toBe('worked_example')
    expect(next.workedExample.family).toBe('ar')
  })

  it('never serves guided or independent stimuli before the worked example is acknowledged', () => {
    const progress = progressWith({}, MASTERED_HABLAR)
    const next = getNextProductionStimulus(progress, 'ar', CONTENT)
    expect(next.phase).toBe('worked_example')
  })
})

describe('applyProductionAttempt — sequencing transitions', () => {
  it('acknowledging the worked example moves phase to guided without touching streak state', () => {
    const progress = progressWith({}, MASTERED_HABLAR)
    const ack = { type: 'production', chunkId: 'ar', action: 'worked_example_ack' }
    const { progress: after, next } = applyProductionAttempt(progress, ack, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.production_phase).toBe('guided')
    expect(arChunk.streak_count).toBe(0)
    expect(arChunk.types_in_streak).toEqual([])
    expect(next.phase).toBe('guided')
  })

  it('moves from guided to independent after exactly one graded attempt', () => {
    const progress = progressWith({ production_phase: 'guided' }, MASTERED_HABLAR)
    const attempt = { type: 'production', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: true }
    const { progress: after, next } = applyProductionAttempt(progress, attempt, CONTENT)
    expect(after.chunks.find((c) => c.id === 'ar').production_phase).toBe('independent')
    expect(next.phase).toBe('independent')
  })

  it('guided stimuli include a hint; independent stimuli do not', () => {
    const guidedProgress = progressWith({ production_phase: 'guided' }, MASTERED_HABLAR)
    const guidedNext = getNextProductionStimulus(guidedProgress, 'ar', CONTENT)
    expect(guidedNext.hint).toBeTruthy()

    const independentProgress = progressWith({ production_phase: 'independent' }, MASTERED_HABLAR)
    const independentNext = getNextProductionStimulus(independentProgress, 'ar', CONTENT)
    expect(independentNext.hint).toBeNull()
  })

  it('stays in independent phase after a miss — worked example never re-appears mid-encounter', () => {
    const progress = progressWith(
      { production_phase: 'independent', streak_count: 2, types_in_streak: ['production'] },
      MASTERED_HABLAR,
    )
    const missAttempt = { type: 'production', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: false }
    const { progress: after, next } = applyProductionAttempt(progress, missAttempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.production_phase).toBe('independent')
    expect(next.phase).toBe('independent')
  })
})

describe('applyProductionAttempt — chunk streak/types state (read by ticket-14 gate)', () => {
  it('records a correct production attempt into the chunk streak_count and types_in_streak', () => {
    const progress = progressWith({ production_phase: 'independent' }, MASTERED_HABLAR)
    const attempt = { type: 'production', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: true }
    const { progress: after } = applyProductionAttempt(progress, attempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.streak_count).toBe(1)
    expect(arChunk.types_in_streak).toEqual(['production'])
  })

  it('resets streak_count to 0 and clears types_in_streak on any miss, regardless of prior streak length', () => {
    const progress = progressWith(
      { production_phase: 'independent', streak_count: 2, types_in_streak: ['production'] },
      MASTERED_HABLAR,
    )
    const attempt = { type: 'production', chunkId: 'ar', wordId: 'hablar', person: 'yo', correct: false }
    const { progress: after } = applyProductionAttempt(progress, attempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.streak_count).toBe(0)
    expect(arChunk.types_in_streak).toEqual([])
  })

  it('does not duplicate "production" in types_in_streak across repeated correct production attempts', () => {
    const progress = progressWith({ production_phase: 'independent', streak_count: 1, types_in_streak: ['production'] }, MASTERED_HABLAR)
    const attempt = { type: 'production', chunkId: 'ar', wordId: 'hablar', person: 'tu', correct: true }
    const { progress: after } = applyProductionAttempt(progress, attempt, CONTENT)
    const arChunk = after.chunks.find((c) => c.id === 'ar')
    expect(arChunk.streak_count).toBe(2)
    expect(arChunk.types_in_streak).toEqual(['production'])
  })
})

describe('vocab-gates-conjugation', () => {
  it('never selects an unmastered word as a drill ingredient', () => {
    const progress = progressWith({ production_phase: 'independent', streak_count: 0 }, MASTERED_ALL)
    for (let streak = 0; streak < 10; streak++) {
      const withStreak = progressWith(
        { production_phase: 'independent', streak_count: streak },
        MASTERED_ALL,
      )
      const next = getNextProductionStimulus(withStreak, 'ar', CONTENT)
      expect(next.verb.id).not.toBe('bailar')
      expect(['hablar', 'caminar']).toContain(next.verb.id)
    }
  })

  it('returns null when no vocab in the family is mastered yet', () => {
    const progress = progressWith({ production_phase: 'independent' }, [
      { id: 'hablar', status: 'learning', streak_count: 0 },
    ])
    expect(getNextProductionStimulus(progress, 'ar', CONTENT)).toBeNull()
  })
})

describe('production stimulus content', () => {
  it('computes the expected conjugated form from stem + family ending', () => {
    const bothMastered = [
      { id: 'hablar', status: 'mastered', streak_count: 2 },
      { id: 'caminar', status: 'mastered', streak_count: 2 },
    ]
    const progress = progressWith({ production_phase: 'independent', streak_count: 1 }, bothMastered)
    const next = getNextProductionStimulus(progress, 'ar', CONTENT)
    expect(next.verb.id).toBe('caminar')
    expect(next.person).toBe('tu')
    expect(next.expectedForm).toBe('caminas')
  })
})
