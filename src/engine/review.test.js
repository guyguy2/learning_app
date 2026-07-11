import { describe, expect, it } from 'vitest'
import { addDays, advanceLadder, dueChunks, resetLadder } from './review.js'

function chunk(overrides = {}) {
  return {
    id: 'ar',
    mastered: true,
    mastered_date: '2026-01-01',
    streak_count: 0,
    types_in_streak: [],
    ladder_step: 0,
    last_reviewed_date: '2026-01-01',
    next_due_date: '2026-01-02',
    ...overrides,
  }
}

describe('dueChunks', () => {
  const today = '2026-02-10'

  it('returns only mastered chunks whose next_due_date has elapsed, most-overdue-first, capped', () => {
    const chunks = [
      chunk({ id: 'ar', next_due_date: '2026-02-08', ladder_step: 1 }), // 2 days overdue
      chunk({ id: 'er', next_due_date: '2026-02-01', ladder_step: 2 }), // 9 days overdue
      chunk({ id: 'ir', next_due_date: '2026-02-10', ladder_step: 0 }), // due today
      chunk({
        id: 'future',
        next_due_date: '2026-02-15',
        ladder_step: 0,
      }), // not yet due
      chunk({
        id: 'unmastered',
        mastered: false,
        mastered_date: null,
        ladder_step: null,
        next_due_date: null,
      }),
      chunk({
        id: 'no-due',
        next_due_date: null,
        ladder_step: null,
      }),
    ]

    const due = dueChunks(chunks, today, 8)
    expect(due.map((c) => c.id)).toEqual(['er', 'ar', 'ir'])
  })

  it('caps the queue and keeps most-overdue items when over the cap', () => {
    const chunks = [
      chunk({ id: 'a', next_due_date: '2026-02-09' }),
      chunk({ id: 'b', next_due_date: '2026-02-05' }),
      chunk({ id: 'c', next_due_date: '2026-02-07' }),
      chunk({ id: 'd', next_due_date: '2026-02-01' }),
      chunk({ id: 'e', next_due_date: '2026-02-10' }),
    ]

    expect(dueChunks(chunks, today, 3).map((c) => c.id)).toEqual(['d', 'b', 'c'])
  })

  it('does not mutate the input chunks array', () => {
    const chunks = [
      chunk({ id: 'ar', next_due_date: '2026-02-08' }),
      chunk({ id: 'er', next_due_date: '2026-02-01' }),
    ]
    const before = chunks.map((c) => c.id)
    dueChunks(chunks, today)
    expect(chunks.map((c) => c.id)).toEqual(before)
  })
})

describe('advanceLadder', () => {
  it('advances ladder_step by exactly one and recomputes next_due_date from the new step', () => {
    const today = '2026-03-01'
    const input = chunk({
      id: 'ar',
      ladder_step: 0,
      last_reviewed_date: '2026-02-28',
      next_due_date: '2026-03-01',
    })

    const updated = advanceLadder(input, today)

    expect(updated.ladder_step).toBe(1)
    expect(updated.last_reviewed_date).toBe(today)
    // ladder[1] = 3 days
    expect(updated.next_due_date).toBe('2026-03-04')
    // purity: original unchanged
    expect(input.ladder_step).toBe(0)
    expect(input.next_due_date).toBe('2026-03-01')
  })

  it('clamps ladder_step at 4 and still schedules the 30-day interval', () => {
    const today = '2026-04-01'
    const atMax = chunk({ ladder_step: 4, next_due_date: '2026-04-01' })
    const updated = advanceLadder(atMax, today)
    expect(updated.ladder_step).toBe(4)
    expect(updated.next_due_date).toBe(addDays(today, 30))
  })

  it('uses each ladder interval correctly when advancing mid-ladder', () => {
    // step 2 (7d) -> step 3 (14d)
    const updated = advanceLadder(chunk({ ladder_step: 2 }), '2026-05-01')
    expect(updated.ladder_step).toBe(3)
    expect(updated.next_due_date).toBe('2026-05-15')
  })
})

describe('resetLadder', () => {
  it('sets ladder_step to 0 (1-day interval), not one step back', () => {
    const today = '2026-06-15'
    const input = chunk({
      ladder_step: 3,
      last_reviewed_date: '2026-06-01',
      next_due_date: '2026-06-15',
    })

    const updated = resetLadder(input, today)

    expect(updated.ladder_step).toBe(0)
    expect(updated.last_reviewed_date).toBe(today)
    expect(updated.next_due_date).toBe('2026-06-16')
    // purity
    expect(input.ladder_step).toBe(3)
  })

  it('resets fully to step 0 even from step 1 (not back to 0 from a partial step-down)', () => {
    const updated = resetLadder(chunk({ ladder_step: 1 }), '2026-07-01')
    expect(updated.ladder_step).toBe(0)
    expect(updated.next_due_date).toBe('2026-07-02')
  })
})

describe('addDays', () => {
  it('adds calendar days across month boundaries on ISO dates', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})
