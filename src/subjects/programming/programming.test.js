import { describe, expect, it } from 'vitest'
import programming from './index.js'
import { validateProgrammingContent } from './validate.js'
import { chunkOrder } from '../contract.js'
import { initialProgress } from '../../engine/chunkProgress.js'
import { begin, createRunnerState, nextSession, retry, submitAttempt } from '../../engine/sessionRunner.js'

const TODAY = '2026-09-12'
const YESTERDAY = '2026-09-11'
const content = programming.content
const { recognition, completion } = programming.exercises

function itemById(id) {
  return content.items.find((item) => item.id === id)
}

function freshProgress() {
  return initialProgress(chunkOrder(programming))
}

function start(progress) {
  return begin(createRunnerState(progress, { today: TODAY, subject: programming }), content, programming)
}

function submit(state, attempt) {
  return submitAttempt(state, attempt, content, TODAY, programming).state
}

/** Build the attempt a learner would submit, graded by the subject like the Desk cards do. */
function attemptFor(state, given) {
  const { exerciseType: type, stimulus } = state
  if (stimulus.phase === 'worked_example') {
    return { type, chunkId: stimulus.chunkId, action: 'worked_example_ack' }
  }
  const attempt = { type, chunkId: stimulus.chunkId, itemId: stimulus.item.id, given: given ?? stimulus.item.answer }
  return { ...attempt, correct: programming.exercises[type].grade(attempt, stimulus) }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

describe('programming grading', () => {
  it('grades recognition answers ignoring whitespace', () => {
    const stimulus = { type: 'recognition', chunkId: 'iteration', item: itemById('iterate_map_join') }
    expect(recognition.grade({ given: '2,4,6' }, stimulus)).toBe(true)
    expect(recognition.grade({ given: ' 2, 4, 6 ' }, stimulus)).toBe(true)
    expect(recognition.grade({ given: '2,4,6,8' }, stimulus)).toBe(false)
  })

  it('grades completion answers against the answer and accepted variants', () => {
    const stimulus = { type: 'completion', phase: 'independent', chunkId: 'closures', item: itemById('closure_adder') }
    expect(completion.grade({ given: 'return (y) => x + y;' }, stimulus)).toBe(true)
    expect(completion.grade({ given: 'return (y)=>x+y' }, stimulus)).toBe(true)
    expect(completion.grade({ given: 'return y => x + y' }, stimulus)).toBe(true)
    expect(completion.grade({ given: 'return x + y' }, stimulus)).toBe(false)
  })

  it('never grades a worked example as answered', () => {
    const stimulus = completion.nextStimulus(freshProgress(), 'closures', content)
    expect(stimulus.phase).toBe('worked_example')
    expect(completion.grade({ given: 'anything' }, stimulus)).toBe(false)
  })

  it('names the misconception for a seeded distractor and nothing for other wrong answers', () => {
    const stimulus = { type: 'completion', phase: 'independent', chunkId: 'off-by-one', item: itemById('obo_sum_bound') }
    const named = completion.repairFor(
      { type: 'completion', chunkId: 'off-by-one', itemId: 'obo_sum_bound', given: 'i<=xs.length' },
      stimulus,
      content,
    )
    expect(named.misconception.id).toBe('off_by_one_bounds')
    expect(named.notionalMachine).toMatch(/indexes 0 to n - 1/)

    const generic = completion.repairFor(
      { type: 'completion', chunkId: 'off-by-one', itemId: 'obo_sum_bound', given: 'i < 3' },
      stimulus,
      content,
    )
    expect(generic).toBeNull()
  })

  it('feedback and expected answers name the right answer', () => {
    const stimulus = { type: 'recognition', chunkId: 'off-by-one', item: itemById('obo_lte_count') }
    expect(recognition.expectedAnswer(stimulus)).toBe('4')
    expect(recognition.feedback({ correct: false, attempt: { given: '3' } }, stimulus)).toBe('Incorrect - it logs 4')
    expect(recognition.feedback({ correct: true, attempt: { given: '4' } }, stimulus)).toBe('Correct: it logs 4')
  })
})

describe('programming content validation', () => {
  it('accepts the shipped content', () => {
    expect(() => validateProgrammingContent(content)).not.toThrow()
  })

  it('rejects an item with no answer', () => {
    const bad = clone(content)
    delete bad.items[0].answer
    expect(() => validateProgrammingContent(bad)).toThrow(/items\[0\] is missing string field "answer"/)
  })

  it('rejects a completion item without a blank', () => {
    const bad = clone(content)
    const i = bad.items.findIndex((item) => item.type === 'completion')
    bad.items[i].code = 'console.log(1)'
    expect(() => validateProgrammingContent(bad)).toThrow(/completion item without a ____ blank/)
  })

  it('rejects an item in an unknown chunk', () => {
    const bad = clone(content)
    bad.items[0].chunk = 'recursion'
    expect(() => validateProgrammingContent(bad)).toThrow(/unknown chunk "recursion"/)
  })

  it('rejects a chunk that cannot span two exercise types', () => {
    const bad = clone(content)
    bad.items = bad.items.filter((item) => !(item.chunk === 'iteration' && item.type === 'completion'))
    bad.distractors = bad.distractors.filter((d) => bad.items.some((item) => item.id === d.item_id))
    expect(() => validateProgrammingContent(bad)).toThrow(/chunk "iteration" has no completion item/)
  })

  it('rejects a distractor that points at a missing misconception or is actually correct', () => {
    const missing = clone(content)
    missing.distractors[0].misconception_id = 'nope'
    expect(() => validateProgrammingContent(missing)).toThrow(/unknown misconception "nope"/)

    const correct = clone(content)
    correct.distractors[0].given = itemById(correct.distractors[0].item_id).answer
    expect(() => validateProgrammingContent(correct)).toThrow(/is a correct answer/)
  })
})

describe('programming session loop (end to end through the engine)', () => {
  it('runs worked example, named repair, retest, and gate to summary on a fresh session', () => {
    let state = start(freshProgress())
    expect(state.plan).toEqual({ reviewChunkIds: [], newChunkId: 'closures', phase: 'new' })
    expect(state.exerciseType).toBe('completion')
    expect(state.stimulus.phase).toBe('worked_example')
    expect(state.stimulus.workedExample.chunk).toBe('closures')

    // I-do acknowledged: guided practice unlocks and the rotation starts at recognition.
    state = submit(state, attemptFor(state))
    expect(state.progress.chunks.find((c) => c.id === 'closures').production_phase).toBe('guided')
    expect(state.exerciseType).toBe('recognition')
    expect(state.stimulus.item.id).toBe('closure_loop_var')

    // Seeded distractor: expecting var to be block scoped.
    state = submit(state, attemptFor(state, '0'))
    expect(state.feedback).toBeNull()
    expect(state.repair.misconception.id).toBe('var_block_scoped')
    expect(state.repair.correctForm).toBe('3')
    expect(state.repair.notionalMachine).toMatch(/live reference/)
    expect(state.repair.pendingType).toBe('recognition')

    // Retest on the pending item.
    state = retry(state)
    expect(state.repair).toBeNull()
    expect(state.stimulus.item.id).toBe('closure_loop_var')

    // A wrong answer with no distractor is a generic miss.
    const generic = submit(state, attemptFor(state, 'banana'))
    expect(generic.repair.misconception).toBeNull()
    expect(generic.feedback).toBe('Incorrect - it logs 3')

    // Correct answers alternate the two types until the gate clears.
    const seenTypes = new Set()
    let steps = 0
    while (state.status === 'running' && steps < 10) {
      expect(state.stimulus).not.toBeNull()
      seenTypes.add(state.exerciseType)
      state = submit(state, attemptFor(state))
      steps++
    }

    expect(state.status).toBe('summary')
    expect(state.masteredChunkId).toBe('closures')
    expect(seenTypes).toEqual(new Set(['recognition', 'completion']))
    const closures = state.progress.chunks.find((c) => c.id === 'closures')
    expect(closures).toMatchObject({ mastered: true, mastered_date: TODAY, ladder_step: 0, next_due_date: '2026-09-13' })
    expect(closures.production_phase).toBe('independent')

    // Session two introduces the next chunk through its worked example.
    const next = nextSession(state, { today: TODAY, autoStart: true, content, subject: programming }).state
    expect(next.mode).toBe('new')
    expect(next.exerciseType).toBe('completion')
    expect(next.stimulus).toMatchObject({ phase: 'worked_example', chunkId: 'iteration' })
  })

  it('reviews a due chunk across both types, advances its ladder, then moves to new content', () => {
    const progress = freshProgress()
    progress.session_number = 2
    Object.assign(progress.chunks[0], {
      mastered: true,
      mastered_date: YESTERDAY,
      ladder_step: 0,
      last_reviewed_date: YESTERDAY,
      next_due_date: YESTERDAY,
      production_phase: 'independent',
      streak_count: 3,
      types_in_streak: ['recognition', 'completion'],
    })

    let state = start(progress)
    expect(state.plan.reviewChunkIds).toEqual(['closures'])
    expect(state.mode).toBe('review')
    expect(state.exerciseType).toBe('recognition')
    expect(state.progress.chunks[0].streak_count).toBe(0)

    const reviewTypes = []
    while (state.mode === 'review') {
      expect(state.stimulus).not.toBeNull()
      reviewTypes.push(state.exerciseType)
      state = submit(state, attemptFor(state))
    }

    expect(reviewTypes).toEqual(['recognition', 'completion', 'recognition'])
    expect(state.reviewedCount).toBe(1)
    expect(state.progress.chunks[0]).toMatchObject({ ladder_step: 1, next_due_date: '2026-09-15' })
    expect(state.mode).toBe('new')
    expect(state.stimulus).toMatchObject({ phase: 'worked_example', chunkId: 'iteration' })
  })

  it('routes a review miss through named repair and resets the ladder', () => {
    const progress = freshProgress()
    progress.session_number = 3
    Object.assign(progress.chunks[2], {
      mastered: true,
      mastered_date: '2026-09-01',
      ladder_step: 2,
      last_reviewed_date: '2026-09-04',
      next_due_date: YESTERDAY,
      production_phase: 'independent',
    })

    let state = start(progress)
    expect(state.mode).toBe('review')
    expect(state.stimulus.item.id).toBe('obo_lte_count')

    state = submit(state, attemptFor(state, '3'))
    expect(state.reviewHadMiss).toBe(true)
    expect(state.repair.misconception.id).toBe('off_by_one_bounds')

    state = retry(state)
    while (state.mode === 'review') {
      state = submit(state, attemptFor(state))
    }
    expect(state.progress.chunks[2]).toMatchObject({ ladder_step: 0, next_due_date: '2026-09-13' })
  })
})
