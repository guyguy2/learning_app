import { useState } from 'react'
import StemEndingTile from './StemEndingTile.jsx'

function normalize(text) {
  return text.trim().toLowerCase()
}

/**
 * GuidedCard (We-Do)
 * Guided practice with stem slip and blank ending slip.
 * UI-only hint fading:
 * - Attempt 0: Person cue only
 * - Attempt 1+: Full stimulus hint
 */
export default function GuidedCard({ stimulus, attemptCount, onSubmit }) {
  const [answer, setAnswer] = useState('')

  const stem = stimulus.verb.word.slice(0, -stimulus.chunkId.length)

  // Derive hint based purely on attemptCount (UI-only fading)
  const hintText =
    attemptCount === 0
      ? `Person cue: target subject is "${stimulus.person}"`
      : stimulus.hint || `Stem: "${stem}-", ending for ${stimulus.person}`

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed) return

    const correct = normalize(trimmed) === normalize(stimulus.expectedForm)
    onSubmit({
      type: 'production',
      chunkId: stimulus.chunkId,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
      given: trimmed,
      expectedForm: stimulus.expectedForm,
    })
    setAnswer('')
  }

  return (
    <div className="desk-card desk-card--slide">
      <div className="desk-label">Guided Practice (We-Do)</div>
      <p className="desk-prompt">
        Conjugate <strong>{stimulus.verb.word}</strong> ({stimulus.verb.meaning}) for{' '}
        <strong>{stimulus.person}</strong>:
      </p>

      {/* Tactile Slips with Blank Ending */}
      <StemEndingTile
        stem={stem}
        ending=""
        family={stimulus.chunkId}
        isBlank={true}
      />

      {/* Faded Hint Callout */}
      <div className="desk-hint-box">
        <span className="desk-hint-box__label">
          {attemptCount === 0 ? 'Scaffold' : 'Detailed Rule'}:
        </span>
        <span>{hintText}</span>
      </div>

      <form className="desk-form" onSubmit={handleSubmit}>
        <input
          className="desk-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={`Enter conjugated form for ${stimulus.person}...`}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="desk-btn-group">
          <button type="submit" className="desk-btn desk-btn--primary">
            Submit Conjugation
          </button>
        </div>
      </form>
    </div>
  )
}
