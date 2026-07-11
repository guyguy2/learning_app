import { LADDER_DAYS, addDays } from './review.js'

/** Real-clock default for `today` params — tests always pass an explicit ISO date instead. */
export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Advancement gate: a chunk masters when streak_count hits 3 AND spans >=2 distinct
 * exercise types. Pure — caller supplies `today` (ISO YYYY-MM-DD) rather than the engine
 * reading the clock. Does not mutate the input chunk.
 *
 * On first clear: sets mastered/mastered_date and initializes ladder_step/next_due_date
 * (day+1) per SPEC's data model — the same fields ticket-17's review ladder reads/advances.
 *
 * @returns {{ chunk: object, gateCleared: boolean }}
 */
export function checkGate(chunk, today) {
  const cleared =
    !chunk.mastered && chunk.streak_count === 3 && (chunk.types_in_streak?.length ?? 0) >= 2

  if (!cleared) return { chunk, gateCleared: false }

  return {
    chunk: {
      ...chunk,
      mastered: true,
      mastered_date: today,
      ladder_step: 0,
      next_due_date: addDays(today, LADDER_DAYS[0]),
    },
    gateCleared: true,
  }
}
