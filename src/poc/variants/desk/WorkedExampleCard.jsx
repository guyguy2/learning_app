import { useState } from 'react'
import StemEndingTile from './StemEndingTile.jsx'

/**
 * WorkedExampleCard
 * Visualizes the notional machine through stepwise paradigm reveal,
 * animated stem-plus-ending tile swaps, and an ungraded self-explanation reflection.
 */
export default function WorkedExampleCard({ stimulus, onAcknowledge }) {
  const { workedExample, chunkId } = stimulus
  const paradigm = workedExample?.paradigm || []

  // Step 0: Joined infinitive slips
  // Steps 1 to 6: Reveal row (step - 1)
  const [step, setStep] = useState(0)
  const [reflection, setReflection] = useState('')

  const isCompleted = step >= paradigm.length

  // Current active ending and person
  const currentEnding = step === 0 ? workedExample?.infinitive_ending || chunkId : paradigm[step - 1]?.ending
  const currentPerson = step === 0 ? 'Infinitive' : paradigm[step - 1]?.person

  function handleNextStep() {
    if (step < paradigm.length) {
      setStep((s) => s + 1)
    }
  }

  function handleContinue() {
    onAcknowledge({
      type: 'production',
      chunkId,
      action: 'worked_example_ack',
    })
  }

  return (
    <div className="desk-card desk-card--slide">
      <div className="desk-label">Worked Example (I-Do)</div>
      <h1 className="desk-title">The Notional Machine: -{chunkId} Verbs</h1>
      <p className="desk-prompt">{workedExample?.notional_machine}</p>

      {/* Visual Slips */}
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--desk-text-muted)', marginBottom: '0.25rem' }}>
          Current person: <strong>{currentPerson}</strong>
        </div>
        <StemEndingTile
          stem={workedExample?.stem}
          ending={currentEnding}
          family={chunkId}
          isJoined={step === 0}
          isAnimated={step > 0}
        />
      </div>

      {/* Paradigm rows revealed one by one */}
      {step > 0 && (
        <ul className="desk-paradigm-list">
          {paradigm.slice(0, step).map((row, idx) => (
            <li
              key={row.person}
              className={`desk-paradigm-item ${idx === step - 1 ? 'desk-paradigm-item--active' : ''}`}
            >
              <span className="desk-paradigm-person">{row.person}</span>
              <span className="desk-paradigm-swap">{row.swap}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Controls */}
      {!isCompleted ? (
        <div className="desk-btn-group">
          <button
            type="button"
            className="desk-btn desk-btn--primary"
            onClick={handleNextStep}
            autoFocus
          >
            Next step ({step + 1} of {paradigm.length})
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--desk-border)', paddingTop: '1.25rem' }}>
          <div className="desk-label">Germane Reflection</div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.375rem' }}>
            Why does yo take -o?
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--desk-text-muted)', margin: '0 0 0.5rem' }}>
            Explain in your own words how the person ending signals who is performing the action.
          </p>
          <textarea
            className="desk-textarea"
            rows={3}
            placeholder="Write your explanation here (ungraded reflection)..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            autoFocus
          />
          <div className="desk-btn-group">
            <button
              type="button"
              className="desk-btn desk-btn--primary"
              onClick={handleContinue}
            >
              Continue to Guided Practice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
