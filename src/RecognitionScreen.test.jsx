import { describe, expect, it } from 'vitest'
import { acceptedMeanings, normalize } from './RecognitionScreen.jsx'

describe('RecognitionScreen meaning matching', () => {
  it('correctly grades synonyms separated by semicolons or commas', () => {
    const meaning = 'to speak; to talk'
    const parsed = acceptedMeanings(meaning)
    
    // Asserts that accepted-meaning matching:
    // given meaning "to speak; to talk", both "to talk" and "to speak" grade correct,
    // and "to run" grades incorrect.
    expect(parsed.includes(normalize('to talk'))).toBe(true)
    expect(parsed.includes(normalize('to speak'))).toBe(true)
    expect(parsed.includes(normalize('to run'))).toBe(false)
  })

  it('handles spaces and different casings correctly', () => {
    const meaning = '  to speak  ;  To Talk '
    const parsed = acceptedMeanings(meaning)
    
    expect(parsed.includes(normalize('  to speak  '))).toBe(true)
    expect(parsed.includes(normalize('  To Talk '))).toBe(true)
    expect(parsed.includes(normalize('to run'))).toBe(false)
  })

  it('handles comma separation as well', () => {
    const meaning = 'to speak, to talk'
    const parsed = acceptedMeanings(meaning)
    
    expect(parsed.includes(normalize('to talk'))).toBe(true)
    expect(parsed.includes(normalize('to speak'))).toBe(true)
  })
})
