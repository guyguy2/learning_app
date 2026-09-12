/**
 * Spanish seed scenarios for POST /api/progress/seed and /reset. Framework-free and free of
 * JSON imports so the Node server can load this file directly: each builder takes the
 * subject's content pool, which the server reads from `contentFiles`.
 */
import { initialProgress } from '../../engine/chunkProgress.js'
import { getYesterdayIso, guidedChunk, reviewDueChunk } from '../seedHelpers.js'

/** Content keys the builders read, as paths under content/. */
export const contentFiles = {
  vocab: 'spanish/vocab.json',
  workedExamples: 'spanish/worked_examples.json',
}

function chunkIds(content) {
  return content.workedExamples.map((we) => we.family)
}

export function getFamilyVerbs(content, family) {
  return content.vocab.filter((v) => v.pos === 'verb' && v.family === family)
}

function masteredWords(verbs) {
  return verbs.map((v) => ({ id: v.id, status: 'mastered', streak_count: 2 }))
}

function withChunks(progress, overrides) {
  return { ...progress, chunks: progress.chunks.map((c) => overrides[c.id] ?? c) }
}

/** Session one, nothing learned. */
function fresh(content) {
  return initialProgress(chunkIds(content))
}

/** Session two: every -ar verb mastered, the -ar family past its worked example. */
function mid(content) {
  return {
    ...withChunks(fresh(content), { ar: guidedChunk('ar') }),
    session_number: 2,
    words: masteredWords(getFamilyVerbs(content, 'ar')),
  }
}

/** Session three: -ar mastered and due for review yesterday, -er in progress. */
function reviewDue(content, { referenceDate } = {}) {
  const yesterday = getYesterdayIso(referenceDate)
  return {
    ...withChunks(fresh(content), { ar: reviewDueChunk('ar', yesterday), er: guidedChunk('er') }),
    session_number: 3,
    words: masteredWords([...getFamilyVerbs(content, 'ar'), ...getFamilyVerbs(content, 'er')]),
  }
}

export const scenarios = { fresh, mid, 'review-due': reviewDue }
