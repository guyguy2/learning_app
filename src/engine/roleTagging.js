import { GATE_STREAK_CAP, PERSONS, findChunk, masteredVerbsForFamily, stemOf } from './conjugation.js'

const PERSON_TO_PRONOUN = {
  yo: 'yo',
  tu: 'tú',
  el_ella_usted: 'él',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos_ellas_ustedes: 'ellos',
}

function nounsPool(vocabPool) {
  return vocabPool.filter((v) => v.pos === 'noun')
}

export function getNextRoleTaggingStimulus(progressState, chunkId, contentPool) {
  const chunk = findChunk(progressState.chunks, chunkId)
  const workedExample = contentPool.workedExamples.find((w) => w.family === chunkId)
  const mastered = masteredVerbsForFamily(contentPool.vocab, progressState.words, chunkId)
  if (mastered.length === 0 || !workedExample) return null

  const nouns = nounsPool(contentPool.vocab)
  const streakCount = chunk?.streak_count ?? 0
  const person = PERSONS[streakCount % PERSONS.length]
  const verb = mastered[streakCount % mastered.length]
  const object = nouns[streakCount % nouns.length]
  const stem = stemOf(verb.word, chunkId)
  const ending = workedExample.endings[person]
  const subject = PERSON_TO_PRONOUN[person]
  const conjugated = stem + ending

  return {
    type: 'role-tagging',
    chunkId,
    verb: { id: verb.id, word: verb.word, meaning: verb.meaning },
    person,
    sentence: `${subject} ${conjugated} ${object.word}`,
    parts: { subject, stem, ending, object: object.word },
  }
}

export function applyRoleTaggingAttempt(progressState, attempt, contentPool) {
  const { chunkId } = attempt
  const chunks = progressState.chunks.map((c) => ({ ...c, types_in_streak: [...(c.types_in_streak ?? [])] }))
  const chunk = findChunk(chunks, chunkId)

  if (attempt.correct) {
    chunk.streak_count = Math.min((chunk.streak_count ?? 0) + 1, GATE_STREAK_CAP)
    if (!chunk.types_in_streak.includes('role-tagging')) {
      chunk.types_in_streak.push('role-tagging')
    }
  } else {
    chunk.streak_count = 0
    chunk.types_in_streak = []
  }

  const progress = { ...progressState, chunks }
  const next = getNextRoleTaggingStimulus(progress, chunkId, contentPool)
  return { progress, next }
}
