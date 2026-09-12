import { describe, expect, it } from 'vitest'
import spanish from './index.js'
import { validateSpanishContent } from './validate.js'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

describe('Spanish content validation', () => {
  it('accepts the shipped content', () => {
    expect(() => validateSpanishContent(spanish.content)).not.toThrow()
  })

  it('rejects a vocab entry with no meaning', () => {
    const bad = clone(spanish.content)
    delete bad.vocab[0].meaning
    expect(() => validateSpanishContent(bad)).toThrow(/vocab\[0\] is missing string field "meaning"/)
  })

  it('rejects a verb whose family has no worked example', () => {
    const bad = clone(spanish.content)
    bad.workedExamples = bad.workedExamples.filter((we) => we.family !== 'ir')
    expect(() => validateSpanishContent(bad)).toThrow(/no worked example for family "ir"/)
  })

  it('rejects a worked example missing a person ending', () => {
    const bad = clone(spanish.content)
    delete bad.workedExamples[0].endings.vosotros
    expect(() => validateSpanishContent(bad)).toThrow(/missing the ending for "vosotros"/)
  })

  it('rejects a distractor that references an unknown misconception or word', () => {
    const unknownMisconception = clone(spanish.content)
    unknownMisconception.distractors[0].misconception_id = 'not_a_thing'
    expect(() => validateSpanishContent(unknownMisconception)).toThrow(/unknown misconception "not_a_thing"/)

    const unknownWord = clone(spanish.content)
    const fc = unknownWord.distractors.find((d) => d.type === 'false_cognate')
    fc.word_id = 'ghost'
    expect(() => validateSpanishContent(unknownWord)).toThrow(/unknown word "ghost"/)
  })

  it('rejects an unknown distractor type', () => {
    const bad = clone(spanish.content)
    bad.distractors[0].type = 'typo'
    expect(() => validateSpanishContent(bad)).toThrow(/unknown type "typo"/)
  })
})
