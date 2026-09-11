import { useState } from 'react'
import TechniquePill from './TechniquePill.jsx'

export default function WorkedExampleView({ stimulus, onAttempt, isReview }) {
  const { workedExample, chunkId } = stimulus
  const paradigm = workedExample.paradigm || []
  const stem = workedExample.stem || (workedExample.infinitive ? workedExample.infinitive.slice(0, -chunkId.length) : '')

  const [revealedCount, setRevealedCount] = useState(1)
  const [reflection, setReflection] = useState('')

  const allRevealed = revealedCount >= paradigm.length

  function handleNextStep() {
    if (revealedCount < paradigm.length) {
      setRevealedCount((c) => c + 1)
    }
  }

  function handleContinue() {
    onAttempt({
      type: 'production',
      chunkId,
      action: 'worked_example_ack',
    })
  }

  return (
    <div className={`editorial-card family-${chunkId} editorial-drill-enter`}>
      <TechniquePill techniqueKey={isReview ? 'review' : 'production'} isReview={isReview} />

      <header className="editorial-card__header">
        <div className="editorial-card__kicker">Worked Example (I-Do)</div>
        <h1 className="editorial-card__title">
          The Notional Machine: -{chunkId} Verbs
        </h1>
        <p className="editorial-card__subtitle">
          {workedExample.notional_machine}
        </p>
      </header>

      <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
        <div className="editorial-tile editorial-tile--open">
          <span className="editorial-tile__stem">{stem}</span>
          <span className="editorial-tile__hairline" />
          <span className="editorial-tile__ending">-{chunkId}</span>
        </div>
      </div>

      <div className="editorial-worked-steps">
        {paradigm.slice(0, revealedCount).map((row, idx) => {
          const isLatest = idx === revealedCount - 1
          return (
            <div
              key={row.person}
              className={`editorial-paradigm-row ${isLatest ? 'editorial-paradigm-row--active' : ''}`}
            >
              <div className="editorial-paradigm-row__person">{row.person}</div>
              <div className="editorial-paradigm-row__tile">
                <span style={{ color: 'var(--editorial-ink)' }}>{stem}</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '1px',
                    height: '1em',
                    backgroundColor: 'var(--editorial-hairline-dark)',
                    margin: isLatest ? '0 0.5rem' : '0 0.25rem',
                    verticalAlign: 'middle',
                    transition: 'margin 250ms ease-out',
                  }}
                />
                <span style={{ color: 'var(--active-accent)', fontWeight: 500 }}>
                  {row.ending}
                </span>
              </div>
              <div className="editorial-paradigm-row__form">{row.form}</div>
            </div>
          )
        })}
      </div>

      {!allRevealed ? (
        <div className="editorial-actions">
          <span className="editorial-hint-text">
            Step {revealedCount} of {paradigm.length}
          </span>
          <button
            type="button"
            className="editorial-btn-primary"
            onClick={handleNextStep}
          >
            Next step
          </button>
        </div>
      ) : (
        <div className="editorial-self-explain">
          <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)' }}>
            Self-Explanation
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginTop: '0.35rem' }}>
            Why does yo take -o?
          </div>
          <textarea
            className="editorial-textarea"
            placeholder="Explain the pattern in your own words (ungraded reflection)..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <div className="editorial-actions">
            <span className="editorial-hint-text">Reflective note</span>
            <button
              type="button"
              className="editorial-btn-primary"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
