import { useEffect, useState } from 'react'
import { useSessionRunner } from '../poc/useSessionRunner.js'
import { techniqueFor } from '../screenTechniques.js'
import SessionStartCard from './SessionStartCard.jsx'
import RecognitionCard from './RecognitionCard.jsx'
import WorkedExampleCard from './WorkedExampleCard.jsx'
import GuidedCard from './GuidedCard.jsx'
import IndependentCard from './IndependentCard.jsx'
import RoleTaggingCard from './RoleTaggingCard.jsx'
import RepairPanel from './RepairPanel.jsx'
import SummaryCard from './SummaryCard.jsx'
import FeedbackStrip from './FeedbackStrip.jsx'
import './desk.css'

function getFamilyColor(chunkId) {
  if (chunkId === 'er') return 'var(--family-er)'
  if (chunkId === 'ir') return 'var(--family-ir)'
  return 'var(--family-ar)'
}

/** Message for the docked strip after a correct attempt. */
export function correctMessage(attempt, stimulus) {
  if (attempt.type === 'recognition') {
    return `Correct: "${stimulus?.word?.word}" means "${attempt.expectedMeaning || attempt.given}"`
  }
  if (attempt.type === 'role-tagging') {
    const { subject, stem, ending, object } = attempt.given
    return `Correct: ${subject} | ${stem} + ${ending} | ${object}`
  }
  return `Correct: "${attempt.expectedForm || attempt.given}"`
}

export function getTechniqueKey(repair, mode, exerciseType) {
  if (repair) {
    if (repair.misconception) return 'repair'
    return null
  }
  if (mode === 'review') return 'review'
  return exerciseType
}

/**
 * DeskApp
 * Production UI for the Spanish learning app adopting the Desk design:
 * Warm paper index cards on a desk, tactile typography, morphological paper slips,
 * commit-then-reveal feedback, and cognitive transparency badges.
 */
export default function DeskApp() {
  const runner = useSessionRunner({ autoStart: false })
  const {
    status,
    error,
    today,
    progress,
    plan,
    begin,
    mode,
    exerciseType,
    stimulus,
    feedback: runnerFeedback,
    repair,
    reviewQueue,
    reviewedCount,
    masteredChunkId,
    attemptCount,
    onAttempt,
    onRetry,
    onStartNext,
  } = runner

  // Injected Google Font (Playfair Display)
  useEffect(() => {
    const linkId = 'google-font-playfair'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  // Local UI state
  const [lastAttempt, setLastAttempt] = useState(null)
  const [localFeedback, setLocalFeedback] = useState(null)
  const [retestNamedMisconception, setRetestNamedMisconception] = useState(false)
  const [mentalModelAligned, setMentalModelAligned] = useState(false)

  // Current active family ID
  const activeFamily =
    stimulus?.chunkId ||
    stimulus?.word?.family ||
    plan?.newChunkId ||
    'ar'

  const familyColor = getFamilyColor(activeFamily)

  // Technique metadata
  const techniqueKey = getTechniqueKey(repair, mode, exerciseType)
  const technique = techniqueFor(techniqueKey)

  // Clear feedback strip when the next drill appears (consistent across review and new modes)
  useEffect(() => {
    setLocalFeedback(null)
  }, [stimulus])

  // Auto-dismiss transient correct feedback strip
  useEffect(() => {
    if (localFeedback?.type === 'correct') {
      const timer = setTimeout(() => {
        setLocalFeedback(null)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [localFeedback])

  // Wrap attempt submission with feedback and named-misconception alignment tracking
  async function handleAttemptSubmit(attemptPayload) {
    setLastAttempt(attemptPayload)

    // Clear previous mental model aligned status on next attempt submission
    if (mentalModelAligned) {
      setMentalModelAligned(false)
    }

    if (attemptPayload.correct) {
      setLocalFeedback({ type: 'correct', message: correctMessage(attemptPayload, stimulus) })

      // Mental model aligned must appear ONLY after a retest that followed a NAMED misconception
      if (retestNamedMisconception) {
        setMentalModelAligned(true)
        setRetestNamedMisconception(false)
      }
    } else {
      setMentalModelAligned(false)
      setRetestNamedMisconception(false)
      setLocalFeedback(null)
    }

    await onAttempt(attemptPayload)
  }

  function handleRetryClick() {
    const isNamed = Boolean(repair?.misconception)
    setRetestNamedMisconception(isNamed)
    setLocalFeedback(null)
    onRetry()
  }

  return (
    <div className="app-desk" style={{ '--card-family-color': familyColor }}>
      {/* Top Meta Bar: shows review pill and mental model aligned indicator (no eyebrow) */}
      {(mode === 'review' || mentalModelAligned) && (
        <div className="desk-topbar">
          <div className="desk-session-tag">
            {mode === 'review' && (
              <span className="desk-review-pill">Spaced Review Mode</span>
            )}
            {mentalModelAligned && (
              <span className="desk-aligned-badge">Mental model aligned</span>
            )}
          </div>
        </div>
      )}

      {/* 1. Loading State */}
      {status === 'loading' && (
        <div className="desk-card desk-card--slide">
          <div className="desk-label">Loading Curriculum</div>
          <h1 className="desk-title">Preparing your desk...</h1>
          <p className="desk-prompt">Loading progress from local memory store.</p>
        </div>
      )}

      {/* 2. Error State */}
      {status === 'error' && (
        <div className="desk-card desk-card--slide" style={{ borderTopColor: 'var(--feedback-amber)' }}>
          <div className="desk-label" style={{ color: 'var(--feedback-amber)' }}>Session Error</div>
          <h1 className="desk-title">Unable to load progress</h1>
          <p className="desk-prompt">{error}</p>
        </div>
      )}

      {/* 3. Session Start Card (autoStart: false) */}
      {status === 'ready' && (
        <SessionStartCard plan={plan} begin={begin} technique={technique} />
      )}

      {/* 4. Active Misconception Repair / Correction Panel */}
      {repair && (
        <RepairPanel
          repair={repair}
          lastAttempt={lastAttempt}
          onRetry={handleRetryClick}
          family={activeFamily}
          technique={technique}
        />
      )}

      {/* 5. Active Drill Screens (when running and no repair) */}
      {status === 'running' && stimulus && !repair && (
        <div>
          {exerciseType === 'recognition' && (
            <RecognitionCard
              key={stimulus.word.id}
              stimulus={stimulus}
              onSubmit={handleAttemptSubmit}
              technique={technique}
            />
          )}

          {exerciseType === 'production' && stimulus.phase === 'worked_example' && (
            <WorkedExampleCard
              key={`we-${stimulus.chunkId}`}
              stimulus={stimulus}
              onAcknowledge={handleAttemptSubmit}
              technique={technique}
            />
          )}

          {exerciseType === 'production' && stimulus.phase === 'guided' && (
            <GuidedCard
              key={`guided-${stimulus.verb.id}-${stimulus.person}`}
              stimulus={stimulus}
              attemptCount={attemptCount}
              onSubmit={handleAttemptSubmit}
              technique={technique}
            />
          )}

          {exerciseType === 'production' && stimulus.phase === 'independent' && (
            <IndependentCard
              key={`ind-${stimulus.verb.id}-${stimulus.person}`}
              stimulus={stimulus}
              onSubmit={handleAttemptSubmit}
              technique={technique}
            />
          )}

          {exerciseType === 'role-tagging' && (
            <RoleTaggingCard
              key={`role-${stimulus.verb.id}-${stimulus.person}`}
              stimulus={stimulus}
              onSubmit={handleAttemptSubmit}
              technique={technique}
            />
          )}

          {/* Bottom Docked Feedback Strip */}
          <div style={{ maxWidth: '44rem', margin: '0 auto' }}>
            <FeedbackStrip feedback={localFeedback || runnerFeedback} />
          </div>
        </div>
      )}

      {/* 6. Session Summary */}
      {status === 'summary' && (
        <SummaryCard
          progress={progress}
          reviewedCount={reviewedCount}
          masteredChunkId={masteredChunkId}
          onStartNext={onStartNext}
          technique={technique}
        />
      )}
    </div>
  )
}
