import { describe, expect, it } from 'vitest'
import {
  SEEDED_SUBJECT_IDS,
  buildResetProgress,
  buildSeed,
  getFamilyVerbs,
  getYesterdayIso,
  seedScenarios,
} from './seeds.js'
import { defaultProgress } from './progressStore.js'
import { SUBJECT_IDS, getSubject } from '../src/subjects/index.js'
import { chunkOrder } from '../src/subjects/contract.js'
import { initialProgress } from '../src/engine/chunkProgress.js'

describe('server/seeds', () => {
  describe('fresh scenario', () => {
    it('returns default progress with session_number 1', () => {
      const seed = buildSeed('fresh')
      expect(seed.session_number).toBe(1)
      expect(seed.words).toEqual([])
      expect(seed).toEqual(defaultProgress())
      expect(seed.chunks).toHaveLength(3)
      for (const chunk of seed.chunks) {
        expect(chunk.mastered).toBe(false)
        expect(chunk.production_phase).toBe('worked_example')
      }
    })
  })

  describe('mid scenario', () => {
    it('has session_number 2, all ar verbs mastered with streak 2, ar chunk in guided phase, er/ir untouched', () => {
      const seed = buildSeed('mid')
      expect(seed.session_number).toBe(2)

      const arVerbs = getFamilyVerbs('ar')
      expect(arVerbs.length).toBeGreaterThan(0)
      expect(seed.words).toHaveLength(arVerbs.length)

      for (const verb of arVerbs) {
        const wordEntry = seed.words.find((w) => w.id === verb.id)
        expect(wordEntry).toBeDefined()
        expect(wordEntry.status).toBe('mastered')
        expect(wordEntry.streak_count).toBe(2)
      }

      const arChunk = seed.chunks.find((c) => c.id === 'ar')
      expect(arChunk.mastered).toBe(false)
      expect(arChunk.production_phase).toBe('guided')
      expect(arChunk.streak_count).toBe(0)

      const erChunk = seed.chunks.find((c) => c.id === 'er')
      expect(erChunk.mastered).toBe(false)
      expect(erChunk.production_phase).toBe('worked_example')
      expect(erChunk.streak_count).toBe(0)

      const irChunk = seed.chunks.find((c) => c.id === 'ir')
      expect(irChunk.mastered).toBe(false)
      expect(irChunk.production_phase).toBe('worked_example')
      expect(irChunk.streak_count).toBe(0)
    })
  })

  describe('review-due scenario', () => {
    it('has session_number 3, ar chunk mastered with next_due_date = yesterday and ladder_step 0, er chunk in guided with its verbs mastered, ir untouched', () => {
      const refDate = new Date('2026-09-11T12:00:00Z')
      const expectedYesterday = getYesterdayIso(refDate)
      const seed = buildSeed('review-due', { referenceDate: refDate })

      expect(seed.session_number).toBe(3)

      const arVerbs = getFamilyVerbs('ar')
      const erVerbs = getFamilyVerbs('er')
      expect(seed.words.length).toBe(arVerbs.length + erVerbs.length)

      for (const verb of [...arVerbs, ...erVerbs]) {
        const wordEntry = seed.words.find((w) => w.id === verb.id)
        expect(wordEntry).toBeDefined()
        expect(wordEntry.status).toBe('mastered')
        expect(wordEntry.streak_count).toBe(2)
      }

      const arChunk = seed.chunks.find((c) => c.id === 'ar')
      expect(arChunk.mastered).toBe(true)
      expect(arChunk.ladder_step).toBe(0)
      expect(arChunk.next_due_date).toBe(expectedYesterday)

      const erChunk = seed.chunks.find((c) => c.id === 'er')
      expect(erChunk.mastered).toBe(false)
      expect(erChunk.production_phase).toBe('guided')
      expect(erChunk.streak_count).toBe(0)

      const irChunk = seed.chunks.find((c) => c.id === 'ir')
      expect(irChunk.mastered).toBe(false)
      expect(irChunk.production_phase).toBe('worked_example')
      expect(irChunk.streak_count).toBe(0)
    })
  })

  describe('buildSeed error handling', () => {
    it('throws for unknown scenarios', () => {
      expect(() => buildSeed('invalid')).toThrow('Unknown seed scenario: invalid')
    })

    it('throws for a scenario the subject does not define, and for an unknown subject', () => {
      expect(() => buildSeed('nope', { subject: 'programming' })).toThrow('Unknown seed scenario: nope')
      expect(() => buildSeed('fresh', { subject: 'klingon' })).toThrow('Unknown subject: klingon')
    })
  })
})

describe('server/seeds per subject', () => {
  it('has seed builders for every registered subject, matching the subject module', () => {
    expect(SEEDED_SUBJECT_IDS.slice().sort()).toEqual(SUBJECT_IDS.slice().sort())
    for (const id of SUBJECT_IDS) {
      expect(seedScenarios(id)).toEqual(Object.keys(getSubject(id).seeds))
      expect(seedScenarios(id)).toEqual(expect.arrayContaining(['fresh', 'review-due']))
    }
  })

  it.each(SUBJECT_IDS)('resets %s to fresh progress over its own chunks', (id) => {
    const reset = buildResetProgress(id)
    expect(reset).toEqual(initialProgress(chunkOrder(getSubject(id))))
    expect(reset).toEqual(buildSeed('fresh', { subject: id }))
  })

  it('resets Spanish by default, to the server default progress', () => {
    expect(buildResetProgress()).toEqual(defaultProgress())
  })

  it('offers fresh, mid, review-due, and late for programming', () => {
    expect(seedScenarios('programming')).toEqual(['fresh', 'mid', 'review-due', 'late'])
    expect(seedScenarios()).toEqual(['fresh', 'mid', 'review-due'])
  })

  it('seeds programming review-due: two chunks due yesterday, two mastered and not due, the fifth guided', () => {
    const refDate = new Date('2026-09-11T12:00:00Z')
    const seed = buildSeed('review-due', { subject: 'programming', referenceDate: refDate })

    expect(seed.session_number).toBe(6)
    expect(seed.words).toEqual([])
    expect(seed.chunks.map((c) => c.id)).toEqual([
      'scope',
      'closures',
      'iteration',
      'off-by-one',
      'references',
      'equality',
      'async',
    ])

    for (const due of seed.chunks.slice(0, 2)) {
      expect(due).toMatchObject({ mastered: true, ladder_step: 0, next_due_date: getYesterdayIso(refDate) })
    }
    for (const settled of seed.chunks.slice(2, 4)) {
      expect(settled.mastered).toBe(true)
      expect(settled.next_due_date > '2026-09-11').toBe(true)
    }
    expect(seed.chunks[4]).toMatchObject({ mastered: false, production_phase: 'guided' })
    for (const rest of seed.chunks.slice(5)) {
      expect(rest).toMatchObject({ mastered: false, production_phase: 'worked_example' })
    }
  })
})
