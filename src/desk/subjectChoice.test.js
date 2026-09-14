import { beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal useState harness (as in src/desk/useSessionRunner.test.js): state survives re-renders.
let hooksState = []
let hookIndex = 0

vi.mock('react', () => ({
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
}))

import {
  SUBJECT_STORAGE_KEY,
  resolveSubjectId,
  searchWithSubject,
  useSubjectChoice,
} from './subjectChoice.js'
import DeskRoot from './DeskRoot.jsx'
import DeskApp from './DeskApp.jsx'

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

/** A browser stand-in whose replaceState updates location, like the real one. */
function fakeEnv({ search = '', hash = '', stored } = {}) {
  const location = { search, hash }
  const history = {
    state: null,
    urls: [],
    replaceState(_state, _title, url) {
      history.urls.push(url)
      const [beforeHash, afterHash] = url.split('#')
      location.search = beforeHash
      location.hash = afterHash ? `#${afterHash}` : ''
    },
  }
  const storage = fakeStorage(stored ? { [SUBJECT_STORAGE_KEY]: stored } : {})
  return { location, history, storage }
}

function render(fn) {
  hookIndex = 0
  return fn()
}

describe('resolveSubjectId: default resolution order', () => {
  it('prefers a registered ?subject= over the remembered choice', () => {
    const storage = fakeStorage({ [SUBJECT_STORAGE_KEY]: 'spanish' })
    expect(resolveSubjectId({ search: '?subject=programming', storage })).toBe('programming')
  })

  it('falls back to the remembered choice when the URL has no subject', () => {
    const storage = fakeStorage({ [SUBJECT_STORAGE_KEY]: 'programming' })
    expect(resolveSubjectId({ search: '', storage })).toBe('programming')
  })

  it('skips an unknown ?subject= and an unknown remembered id', () => {
    const remembered = fakeStorage({ [SUBJECT_STORAGE_KEY]: 'programming' })
    expect(resolveSubjectId({ search: '?subject=klingon', storage: remembered })).toBe('programming')
    const unknown = fakeStorage({ [SUBJECT_STORAGE_KEY]: 'klingon' })
    expect(resolveSubjectId({ search: '', storage: unknown })).toBe('spanish')
  })

  it('defaults to Spanish when nothing is set, or storage is unavailable', () => {
    expect(resolveSubjectId()).toBe('spanish')
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
    }
    expect(resolveSubjectId({ search: '', storage: throwing })).toBe('spanish')
  })
})

describe('searchWithSubject', () => {
  it('sets the subject parameter and keeps the others', () => {
    expect(searchWithSubject('', 'programming')).toBe('?subject=programming')
    expect(searchWithSubject('?poc=0&subject=spanish', 'programming')).toBe('?poc=0&subject=programming')
  })
})

describe('useSubjectChoice', () => {
  beforeEach(() => {
    hooksState = []
  })

  it('opens the resolved subject', () => {
    const env = fakeEnv({ stored: 'programming' })
    const [subject] = render(() => useSubjectChoice(env))
    expect(subject.id).toBe('programming')
  })

  it('switching writes ?subject= into the URL, remembers it, and changes the subject', () => {
    const env = fakeEnv({ search: '?foo=1', hash: '#top' })
    let [subject, chooseSubject] = render(() => useSubjectChoice(env))
    expect(subject.id).toBe('spanish')

    chooseSubject('programming')
    ;[subject, chooseSubject] = render(() => useSubjectChoice(env))

    expect(subject.id).toBe('programming')
    expect(env.history.urls).toEqual(['?foo=1&subject=programming#top'])
    expect(env.storage.data[SUBJECT_STORAGE_KEY]).toBe('programming')
  })

  it('ignores an unknown id and a re-pick of the current subject', () => {
    const env = fakeEnv()
    const [, chooseSubject] = render(() => useSubjectChoice(env))
    chooseSubject('klingon')
    chooseSubject('spanish')
    expect(env.history.urls).toEqual([])
    expect(env.storage.data).toEqual({})
    expect(render(() => useSubjectChoice(env))[0].id).toBe('spanish')
  })
})

describe('DeskRoot', () => {
  beforeEach(() => {
    hooksState = []
  })

  it('keys DeskApp by subject so a switch remounts it and reloads progress for the new subject', () => {
    const env = fakeEnv()
    let element = render(() => DeskRoot({ env }))
    expect(element.type).toBe(DeskApp)
    expect(element.key).toBe('spanish')
    expect(element.props.subject.id).toBe('spanish')

    element.props.onSubjectChange('programming')
    element = render(() => DeskRoot({ env }))

    expect(element.key).toBe('programming')
    expect(element.props.subject.id).toBe('programming')
    expect(env.location.search).toBe('?subject=programming')
  })
})
