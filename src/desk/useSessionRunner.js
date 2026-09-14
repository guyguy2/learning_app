import { useEffect, useState } from 'react'
import spanish from '../subjects/spanish/index.js'
import { chunkOrder } from '../subjects/contract.js'
import { initialProgress } from '../engine/chunkProgress.js'
import {
  createRunnerState,
  begin as engineBegin,
  submitAttempt as engineSubmitAttempt,
  commitProgress,
  retry as engineRetry,
  nextSession as engineNextSession,
} from '../engine/sessionRunner.js'

/** Spanish keeps the original progress.json; other subjects get their own file server-side. */
function progressUrl(subject) {
  if (subject.id === spanish.id) return '/api/progress'
  return `/api/progress?subject=${encodeURIComponent(subject.id)}`
}

async function persistProgress(progress, subject) {
  const res = await fetch(progressUrl(subject), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
  return res.json()
}

/** A subject with no saved progress yet starts from fresh chunks of its own. */
function withInitialProgress(loaded, subject) {
  if (loaded && Array.isArray(loaded.chunks) && loaded.chunks.length > 0) return loaded
  return initialProgress(chunkOrder(subject))
}

/**
 * React hook wrapper around pure engine sessionRunner.
 * `subject` is a subject module (src/subjects/); defaults to Spanish.
 */
export function useSessionRunner({ autoStart = true, subject = spanish } = {}) {
  const content = subject.content
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [runnerState, setRunnerState] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(progressUrl(subject))
      .then((res) => res.json())
      .then(async (raw) => {
        const loaded = withInitialProgress(raw, subject)
        let state = createRunnerState(loaded, { today, subject })
        if (autoStart) {
          state = engineBegin(state, content, subject)
          if (state.progress !== loaded) {
            const persisted = await persistProgress(state.progress, subject)
            state = commitProgress(state, persisted)
          }
        }
        setRunnerState(state)
      })
      .catch((err) => {
        setError(err.message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function begin() {
    if (runnerState && runnerState.status === 'ready') {
      const next = engineBegin(runnerState, content, subject)
      setRunnerState(next)
      if (next.progress !== runnerState.progress) {
        persistProgress(next.progress, subject).then((persisted) => {
          setRunnerState((cur) => (cur ? commitProgress(cur, persisted) : cur))
        })
      }
    }
  }

  async function handleAttempt(attempt) {
    if (!runnerState) return
    const { state: nextState, progress: nextProgress } = engineSubmitAttempt(
      runnerState,
      attempt,
      content,
      today,
      subject,
    )
    if (nextProgress && nextProgress !== runnerState.progress) {
      const persisted = await persistProgress(nextProgress, subject)
      setRunnerState(commitProgress(nextState, persisted))
    } else {
      setRunnerState(nextState)
    }
  }

  function handleRetry() {
    if (!runnerState) return
    setRunnerState(engineRetry(runnerState))
  }

  async function handleStartNext() {
    if (!runnerState) return
    const { state: nextState, progress: nextProgress } = engineNextSession(
      runnerState,
      { today, subject },
    )
    const persisted = await persistProgress(nextProgress, subject)
    let finalState = commitProgress(nextState, persisted)
    if (autoStart) {
      finalState = engineBegin(finalState, content, subject)
      if (finalState.progress !== persisted) {
        const p2 = await persistProgress(finalState.progress, subject)
        finalState = commitProgress(finalState, p2)
      }
    }
    setRunnerState(finalState)
  }

  const status = error ? 'error' : runnerState ? runnerState.status : 'loading'

  return {
    status,
    error,
    today,
    progress: runnerState?.progress ?? null,
    plan: runnerState?.plan ?? null,
    begin,
    mode: runnerState?.mode ?? null,
    exerciseType: runnerState?.exerciseType ?? null,
    stimulus: runnerState?.stimulus ?? null,
    feedback: runnerState?.feedback ?? null,
    repair: runnerState?.repair ?? null,
    reviewQueue: runnerState?.reviewQueue ?? [],
    reviewedCount: runnerState?.reviewedCount ?? 0,
    masteredChunkId: runnerState?.masteredChunkId ?? null,
    attemptCount: runnerState?.attemptCount ?? 0,
    onAttempt: handleAttempt,
    onRetry: handleRetry,
    onStartNext: handleStartNext,
  }
}
