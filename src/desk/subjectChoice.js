import { useState } from 'react'
import { DEFAULT_SUBJECT_ID, SUBJECT_IDS, getSubject } from '../subjects/index.js'

/** localStorage key for the subject the learner last picked. */
export const SUBJECT_STORAGE_KEY = 'desk_subject'

function readStored(storage) {
  try {
    return storage?.getItem(SUBJECT_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

/**
 * The subject to open: a registered ?subject= id, else the last picked subject remembered in
 * storage, else the default (Spanish). Unknown ids are skipped at each step.
 */
export function resolveSubjectId({ search = '', storage } = {}) {
  const fromUrl = new URLSearchParams(search).get('subject')
  if (SUBJECT_IDS.includes(fromUrl)) return fromUrl
  const saved = readStored(storage)
  if (SUBJECT_IDS.includes(saved)) return saved
  return DEFAULT_SUBJECT_ID
}

/** `search` with its subject parameter set to `id`, keeping any other parameters. */
export function searchWithSubject(search, id) {
  const params = new URLSearchParams(search)
  params.set('subject', id)
  return `?${params}`
}

function browserEnv() {
  let storage = null
  try {
    storage = window.localStorage
  } catch {
    // localStorage may fail in restricted environments
  }
  return { location: window.location, history: window.history, storage }
}

/**
 * The Desk's current subject and a function to switch it. Switching writes ?subject= into the
 * URL, which stays the source of truth and keeps links shareable, and remembers the choice in
 * storage as the default for a visit without the parameter.
 */
export function useSubjectChoice(env = browserEnv()) {
  const [subjectId, setSubjectId] = useState(() =>
    resolveSubjectId({ search: env.location.search, storage: env.storage }),
  )

  function chooseSubject(id) {
    if (!SUBJECT_IDS.includes(id) || id === subjectId) return
    const url = `${searchWithSubject(env.location.search, id)}${env.location.hash ?? ''}`
    env.history.replaceState(env.history.state, '', url)
    try {
      env.storage?.setItem(SUBJECT_STORAGE_KEY, id)
    } catch {
      // ignore storage error
    }
    setSubjectId(id)
  }

  return [getSubject(subjectId), chooseSubject]
}
