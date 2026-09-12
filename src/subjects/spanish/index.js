/**
 * Spanish subject: vocabulary plus regular present-tense conjugation (-ar / -er / -ir).
 * Implements the subject contract in src/subjects/contract.js. Framework-free; the Desk
 * cards are in ./ui.jsx.
 */
import vocab from '../../../content/spanish/vocab.json'
import workedExamples from '../../../content/spanish/worked_examples.json'
import distractors from '../../../content/spanish/distractors.json'
import misconceptions from '../../../content/spanish/misconceptions.json'

import { screenTechniques } from '../../screenTechniques.js'
import {
  applyProductionAttempt,
  getNextProductionStimulus,
  masteredVerbsForFamily,
} from './conjugation.js'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from './roleTagging.js'
import { applyRecognitionAttempt, getNextRecognitionStimulus } from './recognition.js'
import { familyVerbsRemaining } from './newContentSchedule.js'
import { getMisconception, matchMisconception } from './misconception.js'
import { mapPersonForMisconception } from './misconceptionInput.js'
import { gradeProduction, gradeRecognition, gradeRoleTagging } from './grading.js'
import { validateSpanishContent } from './validate.js'
import { scenarios as seeds } from './seeds.js'

function namedRepair(matcherAttempt, content, notionalMachine) {
  const match = matchMisconception(matcherAttempt, content.distractors)
  if (!match) return null
  return {
    misconception: getMisconception(match.misconceptionId, content.misconceptions),
    notionalMachine,
  }
}

const recognition = {
  nextStimulus: getNextRecognitionStimulus,
  apply: applyRecognitionAttempt,
  grade: gradeRecognition,
  feedback({ correct, attempt }, stimulus) {
    if (correct) {
      return `Correct: "${stimulus?.word?.word}" means "${attempt?.expectedMeaning || attempt?.given}"`
    }
    return `incorrect — "${stimulus?.word?.word}" means "${stimulus?.word?.meaning}"`
  },
  expectedAnswer: (stimulus) => stimulus?.word?.meaning ?? null,
  repairFor(attempt, _stimulus, content) {
    return namedRepair(
      { type: 'false_cognate', wordId: attempt.wordId, given: attempt.given },
      content,
      null,
    )
  },
}

const production = {
  nextStimulus: getNextProductionStimulus,
  apply: applyProductionAttempt,
  grade: gradeProduction,
  feedback({ correct, attempt }, stimulus) {
    if (correct) return `Correct: "${attempt?.expectedForm || attempt?.given}"`
    return `incorrect — expected "${stimulus?.expectedForm}"`
  },
  expectedAnswer: (stimulus) => stimulus?.expectedForm ?? null,
  repairFor(attempt, _stimulus, content) {
    const we = content.workedExamples?.find((w) => w.family === attempt.chunkId)
    return namedRepair(
      {
        type: 'overgeneralization',
        verbId: attempt.wordId,
        person: mapPersonForMisconception(attempt.person),
        given: attempt.given,
      },
      content,
      we?.notional_machine ?? null,
    )
  },
}

const roleTagging = {
  nextStimulus: getNextRoleTaggingStimulus,
  apply: applyRoleTaggingAttempt,
  grade: gradeRoleTagging,
  feedback({ correct, attempt }, stimulus) {
    if (correct) {
      const { subject, stem, ending, object } = attempt.given
      return `Correct: ${subject} | ${stem} + ${ending} | ${object}`
    }
    return `incorrect — subject: "${stimulus?.parts?.subject}", stem: "${stimulus?.parts?.stem}", ending: "${stimulus?.parts?.ending}", object: "${stimulus?.parts?.object}"`
  },
  // Role tagging has four answers, not one string; the repair panel shows its own fallback.
  expectedAnswer: () => null,
}

/** @type {import('../contract.js').Subject} */
const spanish = {
  id: 'spanish',
  displayName: 'Spanish',
  exerciseTypes: ['recognition', 'production', 'role-tagging'],
  // Recognition feeds word mastery rather than the chunk gate, so review alternates the other two.
  reviewTypes: ['production', 'role-tagging'],
  scaffoldType: 'production',
  chunks: (content) => content.workedExamples.map((we) => ({ id: we.family, label: `-${we.family}` })),
  // Master the family's verbs by recognition first; once they are mastered, start at production.
  firstExerciseType: (progress, chunkId, content) =>
    familyVerbsRemaining(progress, content.vocab, chunkId) ? 'recognition' : 'production',
  // Conjugation drills only use mastered verbs (vocab gates conjugation).
  scaffoldReady: (progress, chunkId, content) =>
    masteredVerbsForFamily(content.vocab, progress.words, chunkId).length > 0,
  exercises: {
    recognition,
    production,
    'role-tagging': roleTagging,
  },
  content: { vocab, workedExamples, distractors, misconceptions },
  validate: validateSpanishContent,
  techniques: screenTechniques,
  seeds,
}

export default spanish
