import React from 'react'

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
}) {
  const masteredChunks = progress?.chunks?.filter((c) => c.mastered) || []

  return (
    <div className="desk-card desk-card--slide">
      <div className="desk-label">Session Complete</div>
      <h1 className="desk-title">Knowledge Consolidation</h1>
      <p className="desk-prompt">
        Your daily spaced repetitions and grammatical schema formations are saved.
      </p>

      {/* Session Metrics */}
      <div className="desk-summary-stats">
        <div className="desk-stat-card">
          <div className="desk-stat-value">{reviewedCount}</div>
          <div className="desk-stat-label">Families Reviewed</div>
        </div>

        <div className="desk-stat-card">
          <div className="desk-stat-value">
            {masteredChunkId ? `-${masteredChunkId}` : 'Consolidated'}
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
                  <span className="desk-ladder-family">-{chunk.id} Family Ladder</span>
                  <span className="desk-ladder-due">
                    Next due: <strong>{chunk.next_due_date || 'Upcoming'}</strong>
                  </span>
                </div>

                {/* 5-Rung Wooden Ladder Rig */}
                <div
                  className="desk-ladder-rig"
                  role="img"
                  aria-label={`5-rung ladder for -${chunk.id}, currently at step ${currentStep + 1} (${LADDER_DAYS[currentStep]} days)`}
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
          Start Next Session
        </button>
      </div>
    </div>
  )
}
