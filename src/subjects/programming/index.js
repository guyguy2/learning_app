/**
 * Programming subject: beginner JavaScript mental models, implementing the subject contract
 * (src/subjects/contract.js). Chunks come from content/programming/worked_examples.json, in
 * order. Two exercise types:
 *   - recognition: predict what a snippet logs (or which error it throws)
 *   - completion:  fill in the blank, faded worked example -> guided -> independent
 * Both types advance the chunk gate, so review alternates them. Per-item attempts are kept
 * in progress.words so item selection rotates through each chunk's whole pool.
 */
import items from '../../../content/programming/items.json'
import workedExamples from '../../../content/programming/worked_examples.json'
import distractors from '../../../content/programming/distractors.json'
import misconceptions from '../../../content/programming/misconceptions.json'

import { screenTechniques } from '../../screenTechniques.js'
import {
  acknowledgeWorkedExample,
  findChunk,
  recordChunkAttempt,
  scaffoldPhase,
} from '../../engine/chunkProgress.js'
import { getMisconception } from '../../engine/misconception.js'
import { recordItemAttempt } from '../../engine/itemMastery.js'
import { validateProgrammingContent } from './validate.js'
import { scenarios as seeds } from './seeds.js'

/** Placeholder a completion item's code uses for the missing piece. */
export const BLANK = '____'

/** Answers compare without whitespace or trailing semicolons. */
export function normalizeCode(text) {
  return String(text ?? '')
    .replace(/\s+/g, '')
    .replace(/;+$/, '')
}

function itemsFor(content, chunkId, type) {
  return content.items.filter((item) => item.chunk === chunkId && item.type === type)
}

function workedExampleFor(content, chunkId) {
  return content.workedExamples.find((we) => we.chunk === chunkId)
}

function attemptsOn(progress, itemId) {
  return (progress.words ?? []).find((w) => w.id === itemId)?.attempts ?? 0
}

/**
 * The least-practised item of the pool, earliest authored first. Attempts are counted per
 * item in progress.words, so across sessions and reviews the whole pool gets served rather
 * than the same first few items.
 */
function pickItem(progress, chunkId, content, type) {
  const pool = itemsFor(content, chunkId, type)
  if (pool.length === 0) return null
  return pool.reduce((best, item) => (attemptsOn(progress, item.id) < attemptsOn(progress, best.id) ? item : best))
}

/** Count an attempt on an item: item mastery (status, streak) plus a total attempt count. */
function recordItem(progress, itemId, correct) {
  if (!itemId) return progress
  const { progress: next } = recordItemAttempt({ ...progress, words: progress.words ?? [] }, itemId, correct)
  return {
    ...next,
    words: next.words.map((w) => (w.id === itemId ? { ...w, attempts: (w.attempts ?? 0) + 1 } : w)),
  }
}

function matchDistractor(attempt, content) {
  const given = normalizeCode(attempt.given)
  return content.distractors.find((d) => d.item_id === attempt.itemId && normalizeCode(d.given) === given) ?? null
}

/**
 * The stimulus to retest with after a miss. A named misconception retests on the
 * least-practised other item of the same type whose distractors probe the same
 * misconception ("try a similar one"); anything else retries the missed item.
 */
function retestStimulus(progress, attempt, content, stimulusFor) {
  const missed = content.items.find((item) => item.id === attempt.itemId)
  if (!missed) return null
  const match = matchDistractor(attempt, content)
  if (match) {
    const probes = new Set(
      content.distractors.filter((d) => d.misconception_id === match.misconception_id).map((d) => d.item_id),
    )
    const siblings = content.items.filter(
      (item) => item.id !== missed.id && item.type === missed.type && probes.has(item.id),
    )
    if (siblings.length > 0) {
      const sibling = siblings.reduce((best, item) =>
        attemptsOn(progress, item.id) < attemptsOn(progress, best.id) ? item : best,
      )
      return stimulusFor(sibling)
    }
  }
  return stimulusFor(missed)
}

function gradeItem(attempt, stimulus) {
  const item = stimulus?.item
  if (!item) return false
  const given = normalizeCode(attempt?.given)
  return [item.answer, ...(item.accepted ?? [])].some((a) => normalizeCode(a) === given)
}

function repairFor(attempt, stimulus, content) {
  const match = matchDistractor({ ...attempt, itemId: attempt.itemId ?? stimulus?.item?.id }, content)
  if (!match) return null
  return {
    misconception: getMisconception(match.misconception_id, content.misconceptions),
    notionalMachine: workedExampleFor(content, attempt.chunkId)?.notional_machine ?? null,
  }
}

const recognition = {
  nextStimulus(progress, chunkId, content) {
    const item = pickItem(progress, chunkId, content, 'recognition')
    return item ? { type: 'recognition', chunkId, item } : null
  },
  apply(progress, attempt, content, today) {
    const withItem = recordItem(progress, attempt.itemId, attempt.correct)
    const result = recordChunkAttempt(withItem, attempt.chunkId, 'recognition', attempt.correct, today)
    const next = attempt.correct
      ? recognition.nextStimulus(result.progress, attempt.chunkId, content)
      : retestStimulus(result.progress, attempt, content, (item) => ({
          type: 'recognition',
          chunkId: attempt.chunkId,
          item,
        }))
    return { progress: result.progress, next, gateCleared: result.gateCleared }
  },
  grade: gradeItem,
  feedback({ correct, attempt }, stimulus) {
    if (correct) return `Correct: it logs ${stimulus?.item?.answer ?? attempt?.given}`
    return `Incorrect - it logs ${stimulus?.item?.answer}`
  },
  expectedAnswer: (stimulus) => stimulus?.item?.answer ?? null,
  repairFor,
}

const completion = {
  nextStimulus(progress, chunkId, content) {
    const phase = scaffoldPhase(findChunk(progress.chunks, chunkId))
    if (phase === 'worked_example') {
      const workedExample = workedExampleFor(content, chunkId)
      return workedExample ? { type: 'completion', phase, chunkId, workedExample } : null
    }
    const item = pickItem(progress, chunkId, content, 'completion')
    if (!item) return null
    return { type: 'completion', phase, chunkId, item, hint: phase === 'guided' ? item.hint ?? null : null }
  },
  apply(progress, attempt, content, today) {
    if (attempt.action === 'worked_example_ack') {
      const acked = acknowledgeWorkedExample(progress, attempt.chunkId)
      return {
        progress: acked,
        next: completion.nextStimulus(acked, attempt.chunkId, content),
        gateCleared: false,
      }
    }
    const withItem = recordItem(progress, attempt.itemId, attempt.correct)
    const result = recordChunkAttempt(withItem, attempt.chunkId, 'completion', attempt.correct, today, {
      advanceScaffold: true,
    })
    const next = attempt.correct
      ? completion.nextStimulus(result.progress, attempt.chunkId, content)
      : retestStimulus(result.progress, attempt, content, (item) => {
          const phase = scaffoldPhase(findChunk(result.progress.chunks, attempt.chunkId))
          return { type: 'completion', phase, chunkId: attempt.chunkId, item, hint: phase === 'guided' ? item.hint ?? null : null }
        })
    return { progress: result.progress, next, gateCleared: result.gateCleared }
  },
  grade: gradeItem,
  feedback({ correct, attempt }, stimulus) {
    if (correct) return `Correct: ${stimulus?.item?.answer ?? attempt?.given}`
    return `Incorrect - expected "${stimulus?.item?.answer}"`
  },
  expectedAnswer: (stimulus) => stimulus?.item?.answer ?? null,
  repairFor,
}

/** @type {import('../contract.js').Subject} */
const programming = {
  id: 'programming',
  displayName: 'JavaScript',
  exerciseTypes: ['recognition', 'completion'],
  reviewTypes: ['recognition', 'completion'],
  scaffoldType: 'completion',
  chunks: (content) => content.workedExamples.map((we) => ({ id: we.chunk, label: we.title })),
  // I-do first: a chunk still on its worked example opens with it.
  firstExerciseType: (progress, chunkId) =>
    scaffoldPhase(findChunk(progress.chunks, chunkId)) === 'worked_example' ? 'completion' : 'recognition',
  exercises: { recognition, completion },
  content: { items, workedExamples, distractors, misconceptions },
  validate: validateProgrammingContent,
  techniques: {
    recognition: {
      techniqueName: 'Retrieval practice',
      explanation:
        'Predicting what code does from memory, before running it, strengthens your model of how it executes.',
    },
    completion: {
      techniqueName: 'Faded worked example',
      explanation:
        'Completing a partly written program bridges studying an example and writing code on your own.',
    },
    review: screenTechniques.review,
    repair: screenTechniques.repair,
  },
  seeds,
}

export default programming
