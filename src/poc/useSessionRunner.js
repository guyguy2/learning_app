import { useEffect, useState } from 'react'
import vocab from '../../content/spanish/vocab.json'
import workedExamples from '../../content/spanish/worked_examples.json'
import distractors from '../../content/spanish/distractors.json'
import misconceptions from '../../content/spanish/misconceptions.json'
import {
  createRunnerState,
  begin as engineBegin,
  submitAttempt as engineSubmitAttempt,
  commitProgress,
  retry as engineRetry,
  nextSession as engineNextSession,
} from '../engine/sessionRunner.js'

const CONTENT = { vocab, workedExamples, distractors, misconceptions }

async function persistProgress(progress) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
  return res.json()
}

/**
 * React hook wrapper around pure engine sessionRunner.
 */
export function useSessionRunner({ autoStart = true } = {}) {
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [runnerState, setRunnerState] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then(async (loaded) => {
        let state = createRunnerState(loaded, { today })
        if (autoStart) {
          state = engineBegin(state, CONTENT)
          if (state.progress !== loaded) {
            const persisted = await persistProgress(state.progress)
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
      const next = engineBegin(runnerState, CONTENT)
      setRunnerState(next)
      if (next.progress !== runnerState.progress) {
        persistProgress(next.progress).then((persisted) => {
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
      CONTENT,
      today,
    )
    if (nextProgress && nextProgress !== runnerState.progress) {
      const persisted = await persistProgress(nextProgress)
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
      { today },
    )
    const persisted = await persistProgress(nextProgress)
    let finalState = commitProgress(nextState, persisted)
    if (autoStart) {
      finalState = engineBegin(finalState, CONTENT)
      if (finalState.progress !== persisted) {
        const p2 = await persistProgress(finalState.progress)
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
