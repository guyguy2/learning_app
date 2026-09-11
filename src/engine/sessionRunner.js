/**
 * src/engine/sessionRunner.js
 *
 * Pure, framework-free session state machine for the pedagogy engine.
 * Decoupled from React, the DOM, timers/clock reads, and HTTP persistence.
 *
 * Contract Gap Fix:
 * In prior implementations, review mode left `feedback === 'correct'` active when advancing
 * to the next stimulus, whereas new-content mode cleared it immediately upon presenting
 * the next stimulus. In this module, `feedback === 'correct'` is cleared when the next stimulus
 * is presented in BOTH review and new-content modes, ensuring consistent contract behavior
 * across all session modes.
 */

import defaultVocab from '../../content/spanish/vocab.json'
import defaultWorkedExamples from '../../content/spanish/worked_examples.json'
import defaultDistractors from '../../content/spanish/distractors.json'
import defaultMisconceptions from '../../content/spanish/misconceptions.json'

import { buildSession } from './session.js'
import { selectChunkForSession } from './sessionPlan.js'
import { getNextStimulus, applyAttempt } from './wordMastery.js'
import {
  applyProductionAttempt,
  findChunk,
  getNextProductionStimulus,
  masteredVerbsForFamily,
} from './conjugation.js'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from './roleTagging.js'
import { advanceLadder, resetLadder } from './review.js'
import { getMisconception, matchMisconception } from './misconception.js'
import { isReviewGateCleared, nextReviewDrillType, resetReviewStreak } from './reviewGate.js'
import { recognitionPool, familyVerbsRemaining } from './newContentSchedule.js'
import { mapPersonForMisconception } from '../misconceptionInput.js'

export const NEW_PHASE_ROTATION = ['recognition', 'production', 'role-tagging']

export const DEFAULT_CONTENT = {
  vocab: defaultVocab,
  workedExamples: defaultWorkedExamples,
  distractors: defaultDistractors,
  misconceptions: defaultMisconceptions,
}

export function resolveContent(content) {
  if (!content) return DEFAULT_CONTENT
  return {
    vocab: content.vocab ?? defaultVocab,
    workedExamples: content.workedExamples ?? defaultWorkedExamples,
    distractors: content.distractors ?? defaultDistractors,
    misconceptions: content.misconceptions ?? defaultMisconceptions,
  }
}

export function replaceChunk(progressState, chunkId, updatedChunk) {
  return {
    ...progressState,
    chunks: progressState.chunks.map((c) => (c.id === chunkId ? updatedChunk : c)),
  }
}

function stimulusForType(type, progressState, chunkId, content) {
  if (type === 'recognition') {
    return getNextStimulus(progressState, recognitionPool(progressState, content.vocab, chunkId))
  }
  if (type === 'production') {
    return getNextProductionStimulus(progressState, chunkId, content)
  }
  return getNextRoleTaggingStimulus(progressState, chunkId, content)
}

/**
 * 3-way rotation across recognition/production/role-tagging for the active new-content chunk.
 * If all family verbs are mastered, initial rotation starts at production; otherwise recognition.
 * Skips slots whose stimulus is null.
 */
export function pickNewPhaseStimulus(progressState, chunkId, lastType, content) {
  let startIndex
  if (lastType) {
    startIndex = (NEW_PHASE_ROTATION.indexOf(lastType) + 1) % NEW_PHASE_ROTATION.length
  } else {
    const hasRemaining = familyVerbsRemaining(progressState, content.vocab, chunkId)
    startIndex = hasRemaining ? 0 : 1
  }

  for (let i = 0; i < NEW_PHASE_ROTATION.length; i++) {
    const type = NEW_PHASE_ROTATION[(startIndex + i) % NEW_PHASE_ROTATION.length]
    const stimulus = stimulusForType(type, progressState, chunkId, content)
    if (stimulus) return { exerciseType: type, stimulus }
  }
  return { exerciseType: 'recognition', stimulus: null }
}

function incorrectMessage(type, stimulus) {
  if (type === 'recognition') {
    return `incorrect — "${stimulus?.word?.word}" means "${stimulus?.word?.meaning}"`
  }
  if (type === 'production') {
    return `incorrect — expected "${stimulus?.expectedForm}"`
  }
  return `incorrect — subject: "${stimulus?.parts?.subject}", stem: "${stimulus?.parts?.stem}", ending: "${stimulus?.parts?.ending}", object: "${stimulus?.parts?.object}"`
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

function notionalMachineFor(attempt, content) {
  if (attempt.type !== 'production') return null
  const we = content.workedExamples?.find((w) => w.family === attempt.chunkId)
  return we?.notional_machine ?? null
}

function handleMiss(attempt, stimulus, pendingStimulus, content) {
  const match = matchMisconception(misconceptionMatcherAttempt(attempt), content.distractors)
  const correctForm = correctFormFor(attempt, stimulus)

  if (match) {
    return {
      feedback: null,
      repair: {
        misconception: getMisconception(match.misconceptionId, content.misconceptions),
        correctForm,
        notionalMachine: notionalMachineFor(attempt, content),
        pendingStimulus,
        pendingType: attempt.type,
      },
    }
  }

  return {
    feedback: incorrectMessage(attempt.type, stimulus),
    repair: {
      misconception: null,
      correctForm,
      notionalMachine: null,
      pendingStimulus,
      pendingType: attempt.type,
    },
  }
}

function enterActiveDrillState(state, lastType, content) {
  const chunkId = selectChunkForSession(state.progress, state.progress.session_number)
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
  const picked = pickNewPhaseStimulus(state.progress, chunkId, lastType, content)
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

function enterNewPhaseState(state, content, lastType = null) {
  const base = {
    ...state,
    feedback: null,
    repair: null,
  }

  if (base.progress.session_number >= 2) {
    const toIntroduce = base.progress.chunks
      .filter(
        (c) =>
          !c.mastered &&
          (c.production_phase ?? 'worked_example') === 'worked_example' &&
          masteredVerbsForFamily(content.vocab, base.progress.words, c.id).length > 0,
      )
      .map((c) => c.id)
    if (toIntroduce.length > 0) {
      const stimulus = getNextProductionStimulus(base.progress, toIntroduce[0], content)
      return {
        ...base,
        status: 'running',
        mode: 'new',
        exerciseType: 'production',
        stimulus,
        attemptCount: 0,
      }
    }
  }

  return enterActiveDrillState(base, lastType, content)
}

function enterReviewChunkState(state, queue, content) {
  const chunkId = queue[0]
  const targetChunk = findChunk(state.progress.chunks, chunkId)
  const resetChunk = resetReviewStreak(targetChunk)
  const updatedProgress = replaceChunk(state.progress, chunkId, resetChunk)
  const stimulus = getNextProductionStimulus(updatedProgress, chunkId, content)

  return {
    ...state,
    status: 'running',
    mode: 'review',
    progress: updatedProgress,
    reviewQueue: [...queue],
    reviewHadMiss: false,
    exerciseType: 'production',
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
export function createRunnerState(progress, { today } = {}) {
  const plan = progress
    ? buildSession(progress, { sessionNumber: progress.session_number, today })
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
export function begin(state, content) {
  if (!state || !state.progress) return state
  const c = resolveContent(content)
  const s =
    state.plan ||
    buildSession(state.progress, {
      sessionNumber: state.progress.session_number,
      today: state.today,
    })

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
    return enterReviewChunkState(base, s.reviewChunkIds, c)
  } else if (s.phase === 'new') {
    return enterNewPhaseState(
      {
        ...base,
        reviewQueue: [],
      },
      c,
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
export function submitAttempt(state, attempt, content, today = state?.today) {
  if (!state || !state.progress) return { state, progress: state?.progress ?? null }
  const c = resolveContent(content)
  const curToday = today ?? state.today

  if (state.mode === 'review') {
    const attemptCount = state.attemptCount + 1
    const chunkId = attempt.chunkId
    const result =
      attempt.type === 'production'
        ? applyProductionAttempt(state.progress, attempt, c, curToday)
        : applyRoleTaggingAttempt(state.progress, attempt, c, curToday)

    if (!attempt.correct) {
      const repairState = handleMiss(attempt, state.stimulus, result.next, c)
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
    const nextType = nextReviewDrillType(attempt.type)
    const nextStimulus = stimulusForType(nextType, result.progress, chunkId, c)
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
    let result
    if (attempt.type === 'recognition') {
      result = applyAttempt(state.progress, attempt, c.vocab, curToday)
    } else if (attempt.type === 'production') {
      result = applyProductionAttempt(state.progress, attempt, c, curToday)
    } else {
      result = applyRoleTaggingAttempt(state.progress, attempt, c, curToday)
    }

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
      )
      return { state: nextState, progress: result.progress }
    }

    // Miss:
    const repairState = handleMiss(attempt, state.stimulus, result.next, c)
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
export function nextSession(state, { today, autoStart = false, content } = {}) {
  const curToday = today ?? state?.today
  const nextProgress = {
    ...state.progress,
    session_number: (state.progress?.session_number ?? 1) + 1,
  }
  const nextPlan = buildSession(nextProgress, {
    sessionNumber: nextProgress.session_number,
    today: curToday,
  })
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
    nextState = begin(nextState, content)
    return { state: nextState, progress: nextState.progress }
  }

  return { state: nextState, progress: nextProgress }
}
