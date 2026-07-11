import { describe, expect, it } from 'vitest'
import { getMisconception, matchMisconception } from './misconception.js'

const DISTRACTORS = [
  {
    id: 'd_fc_embarazada',
    type: 'false_cognate',
    misconception_id: 'false_cognate_embarazada',
    word_id: 'embarazada',
    correct: 'pregnant',
    distractor: 'embarrassed',
  },
  {
    id: 'd_fc_libreria',
    type: 'false_cognate',
    misconception_id: 'false_cognate_libreria',
    word_id: 'libreria',
    correct: 'bookstore',
    distractor: 'library',
  },
  {
    id: 'd_og_comer_tu_comas',
    type: 'overgeneralization',
    misconception_id: 'overgen_ar_on_er',
    verb_id: 'comer',
    person: 'tú',
    correct_form: 'comes',
    distractor_form: 'comas',
  },
  {
    id: 'd_og_vivir_nosotros_vivemos',
    type: 'overgeneralization',
    misconception_id: 'overgen_er_on_ir',
    verb_id: 'vivir',
    person: 'nosotros/nosotras',
    correct_form: 'vivimos',
    distractor_form: 'vivemos',
  },
]

const MISCONCEPTIONS = [
  {
    id: 'false_cognate_embarazada',
    name: 'False cognate: embarazada',
    explanation: 'Embarazada means pregnant, not embarrassed.',
  },
  {
    id: 'overgen_ar_on_er',
    name: 'Overgeneralizing -ar endings onto -er verbs',
    explanation: 'Regular -er verbs do not take -ar endings.',
  },
]

describe('matchMisconception', () => {
  it('returns the specific misconception when a false_cognate wrong answer matches a seeded distractor', () => {
    const attempt = {
      type: 'false_cognate',
      wordId: 'embarazada',
      given: 'embarrassed',
    }
    expect(matchMisconception(attempt, DISTRACTORS)).toEqual({
      misconceptionId: 'false_cognate_embarazada',
      distractorId: 'd_fc_embarazada',
    })
  })

  it('returns the specific misconception when an overgeneralization wrong answer matches a seeded distractor', () => {
    const attempt = {
      type: 'overgeneralization',
      verbId: 'comer',
      person: 'tú',
      given: 'comas',
    }
    expect(matchMisconception(attempt, DISTRACTORS)).toEqual({
      misconceptionId: 'overgen_ar_on_er',
      distractorId: 'd_og_comer_tu_comas',
    })
  })

  it('returns null when a wrong answer has no matching seeded distractor', () => {
    expect(
      matchMisconception(
        { type: 'false_cognate', wordId: 'embarazada', given: 'happy' },
        DISTRACTORS,
      ),
    ).toBeNull()

    expect(
      matchMisconception(
        { type: 'overgeneralization', verbId: 'comer', person: 'tú', given: 'comi' },
        DISTRACTORS,
      ),
    ).toBeNull()

    // Same wrong text, wrong item context — no false attribution
    expect(
      matchMisconception(
        { type: 'false_cognate', wordId: 'libreria', given: 'embarrassed' },
        DISTRACTORS,
      ),
    ).toBeNull()
  })
})

describe('getMisconception', () => {
  it('looks up id, name, and explanation from the catalog', () => {
    expect(getMisconception('false_cognate_embarazada', MISCONCEPTIONS)).toEqual({
      id: 'false_cognate_embarazada',
      name: 'False cognate: embarazada',
      explanation: 'Embarazada means pregnant, not embarrassed.',
    })
  })

  it('returns null for an unknown misconception id', () => {
    expect(getMisconception('does_not_exist', MISCONCEPTIONS)).toBeNull()
  })
})
