import { describe, expect, it } from 'vitest'
import { findFirstFailure } from './validate-content.js'

function subjectsWith(validators) {
  return (id) => ({ content: { id }, validate: validators[id] })
}

describe('findFirstFailure', () => {
  it('returns null when every subject validates', () => {
    const getSubject = subjectsWith({ a: () => {}, b: () => {} })
    expect(findFirstFailure(['a', 'b'], getSubject)).toBeNull()
  })

  it('names the first failing subject and its error, and stops there', () => {
    const seen = []
    const getSubject = subjectsWith({
      a: (content) => seen.push(content.id),
      b: () => {
        throw new Error('items[3] is missing an answer')
      },
      c: (content) => seen.push(content.id),
    })
    expect(findFirstFailure(['a', 'b', 'c'], getSubject)).toBe(
      'Content validation failed for subject "b": items[3] is missing an answer',
    )
    expect(seen).toEqual(['a'])
  })

  it('reports a subject whose lookup throws', () => {
    const getSubject = () => {
      throw new Error('malformed content')
    }
    expect(findFirstFailure(['x'], getSubject)).toBe(
      'Content validation failed for subject "x": malformed content',
    )
  })
})
