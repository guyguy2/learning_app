import { describe, expect, it } from 'vitest'
import {
  resetReviewStreak,
  isReviewGateCleared,
  nextReviewDrillType,
} from './reviewGate.js'

function chunk(overrides = {}) {
  return {
    id: 'ar',
    mastered: true,
    mastered_date: '2026-01-01',
    streak_count: 3,
    types_in_streak: ['production', 'role-tagging'],
    ladder_step: 0,
    last_reviewed_date: null,
    next_due_date: '2026-01-02',
    production_phase: 'independent',
    ...overrides,
  }
}

describe('resetReviewStreak', () => {
  it('zeroes streak_count and empties types_in_streak without mutating input', () => {
    const input = chunk({
      streak_count: 3,
      types_in_streak: ['production', 'role-tagging'],
    })
    const snapshot = structuredClone(input)

    const result = resetReviewStreak(input)

    expect(result.streak_count).toBe(0)
    expect(result.types_in_streak).toEqual([])
    expect(input).toEqual(snapshot)
    expect(result).not.toBe(input)
    expect(result.types_in_streak).not.toBe(input.types_in_streak)
  })

  it('keeps other fields (id, mastered) intact', () => {
    const input = chunk({
      id: 'er',
      mastered: true,
      streak_count: 3,
      types_in_streak: ['production'],
    })
    const result = resetReviewStreak(input)

    expect(result.id).toBe('er')
    expect(result.mastered).toBe(true)
    expect(result.mastered_date).toBe(input.mastered_date)
    expect(result.ladder_step).toBe(input.ladder_step)
    expect(result.next_due_date).toBe(input.next_due_date)
  })
})

describe('isReviewGateCleared', () => {
  it('is true at streak 3 with 2 types', () => {
    expect(
      isReviewGateCleared(
        chunk({
          streak_count: 3,
          types_in_streak: ['production', 'role-tagging'],
        }),
      ),
    ).toBe(true)
  })

  it('is false at streak 3 with only 1 type', () => {
    expect(
      isReviewGateCleared(
        chunk({ streak_count: 3, types_in_streak: ['production'] }),
      ),
    ).toBe(false)
  })

  it('is false at streak 2 with 2 types', () => {
    expect(
      isReviewGateCleared(
        chunk({
          streak_count: 2,
          types_in_streak: ['production', 'role-tagging'],
        }),
      ),
    ).toBe(false)
  })

  it('handles missing or empty types_in_streak without throwing', () => {
    expect(() =>
      isReviewGateCleared(chunk({ streak_count: 3, types_in_streak: [] })),
    ).not.toThrow()
    expect(
      isReviewGateCleared(chunk({ streak_count: 3, types_in_streak: [] })),
    ).toBe(false)

    const noTypes = chunk({ streak_count: 3 })
    delete noTypes.types_in_streak
    expect(() => isReviewGateCleared(noTypes)).not.toThrow()
    expect(isReviewGateCleared(noTypes)).toBe(false)

    expect(
      isReviewGateCleared(chunk({ streak_count: 3, types_in_streak: undefined })),
    ).toBe(false)
  })
})

describe('nextReviewDrillType', () => {
  it("returns 'production' when lastType is null or undefined", () => {
    expect(nextReviewDrillType(null)).toBe('production')
    expect(nextReviewDrillType(undefined)).toBe('production')
  })

  it("returns 'role-tagging' after production", () => {
    expect(nextReviewDrillType('production')).toBe('role-tagging')
  })

  it("returns 'production' after role-tagging", () => {
    expect(nextReviewDrillType('role-tagging')).toBe('production')
  })
})
