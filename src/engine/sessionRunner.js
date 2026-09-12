/**
 * src/engine/sessionRunner.js
 *
 * Pure, framework-free session state machine for the pedagogy engine.
 * Decoupled from React, the DOM, timers/clock reads, and HTTP persistence.
 *
 * Subject-agnostic: every subject-specific decision (which stimulus to show, how an attempt
 * updates progress, feedback text, named-misconception repair) goes through a subject module
 * implementing the contract in src/subjects/contract.js. Each entry point takes the subject
 * as its last parameter, defaulting to Spanish.
 *
 * Contract Gap Fix:
 * In prior implementations, review mode left `feedback === 'correct'` active when advancing
 * to the next stimulus, whereas new-content mode cleared it immediately upon presenting
 * the next stimulus. In this module, `feedback === 'correct'` is cleared when the next stimulus
 * is presented in BOTH review and new-content modes, ensuring consistent contract behavior
 * across all session modes.
 */

import spanish from '../subjects/spanish/index.js'
import { chunkOrder, exerciseFor, resolveSubjectContent } from '../subjects/contract.js'

import { buildSession } from './session.js'
import { selectChunkForSession } from './sessionPlan.js'
import { findChunk, scaffoldPhase } from './chunkProgress.js'
import { advanceLadder, resetLadder } from './review.js'
import { isReviewGateCleared, nextReviewDrillType, resetReviewStreak } from './reviewGate.js'

export const DEFAULT_CONTENT = spanish.content

export function resolveContent(content, subject = spanish) {
  return resolveSubjectContent(subject, content)
}

export function replaceChunk(progressState, chunkId, updatedChunk) {
  return {
    ...progressState,
    chunks: progressState.chunks.map((c) => (c.id === chunkId ? updatedChunk : c)),
  }
}

function stimulusForType(type, progressState, chunkId, content, subject) {
  return exerciseFor(subject, type).nextStimulus(progressState, chunkId, content)
}

function planSession(progress, { sessionNumber, today }, content, subject) {
  return buildSession(progress, {
    sessionNumber,
    today,
    chunkOrder: chunkOrder(subject, content),
  })
}

/**
 * Rotation across subject.exerciseTypes for the active new-content chunk.
 * With no previous type, starts where the subject says (firstExerciseType), else at the first type.
 * Skips slots whose stimulus is null.
 */
export function pickNewPhaseStimulus(progressState, chunkId, lastType, content, subject = spanish) {
  const rotation = subject.exerciseTypes
  let startIndex
  if (lastType) {
    startIndex = (rotation.indexOf(lastType) + 1) % rotation.length
  } else {
    const firstType = subject.firstExerciseType?.(progressState, chunkId, content) ?? rotation[0]
    startIndex = Math.max(rotation.indexOf(firstType), 0)
  }

  for (let i = 0; i < rotation.length; i++) {
    const type = rotation[(startIndex + i) % rotation.length]
    const stimulus = stimulusForType(type, progressState, chunkId, content, subject)
    if (stimulus) return { exerciseType: type, stimulus }
  }
  return { exerciseType: rotation[0], stimulus: null }
}

function handleMiss(attempt, stimulus, pendingStimulus, content, subject) {
  const exercise = exerciseFor(subject, attempt.type)
  const named = exercise.repairFor?.(attempt, stimulus, content) ?? null
  const correctForm = exercise.expectedAnswer(stimulus)

  if (named) {
    return {
      feedback: null,
      repair: {
        misconception: named.misconception,
        correctForm,
        notionalMachine: named.notionalMachine ?? null,
        pendingStimulus,
        pendingType: attempt.type,
      },
    }
  }

  return {
    feedback: exercise.feedback({ correct: false, attempt }, stimulus),
    repair: {
      misconception: null,
      correctForm,
      notionalMachine: null,
      pendingStimulus,
      pendingType: attempt.type,
    },
  }
}

function enterActiveDrillState(state, lastType, content, subject) {
  const chunkId = selectChunkForSession(
    state.progress,
    state.progress.session_number,
    chunkOrder(subject, content),
  )
  if (chunkId == null) {
    return {
      ...state,
      status: 'summary',
      mode: null,
      exerciseType: null,
      stimulus: null,
      feedback: null,
      repair: null,
      attemptCount: 0,
    }
  }
  const picked = pickNewPhaseStimulus(state.progress, chunkId, lastType, content, subject)
  return {
    ...state,
    status: 'running',
    mode: 'new',
    exerciseType: picked.exerciseType,
    stimulus: picked.stimulus,
    feedback: null,
    repair: null,
    attemptCount: 0,
  }
}

function enterNewPhaseState(state, content, subject, lastType = null) {
  const base = {
    ...state,
    feedback: null,
    repair: null,
  }

  // From session two, introduce (via its worked example) any chunk still waiting on one.
  const { scaffoldType } = subject
  if (base.progress.session_number >= 2 && scaffoldType) {
    const toIntroduce = base.progress.chunks
      .filter(
        (c) =>
          !c.mastered &&
          scaffoldPhase(c) === 'worked_example' &&
          (subject.scaffoldReady?.(base.progress, c.id, content) ?? true),
      )
      .map((c) => c.id)
    if (toIntroduce.length > 0) {
      const stimulus = stimulusForType(scaffoldType, base.progress, toIntroduce[0], content, subject)
      return {
        ...base,
        status: 'running',
        mode: 'new',
        exerciseType: scaffoldType,
        stimulus,
        attemptCount: 0,
      }
    }
  }

  return enterActiveDrillState(base, lastType, content, subject)
}

function enterReviewChunkState(state, queue, content, subject) {
  const chunkId = queue[0]
  const targetChunk = findChunk(state.progress.chunks, chunkId)
  const resetChunk = resetReviewStreak(targetChunk)
  const updatedProgress = replaceChunk(state.progress, chunkId, resetChunk)
  const firstType = subject.reviewTypes[0]
  const stimulus = stimulusForType(firstType, updatedProgress, chunkId, content, subject)

  return {
    ...state,
    status: 'running',
    mode: 'review',
    progress: updatedProgress,
    reviewQueue: [...queue],
    reviewHadMiss: false,
    exerciseType: firstType,
    stimulus,
    feedback: null,
    repair: null,
    attemptCount: 0,
  }
}

/**
 * Initialize a session runner state from loaded progress and date.
 * Returns state with status 'ready'.
 */
export function createRunnerState(progress, { today, subject = spanish, content } = {}) {
  const plan = progress
    ? planSession(
        progress,
        { sessionNumber: progress.session_number, today },
        resolveContent(content, subject),
        subject,
      )
    : null

  return {
    status: 'ready',
    plan,
    today: today ?? null,
    progress: progress ? { ...progress } : null,
    mode: null,
    exerciseType: null,
    stimulus: null,
    feedback: null,
    repair: null,
    reviewQueue: [],
    reviewedCount: 0,
    reviewHadMiss: false,
    masteredChunkId: null,
    attemptCount: 0,
  }
}

/**
 * Begin drilling based on the session plan.
 * Transitions status from 'ready' to 'running' (or 'summary' if no review or new content).
 */
export function begin(state, content, subject = spanish) {
  if (!state || !state.progress) return state
  const c = resolveContent(content, subject)
  const s =
    state.plan ||
    planSession(
      state.progress,
      { sessionNumber: state.progress.session_number, today: state.today },
      c,
      subject,
    )

  const base = {
    ...state,
    plan: s,
    masteredChunkId: null,
    reviewedCount: 0,
    feedback: null,
    repair: null,
    attemptCount: 0,
  }

  if (s.phase === 'review') {
    return enterReviewChunkState(base, s.reviewChunkIds, c, subject)
  } else if (s.phase === 'new') {
    return enterNewPhaseState(
      {
        ...base,
        reviewQueue: [],
      },
      c,
      subject,
    )
  } else {
    return {
      ...base,
      status: 'summary',
      mode: null,
      exerciseType: null,
      stimulus: null,
      reviewQueue: [],
    }
  }
}

/**
 * Submit a user attempt on the active drill.
 * Returns `{ state, progress }` where progress is the updated progress to persist.
 */
export function submitAttempt(state, attempt, content, today = state?.today, subject = spanish) {
  if (!state || !state.progress) return { state, progress: state?.progress ?? null }
  const c = resolveContent(content, subject)
  const curToday = today ?? state.today

  if (state.mode === 'review') {
    const attemptCount = state.attemptCount + 1
    const chunkId = attempt.chunkId
    const result = exerciseFor(subject, attempt.type).apply(state.progress, attempt, c, curToday)

    if (!attempt.correct) {
      const repairState = handleMiss(attempt, state.stimulus, result.next, c, subject)
      const nextState = {
        ...state,
        progress: result.progress,
        attemptCount,
        reviewHadMiss: true,
        feedback: repairState.feedback,
        repair: repairState.repair,
      }
      return { state: nextState, progress: result.progress }
    }

    const updatedChunk = findChunk(result.progress.chunks, chunkId)
    if (isReviewGateCleared(updatedChunk)) {
      const finalChunk = state.reviewHadMiss
        ? resetLadder(updatedChunk, curToday)
        : advanceLadder(updatedChunk, curToday)
      const finalProgress = replaceChunk(result.progress, chunkId, finalChunk)
      const reviewedCount = state.reviewedCount + 1
      const rest = state.reviewQueue.slice(1)

      if (rest.length > 0) {
        const nextReviewState = enterReviewChunkState(
          {
            ...state,
            progress: finalProgress,
            reviewedCount,
          },
          rest,
          c,
          subject,
        )
        return { state: nextReviewState, progress: nextReviewState.progress }
      } else if (state.plan?.newChunkId != null) {
        const nextState = enterNewPhaseState(
          {
            ...state,
            progress: finalProgress,
            reviewQueue: [],
            reviewedCount,
          },
          c,
          subject,
        )
        return { state: nextState, progress: finalProgress }
      } else {
        const nextState = {
          ...state,
          progress: finalProgress,
          reviewQueue: [],
          reviewedCount,
          status: 'summary',
          mode: null,
          exerciseType: null,
          stimulus: null,
          feedback: null,
          repair: null,
          attemptCount: 0,
        }
        return { state: nextState, progress: finalProgress }
      }
    }

    // Review drill correct, gate NOT cleared yet:
    // CONTRACT GAP FIX: feedback cleared when next stimulus is presented (consistent with new-content mode).
    const nextType = nextReviewDrillType(attempt.type, subject.reviewTypes)
    const nextStimulus = stimulusForType(nextType, result.progress, chunkId, c, subject)
    const nextState = {
      ...state,
      progress: result.progress,
      exerciseType: nextType,
      stimulus: nextStimulus,
      feedback: null,
      repair: null,
      attemptCount: 0,
    }
    return { state: nextState, progress: result.progress }
  }

  if (state.mode === 'new') {
    const attemptCount = state.attemptCount + 1
    const result = exerciseFor(subject, attempt.type).apply(state.progress, attempt, c, curToday)

    if (attempt.action === 'worked_example_ack') {
      const nextState = enterNewPhaseState(
        {
          ...state,
          progress: result.progress,
          attemptCount: 0,
          feedback: null,
          repair: null,
        },
        c,
        subject,
      )
      return { state: nextState, progress: result.progress }
    }

    if (attempt.correct) {
      if (result.gateCleared) {
        const masteredChunkId = attempt.chunkId ?? state.plan?.newChunkId ?? null
        const nextState = {
          ...state,
          progress: result.progress,
          masteredChunkId,
          status: 'summary',
          mode: null,
          exerciseType: null,
          stimulus: null,
          feedback: null,
          repair: null,
          attemptCount: 0,
        }
        return { state: nextState, progress: result.progress }
      }

      const nextState = enterActiveDrillState(
        {
          ...state,
          progress: result.progress,
          feedback: null,
          repair: null,
          attemptCount: 0,
        },
        attempt.type,
        c,
        subject,
      )
      return { state: nextState, progress: result.progress }
    }

    // Miss:
    const repairState = handleMiss(attempt, state.stimulus, result.next, c, subject)
    const nextState = {
      ...state,
      progress: result.progress,
      attemptCount,
      feedback: repairState.feedback,
      repair: repairState.repair,
    }
    return { state: nextState, progress: result.progress }
  }

  return { state, progress: state.progress }
}

/**
 * Commit persisted progress echo back into runner state.
 */
export function commitProgress(state, persistedProgress) {
  if (!state) return state
  return {
    ...state,
    progress: persistedProgress,
  }
}

/**
 * Dismiss repair panel and activate the pending stimulus.
 * Resets attemptCount to 0 for the retried stimulus.
 */
export function retry(state) {
  if (!state || !state.repair) return state
  return {
    ...state,
    exerciseType: state.repair.pendingType,
    stimulus: state.repair.pendingStimulus,
    repair: null,
    feedback: null,
    attemptCount: 0,
  }
}

/**
 * Advance session_number by 1 and build a fresh session plan.
 * Returns `{ state, progress }` with status 'ready'.
 */
export function nextSession(state, { today, autoStart = false, content, subject = spanish } = {}) {
  const curToday = today ?? state?.today
  const nextProgress = {
    ...state.progress,
    session_number: (state.progress?.session_number ?? 1) + 1,
  }
  const nextPlan = planSession(
    nextProgress,
    { sessionNumber: nextProgress.session_number, today: curToday },
    resolveContent(content, subject),
    subject,
  )
  let nextState = {
    ...state,
    status: 'ready',
    plan: nextPlan,
    progress: nextProgress,
    today: curToday,
    mode: null,
    exerciseType: null,
    stimulus: null,
    feedback: null,
    repair: null,
    reviewQueue: [],
    reviewedCount: 0,
    reviewHadMiss: false,
    masteredChunkId: null,
    attemptCount: 0,
  }

  if (autoStart && content) {
    nextState = begin(nextState, content, subject)
    return { state: nextState, progress: nextState.progress }
  }

  return { state: nextState, progress: nextProgress }
}
