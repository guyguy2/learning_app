import { describe, expect, it } from 'vitest'
import { getMisconception, matchMisconception } from './misconception.js'
import { applyAttempt } from '../../engine/wordMastery.js'
import { applyProductionAttempt } from './conjugation.js'

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

describe('re-tests on a similar item upon miss', () => {
  it('re-tests the same word for recognition/vocabulary on false cognate miss', () => {
    const progress = {
      words: [{ id: 'embarazada', status: 'learning', streak_count: 1 }],
      chunks: []
    }
    const attempt = { type: 'recognition', wordId: 'embarazada', correct: false, given: 'embarrassed' }
    const vocabPool = [
      { id: 'embarazada', word: 'embarazada', meaning: 'pregnant', pos: 'adj' },
      { id: 'feliz', word: 'feliz', meaning: 'happy', pos: 'adj' }
    ]
    const { progress: nextProgress, next } = applyAttempt(progress, attempt, vocabPool, '2026-07-13')
    
    // Streak resets to 0
    expect(nextProgress.words.find(w => w.id === 'embarazada').streak_count).toBe(0)
    // Re-tests the same word
    expect(next.type).toBe('recognition')
    expect(next.word.id).toBe('embarazada')
  })

  it('re-tests on a similar conjugation item (resetting streak) on overgeneralization miss', () => {
    const progress = {
      words: [
        { id: 'comer', status: 'mastered', streak_count: 2 },
        { id: 'beber', status: 'mastered', streak_count: 2 }
      ],
      chunks: [
        {
          id: 'er',
          mastered: false,
          streak_count: 2,
          types_in_streak: ['production'],
          production_phase: 'guided'
        }
      ]
    }
    const attempt = { type: 'production', chunkId: 'er', wordId: 'comer', person: 'tu', correct: false, given: 'comas' }
    const contentPool = {
      vocab: [
        { id: 'comer', word: 'comer', meaning: 'to eat', pos: 'verb', family: 'er' },
        { id: 'beber', word: 'beber', meaning: 'to drink', pos: 'verb', family: 'er' }
      ],
      workedExamples: [
        {
          family: 'er',
          endings: {
            yo: 'o',
            tu: 'es',
            el_ella_usted: 'e',
            nosotros: 'emos',
            vosotros: 'éis',
            ellos_ellas_ustedes: 'en'
          }
        }
      ]
    }
    const { progress: nextProgress, next } = applyProductionAttempt(progress, attempt, contentPool, '2026-07-13')

    // Streak count resets to 0
    const chunk = nextProgress.chunks.find(c => c.id === 'er')
    expect(chunk.streak_count).toBe(0)
    expect(chunk.types_in_streak).toEqual([])

    // Should return a production stimulus under the same family but with the streak reset to person = 'yo'
    expect(next.type).toBe('production')
    expect(next.chunkId).toBe('er')
    expect(next.person).toBe('yo')
    expect(next.expectedForm).toBe('como') // stem 'com' + ending 'o'
  })
})
