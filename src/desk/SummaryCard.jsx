import React from 'react'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'
import { DEFAULT_COPY, defaultChunkLabel } from './copy.js'

const LADDER_DAYS = [1, 3, 7, 14, 30]

/**
 * SummaryCard
 * Session closure screen showing reviewed items, new family mastery,
 * and a tactile 5-rung wooden ladder for each mastered verb family.
 */
export default function SummaryCard({
  progress,
  reviewedCount,
  masteredChunkId,
  onStartNext,
  technique,
  chunkLabel = defaultChunkLabel,
  copy = DEFAULT_COPY,
}) {
  const masteredChunks = progress?.chunks?.filter((c) => c.mastered) || []

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (typeof onStartNext === 'function') onStartNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onStartNext])

  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">Session Complete</div>
      <h1 className="desk-title">Knowledge Consolidation</h1>
      <p className="desk-prompt">
        {copy.summaryIntro}
      </p>

      {/* Session Metrics */}
      <div className="desk-summary-stats">
        <div className="desk-stat-card">
          <div className="desk-stat-value">{reviewedCount}</div>
          <div className="desk-stat-label">{copy.reviewedLabel}</div>
        </div>

        <div className="desk-stat-card">
          <div className="desk-stat-value">
            {masteredChunkId ? chunkLabel(masteredChunkId) : 'Consolidated'}
          </div>
          <div className="desk-stat-label">
            {masteredChunkId ? 'Newly Mastered' : 'Curriculum Status'}
          </div>
        </div>
      </div>

      {/* Five-Rung Wooden Ladders for Mastered Families */}
      {masteredChunks.length > 0 && (
        <div>
          <div className="desk-label" style={{ marginTop: '1.5rem' }}>
            Spaced Repetition Ladders
          </div>
          {masteredChunks.map((chunk) => {
            const currentStep = chunk.ladder_step ?? 0

            return (
              <div key={chunk.id} className="desk-ladder-card">
                <div className="desk-ladder-header">
                  <span className="desk-ladder-family">{chunkLabel(chunk.id)} {copy.ladderSuffix}</span>
                  <span className="desk-ladder-due">
                    Next due: <strong>{chunk.next_due_date || 'Upcoming'}</strong>
                  </span>
                </div>

                {/* 5-Rung Wooden Ladder Rig */}
                <div
                  className="desk-ladder-rig"
                  role="img"
                  aria-label={`5-rung ladder for ${chunkLabel(chunk.id)}, currently at step ${currentStep + 1} (${LADDER_DAYS[currentStep]} days)`}
                >
                  {LADDER_DAYS.map((days, stepIdx) => {
                    const isClimbed = stepIdx <= currentStep
                    const isActive = stepIdx === currentStep

                    return (
                      <div
                        key={days}
                        className={`desk-ladder-rung ${
                          isClimbed ? 'desk-ladder-rung--climbed' : ''
                        } ${isActive ? 'desk-ladder-rung--active' : ''}`}
                      >
                        {isActive && <div className="desk-ladder-peg" />}
                        <span className="desk-ladder-rung-label">
                          {days} {days === 1 ? 'day' : 'days'}
                          {isActive ? ' (Current)' : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="desk-btn-group" style={{ marginTop: '2rem' }}>
        <button
          type="button"
          className="desk-btn desk-btn--primary"
          onClick={onStartNext}
          autoFocus
        >
          Start Next Session <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}
