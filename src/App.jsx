import { useEffect, useState } from 'react'
import vocab from '../content/spanish/vocab.json'
import workedExamples from '../content/spanish/worked_examples.json'
import distractors from '../content/spanish/distractors.json'
import misconceptions from '../content/spanish/misconceptions.json'
import RecognitionScreen from './RecognitionScreen.jsx'
import ProductionScreen from './ProductionScreen.jsx'
import RoleTaggingScreen from './RoleTaggingScreen.jsx'
import MisconceptionRepair from './components/MisconceptionRepair.jsx'
import SessionSummary from './components/SessionSummary.jsx'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'
import { buildSession } from './engine/session.js'
import { selectChunkForSession } from './engine/sessionPlan.js'
import { getNextStimulus, applyAttempt } from './engine/wordMastery.js'
import { applyProductionAttempt, findChunk, getNextProductionStimulus } from './engine/conjugation.js'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from './engine/roleTagging.js'
import { advanceLadder, resetLadder } from './engine/review.js'
import { getMisconception, matchMisconception } from './engine/misconception.js'
import { isReviewGateCleared, nextReviewDrillType, resetReviewStreak } from './engine/reviewGate.js'
import { recognitionPool } from './engine/newContentSchedule.js'
import { mapPersonForMisconception } from './misconceptionInput.js'

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
 * 3-way rotation across recognition/production/role-tagging for the active new-content chunk,
 * skipping any slot whose stimulus is null (production/role-tagging are null until a family
 * verb is mastered, so early on this is recognition-only — that's what builds the gating vocab).
 */
function pickNewPhaseStimulus(progressState, chunkId, lastType) {
  const startIndex = lastType ? (NEW_PHASE_ROTATION.indexOf(lastType) + 1) % NEW_PHASE_ROTATION.length : 0
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

/** Matcher-attempt shape for matchMisconception; role-tagging has no seeded distractor type. */
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
  if (attempt.type === 'recognition') return stimulus.word.meaning
  if (attempt.type === 'production') return stimulus.expectedForm
  return null
}

function notionalMachineFor(attempt) {
  return attempt.type === 'production' ? workedExampleFor(attempt.chunkId)?.notional_machine : null
}

function App() {
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const [mode, setMode] = useState('loading') // loading | review | new | summary
  const [reviewQueue, setReviewQueue] = useState([])
  const [reviewedCount, setReviewedCount] = useState(0)
  const [reviewHadMiss, setReviewHadMiss] = useState(false)
  const [masteredChunkId, setMasteredChunkId] = useState(null)
  const [newChunkId, setNewChunkId] = useState(null)

  const [exerciseType, setExerciseType] = useState(null)
  const [stimulus, setStimulus] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [repair, setRepair] = useState(null) // { misconception, correctForm, notionalMachine, pendingStimulus, pendingType }

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then((loaded) => {
        setProgress(loaded)
        startSession(loaded)
      })
      .catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startSession(progressState) {
    const s = buildSession(progressState, { sessionNumber: progressState.session_number, today })
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
      setMode('summary')
    }
  }

  async function enterReviewChunk(progressState, chunkId) {
    setRepair(null)
    setFeedback(null)
    setReviewHadMiss(false)

    // A just-mastered chunk still carries streak_count 3 / >=2 types from the original
    // advancement gate — reset before drilling or the review gate insta-clears.
    const resetChunk = resetReviewStreak(findChunk(progressState.chunks, chunkId))
    const persisted = await persistProgress(replaceChunk(progressState, chunkId, resetChunk))
    setProgress(persisted)

    setExerciseType('production')
    setStimulus(getNextProductionStimulus(persisted, chunkId, CONTENT))
    setMode('review')
  }

  // selectChunkForSession already encodes the blocked-vs-interleaved rule: session 1 returns the
  // single blocked chunk (first unmastered), session 2+ rotates across introduced-unmastered
  // families. Deriving it here (rather than reading newChunkId state) avoids a stale-state read
  // on the first drill, where startSession sets newChunkId and calls in the same synchronous tick.
  function activeChunkFor(progressState) {
    return selectChunkForSession(progressState, progressState.session_number)
  }

  function enterActiveDrill(progressState, lastType) {
    setFeedback(null)
    setRepair(null)
    const chunkId = activeChunkFor(progressState)
    if (chunkId == null) {
      setMode('summary')
      return
    }
    const picked = pickNewPhaseStimulus(progressState, chunkId, lastType)
    setExerciseType(picked.exerciseType)
    setStimulus(picked.stimulus)
    setMode('new')
  }

  // Entry point for the new-content phase. From session 2 on, every not-yet-mastered
  // chunk still sitting at 'worked_example' must be introduced (I-do shown, ack'd to
  // 'guided') before interleaved drilling begins, so each ack re-enters here and either
  // shows the next worked example or falls through to active-drill selection.
  function enterNewPhase(progressState, lastType = null) {
    setFeedback(null)
    setRepair(null)

    if (progressState.session_number >= 2) {
      const toIntroduce = progressState.chunks
        .filter((c) => !c.mastered && (c.production_phase ?? 'worked_example') === 'worked_example')
        .map((c) => c.id)
      if (toIntroduce.length > 0) {
        setExerciseType('production')
        setStimulus(getNextProductionStimulus(progressState, toIntroduce[0], CONTENT))
        setMode('new')
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
      setRepair({ misconception: null, correctForm, pendingStimulus, pendingType: attempt.type })
    }
  }

  // ---- REVIEW handlers ----

  async function handleReviewAttempt(attempt) {
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
    setStimulus(stimulusForType(nextType, persisted, chunkId))
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
      setMode('summary')
    }
  }

  // ---- NEW-content handlers ----

  async function handleNewAttempt(attempt) {
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
      // Re-enter the new-content phase entry point: it will show the next un-introduced
      // chunk's worked example if any remain (session 2+), or fall back to active-drill
      // selection rather than rendering a blank screen.
      enterNewPhase(persisted)
      return
    }

    if (attempt.correct) {
      if (result.gateCleared) {
        setMasteredChunkId(attempt.chunkId ?? newChunkId)
        setRepair(null)
        setFeedback(null)
        setMode('summary')
        return
      }
      setFeedback('correct')
      enterActiveDrill(persisted, attempt.type)
      return
    }

    handleMiss(attempt, result.next)
  }

  function handleRetry() {
    setExerciseType(repair.pendingType)
    setStimulus(repair.pendingStimulus)
    setRepair(null)
    setFeedback(null)
  }

  async function startNextSession() {
    const persisted = await persistProgress({ ...progress, session_number: progress.session_number + 1 })
    setProgress(persisted)
    startSession(persisted)
  }

  if (error) {
    return (
      <div className="app">
        <p className="app-status app-status--error">Error: {error}</p>
      </div>
    )
  }
  if (progress === null || mode === 'loading') {
    return (
      <div className="app">
        <p className="app-status">Loading…</p>
      </div>
    )
  }

  if (mode === 'summary') {
    return <SessionSummary reviewedCount={reviewedCount} masteredChunkId={masteredChunkId} onStartNext={startNextSession} />
  }

  const onAttempt = mode === 'review' ? handleReviewAttempt : handleNewAttempt
  const ExerciseScreen = { recognition: RecognitionScreen, production: ProductionScreen, 'role-tagging': RoleTaggingScreen }[
    exerciseType
  ]

  return (
    <div className="app">
      {mode === 'review' && <TechniqueBadge {...techniqueFor('review')} />}
      {repair ? (
        repair.misconception ? (
          <>
            <TechniqueBadge {...techniqueFor('repair')} />
            <MisconceptionRepair
              misconception={repair.misconception}
              correctForm={repair.correctForm}
              notionalMachine={repair.notionalMachine}
              onRetry={handleRetry}
            />
          </>
        ) : (
          <div className="retry-panel">
            <p className="retry-panel__message">{feedback}</p>
            <button type="button" className="btn" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )
      ) : (
        stimulus && <ExerciseScreen stimulus={stimulus} onAttempt={onAttempt} feedback={feedback} />
      )}
    </div>
  )
}

export default App
