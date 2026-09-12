import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSeed } from '../../server/seeds.js'

// Simple hook harness that implements React-like useState and useEffect in node
let hooksState = []
let hookIndex = 0
let effects = []

function resetHookHarness() {
  hooksState = []
  hookIndex = 0
  effects = []
}

vi.mock('react', () => {
  return {
    useState: (initial) => {
      const i = hookIndex++
      if (hooksState[i] === undefined) {
        hooksState[i] = typeof initial === 'function' ? initial() : initial
      }
      const setState = (action) => {
        hooksState[i] = typeof action === 'function' ? action(hooksState[i]) : action
      }
      return [hooksState[i], setState]
    },
    useEffect: (cb) => {
      effects.push(cb)
    },
  }
})

// Now import useSessionRunner
import { useSessionRunner } from './useSessionRunner.js'

function renderHook(options) {
  hookIndex = 0
  effects = []
  const result = useSessionRunner(options)
  return {
    get current() {
      hookIndex = 0
      return useSessionRunner(options)
    },
    runEffects: async () => {
      for (const eff of effects) {
        eff()
      }
      effects = []
      // Flush microtasks and promise callbacks
      await new Promise((resolve) => setTimeout(resolve, 20))
    },
  }
}

describe('useSessionRunner', () => {
  beforeEach(() => {
    resetHookHarness()
    vi.restoreAllMocks()
  })

  it('starts with autoStart=false in ready state with plan available', async () => {
    const fresh = buildSeed('fresh')
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => fresh,
    })

    const hook = renderHook({ autoStart: false })
    expect(hook.current.status).toBe('loading')

    await hook.runEffects()

    const state = hook.current
    expect(state.status).toBe('ready')
    expect(state.plan).toEqual({
      reviewChunkIds: [],
      newChunkId: 'ar',
      phase: 'new',
    })
    expect(state.mode).toBeNull()
    expect(typeof state.begin).toBe('function')

    // Call begin to start
    state.begin()
    const running = hook.current
    expect(running.status).toBe('running')
    expect(running.mode).toBe('new')
    expect(running.exerciseType).toBe('recognition')
    expect(running.stimulus.type).toBe('recognition')
  })

  it('starts with autoStart=true on fresh progress and presents recognition drill', async () => {
    const fresh = buildSeed('fresh')
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => fresh,
    })

    const hook = renderHook({ autoStart: true })
    await hook.runEffects()

    const state = hook.current
    expect(state.status).toBe('running')
    expect(state.mode).toBe('new')
    expect(state.exerciseType).toBe('recognition')
    expect(state.stimulus.type).toBe('recognition')
    expect(state.attemptCount).toBe(0)
  })

  it('starts with autoStart=true on mid progress and presents production stimulus with phase guided', async () => {
    const mid = buildSeed('mid')
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mid,
    })

    const hook = renderHook({ autoStart: true })
    await hook.runEffects()

    const state = hook.current
    expect(state.status).toBe('running')
    expect(state.mode).toBe('new')
    expect(state.exerciseType).toBe('production')
    expect(state.stimulus.type).toBe('production')
    expect(state.stimulus.phase).toBe('guided')
    expect(state.attemptCount).toBe(0)
  })

  it('starts with autoStart=true on review-due progress and enters review mode', async () => {
    const reviewDue = buildSeed('review-due')
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/progress') {
        return Promise.resolve({ json: async () => reviewDue })
      }
      return Promise.resolve({ json: async () => reviewDue })
    })

    const hook = renderHook({ autoStart: true })
    await hook.runEffects()

    const state = hook.current
    expect(state.status).toBe('running')
    expect(state.mode).toBe('review')
    expect(state.exerciseType).toBe('production')
    expect(state.reviewQueue).toContain('ar')
    expect(state.attemptCount).toBe(0)
  })

  it('tracks attemptCount and resets on stimulus change', async () => {
    const fresh = buildSeed('fresh')
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.body) {
        return Promise.resolve({ json: async () => JSON.parse(opts.body) })
      }
      return Promise.resolve({ json: async () => fresh })
    })

    const hook = renderHook({ autoStart: true })
    await hook.runEffects()

    let state = hook.current
    expect(state.attemptCount).toBe(0)

    // Make an incorrect attempt
    await state.onAttempt({
      type: 'recognition',
      wordId: state.stimulus.word.id,
      correct: false,
      given: 'wrong-answer',
    })

    state = hook.current
    expect(state.attemptCount).toBe(1)
    expect(state.repair).not.toBeNull()

    // Retry resets attemptCount for the pending stimulus
    state.onRetry()
    state = hook.current
    expect(state.attemptCount).toBe(0)
    expect(state.repair).toBeNull()
  })

  it('detects seeded misconception and populates named repair object', async () => {
    const fresh = buildSeed('fresh')
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.body) {
        return Promise.resolve({ json: async () => JSON.parse(opts.body) })
      }
      return Promise.resolve({ json: async () => fresh })
    })

    const hook = renderHook({ autoStart: true })
    await hook.runEffects()

    let state = hook.current

    // Trigger false cognate misconception on 'embarazada'
    await state.onAttempt({
      type: 'recognition',
      wordId: 'embarazada',
      correct: false,
      given: 'embarrassed',
    })

    state = hook.current
    expect(state.repair).not.toBeNull()
    expect(state.repair.misconception).toBeDefined()
    expect(state.repair.misconception.id).toBe('false_cognate_embarazada')
    expect(state.repair.pendingType).toBe('recognition')
  })

  it('runs a non-default subject from its own progress endpoint, seeding fresh progress', async () => {
    const { default: programming } = await import('../subjects/programming/index.js')
    const urls = []
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      urls.push(url)
      if (opts?.body) {
        return Promise.resolve({ json: async () => JSON.parse(opts.body) })
      }
      return Promise.resolve({ json: async () => null })
    })

    const hook = renderHook({ autoStart: false, subject: programming })
    await hook.runEffects()

    let state = hook.current
    expect(urls[0]).toBe('/api/progress?subject=programming')
    expect(state.status).toBe('ready')
    expect(state.plan.newChunkId).toBe('closures')

    state.begin()
    state = hook.current
    expect(state.status).toBe('running')
    expect(state.exerciseType).toBe('completion')
    expect(state.stimulus.phase).toBe('worked_example')
  })

  it('handles error state when progress fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const hook = renderHook({ autoStart: true })
    await hook.runEffects()

    const state = hook.current
    expect(state.status).toBe('error')
    expect(state.error).toBe('Network error')
  })
})
