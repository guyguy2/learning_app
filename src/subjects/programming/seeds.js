/**
 * Programming seed scenarios for POST /api/progress/seed and /reset. Framework-free and free
 * of JSON imports so the Node server can load this file directly: each builder takes the
 * subject's content pool, which the server reads from `contentFiles`.
 *
 * Scenarios place chunks by position in the curriculum order, so they follow the content:
 *   fresh       session one, nothing learned
 *   mid         session four: the first three chunks mastered and not yet due, the fourth in progress
 *   review-due  session six: the first two chunks due for review, the next two mastered, the fifth in progress
 *   late        every chunk but the last mastered and not due, so the session opens the last worked example
 */
import { defaultChunk, initialProgress } from '../../engine/chunkProgress.js'
import { getYesterdayIso, guidedChunk, reviewDueChunk } from '../seedHelpers.js'

/** Content keys the builders read, as paths under content/. */
export const contentFiles = {
  workedExamples: 'programming/worked_examples.json',
}

function chunkIds(content) {
  return content.workedExamples.map((we) => we.chunk)
}

function isoDaysFrom(referenceDate = new Date(), days) {
  const d = new Date(referenceDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Mastered, reviewed once (ladder step 1, a three-day interval), next due in `dueInDays` days. */
function settledChunk(id, referenceDate, dueInDays) {
  return {
    ...defaultChunk(id),
    mastered: true,
    mastered_date: isoDaysFrom(referenceDate, dueInDays - 4),
    ladder_step: 1,
    last_reviewed_date: isoDaysFrom(referenceDate, dueInDays - 3),
    next_due_date: isoDaysFrom(referenceDate, dueInDays),
    production_phase: 'independent',
  }
}

/** Progress at `session`, with `build(id, index)` choosing each chunk (null keeps it fresh). */
function seeded(content, session, build) {
  const ids = chunkIds(content)
  return { ...initialProgress(ids), session_number: session, chunks: ids.map((id, i) => build(id, i) ?? defaultChunk(id)) }
}

function fresh(content) {
  return initialProgress(chunkIds(content))
}

function mid(content, { referenceDate } = {}) {
  return seeded(content, 4, (id, i) => {
    if (i < 3) return settledChunk(id, referenceDate, 1 + i)
    if (i === 3) return guidedChunk(id)
    return null
  })
}

function reviewDue(content, { referenceDate } = {}) {
  const yesterday = getYesterdayIso(referenceDate)
  return seeded(content, 6, (id, i) => {
    if (i < 2) return { ...reviewDueChunk(id, yesterday), production_phase: 'independent' }
    if (i < 4) return settledChunk(id, referenceDate, 2)
    if (i === 4) return guidedChunk(id)
    return null
  })
}

function late(content, { referenceDate } = {}) {
  const last = chunkIds(content).length - 1
  return seeded(content, last + 2, (id, i) => (i < last ? settledChunk(id, referenceDate, 1 + (i % 3)) : null))
}

export const scenarios = { fresh, mid, 'review-due': reviewDue, late }
