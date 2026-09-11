import React from 'react'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'

/**
 * SessionStartCard
 * Shown when status is 'ready' (autoStart: false).
 * Summarizes review queue and upcoming new chunk before the session begins.
 */
export default function SessionStartCard({ plan, begin, technique }) {
  const reviewCount = plan?.reviewChunkIds?.length ?? 0
  const hasReview = reviewCount > 0
  const newChunk = plan?.newChunkId

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (typeof begin === 'function') begin()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [begin])

  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">Session Overview</div>
      <h1 className="desk-title">Daily Study Session</h1>
      <p className="desk-prompt">
        Review consolidated verbs and construct new grammatical schemas through retrieval practice.
      </p>

      <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            padding: '0.875rem 1rem',
            background: 'var(--desk-surface)',
            border: '1px solid var(--desk-border)',
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
            background: 'var(--desk-surface)',
            border: '1px solid var(--desk-border)',
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
            if (typeof begin === 'function') begin()
          }}
          autoFocus
        >
          Begin Session <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}
