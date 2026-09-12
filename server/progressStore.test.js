import { describe, expect, it } from 'vitest'
import { PROGRESS_PATH, isValidSubjectId, progressPathFor } from './progressStore.js'

describe('progress file per subject', () => {
  it('keeps the default subject on progress.json', () => {
    expect(progressPathFor(undefined)).toBe(PROGRESS_PATH)
    expect(progressPathFor('spanish')).toBe(PROGRESS_PATH)
  })

  it('gives other subjects their own file next to progress.json', () => {
    const file = progressPathFor('programming')
    expect(file).not.toBe(PROGRESS_PATH)
    expect(file.endsWith('progress.programming.json')).toBe(true)
  })

  it('rejects subject ids that could escape the project directory', () => {
    expect(isValidSubjectId('programming')).toBe(true)
    expect(isValidSubjectId(undefined)).toBe(true)
    expect(isValidSubjectId('../secrets')).toBe(false)
    expect(isValidSubjectId('a/b')).toBe(false)
    expect(() => progressPathFor('../secrets')).toThrow(/invalid subject/)
  })
})
