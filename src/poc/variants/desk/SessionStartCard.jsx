import React from 'react'

/**
 * SessionStartCard
 * Shown when status is 'ready' (autoStart: false).
 * Summarizes review queue and upcoming new chunk before the session begins.
 */
export default function SessionStartCard({ plan, begin }) {
  const reviewCount = plan?.reviewChunkIds?.length ?? 0
  const hasReview = reviewCount > 0
  const newChunk = plan?.newChunkId

  return (
    <div className="desk-card desk-card--slide">
      <div className="desk-label">Session Overview</div>
      <h1 className="desk-title">Daily Study Session</h1>
      <p className="desk-prompt">
        Review consolidated verbs and construct new grammatical schemas through retrieval practice.
      </p>

      <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            padding: '0.875rem 1rem',
            background: '#fcfaf6',
            border: '1px solid #e5dfd2',
            borderRadius: '6px',
          }}
        >
          <div className="desk-label" style={{ marginBottom: '0.25rem' }}>
            Spaced Review Queue
          </div>
          {hasReview ? (
            <div style={{ fontWeight: 600, color: 'var(--desk-text)' }}>
              Due today: {plan.reviewChunkIds.map((c) => `-${c}`).join(', ')} ({reviewCount} verb family)
            </div>
          ) : (
            <div style={{ color: 'var(--desk-text-muted)', fontSize: '0.9375rem' }}>
              No review chunks currently due today.
            </div>
          )}
        </div>

        <div
          style={{
            padding: '0.875rem 1rem',
            background: '#fcfaf6',
            border: '1px solid #e5dfd2',
            borderRadius: '6px',
          }}
        >
          <div className="desk-label" style={{ marginBottom: '0.25rem' }}>
            Active Verb Family
          </div>
          {newChunk ? (
            <div style={{ fontWeight: 600, color: 'var(--desk-text)' }}>
              Working family: -{newChunk}
            </div>
          ) : (
            <div style={{ color: 'var(--desk-text-muted)', fontSize: '0.9375rem' }}>
              All core families introduced.
            </div>
          )}
        </div>
      </div>

      <div className="desk-btn-group">
        <button
          type="button"
          className="desk-btn desk-btn--primary"
          onClick={() => {
            console.log('Begin Session button clicked! typeof begin =', typeof begin)
            if (typeof begin === 'function') begin()
          }}
          autoFocus
        >
          Begin Session
        </button>
      </div>
    </div>
  )
}
