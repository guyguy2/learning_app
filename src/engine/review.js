/** Fixed review interval ladder (days). `ladder_step` is an index into this array. */
export const LADDER_DAYS = [1, 3, 7, 14, 30]

const MAX_STEP = LADDER_DAYS.length - 1 // 4

/**
 * Add N calendar days to an ISO date string (YYYY-MM-DD). Pure — no Date.now().
 * Uses UTC so the calendar day does not shift with local timezone.
 */
export function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

/**
 * Chunks due for review on `today` (ISO YYYY-MM-DD).
 * Eligible: mastered === true AND next_due_date is set AND next_due_date <= today.
 * Ordered most-overdue-first (oldest next_due_date first), then capped (default 8).
 *
 * @returns {Array} due chunk objects (same references as input, not mutated)
 */
export function dueChunks(chunks, today, cap = 8) {
  if (!Array.isArray(chunks)) return []

  return chunks
    .filter(
      (c) =>
        c.mastered === true &&
        c.next_due_date != null &&
        c.next_due_date !== '' &&
        c.next_due_date <= today,
    )
    .slice()
    .sort((a, b) => {
      if (a.next_due_date < b.next_due_date) return -1
      if (a.next_due_date > b.next_due_date) return 1
      return 0
    })
    .slice(0, cap)
}

/**
 * After a SUCCESSFUL review: advance ladder_step by one (clamp at 4),
 * set last_reviewed_date = today, next_due_date = today + ladder[new_step] days.
 * Returns a new chunk object; does not mutate the input.
 */
export function advanceLadder(chunk, today) {
  const current = chunk.ladder_step == null ? 0 : chunk.ladder_step
  const ladder_step = Math.min(current + 1, MAX_STEP)
  const interval = LADDER_DAYS[ladder_step]
  return {
    ...chunk,
    ladder_step,
    last_reviewed_date: today,
    next_due_date: addDays(today, interval),
  }
}

/**
 * After a MISSED review: full reset to step 0 (1-day interval), not one step back.
 * last_reviewed_date = today, next_due_date = today + 1 day.
 * Returns a new chunk object; does not mutate the input.
 */
export function resetLadder(chunk, today) {
  return {
    ...chunk,
    ladder_step: 0,
    last_reviewed_date: today,
    next_due_date: addDays(today, LADDER_DAYS[0]),
  }
}
