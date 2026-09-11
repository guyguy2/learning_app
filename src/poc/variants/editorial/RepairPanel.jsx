import TechniquePill from './TechniquePill.jsx'

export default function RepairPanel({ repair, lastAttempt, onRetry, isReview }) {
  const { misconception, correctForm, notionalMachine, pendingType } = repair
  const family = lastAttempt?.chunkId || 'ar'

  // Helper to extract stem and endings for production strikethrough comparison
  let wrongEnding = null
  let rightEnding = null
  let stem = null

  if (pendingType === 'production' && lastAttempt?.given && correctForm) {
    // Find common prefix as stem
    let i = 0
    while (
      i < lastAttempt.given.length &&
      i < correctForm.length &&
      lastAttempt.given[i].toLowerCase() === correctForm[i].toLowerCase()
    ) {
      i++
    }
    stem = correctForm.slice(0, i)
    wrongEnding = lastAttempt.given.slice(i)
    rightEnding = correctForm.slice(i)
  }

  return (
    <div className={`editorial-card family-${family} editorial-drill-enter`}>
      <TechniquePill techniqueKey="repair" isReview={isReview} />

      <div className="editorial-repair-panel">
        {misconception ? (
          <div>
            <div className="editorial-card__kicker">Misconception Diagnosed</div>
            <h2 className="editorial-repair-title">{misconception.name}</h2>
            <p className="editorial-repair-explanation">{misconception.explanation}</p>

            {pendingType === 'production' && (
              <div style={{ margin: '1.75rem 0' }}>
                <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)', marginBottom: '0.5rem' }}>
                  Notional Machine Model
                </div>
                <div className="editorial-tile">
                  <span className="editorial-tile__stem">{stem}</span>
                  <span className="editorial-tile__hairline" />
                  <span className="editorial-struck-through">
                    {wrongEnding ? `-${wrongEnding}` : lastAttempt?.given}
                  </span>
                  <span className="editorial-correct-replacement">
                    {rightEnding ? `-${rightEnding}` : correctForm}
                  </span>
                </div>
                {notionalMachine && (
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--editorial-ink-muted)', marginTop: '0.5rem' }}>
                    {notionalMachine}
                  </p>
                )}
              </div>
            )}

            {pendingType === 'recognition' && (
              <div style={{ margin: '1.75rem 0' }}>
                <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)', marginBottom: '0.5rem' }}>
                  False Friend Contrast
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0.5rem 0' }}>
                  <del className="editorial-struck-through">{lastAttempt?.given}</del>
                  <span className="editorial-correct-replacement">{correctForm}</span>
                </div>
              </div>
            )}

            <div className="editorial-actions" style={{ marginTop: '2rem' }}>
              <span className="editorial-hint-text">Re-align mental model</span>
              <button
                type="button"
                className="editorial-btn-primary"
                onClick={onRetry}
              >
                Try a similar one
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="editorial-card__kicker">Review Form</div>
            <h2 className="editorial-repair-title" style={{ color: 'var(--editorial-ink)' }}>
              Incorrect Answer
            </h2>
            <p className="editorial-repair-explanation">
              The expected form was{' '}
              <strong style={{ color: 'var(--editorial-correct)' }}>{correctForm}</strong>.
              Take a moment to absorb the form before retrying.
            </p>

            <div className="editorial-actions" style={{ marginTop: '2rem' }}>
              <span className="editorial-hint-text">Clear and retry</span>
              <button
                type="button"
                className="editorial-btn-primary"
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
