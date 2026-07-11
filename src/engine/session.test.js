import { describe, expect, it } from 'vitest'
import { buildSession } from './session.js'

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

describe('buildSession', () => {
  it('all chunks fresh, session 1 -> no review, new chunk ar, phase new', () => {
    const result = buildSession(freshProgress(), { sessionNumber: 1, today: '2026-07-10' })
    expect(result).toEqual({ reviewChunkIds: [], newChunkId: 'ar', phase: 'new' })
  })

  it('due chunks appear most-overdue-first, phase review, capped at reviewCap', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { mastered: true, next_due_date: '2026-07-05' }),
        chunk('er', { mastered: true, next_due_date: '2026-07-01' }),
        chunk('ir', { mastered: true, next_due_date: '2026-07-08' }),
      ],
    }
    const result = buildSession(progress, { sessionNumber: 5, today: '2026-07-10', reviewCap: 2 })
    expect(result.phase).toBe('review')
    expect(result.reviewChunkIds).toEqual(['er', 'ar'])
    expect(result.reviewChunkIds).toHaveLength(2)
  })

  it('all mastered and none due -> done', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { mastered: true, next_due_date: '2026-07-20' }),
        chunk('er', { mastered: true, next_due_date: '2026-07-20' }),
        chunk('ir', { mastered: true, next_due_date: '2026-07-20' }),
      ],
    }
    const result = buildSession(progress, { sessionNumber: 5, today: '2026-07-10' })
    expect(result).toEqual({ reviewChunkIds: [], newChunkId: null, phase: 'done' })
  })

  it('due chunks present AND an unmastered chunk exists -> review wins ordering, newChunkId still set', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { mastered: true, next_due_date: '2026-07-05' }),
        chunk('er', { streak_count: 1, production_phase: 'guided' }),
        chunk('ir'),
      ],
    }
    const result = buildSession(progress, { sessionNumber: 5, today: '2026-07-10' })
    expect(result.phase).toBe('review')
    expect(result.reviewChunkIds).toEqual(['ar'])
    expect(result.newChunkId).toBe('er')
  })

  it('does not mutate progressState or its chunks array', () => {
    const progress = {
      words: [],
      chunks: [
        chunk('ar', { mastered: true, next_due_date: '2026-07-05' }),
        chunk('er', { mastered: true, next_due_date: '2026-07-01' }),
        chunk('ir'),
      ],
    }
    const snapshot = JSON.parse(JSON.stringify(progress))
    buildSession(progress, { sessionNumber: 3, today: '2026-07-10' })
    expect(progress).toEqual(snapshot)
  })
})
