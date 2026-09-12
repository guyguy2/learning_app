import { describe, expect, it } from 'vitest'
import { DEFAULT_SUBJECT_ID, SUBJECT_IDS, getSubject } from './index.js'
import { chunkOrder, exerciseFor, resolveSubjectContent } from './contract.js'
import { initialProgress } from '../engine/chunkProgress.js'
import { begin, createRunnerState } from '../engine/sessionRunner.js'
import { defaultProgress } from '../../server/progressStore.js'

const TODAY = '2026-09-12'
const EXERCISE_FUNCTIONS = ['nextStimulus', 'apply', 'grade', 'feedback', 'expectedAnswer']

describe.each(SUBJECT_IDS)('subject contract: %s', (id) => {
  const subject = getSubject(id)
  const fresh = () => initialProgress(chunkOrder(subject))

  it('has an id matching its registry key and a display name', () => {
    expect(subject.id).toBe(id)
    expect(typeof subject.displayName).toBe('string')
    expect(subject.displayName.length).toBeGreaterThan(0)
  })

  it('implements every exercise type, with a badge and a Desk card for each', () => {
    expect(subject.exerciseTypes.length).toBeGreaterThan(0)
    expect(new Set(subject.exerciseTypes).size).toBe(subject.exerciseTypes.length)
    for (const type of subject.exerciseTypes) {
      const exercise = exerciseFor(subject, type)
      for (const fn of EXERCISE_FUNCTIONS) expect(typeof exercise[fn]).toBe('function')
      if (exercise.repairFor != null) expect(typeof exercise.repairFor).toBe('function')
      expect(subject.techniques[type]?.techniqueName).toEqual(expect.any(String))
      expect(typeof subject.ui.cards[type]).toBe('function')
    }
  })

  it('has badges for the engine phases review and repair', () => {
    expect(subject.techniques.review?.techniqueName).toEqual(expect.any(String))
    expect(subject.techniques.repair?.techniqueName).toEqual(expect.any(String))
  })

  it('reviews over at least two of its exercise types, so the review gate can clear', () => {
    expect(subject.reviewTypes.length).toBeGreaterThanOrEqual(2)
    for (const type of subject.reviewTypes) expect(subject.exerciseTypes).toContain(type)
  })

  it('names a scaffold type from its exercise types, or none', () => {
    if (subject.scaffoldType != null) expect(subject.exerciseTypes).toContain(subject.scaffoldType)
  })

  it('lists ordered, uniquely identified, labelled chunks', () => {
    const chunks = subject.chunks(subject.content)
    expect(chunks.length).toBeGreaterThan(0)
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length)
    for (const c of chunks) expect(c.label).toEqual(expect.any(String))
  })

  it('validates its default content and rejects content with missing pools', () => {
    expect(() => subject.validate(subject.content)).not.toThrow()
    expect(() => subject.validate({})).toThrow(new RegExp(`^${id} content:`))
  })

  it('serves null or a stimulus of the matching type for every chunk and exercise type', () => {
    const progress = fresh()
    for (const chunkId of chunkOrder(subject)) {
      for (const type of subject.exerciseTypes) {
        const stimulus = exerciseFor(subject, type).nextStimulus(progress, chunkId, subject.content)
        if (stimulus !== null) expect(stimulus.type).toBe(type)
      }
    }
  })

  it('starts a fresh session on a drill rather than a blank screen', () => {
    const state = begin(createRunnerState(fresh(), { today: TODAY, subject }), subject.content, subject)
    expect(state.status).toBe('running')
    expect(state.mode).toBe('new')
    expect(subject.exerciseTypes).toContain(state.exerciseType)
    expect(state.stimulus).not.toBeNull()
  })
})

describe('subject registry and contract helpers', () => {
  it('falls back to the default subject for a missing or unknown id', () => {
    expect(getSubject().id).toBe(DEFAULT_SUBJECT_ID)
    expect(getSubject(null).id).toBe(DEFAULT_SUBJECT_ID)
    expect(getSubject('klingon').id).toBe(DEFAULT_SUBJECT_ID)
    expect(getSubject('programming').id).toBe('programming')
  })

  it('seeds Spanish exactly like the server default progress', () => {
    const spanish = getSubject('spanish')
    expect(initialProgress(chunkOrder(spanish))).toEqual(defaultProgress())
  })

  it('throws on an exercise type the subject does not have', () => {
    expect(() => exerciseFor(getSubject('spanish'), 'completion')).toThrow(/no exercise type "completion"/)
  })

  it('fills missing content keys from the subject defaults', () => {
    const programming = getSubject('programming')
    const custom = { items: [] }
    const resolved = resolveSubjectContent(programming, custom)
    expect(resolved.items).toBe(custom.items)
    expect(resolved.misconceptions).toBe(programming.content.misconceptions)
    expect(resolveSubjectContent(programming, undefined)).toBe(programming.content)
  })
})
