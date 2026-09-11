import { describe, expect, it } from 'vitest'
import {
  createRunnerState,
  begin,
  submitAttempt,
  commitProgress,
  retry,
  nextSession,
  DEFAULT_CONTENT,
} from './sessionRunner.js'
import { buildFreshSeed, buildMidSeed, buildReviewDueSeed } from '../../server/seeds.js'

describe('sessionRunner', () => {
  const TODAY = '2026-09-11'

  function answerCorrectly(s) {
    if (s.exerciseType === 'recognition') {
      return {
        type: 'recognition',
        wordId: s.stimulus.word.id,
        given: s.stimulus.word.meaning,
        correct: true,
      }
    }
    if (s.exerciseType === 'production') {
      return {
        type: 'production',
        chunkId: s.stimulus.chunkId,
        wordId: s.stimulus.verb.id,
        person: s.stimulus.person,
        given: s.stimulus.expectedForm,
        correct: true,
      }
    }
    return {
      type: 'role-tagging',
      chunkId: s.stimulus.chunkId,
      given: {
        subject: s.stimulus.parts.subject,
        stem: s.stimulus.parts.stem,
        ending: s.stimulus.parts.ending,
        object: s.stimulus.parts.object,
      },
      correct: true,
    }
  }

  it('initializes in ready state with plan available', () => {
    const fresh = buildFreshSeed()
    const state = createRunnerState(fresh, { today: TODAY })

    expect(state.status).toBe('ready')
    expect(state.plan).toEqual({
      reviewChunkIds: [],
      newChunkId: 'ar',
      phase: 'new',
    })
    expect(state.mode).toBeNull()
    expect(state.stimulus).toBeNull()
    expect(state.attemptCount).toBe(0)
  })

  it('progresses: review -> new -> gate -> summary', () => {
    const reviewDue = buildReviewDueSeed(new Date(TODAY))
    let state = createRunnerState(reviewDue, { today: TODAY })
    expect(state.plan.phase).toBe('review')
    expect(state.plan.reviewChunkIds).toContain('ar')
    expect(state.plan.newChunkId).toBe('er')

    // Begin review session
    state = begin(state, DEFAULT_CONTENT)
    expect(state.status).toBe('running')
    expect(state.mode).toBe('review')
    expect(state.exerciseType).toBe('production')
    expect(state.reviewQueue).toEqual(['ar'])
    expect(state.reviewedCount).toBe(0)
    expect(state.stimulus).not.toBeNull()

    // 1st review drill (production) - correct
    let res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    expect(state.mode).toBe('review')
    expect(state.exerciseType).toBe('role-tagging')
    expect(state.reviewedCount).toBe(0)

    // 2nd review drill (role-tagging) - correct
    res = submitAttempt(
      state,
      {
        type: 'role-tagging',
        chunkId: 'ar',
        given: {
          subject: state.stimulus.parts.subject,
          stem: state.stimulus.parts.stem,
          ending: state.stimulus.parts.ending,
          object: state.stimulus.parts.object,
        },
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    expect(state.mode).toBe('review')
    expect(state.exerciseType).toBe('production')

    // 3rd review drill (production) - correct -> review gate cleared!
    res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state

    // Review cleared and queue empty -> transitioned into new-content phase ('er')
    expect(state.reviewedCount).toBe(1)
    expect(state.reviewQueue).toEqual([])
    expect(state.mode).toBe('new')
    expect(state.status).toBe('running')

    // 'ar' chunk ladder should have advanced from step 0 to step 1
    const arChunk = state.progress.chunks.find((c) => c.id === 'ar')
    expect(arChunk.ladder_step).toBe(1)

    // Answer drills until chunk advancement gate clears
    let attempts = 0
    while (state.status === 'running' && attempts < 10) {
      res = submitAttempt(state, answerCorrectly(state), DEFAULT_CONTENT, TODAY)
      state = res.state
      attempts++
    }

    // Advancement gate cleared -> summary transition!
    expect(state.status).toBe('summary')
    expect(state.mode).toBeNull()
    expect(state.masteredChunkId).toBe('er')
    expect(state.stimulus).toBeNull()

    // Next session
    const next = nextSession(state, { today: TODAY })
    expect(next.state.status).toBe('ready')
    expect(next.state.progress.session_number).toBe(4)
    expect(next.progress.session_number).toBe(4)
  })

  it('resets streak on a miss during new-content and review modes', () => {
    // 1. New-content mode: streak reset
    const mid = buildMidSeed()
    let state = createRunnerState(mid, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)
    expect(state.mode).toBe('new')

    // Answer correctly once
    let res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    const arChunkAfter1 = state.progress.chunks.find((c) => c.id === 'ar')
    expect(arChunkAfter1.streak_count).toBe(1)

    // Now miss on the next drill
    res = submitAttempt(
      state,
      {
        type: state.exerciseType,
        chunkId: 'ar',
        wordId: state.stimulus?.verb?.id ?? state.stimulus?.word?.id,
        person: state.stimulus?.person,
        given: 'wrong',
        correct: false,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    const arChunkAfterMiss = state.progress.chunks.find((c) => c.id === 'ar')
    expect(arChunkAfterMiss.streak_count).toBe(0)
    expect(arChunkAfterMiss.types_in_streak).toEqual([])

    // 2. Review mode: miss flags reviewHadMiss and resets streak
    const reviewDue = buildReviewDueSeed(new Date(TODAY))
    state = createRunnerState(reviewDue, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)
    expect(state.mode).toBe('review')

    // Answer correctly once
    res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    expect(state.progress.chunks.find((c) => c.id === 'ar').streak_count).toBe(1)

    // Now miss in review
    res = submitAttempt(
      state,
      {
        type: 'role-tagging',
        chunkId: 'ar',
        given: { subject: 'x', stem: 'x', ending: 'x', object: 'x' },
        correct: false,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    expect(state.reviewHadMiss).toBe(true)
    expect(state.progress.chunks.find((c) => c.id === 'ar').streak_count).toBe(0)
    expect(state.progress.chunks.find((c) => c.id === 'ar').types_in_streak).toEqual([])
  })

  it('branches misconception detection into named repair vs generic repair', () => {
    const fresh = buildFreshSeed()
    let state = createRunnerState(fresh, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)

    // Trigger named misconception: false cognate 'embarazada' -> 'embarrassed'
    const resNamed = submitAttempt(
      state,
      {
        type: 'recognition',
        wordId: 'embarazada',
        given: 'embarrassed',
        correct: false,
      },
      DEFAULT_CONTENT,
      TODAY,
    )

    expect(resNamed.state.repair).not.toBeNull()
    expect(resNamed.state.repair.misconception).toBeDefined()
    expect(resNamed.state.repair.misconception.id).toBe('false_cognate_embarazada')
    expect(resNamed.state.feedback).toBeNull()

    // Trigger generic miss: nonsense input
    const resGeneric = submitAttempt(
      state,
      {
        type: 'recognition',
        wordId: state.stimulus.word.id,
        given: 'nonsense-answer',
        correct: false,
      },
      DEFAULT_CONTENT,
      TODAY,
    )

    expect(resGeneric.state.repair).not.toBeNull()
    expect(resGeneric.state.repair.misconception).toBeNull()
    expect(resGeneric.state.repair.correctForm).toBe(state.stimulus.word.meaning)
    expect(resGeneric.state.feedback).toMatch(/incorrect — /)
  })

  it('historical bug (a): worked_example_ack does not leave a blank screen (commit 20ace31)', () => {
    // When acknowledging a worked example in session 1 where no verbs are mastered,
    // the next production stimulus is null. The runner must fall back through rotation
    // to recognition rather than leaving stimulus: null.
    const fresh = buildFreshSeed()
    let state = createRunnerState(fresh, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)

    const res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        action: 'worked_example_ack',
      },
      DEFAULT_CONTENT,
      TODAY,
    )

    expect(res.state.status).toBe('running')
    expect(res.state.mode).toBe('new')
    expect(res.state.stimulus).not.toBeNull()
    expect(res.state.exerciseType).toBe('recognition')
  })

  it('historical bug (b): fresh session renders new content drill instead of summary (commit 0444138)', () => {
    // A fresh session must derive the active chunk directly from progress without
    // stale state reads, never falling through to summary.
    const fresh = buildFreshSeed()
    const state = createRunnerState(fresh, { today: TODAY })
    const started = begin(state, DEFAULT_CONTENT)

    expect(started.status).toBe('running')
    expect(started.mode).toBe('new')
    expect(started.exerciseType).toBe('recognition')
    expect(started.stimulus).not.toBeNull()
    expect(started.stimulus.type).toBe('recognition')
  })

  it('prevents review gate insta-clearing by resetting streaks on chunk entry', () => {
    // A just-mastered chunk in review-due seed may carry streak_count 3 from initial mastery.
    const reviewDue = buildReviewDueSeed(new Date(TODAY))
    const arChunkBefore = reviewDue.chunks.find((c) => c.id === 'ar')
    // Artificially simulate that ar chunk had streak 3 left over from earlier gate
    arChunkBefore.streak_count = 3
    arChunkBefore.types_in_streak = ['production', 'role-tagging']

    let state = createRunnerState(reviewDue, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)

    // Entering review chunk must have reset streak_count and types_in_streak in progress
    const arChunkOnEntry = state.progress.chunks.find((c) => c.id === 'ar')
    expect(arChunkOnEntry.streak_count).toBe(0)
    expect(arChunkOnEntry.types_in_streak).toEqual([])

    // A single correct answer must NOT clear the gate
    const res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )

    expect(res.state.mode).toBe('review')
    expect(res.state.status).toBe('running')
    expect(res.state.reviewedCount).toBe(0)
    expect(res.state.progress.chunks.find((c) => c.id === 'ar').streak_count).toBe(1)
  })

  it('maintains attemptCount semantics: increments on miss, resets on retry and new stimulus', () => {
    const fresh = buildFreshSeed()
    let state = createRunnerState(fresh, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)

    expect(state.attemptCount).toBe(0)

    // Incorrect attempt: attemptCount increments to 1
    let res = submitAttempt(
      state,
      {
        type: 'recognition',
        wordId: state.stimulus.word.id,
        given: 'wrong',
        correct: false,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    expect(state.attemptCount).toBe(1)
    expect(state.repair).not.toBeNull()

    // Retry resets attemptCount for the pending stimulus
    state = retry(state)
    expect(state.attemptCount).toBe(0)
    expect(state.repair).toBeNull()

    // Correct attempt advances to next stimulus and resets attemptCount to 0
    res = submitAttempt(
      state,
      {
        type: 'recognition',
        wordId: state.stimulus.word.id,
        given: state.stimulus.word.meaning,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    state = res.state
    expect(state.attemptCount).toBe(0)
  })

  it('codifies contract gap fix: feedback === "correct" is cleared when next stimulus is presented in both modes', () => {
    // 1. New-content mode: feedback is null when next stimulus is presented
    const mid = buildMidSeed()
    let state = createRunnerState(mid, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)
    expect(state.mode).toBe('new')

    let res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    expect(res.state.stimulus).not.toBeNull()
    expect(res.state.feedback).toBeNull()

    // 2. Review mode: feedback is ALSO null when next stimulus is presented (contract gap fixed)
    const reviewDue = buildReviewDueSeed(new Date(TODAY))
    state = createRunnerState(reviewDue, { today: TODAY })
    state = begin(state, DEFAULT_CONTENT)
    expect(state.mode).toBe('review')

    res = submitAttempt(
      state,
      {
        type: 'production',
        chunkId: 'ar',
        wordId: state.stimulus.verb.id,
        person: state.stimulus.person,
        given: state.stimulus.expectedForm,
        correct: true,
      },
      DEFAULT_CONTENT,
      TODAY,
    )
    expect(res.state.mode).toBe('review')
    expect(res.state.stimulus).not.toBeNull()
    // Prior bug: feedback remained 'correct' on the next card in review mode.
    // Fixed: feedback is cleared to null when the next stimulus is presented in review mode as well.
    expect(res.state.feedback).toBeNull()
  })

  it('commits persisted progress via commitProgress without mutating state', () => {
    const fresh = buildFreshSeed()
    const state = createRunnerState(fresh, { today: TODAY })
    const updated = { ...fresh, session_number: 99 }

    const committed = commitProgress(state, updated)
    expect(committed.progress.session_number).toBe(99)
    expect(state.progress.session_number).toBe(1)
  })
})
