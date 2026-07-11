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
import { getNextStimulus, applyAttempt } from './engine/wordMastery.js'
import { applyProductionAttempt, findChunk, getNextProductionStimulus } from './engine/conjugation.js'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from './engine/roleTagging.js'
import { advanceLadder, resetLadder } from './engine/review.js'
import { getMisconception, matchMisconception } from './engine/misconception.js'
import { mapPersonForMisconception } from './misconceptionInput.js'

const CONTENT = { vocab, workedExamples }

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

/**
 * Decide the next new-content stimulus: recognition first to grow mastered vocab for the
 * chunk's family, then alternate production/role-tagging drills once verbs are mastered
 * (both feed the same chunk streak so the mastery gate sees >=2 distinct exercise types).
 */
function pickNewPhaseStimulus(progressState, chunkId, lastDrillType) {
  const productionStimulus = getNextProductionStimulus(progressState, chunkId, CONTENT)

  if (!productionStimulus) {
    return { exerciseType: 'recognition', stimulus: getNextStimulus(progressState, vocab) }
  }

  if (productionStimulus.phase === 'worked_example') {
    return { exerciseType: 'production', stimulus: productionStimulus }
  }

  const nextType = lastDrillType === 'production' ? 'role-tagging' : 'production'
  if (nextType === 'role-tagging') {
    const roleTaggingStimulus = getNextRoleTaggingStimulus(progressState, chunkId, CONTENT)
    if (roleTaggingStimulus) return { exerciseType: 'role-tagging', stimulus: roleTaggingStimulus }
  }

  return { exerciseType: 'production', stimulus: productionStimulus }
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

function App() {
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const [mode, setMode] = useState('loading') // loading | review | new | summary
  const [reviewQueue, setReviewQueue] = useState([])
  const [reviewedCount, setReviewedCount] = useState(0)
  const [masteredChunkId, setMasteredChunkId] = useState(null)
  const [newChunkId, setNewChunkId] = useState(null)

  const [exerciseType, setExerciseType] = useState(null)
  const [stimulus, setStimulus] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [repair, setRepair] = useState(null) // { misconception, correctForm, notionalMachine, pendingStimulus, pendingType }
  const [isRecheck, setIsRecheck] = useState(false)

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
    setIsRecheck(false)
    setNewChunkId(s.newChunkId)

    if (s.phase === 'review') {
      setReviewQueue(s.reviewChunkIds)
      setMode('review')
      enterReviewChunk(progressState, s.reviewChunkIds[0])
    } else if (s.phase === 'new') {
      setReviewQueue([])
      enterNewPhase(progressState, s.newChunkId, null)
    } else {
      setReviewQueue([])
      setMode('summary')
    }
  }

  function enterReviewChunk(progressState, chunkId) {
    setIsRecheck(false)
    setRepair(null)
    setFeedback(null)
    setExerciseType('production')
    setStimulus(getNextProductionStimulus(progressState, chunkId, CONTENT))
    setMode('review')
  }

  function enterNewPhase(progressState, chunkId, lastDrillType) {
    setFeedback(null)
    setRepair(null)
    const picked = pickNewPhaseStimulus(progressState, chunkId, lastDrillType)
    setExerciseType(picked.exerciseType)
    setStimulus(picked.stimulus)
    setMode('new')
  }

  // ---- REVIEW handlers ----

  async function handleReviewAttempt(attempt) {
    const chunkId = attempt.chunkId

    if (isRecheck) {
      const updated = resetLadder(findChunk(progress.chunks, chunkId), today)
      const persisted = await persistProgress(replaceChunk(progress, chunkId, updated))
      setProgress(persisted)
      advanceReviewQueue(persisted)
      return
    }

    if (attempt.correct) {
      const updated = advanceLadder(findChunk(progress.chunks, chunkId), today)
      const persisted = await persistProgress(replaceChunk(progress, chunkId, updated))
      setProgress(persisted)
      setReviewedCount((n) => n + 1)
      advanceReviewQueue(persisted)
      return
    }

    const matcherAttempt = {
      type: 'overgeneralization',
      verbId: attempt.wordId,
      person: mapPersonForMisconception(attempt.person),
      given: attempt.given,
    }
    const match = matchMisconception(matcherAttempt, distractors)
    const pendingStimulus = getNextProductionStimulus(progress, chunkId, CONTENT)
    const correctForm = stimulus.expectedForm

    if (match) {
      setRepair({
        misconception: getMisconception(match.misconceptionId, misconceptions),
        correctForm,
        notionalMachine: workedExampleFor(chunkId)?.notional_machine,
        pendingStimulus,
        pendingType: 'production',
      })
    } else {
      setFeedback(incorrectMessage('production', stimulus))
      setRepair({ misconception: null, correctForm, pendingStimulus, pendingType: 'production' })
    }
  }

  function advanceReviewQueue(persistedProgress) {
    const rest = reviewQueue.slice(1)
    setReviewQueue(rest)
    if (rest.length > 0) {
      enterReviewChunk(persistedProgress, rest[0])
    } else if (newChunkId != null) {
      enterNewPhase(persistedProgress, newChunkId, null)
    } else {
      setFeedback(null)
      setRepair(null)
      setMode('summary')
    }
  }

  function handleReviewRetry() {
    setStimulus(repair.pendingStimulus)
    setRepair(null)
    setFeedback(null)
    setIsRecheck(true)
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
      setStimulus(result.next)
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
      enterNewPhase(persisted, newChunkId, attempt.type)
      return
    }

    let match = null
    if (attempt.type === 'recognition') {
      match = matchMisconception(
        { type: 'false_cognate', wordId: attempt.wordId, given: attempt.given },
        distractors,
      )
    } else if (attempt.type === 'production') {
      match = matchMisconception(
        {
          type: 'overgeneralization',
          verbId: attempt.wordId,
          person: mapPersonForMisconception(attempt.person),
          given: attempt.given,
        },
        distractors,
      )
    }

    const correctForm = attempt.type === 'recognition' ? stimulus.word.meaning : stimulus.expectedForm

    if (match) {
      setRepair({
        misconception: getMisconception(match.misconceptionId, misconceptions),
        correctForm,
        notionalMachine: attempt.type === 'production' ? workedExampleFor(attempt.chunkId)?.notional_machine : null,
        pendingStimulus: result.next,
        pendingType: attempt.type,
      })
    } else {
      setFeedback(incorrectMessage(attempt.type, stimulus))
      setRepair({ misconception: null, correctForm, pendingStimulus: result.next, pendingType: attempt.type })
    }
  }

  function handleNewRetry() {
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

  if (error) return <p>Error: {error}</p>
  if (progress === null || mode === 'loading') return <p>Loading...</p>

  if (mode === 'summary') {
    return <SessionSummary reviewedCount={reviewedCount} masteredChunkId={masteredChunkId} onStartNext={startNextSession} />
  }

  const onAttempt = mode === 'review' ? handleReviewAttempt : handleNewAttempt
  const onRetry = mode === 'review' ? handleReviewRetry : handleNewRetry
  const ExerciseScreen = { recognition: RecognitionScreen, production: ProductionScreen, 'role-tagging': RoleTaggingScreen }[
    exerciseType
  ]

  return (
    <div>
      {mode === 'review' && <TechniqueBadge {...techniqueFor('review')} />}
      {repair ? (
        repair.misconception ? (
          <>
            <TechniqueBadge {...techniqueFor('repair')} />
            <MisconceptionRepair
              misconception={repair.misconception}
              correctForm={repair.correctForm}
              notionalMachine={repair.notionalMachine}
              onRetry={onRetry}
            />
          </>
        ) : (
          <div>
            <p>{feedback}</p>
            <button type="button" onClick={onRetry}>
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
