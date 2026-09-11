import { useEffect, useState, useRef } from 'react'
import { useSessionRunner } from '../../useSessionRunner.js'
import SessionStartCard from './SessionStartCard.jsx'
import RecognitionDrill from './RecognitionDrill.jsx'
import WorkedExampleView from './WorkedExampleView.jsx'
import ProductionDrill from './ProductionDrill.jsx'
import RoleTaggingDrill from './RoleTaggingDrill.jsx'
import RepairPanel from './RepairPanel.jsx'
import SummaryView from './SummaryView.jsx'
import './editorial.css'

function EditorialVariant() {
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
    feedback,
    repair,
    reviewedCount,
    masteredChunkId,
    attemptCount,
    onAttempt,
    onRetry,
    onStartNext,
  } = runner

  // Retest tracking for "Mental model aligned" confirmation
  const [wasRepairing, setWasRepairing] = useState(false)
  const [mentalModelAligned, setMentalModelAligned] = useState(false)
  const lastAttemptRef = useRef(null)

  // Inject Google Fonts idempotently
  useEffect(() => {
    const fontId = 'editorial-fonts'
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link')
      link.id = fontId
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  // If repair is triggered, record it
  useEffect(() => {
    if (repair) {
      setWasRepairing(true)
      setMentalModelAligned(false)
    }
  }, [repair])

  // If previous repair was retried and now correct, trigger mental model aligned confirmation
  useEffect(() => {
    if (feedback === 'correct' && wasRepairing) {
      setMentalModelAligned(true)
      setWasRepairing(false)
      const timer = setTimeout(() => setMentalModelAligned(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback, wasRepairing])

  // Track last attempt for repair panel comparisons
  function handleAttempt(attempt) {
    lastAttemptRef.current = attempt
    return onAttempt(attempt)
  }

  // Active family determines the subtle ink accent
  const activeFamily =
    stimulus?.chunkId ||
    stimulus?.word?.family ||
    plan?.newChunkId ||
    plan?.reviewChunkIds?.[0] ||
    'ar'

  const isReview = mode === 'review'

  return (
    <div className={`variant-editorial family-${activeFamily}`}>
      <div className="editorial-column">
        {status === 'loading' && (
          <div className="editorial-card" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--editorial-ink-muted)' }}>
              Loading study session...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="editorial-card" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h2 className="editorial-repair-title">Unable to Load Progress</h2>
            <p style={{ color: 'var(--editorial-ink-muted)' }}>{error}</p>
          </div>
        )}

        {status === 'ready' && (
          <SessionStartCard plan={plan} begin={begin} />
        )}

        {status === 'summary' && (
          <SummaryView
            reviewedCount={reviewedCount}
            masteredChunkId={masteredChunkId}
            progress={progress}
            today={today}
            onStartNext={onStartNext}
          />
        )}

        {status === 'running' && repair && (
          <RepairPanel
            repair={repair}
            lastAttempt={lastAttemptRef.current}
            onRetry={onRetry}
            isReview={isReview}
          />
        )}

        {status === 'running' && stimulus && !repair && (
          <div>
            {exerciseType === 'recognition' && (
              <RecognitionDrill
                stimulus={stimulus}
                onAttempt={handleAttempt}
                feedback={feedback}
                isReview={isReview}
                mentalModelAligned={mentalModelAligned}
              />
            )}

            {exerciseType === 'production' && stimulus.phase === 'worked_example' && (
              <WorkedExampleView
                stimulus={stimulus}
                onAttempt={handleAttempt}
                isReview={isReview}
              />
            )}

            {exerciseType === 'production' && stimulus.phase !== 'worked_example' && (
              <ProductionDrill
                stimulus={stimulus}
                attemptCount={attemptCount}
                onAttempt={handleAttempt}
                feedback={feedback}
                isReview={isReview}
                mentalModelAligned={mentalModelAligned}
              />
            )}

            {exerciseType === 'role-tagging' && (
              <RoleTaggingDrill
                stimulus={stimulus}
                onAttempt={handleAttempt}
                feedback={feedback}
                isReview={isReview}
                mentalModelAligned={mentalModelAligned}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default {
  id: 'editorial',
  name: 'Editorial',
  description: 'Near-monochrome, large type, one ink accent per family; reading-focused calm.',
  Component: EditorialVariant,
}
