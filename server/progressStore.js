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

export async function readProgress() {
  try {
    const raw = await readFile(PROGRESS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return defaultProgress()
    throw err
  }
}

export async function writeProgress(state) {
  await writeFile(PROGRESS_PATH, JSON.stringify(state, null, 2))
  return state
}
