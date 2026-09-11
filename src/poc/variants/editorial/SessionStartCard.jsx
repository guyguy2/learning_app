import TechniquePill from './TechniquePill.jsx'

export default function SessionStartCard({ plan, begin }) {
  const reviewChunkIds = plan?.reviewChunkIds ?? []
  const newChunkId = plan?.newChunkId ?? null
  const activeFamily = newChunkId || reviewChunkIds[0] || 'ar'

  const techniqueKey = plan?.phase === 'review' ? 'review' : 'production'

  return (
    <div className={`editorial-card family-${activeFamily} editorial-drill-enter`}>
      <TechniquePill techniqueKey={techniqueKey} isReview={plan?.phase === 'review'} />

      <header className="editorial-card__header">
        <div className="editorial-card__kicker">Session Overview</div>
        <h1 className="editorial-card__title">Ready to Study</h1>
        <p className="editorial-card__subtitle">
          A calm session structured for long-term retention.
        </p>
      </header>

      <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ borderBottom: '1px solid var(--editorial-hairline)', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)' }}>
            Due for Spaced Review
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginTop: '0.35rem' }}>
            {reviewChunkIds.length > 0
              ? reviewChunkIds.map((id) => `-${id} verb family`).join(', ')
              : 'No items due for review'}
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--editorial-hairline)', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)' }}>
            Current Focus Family
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginTop: '0.35rem' }}>
            {newChunkId ? `-${newChunkId} verb family` : 'Review only'}
          </div>
        </div>
      </div>

      <div className="editorial-actions">
        <button
          type="button"
          className="editorial-btn-primary"
          onClick={begin}
        >
          Begin Session
        </button>
      </div>
    </div>
  )
}
