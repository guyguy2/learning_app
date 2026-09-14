import { describe, expect, it } from 'vitest'
import programming from './index.js'
import { sentenceCount, validateProgrammingContent } from './validate.js'
import { chunkOrder } from '../contract.js'
import { findChunk, initialProgress } from '../../engine/chunkProgress.js'
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

function chunkIn(progress, id) {
  return findChunk(progress.chunks, id)
}

/** A chunk mastered earlier whose review fell due yesterday. */
function dueForReview(progress, id, fields = {}) {
  Object.assign(chunkIn(progress, id), {
    mastered: true,
    mastered_date: YESTERDAY,
    ladder_step: 0,
    last_reviewed_date: YESTERDAY,
    next_due_date: YESTERDAY,
    production_phase: 'independent',
    ...fields,
  })
  return progress
}

describe('programming grading', () => {
  it('grades recognition answers ignoring whitespace, with a comma-separated synonym', () => {
    const stimulus = { type: 'recognition', chunkId: 'scope', item: itemById('scope_var_escapes') }
    expect(recognition.grade({ given: 'number undefined' }, stimulus)).toBe(true)
    expect(recognition.grade({ given: '  number   undefined ' }, stimulus)).toBe(true)
    expect(recognition.grade({ given: 'number, undefined' }, stimulus)).toBe(true)
    expect(recognition.grade({ given: 'number number' }, stimulus)).toBe(false)
  })

  it('grades completion answers against the answer and accepted variants', () => {
    const stimulus = { type: 'completion', phase: 'independent', chunkId: 'scope', item: itemById('scope_assign_outer') }
    expect(completion.grade({ given: 'total += n;' }, stimulus)).toBe(true)
    expect(completion.grade({ given: 'total+=n' }, stimulus)).toBe(true)
    expect(completion.grade({ given: 'total = total + n' }, stimulus)).toBe(true)
    expect(completion.grade({ given: 'let total = n' }, stimulus)).toBe(false)
  })

  it('never grades a worked example as answered', () => {
    const stimulus = completion.nextStimulus(freshProgress(), 'scope', content)
    expect(stimulus.phase).toBe('worked_example')
    expect(completion.grade({ given: 'anything' }, stimulus)).toBe(false)
  })

  it('names the misconception for a seeded distractor and nothing for other wrong answers', () => {
    const stimulus = { type: 'completion', phase: 'independent', chunkId: 'scope', item: itemById('scope_assign_outer') }
    const named = completion.repairFor(
      { type: 'completion', chunkId: 'scope', itemId: 'scope_assign_outer', given: 'let total=n;' },
      stimulus,
      content,
    )
    expect(named.misconception.id).toBe('shadow_assigns_outer')
    expect(named.notionalMachine).toMatch(/nearest scope first/)

    const generic = completion.repairFor(
      { type: 'completion', chunkId: 'scope', itemId: 'scope_assign_outer', given: 'total = 5' },
      stimulus,
      content,
    )
    expect(generic).toBeNull()
  })

  it('names the seeded misconception for every distractor', () => {
    for (const d of content.distractors) {
      const item = itemById(d.item_id)
      const attempt = { type: item.type, chunkId: item.chunk, itemId: item.id, given: d.given }
      const stimulus = { type: item.type, chunkId: item.chunk, item }
      expect(programming.exercises[item.type].grade(attempt, stimulus)).toBe(false)
      expect(programming.exercises[item.type].repairFor(attempt, stimulus, content).misconception.id).toBe(
        d.misconception_id,
      )
    }
  })

  it('feedback and expected answers name the right answer', () => {
    const stimulus = { type: 'recognition', chunkId: 'scope', item: itemById('scope_shadow') }
    expect(recognition.expectedAnswer(stimulus)).toBe('1')
    expect(recognition.feedback({ correct: false, attempt: { given: '2' } }, stimulus)).toBe('Incorrect - it logs 1')
    expect(recognition.feedback({ correct: true, attempt: { given: '1' } }, stimulus)).toBe('Correct: it logs 1')
  })
})

describe('programming item rotation', () => {
  it('serves every item of a chunk and type before repeating one, correct or not', () => {
    for (const chunkId of chunkOrder(programming)) {
      for (const type of programming.exerciseTypes) {
        const exercise = programming.exercises[type]
        const pool = content.items.filter((item) => item.chunk === chunkId && item.type === type)
        let progress = freshProgress()
        Object.assign(chunkIn(progress, chunkId), { production_phase: 'independent' })
        const served = []
        for (let i = 0; i < pool.length; i++) {
          const stimulus = exercise.nextStimulus(progress, chunkId, content)
          served.push(stimulus.item.id)
          const attempt = { type, chunkId, itemId: stimulus.item.id, given: 'x', correct: i % 2 === 0 }
          progress = exercise.apply(progress, attempt, content, TODAY).progress
        }
        expect(new Set(served)).toEqual(new Set(pool.map((item) => item.id)))
      }
    }
  })

  it('counts attempts per item in progress.words without touching other items', () => {
    const progress = freshProgress()
    const stimulus = recognition.nextStimulus(progress, 'scope', content)
    const attempt = { type: 'recognition', chunkId: 'scope', itemId: stimulus.item.id, given: 'x', correct: false }
    const after = recognition.apply(progress, attempt, content, TODAY).progress
    expect(after.words).toEqual([{ id: stimulus.item.id, status: 'learning', streak_count: 0, attempts: 1 }])
    expect(progress.words).toEqual([])
  })

  it('retests a named misconception on another item of the same chunk and type that probes it', () => {
    let checked = 0
    for (const d of content.distractors) {
      const missed = itemById(d.item_id)
      const probes = new Set(
        content.distractors.filter((o) => o.misconception_id === d.misconception_id).map((o) => o.item_id),
      )
      const siblings = content.items.filter(
        (item) => item.id !== missed.id && item.chunk === missed.chunk && item.type === missed.type && probes.has(item.id),
      )
      const progress = freshProgress()
      Object.assign(chunkIn(progress, missed.chunk), { production_phase: 'independent' })
      const attempt = { type: missed.type, chunkId: missed.chunk, itemId: missed.id, given: d.given, correct: false }
      const { next } = programming.exercises[missed.type].apply(progress, attempt, content, TODAY)
      expect(next.type).toBe(missed.type)
      expect(next.chunkId).toBe(missed.chunk)
      if (siblings.length > 0) {
        expect(siblings.map((s) => s.id)).toContain(next.item.id)
        checked++
      } else {
        expect(next.item.id).toBe(missed.id)
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('retries the missed item itself after a generic miss', () => {
    const item = itemById('scope_shadow')
    const attempt = { type: 'recognition', chunkId: 'scope', itemId: item.id, given: 'banana', correct: false }
    const { next } = recognition.apply(freshProgress(), attempt, content, TODAY)
    expect(next.item.id).toBe(item.id)
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
    expect(() => validateProgrammingContent(bad)).toThrow(/completion item without exactly one ____ blank/)
  })

  it('rejects a completion item with no stated output', () => {
    const bad = clone(content)
    const i = bad.items.findIndex((item) => item.type === 'completion')
    delete bad.items[i].output
    expect(() => validateProgrammingContent(bad)).toThrow(/missing string field "output"/)
  })

  it('rejects a recognition synonym that is not a formatting variant of the answer', () => {
    const ok = clone(content)
    const i = ok.items.findIndex((item) => item.type === 'recognition')
    ok.items[i].accepted = [` ${ok.items[i].answer} `]
    expect(() => validateProgrammingContent(ok)).not.toThrow()

    const bad = clone(content)
    bad.items[i].accepted = ['something else']
    expect(() => validateProgrammingContent(bad)).toThrow(/is not a formatting variant/)
  })

  it('rejects a recognition item whose thrown error is not its answer', () => {
    const bad = clone(content)
    const i = bad.items.findIndex((item) => item.type === 'recognition' && !item.throws)
    bad.items[i].throws = 'TypeError'
    expect(() => validateProgrammingContent(bad)).toThrow(/throws "TypeError" but answers/)
  })

  it('rejects a misconception no distractor reaches, or one explained in one sentence', () => {
    const orphan = clone(content)
    orphan.misconceptions.push({ id: 'orphan', name: 'Orphan', explanation: 'One. Two.' })
    expect(() => validateProgrammingContent(orphan)).toThrow(/misconception "orphan" has no distractor/)

    const terse = clone(content)
    terse.misconceptions[0].explanation = 'Too short.'
    expect(() => validateProgrammingContent(terse)).toThrow(/explanation has 1 sentences; use two or three/)
  })

  it('does not count code operators such as ??, ... and === as sentence ends', () => {
    expect(sentenceCount('Use ?? here. Then stop.')).toBe(2)
    expect(sentenceCount('for...of walks by index. x === y is strict! Done?')).toBe(3)
  })

  it('rejects an item in an unknown chunk', () => {
    const bad = clone(content)
    bad.items[0].chunk = 'recursion'
    expect(() => validateProgrammingContent(bad)).toThrow(/unknown chunk "recursion"/)
  })

  it('rejects a chunk that cannot span two exercise types', () => {
    const bad = clone(content)
    bad.items = bad.items.filter((item) => !(item.chunk === 'scope' && item.type === 'completion'))
    bad.distractors = bad.distractors.filter((d) => bad.items.some((item) => item.id === d.item_id))
    expect(() => validateProgrammingContent(bad)).toThrow(/chunk "scope" has no completion item/)
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
  it('runs worked example, named repair, similar-item retest, and gate to summary on a fresh session', () => {
    const [first, second] = chunkOrder(programming)
    expect(first).toBe('scope')

    let state = start(freshProgress())
    expect(state.plan).toEqual({ reviewChunkIds: [], newChunkId: 'scope', phase: 'new' })
    expect(state.exerciseType).toBe('completion')
    expect(state.stimulus.phase).toBe('worked_example')
    expect(state.stimulus.workedExample.chunk).toBe('scope')

    // I-do acknowledged: guided practice unlocks and the rotation starts at recognition.
    state = submit(state, attemptFor(state))
    expect(chunkIn(state.progress, 'scope').production_phase).toBe('guided')
    expect(state.exerciseType).toBe('recognition')
    expect(state.stimulus.item.id).toBe('scope_var_escapes')

    // Seeded distractor: expecting var to be block scoped.
    state = submit(state, attemptFor(state, 'undefined undefined'))
    expect(state.feedback).toBeNull()
    expect(state.repair.misconception.id).toBe('var_block_scoped')
    expect(state.repair.correctForm).toBe('number undefined')
    expect(state.repair.notionalMachine).toMatch(/nearest enclosing block/)
    expect(state.repair.pendingType).toBe('recognition')

    // The retest is a similar item probing the same misconception, not the one just missed.
    state = retry(state)
    expect(state.repair).toBeNull()
    expect(state.stimulus.item.id).toBe('scope_loop_var_after')

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
    expect(state.masteredChunkId).toBe('scope')
    expect(seenTypes).toEqual(new Set(['recognition', 'completion']))
    const scope = chunkIn(state.progress, 'scope')
    expect(scope).toMatchObject({ mastered: true, mastered_date: TODAY, ladder_step: 0, next_due_date: '2026-09-13' })
    expect(scope.production_phase).toBe('independent')

    // Session two introduces the next chunk through its worked example.
    const next = nextSession(state, { today: TODAY, autoStart: true, content, subject: programming }).state
    expect(next.mode).toBe('new')
    expect(next.exerciseType).toBe('completion')
    expect(next.stimulus).toMatchObject({ phase: 'worked_example', chunkId: second })
  })

  it('reviews a due chunk across both types, advances its ladder, then moves to new content', () => {
    const [first, second] = chunkOrder(programming)
    const progress = dueForReview(freshProgress(), first, {
      streak_count: 3,
      types_in_streak: ['recognition', 'completion'],
    })
    progress.session_number = 2

    let state = start(progress)
    expect(state.plan.reviewChunkIds).toEqual([first])
    expect(state.mode).toBe('review')
    expect(state.exerciseType).toBe('recognition')
    expect(chunkIn(state.progress, first).streak_count).toBe(0)

    const reviewTypes = []
    while (state.mode === 'review') {
      expect(state.stimulus).not.toBeNull()
      reviewTypes.push(state.exerciseType)
      state = submit(state, attemptFor(state))
    }

    expect(reviewTypes).toEqual(['recognition', 'completion', 'recognition'])
    expect(state.reviewedCount).toBe(1)
    expect(chunkIn(state.progress, first)).toMatchObject({ ladder_step: 1, next_due_date: '2026-09-15' })
    expect(state.mode).toBe('new')
    expect(state.stimulus).toMatchObject({ phase: 'worked_example', chunkId: second })
  })

  it('routes a review miss through named repair and resets the ladder', () => {
    const progress = dueForReview(freshProgress(), 'off-by-one', {
      mastered_date: '2026-09-01',
      ladder_step: 2,
      last_reviewed_date: '2026-09-04',
    })
    progress.session_number = 3

    let state = start(progress)
    expect(state.mode).toBe('review')
    const distractor = content.distractors.find((d) => d.item_id === state.stimulus.item.id)
    expect(distractor).toBeDefined()

    state = submit(state, attemptFor(state, distractor.given))
    expect(state.reviewHadMiss).toBe(true)
    expect(state.repair.misconception.id).toBe(distractor.misconception_id)

    state = retry(state)
    while (state.mode === 'review') {
      state = submit(state, attemptFor(state))
    }
    expect(chunkIn(state.progress, 'off-by-one')).toMatchObject({ ladder_step: 0, next_due_date: '2026-09-13' })
  })
})
