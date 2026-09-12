import { checkGate, todayIso } from '../../engine/advancement.js'

export const GATE_STREAK_CAP = 3
export const PERSONS = ['yo', 'tu', 'el_ella_usted', 'nosotros', 'vosotros', 'ellos_ellas_ustedes']

export function findChunk(chunks, chunkId) {
  return chunks.find((c) => c.id === chunkId)
}

export function statusOf(wordId, words) {
  return words.find((w) => w.id === wordId)?.status ?? 'learning'
}

export function stemOf(verbWord, family) {
  return verbWord.slice(0, -family.length)
}

export function masteredVerbsForFamily(vocabPool, words, family) {
  return vocabPool.filter(
    (v) => v.pos === 'verb' && v.family === family && statusOf(v.id, words) === 'mastered',
  )
}

export function getNextProductionStimulus(progressState, chunkId, contentPool) {
  const chunk = findChunk(progressState.chunks, chunkId)
  const phase = chunk?.production_phase ?? 'worked_example'
  const workedExample = contentPool.workedExamples.find((w) => w.family === chunkId)

  if (phase === 'worked_example') {
    return workedExample ? { type: 'production', phase, chunkId, workedExample } : null
  }

  const mastered = masteredVerbsForFamily(contentPool.vocab, progressState.words, chunkId)
  if (mastered.length === 0 || !workedExample) return null

  const streakCount = chunk?.streak_count ?? 0
  const person = PERSONS[streakCount % PERSONS.length]
  const verb = mastered[streakCount % mastered.length]
  const stem = stemOf(verb.word, chunkId)
  const ending = workedExample.endings[person]
  const expectedForm = stem + ending

  return {
    type: 'production',
    phase,
    chunkId,
    verb: { id: verb.id, word: verb.word, meaning: verb.meaning },
    person,
    expectedForm,
    hint: phase === 'guided' ? `Stem: "${stem}-", ending for ${person}: "-${ending}"` : null,
  }
}

export function applyProductionAttempt(progressState, attempt, contentPool, today = todayIso()) {
  const { chunkId } = attempt
  const chunks = progressState.chunks.map((c) => ({ ...c, types_in_streak: [...(c.types_in_streak ?? [])] }))
  const chunkIndex = chunks.findIndex((c) => c.id === chunkId)
  let chunk = chunks[chunkIndex]
  const phaseBefore = chunk.production_phase ?? 'worked_example'
  let gateCleared = false

  if (attempt.action === 'worked_example_ack') {
    chunk.production_phase = 'guided'
  } else {
    if (attempt.correct) {
      chunk.streak_count = Math.min((chunk.streak_count ?? 0) + 1, GATE_STREAK_CAP)
      if (!chunk.types_in_streak.includes('production')) {
        chunk.types_in_streak.push('production')
      }
    } else {
      chunk.streak_count = 0
      chunk.types_in_streak = []
    }
    if (phaseBefore === 'guided') {
      chunk.production_phase = 'independent'
    }
    const gated = checkGate(chunk, today)
    chunk = gated.chunk
    gateCleared = gated.gateCleared
    chunks[chunkIndex] = chunk
  }

  const progress = { ...progressState, chunks }
  const next = getNextProductionStimulus(progress, chunkId, contentPool)
  return { progress, next, gateCleared }
}
