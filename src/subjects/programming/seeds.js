/**
 * Programming seed scenarios for POST /api/progress/seed and /reset. Framework-free and free
 * of JSON imports so the Node server can load this file directly: each builder takes the
 * subject's content pool, which the server reads from `contentFiles`.
 */
import { initialProgress } from '../../engine/chunkProgress.js'
import { getYesterdayIso, guidedChunk, reviewDueChunk } from '../seedHelpers.js'

/** Content keys the builders read, as paths under content/. */
export const contentFiles = {
  workedExamples: 'programming/worked_examples.json',
}

function chunkIds(content) {
  return content.workedExamples.map((we) => we.chunk)
}

/** Session one, nothing learned. */
function fresh(content) {
  return initialProgress(chunkIds(content))
}

/** Session three: the first chunk mastered and due for review yesterday, the second in progress. */
function reviewDue(content, { referenceDate } = {}) {
  const yesterday = getYesterdayIso(referenceDate)
  const [first, second] = chunkIds(content)
  const base = fresh(content)
  return {
    ...base,
    session_number: 3,
    chunks: base.chunks.map((c) => {
      if (c.id === first) return reviewDueChunk(first, yesterday)
      if (c.id === second) return guidedChunk(second)
      return c
    }),
  }
}

export const scenarios = { fresh, 'review-due': reviewDue }
