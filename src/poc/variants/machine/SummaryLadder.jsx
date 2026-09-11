import React, { useEffect } from 'react'

export const LADDER_DAYS = [1, 3, 7, 14, 30]

/**
 * SummaryLadder - Renders the session completion summary with a horizontal
 * five-rung track for each mastered chunk.
 */
export default function SummaryLadder({
  chunks = [],
  reviewedCount = 0,
  masteredChunkId = null,
  onStartNext,
  today,
}) {
  const masteredChunks = chunks.filter((c) => c.mastered)

  // Keyboard shortcut: Enter starts next session
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Enter') {
        onStartNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStartNext])

  return (
    <div>
      <div className="machine-card__meta">
        <span className="machine-badge machine-badge--neutral">Session Complete</span>
        {masteredChunkId && (
          <span className="machine-badge machine-badge--ar">Mastered Chunk: {masteredChunkId}</span>
        )}
      </div>

      <h2 className="machine-title">Session Summary</h2>
      <p className="machine-prompt">
        Reviewed items: <strong>{reviewedCount}</strong>.
        {masteredChunkId ? ` Congratulations on mastering the regular -${masteredChunkId} verb family!` : ''}
      </p>

      {masteredChunks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Spaced Repetition Ladder (Mastered Chunks)
          </h3>
          {masteredChunks.map((chunk) => {
            const currentStep = chunk.ladder_step != null ? chunk.ladder_step : 0
            const family = chunk.id || 'ar'
            const familyBadgeClass =
              family === 'ar'
                ? 'machine-badge--ar'
                : family === 'er'
                ? 'machine-badge--er'
                : 'machine-badge--ir'

            return (
              <div key={chunk.id} className="machine-ladder-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`machine-badge ${familyBadgeClass}`}>-{family} family</span>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', color: 'var(--lab-text-muted)' }}>
                      Step {currentStep + 1} of 5 ({LADDER_DAYS[currentStep]} day interval)
                    </span>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                    Next Due: <strong>{chunk.next_due_date || 'Scheduled'}</strong>
                  </div>
                </div>

                {/* Horizontal Track with 5 Stops */}
                <div className="machine-ladder-track">
                  {LADDER_DAYS.map((days, idx) => {
                    const isPassed = idx < currentStep
                    const isActive = idx === currentStep
                    const nodeClass = isActive
                      ? 'machine-ladder-node--active'
                      : isPassed
                      ? 'machine-ladder-node--passed'
                      : ''

                    return (
                      <div key={idx} className="machine-ladder-stop">
                        <div className={`machine-ladder-node ${nodeClass}`}>
                          {idx + 1}
                        </div>
                        <span className="machine-ladder-label">{days}d</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="machine-ladder-card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem', color: 'var(--lab-text-muted)' }}>
            No chunks on the spaced review ladder yet. Complete practice drills to master verb families!
          </p>
        </div>
      )}

      <div>
        <button
          type="button"
          className="machine-btn machine-btn--primary"
          onClick={onStartNext}
          autoFocus
        >
          Start Next Session
          <span className="machine-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}
