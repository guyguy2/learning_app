/**
 * Programming subject: a deliberately tiny JavaScript subject that exists to prove the
 * subject contract (src/subjects/contract.js). Three chunks (closures, array iteration,
 * off-by-one), two exercise types:
 *   - recognition: predict what a snippet logs
 *   - completion:  fill in the blank, faded worked example -> guided -> independent
 * Both types advance the chunk gate, so review alternates them.
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

/** Rotate by the chunk's streak: a correct answer moves on, a miss restarts at the first item. */
function pickItem(progress, chunkId, content, type) {
  const pool = itemsFor(content, chunkId, type)
  if (pool.length === 0) return null
  const streak = findChunk(progress.chunks, chunkId)?.streak_count ?? 0
  return pool[streak % pool.length]
}

function gradeItem(attempt, stimulus) {
  const item = stimulus?.item
  if (!item) return false
  const given = normalizeCode(attempt?.given)
  return [item.answer, ...(item.accepted ?? [])].some((a) => normalizeCode(a) === given)
}

function repairFor(attempt, stimulus, content) {
  const itemId = attempt.itemId ?? stimulus?.item?.id
  const given = normalizeCode(attempt.given)
  const match = content.distractors.find(
    (d) => d.item_id === itemId && normalizeCode(d.given) === given,
  )
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
    const result = recordChunkAttempt(progress, attempt.chunkId, 'recognition', attempt.correct, today)
    return {
      progress: result.progress,
      next: recognition.nextStimulus(result.progress, attempt.chunkId, content),
      gateCleared: result.gateCleared,
    }
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
    const result = recordChunkAttempt(progress, attempt.chunkId, 'completion', attempt.correct, today, {
      advanceScaffold: true,
    })
    return {
      progress: result.progress,
      next: completion.nextStimulus(result.progress, attempt.chunkId, content),
      gateCleared: result.gateCleared,
    }
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
