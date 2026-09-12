import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROGRESS_PATH = path.join(dirname, '..', 'progress.json')

export function defaultProgress() {
  return {
    session_number: 1,
    words: [],
    chunks: [
      {
        id: 'ar',
        mastered: false,
        mastered_date: null,
        streak_count: 0,
        types_in_streak: [],
        ladder_step: null,
        last_reviewed_date: null,
        next_due_date: null,
        production_phase: 'worked_example',
      },
      {
        id: 'er',
        mastered: false,
        mastered_date: null,
        streak_count: 0,
        types_in_streak: [],
        ladder_step: null,
        last_reviewed_date: null,
        next_due_date: null,
        production_phase: 'worked_example',
      },
      {
        id: 'ir',
        mastered: false,
        mastered_date: null,
        streak_count: 0,
        types_in_streak: [],
        ladder_step: null,
        last_reviewed_date: null,
        next_due_date: null,
        production_phase: 'worked_example',
      },
    ],
  }
}

const SUBJECT_ID = /^[a-z0-9-]+$/

/** A subject id is optional; when given it must be a plain slug (no path characters). */
export function isValidSubjectId(subject) {
  return subject == null || SUBJECT_ID.test(subject)
}

/**
 * progress.json holds the default (Spanish) subject, as before. Any other subject gets
 * progress.<subject>.json so switching subjects never overwrites Spanish progress.
 */
export function progressPathFor(subject) {
  if (subject == null || subject === 'spanish') return PROGRESS_PATH
  if (!SUBJECT_ID.test(subject)) throw new Error(`invalid subject "${subject}"`)
  return path.join(dirname, '..', `progress.${subject}.json`)
}

/**
 * Missing progress: the default subject gets defaultProgress(); other subjects get null
 * and the client seeds fresh progress from the subject's own chunks.
 */
export async function readProgress(subject) {
  const file = progressPathFor(subject)
  try {
    const raw = await readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return file === PROGRESS_PATH ? defaultProgress() : null
    throw err
  }
}

export async function writeProgress(state, subject) {
  await writeFile(progressPathFor(subject), JSON.stringify(state, null, 2))
  return state
}
