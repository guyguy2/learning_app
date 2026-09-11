import { useEffect, useState } from 'react'
import vocab from '../../content/spanish/vocab.json'
import workedExamples from '../../content/spanish/worked_examples.json'
import distractors from '../../content/spanish/distractors.json'
import misconceptions from '../../content/spanish/misconceptions.json'
import { buildSession } from '../engine/session.js'
import { selectChunkForSession } from '../engine/sessionPlan.js'
import { getNextStimulus, applyAttempt } from '../engine/wordMastery.js'
import { applyProductionAttempt, findChunk, getNextProductionStimulus, masteredVerbsForFamily } from '../engine/conjugation.js'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from '../engine/roleTagging.js'
import { advanceLadder, resetLadder } from '../engine/review.js'
import { getMisconception, matchMisconception } from '../engine/misconception.js'
import { isReviewGateCleared, nextReviewDrillType, resetReviewStreak } from '../engine/reviewGate.js'
import { recognitionPool, familyVerbsRemaining } from '../engine/newContentSchedule.js'
import { mapPersonForMisconception } from '../misconceptionInput.js'

const CONTENT = { vocab, workedExamples }
const NEW_PHASE_ROTATION = ['recognition', 'production', 'role-tagging']

async function persistProgress(progress) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
  return res.json()
}

function replaceChunk(progressState, chunkId, updatedChunk) {
  return {
    ...progressState,
    chunks: progressState.chunks.map((c) => (c.id === chunkId ? updatedChunk : c)),
  }
}

function workedExampleFor(chunkId) {
  return workedExamples.find((w) => w.family === chunkId)
}

function stimulusForType(type, progressState, chunkId) {
  if (type === 'recognition') {
    return getNextStimulus(progressState, recognitionPool(progressState, vocab, chunkId))
  }
  if (type === 'production') {
    return getNextProductionStimulus(progressState, chunkId, CONTENT)
  }
  return getNextRoleTaggingStimulus(progressState, chunkId, CONTENT)
}

/**
 * 3-way rotation across recognition/production/role-tagging for the active new-content chunk.
 * If all family verbs are mastered, initial rotation starts at production; otherwise recognition.
 */
function pickNewPhaseStimulus(progressState, chunkId, lastType) {
  let startIndex
  if (lastType) {
    startIndex = (NEW_PHASE_ROTATION.indexOf(lastType) + 1) % NEW_PHASE_ROTATION.length
  } else {
    const hasRemaining = familyVerbsRemaining(progressState, vocab, chunkId)
    startIndex = hasRemaining ? 0 : 1
  }

  for (let i = 0; i < NEW_PHASE_ROTATION.length; i++) {
    const type = NEW_PHASE_ROTATION[(startIndex + i) % NEW_PHASE_ROTATION.length]
    const stimulus = stimulusForType(type, progressState, chunkId)
    if (stimulus) return { exerciseType: type, stimulus }
  }
  return { exerciseType: 'recognition', stimulus: null }
}

function incorrectMessage(type, stimulus) {
  if (type === 'recognition') {
    return `incorrect — "${stimulus.word.word}" means "${stimulus.word.meaning}"`
  }
  if (type === 'production') {
    return `incorrect — expected "${stimulus.expectedForm}"`
  }
  return `incorrect — subject: "${stimulus.parts.subject}", stem: "${stimulus.parts.stem}", ending: "${stimulus.parts.ending}", object: "${stimulus.parts.object}"`
}

function misconceptionMatcherAttempt(attempt) {
  if (attempt.type === 'recognition') {
    return { type: 'false_cognate', wordId: attempt.wordId, given: attempt.given }
  }
  if (attempt.type === 'production') {
    return {
      type: 'overgeneralization',
      verbId: attempt.wordId,
      person: mapPersonForMisconception(attempt.person),
      given: attempt.given,
    }
  }
  return null
}

function correctFormFor(attempt, stimulus) {
  if (attempt.type === 'recognition') return stimulus?.word?.meaning ?? null
  if (attempt.type === 'production') return stimulus?.expectedForm ?? null
  return null
}

function notionalMachineFor(attempt) {
  return attempt.type === 'production' ? workedExampleFor(attempt.chunkId)?.notional_machine ?? null : null
}

export function useSessionRunner({ autoStart = true } = {}) {
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready' | 'running' | 'summary'
  const [mode, setMode] = useState(null) // 'review' | 'new' | null
  const [plan, setPlan] = useState(null) // { reviewChunkIds, newChunkId, phase } | null

  const [reviewQueue, setReviewQueue] = useState([])
  const [reviewedCount, setReviewedCount] = useState(0)
  const [reviewHadMiss, setReviewHadMiss] = useState(false)
  const [masteredChunkId, setMasteredChunkId] = useState(null)
  const [newChunkId, setNewChunkId] = useState(null)

  const [exerciseType, setExerciseType] = useState(null) // 'recognition' | 'production' | 'role-tagging' | null
  const [stimulus, setStimulus] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [repair, setRepair] = useState(null) // { misconception, correctForm, notionalMachine, pendingStimulus, pendingType } | null
  const [attemptCount, setAttemptCount] = useState(0)

  function updateStimulus(newStimulus) {
    setStimulus(newStimulus)
    setAttemptCount(0)
  }

  function activeChunkFor(progressState) {
    return selectChunkForSession(progressState, progressState.session_number)
  }

  function startSession(progressState, sessionPlan = null) {
    const s = sessionPlan || buildSession(progressState, { sessionNumber: progressState.session_number, today })
    setPlan(s)
    setMasteredChunkId(null)
    setReviewedCount(0)
    setFeedback(null)
    setRepair(null)
    setNewChunkId(s.newChunkId)

    if (s.phase === 'review') {
      setReviewQueue(s.reviewChunkIds)
      enterReviewChunk(progressState, s.reviewChunkIds[0])
    } else if (s.phase === 'new') {
      setReviewQueue([])
      enterNewPhase(progressState)
    } else {
      setReviewQueue([])
      setStatus('summary')
      setMode(null)
      setExerciseType(null)
      updateStimulus(null)
    }
  }

  async function enterReviewChunk(progressState, chunkId) {
    setRepair(null)
    setFeedback(null)
    setReviewHadMiss(false)

    const resetChunk = resetReviewStreak(findChunk(progressState.chunks, chunkId))
    const persisted = await persistProgress(replaceChunk(progressState, chunkId, resetChunk))
    setProgress(persisted)

    setExerciseType('production')
    updateStimulus(getNextProductionStimulus(persisted, chunkId, CONTENT))
    setMode('review')
    setStatus('running')
  }

  function enterActiveDrill(progressState, lastType) {
    setFeedback(null)
    setRepair(null)
    const chunkId = activeChunkFor(progressState)
    if (chunkId == null) {
      setStatus('summary')
      setMode(null)
      setExerciseType(null)
      updateStimulus(null)
      return
    }
    const picked = pickNewPhaseStimulus(progressState, chunkId, lastType)
    setExerciseType(picked.exerciseType)
    updateStimulus(picked.stimulus)
    setMode('new')
    setStatus('running')
  }

  function enterNewPhase(progressState, lastType = null) {
    setFeedback(null)
    setRepair(null)

    if (progressState.session_number >= 2) {
      const toIntroduce = progressState.chunks
        .filter(
          (c) =>
            !c.mastered &&
            (c.production_phase ?? 'worked_example') === 'worked_example' &&
            masteredVerbsForFamily(CONTENT.vocab, progressState.words, c.id).length > 0,
        )
        .map((c) => c.id)
      if (toIntroduce.length > 0) {
        setExerciseType('production')
        updateStimulus(getNextProductionStimulus(progressState, toIntroduce[0], CONTENT))
        setMode('new')
        setStatus('running')
        return
      }
    }

    enterActiveDrill(progressState, lastType)
  }

  function handleMiss(attempt, pendingStimulus) {
    const match = matchMisconception(misconceptionMatcherAttempt(attempt), distractors)
    const correctForm = correctFormFor(attempt, stimulus)

    if (match) {
      setRepair({
        misconception: getMisconception(match.misconceptionId, misconceptions),
        correctForm,
        notionalMachine: notionalMachineFor(attempt),
        pendingStimulus,
        pendingType: attempt.type,
      })
    } else {
      setFeedback(incorrectMessage(attempt.type, stimulus))
      setRepair({
        misconception: null,
        correctForm,
        notionalMachine: null,
        pendingStimulus,
        pendingType: attempt.type,
      })
    }
  }

  async function handleReviewAttempt(attempt) {
    setAttemptCount((c) => c + 1)
    const chunkId = attempt.chunkId
    const result =
      attempt.type === 'production'
        ? applyProductionAttempt(progress, attempt, CONTENT, today)
        : applyRoleTaggingAttempt(progress, attempt, CONTENT, today)

    const persisted = await persistProgress(result.progress)
    setProgress(persisted)

    if (!attempt.correct) {
      setReviewHadMiss(true)
      handleMiss(attempt, result.next)
      return
    }

    const updatedChunk = findChunk(persisted.chunks, chunkId)
    if (isReviewGateCleared(updatedChunk)) {
      const finalChunk = reviewHadMiss ? resetLadder(updatedChunk, today) : advanceLadder(updatedChunk, today)
      const finalProgress = await persistProgress(replaceChunk(persisted, chunkId, finalChunk))
      setProgress(finalProgress)
      setReviewedCount((n) => n + 1)
      advanceReviewQueue(finalProgress)
      return
    }

    setFeedback('correct')
    setRepair(null)
    const nextType = nextReviewDrillType(attempt.type)
    setExerciseType(nextType)
    updateStimulus(stimulusForType(nextType, persisted, chunkId))
  }

  function advanceReviewQueue(persistedProgress) {
    const rest = reviewQueue.slice(1)
    setReviewQueue(rest)
    if (rest.length > 0) {
      enterReviewChunk(persistedProgress, rest[0])
    } else if (newChunkId != null) {
      enterNewPhase(persistedProgress)
    } else {
      setFeedback(null)
      setRepair(null)
      setStatus('summary')
      setMode(null)
      setExerciseType(null)
      updateStimulus(null)
    }
  }

  async function handleNewAttempt(attempt) {
    setAttemptCount((c) => c + 1)
    let result
    if (attempt.type === 'recognition') {
      result = applyAttempt(progress, attempt, vocab, today)
    } else if (attempt.type === 'production') {
      result = applyProductionAttempt(progress, attempt, CONTENT, today)
    } else {
      result = applyRoleTaggingAttempt(progress, attempt, CONTENT, today)
    }

    const persisted = await persistProgress(result.progress)
    setProgress(persisted)

    if (attempt.action === 'worked_example_ack') {
      enterNewPhase(persisted)
      return
    }

    if (attempt.correct) {
      if (result.gateCleared) {
        setMasteredChunkId(attempt.chunkId ?? newChunkId)
        setRepair(null)
        setFeedback(null)
        setStatus('summary')
        setMode(null)
        setExerciseType(null)
        updateStimulus(null)
        return
      }
      setFeedback('correct')
      enterActiveDrill(persisted, attempt.type)
      return
    }

    handleMiss(attempt, result.next)
  }

  function handleRetry() {
    if (!repair) return
    setExerciseType(repair.pendingType)
    updateStimulus(repair.pendingStimulus)
    setRepair(null)
    setFeedback(null)
  }

  async function startNextSession() {
    const persisted = await persistProgress({ ...progress, session_number: progress.session_number + 1 })
    setProgress(persisted)
    const nextPlan = buildSession(persisted, { sessionNumber: persisted.session_number, today })
    setPlan(nextPlan)
    setMasteredChunkId(null)
    setReviewedCount(0)
    setFeedback(null)
    setRepair(null)
    setNewChunkId(nextPlan.newChunkId)

    if (!autoStart) {
      setStatus('ready')
      setMode(null)
      setExerciseType(null)
      updateStimulus(null)
    } else {
      startSession(persisted, nextPlan)
    }
  }

  function begin() {
    if (status === 'ready' && progress) {
      startSession(progress, plan)
    }
  }

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then((loaded) => {
        setProgress(loaded)
        const initialPlan = buildSession(loaded, { sessionNumber: loaded.session_number, today })
        setPlan(initialPlan)
        setNewChunkId(initialPlan.newChunkId)

        if (!autoStart) {
          setStatus('ready')
          setMode(null)
          setExerciseType(null)
          updateStimulus(null)
        } else {
          startSession(loaded, initialPlan)
        }
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onAttempt(attempt) {
    if (mode === 'review') {
      return handleReviewAttempt(attempt)
    }
    if (mode === 'new') {
      return handleNewAttempt(attempt)
    }
  }

  return {
    status,
    error,
    today,
    progress,
    plan,
    begin,
    mode,
    exerciseType,
    stimulus,
    feedback,
    repair,
    reviewQueue,
    reviewedCount,
    masteredChunkId,
    attemptCount,
    onAttempt,
    onRetry: handleRetry,
    onStartNext: startNextSession,
  }
}
