import { describe, expect, it } from 'vitest'
import { checkGate } from './advancement.js'

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

describe('checkGate', () => {
  it('does not flip mastered at streak_count 3 spanning only one exercise type', () => {
    const { chunk: result, gateCleared } = checkGate(
      chunk({ streak_count: 3, types_in_streak: ['production'] }),
      '2026-01-01',
    )
    expect(gateCleared).toBe(false)
    expect(result.mastered).toBe(false)
  })

  it('does not flip mastered before streak_count reaches 3, even with 2 distinct types', () => {
    const { gateCleared } = checkGate(
      chunk({ streak_count: 2, types_in_streak: ['production', 'role-tagging'] }),
      '2026-01-01',
    )
    expect(gateCleared).toBe(false)
  })

  it('flips mastered at exactly streak_count 3 spanning >=2 distinct types', () => {
    const { chunk: result, gateCleared } = checkGate(
      chunk({ streak_count: 3, types_in_streak: ['production', 'role-tagging'] }),
      '2026-01-01',
    )
    expect(gateCleared).toBe(true)
    expect(result.mastered).toBe(true)
    expect(result.mastered_date).toBe('2026-01-01')
  })

  it('initializes ladder_step to 0 and next_due_date to day+1 on first clear', () => {
    const { chunk: result } = checkGate(
      chunk({ streak_count: 3, types_in_streak: ['recognition', 'production'] }),
      '2026-01-01',
    )
    expect(result.ladder_step).toBe(0)
    expect(result.next_due_date).toBe('2026-01-02')
  })

  it('does not re-trigger or overwrite mastered_date once already mastered', () => {
    const alreadyMastered = chunk({
      mastered: true,
      mastered_date: '2025-12-01',
      streak_count: 3,
      types_in_streak: ['production', 'role-tagging'],
      ladder_step: 2,
      next_due_date: '2026-02-01',
    })
    const { chunk: result, gateCleared } = checkGate(alreadyMastered, '2026-01-01')
    expect(gateCleared).toBe(false)
    expect(result).toEqual(alreadyMastered)
  })
})
