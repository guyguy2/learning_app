import { describe, expect, it } from 'vitest'
import { selectChunkForSession } from './sessionPlan.js'

function chunk(id, overrides = {}) {
  return {
    id,
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

function freshProgress() {
  return { words: [], chunks: [chunk('ar'), chunk('er'), chunk('ir')] }
}

describe('selectChunkForSession — session one is blocked (one family at a time)', () => {
  it('picks -ar first from a completely fresh state', () => {
    expect(selectChunkForSession(freshProgress(), 1)).toBe('ar')
  })

  it('stays on -ar until it is mastered, even if -er/-ir have been introduced', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { streak_count: 2, production_phase: 'independent' }),
        chunk('er', { production_phase: 'guided' }),
        chunk('ir'),
      ],
    }
    expect(selectChunkForSession(progress, 1)).toBe('ar')
  })

  it('moves to -er once -ar is mastered, then -ir once -er is mastered', () => {
    const arMastered = {
      words: [],
      chunks: [chunk('ar', { mastered: true }), chunk('er'), chunk('ir')],
    }
    expect(selectChunkForSession(arMastered, 1)).toBe('er')

    const arErMastered = {
      words: [],
      chunks: [chunk('ar', { mastered: true }), chunk('er', { mastered: true }), chunk('ir')],
    }
    expect(selectChunkForSession(arErMastered, 1)).toBe('ir')
  })

  it('returns null once all chunks are mastered', () => {
    const allMastered = {
      words: [],
      chunks: [chunk('ar', { mastered: true }), chunk('er', { mastered: true }), chunk('ir', { mastered: true })],
    }
    expect(selectChunkForSession(allMastered, 1)).toBeNull()
  })
})

describe('selectChunkForSession — session two onward interleaves across introduced families', () => {
  it('picks the least-progressed introduced-and-unmastered chunk, not simply the fixed order', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { streak_count: 2, production_phase: 'independent' }),
        chunk('er', { streak_count: 0, production_phase: 'guided' }),
        chunk('ir'),
      ],
    }
    // fixed blocked order would say 'ar' (first in CHUNK_ORDER); interleaving should
    // favor 'er' since it is the least-progressed introduced chunk.
    expect(selectChunkForSession(progress, 2)).toBe('er')
  })

  it('does not select a chunk that has not been introduced yet (still at worked_example)', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { streak_count: 1, production_phase: 'independent' }),
        chunk('er'),
        chunk('ir'),
      ],
    }
    expect(selectChunkForSession(progress, 2)).toBe('ar')
  })

  it('excludes already-mastered chunks from interleaving', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { mastered: true, production_phase: 'independent' }),
        chunk('er', { streak_count: 1, production_phase: 'guided' }),
        chunk('ir'),
      ],
    }
    expect(selectChunkForSession(progress, 2)).toBe('er')
  })

  it('falls back to introducing the next fresh chunk when nothing is introduced yet', () => {
    expect(selectChunkForSession(freshProgress(), 2)).toBe('ar')
  })

  it('returns null once all chunks are mastered', () => {
    const allMastered = {
      words: [],
      chunks: [chunk('ar', { mastered: true }), chunk('er', { mastered: true }), chunk('ir', { mastered: true })],
    }
    expect(selectChunkForSession(allMastered, 2)).toBeNull()
  })
})
