import { useState } from 'react'
import TechniquePill from './TechniquePill.jsx'

function normalize(text) {
  return text.trim().toLowerCase()
}

const PERSON_LABELS = {
  yo: 'yo',
  tu: 'tú',
  el_ella_usted: 'él / ella / usted',
  nosotros: 'nosotros / nosotras',
  vosotros: 'vosotros / vosotras',
  ellos_ellas_ustedes: 'ellos / ellas / ustedes',
}

export default function ProductionDrill({
  stimulus,
  attemptCount,
  onAttempt,
  feedback,
  isReview,
  mentalModelAligned,
}) {
  const [input, setInput] = useState('')
  const { chunkId, verb, person, phase, expectedForm, hint } = stimulus
  const isGuided = phase === 'guided'
  const personDisplay = PERSON_LABELS[person] || person
  const stem = verb.word.slice(0, -chunkId.length)

  // Derive faded hint strictly in UI
  let displayHint = null
  if (isGuided) {
    if (attemptCount === 0) {
      displayHint = `Ending for ${personDisplay}`
    } else {
      displayHint = hint
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return

    const correct = normalize(input) === normalize(expectedForm)
    onAttempt({
      type: 'production',
      chunkId,
      wordId: verb.id,
      person,
      correct,
      given: input,
    })
    setInput('')
  }

  return (
    <div className={`editorial-card family-${chunkId} editorial-drill-enter`}>
      <TechniquePill techniqueKey={isReview ? 'review' : 'production'} isReview={isReview} />

      <header className="editorial-card__header">
        <div className="editorial-card__kicker">
          {isGuided ? 'Guided Practice (We-Do)' : 'Independent Recall (You-Do)'}
        </div>
        <h1 className="editorial-card__title">
          Conjugate {verb.word}
        </h1>
        <p className="editorial-card__subtitle">
          Subject: <strong>{personDisplay}</strong> ({verb.meaning})
        </p>
      </header>

      {isGuided && (
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <div className="editorial-tile">
            <span className="editorial-tile__stem">{stem}</span>
            <span className="editorial-tile__hairline" />
            <span className="editorial-tile__ending editorial-tile__ending--blank">
              __
            </span>
          </div>
        </div>
      )}

      <form className="editorial-form" onSubmit={handleSubmit}>
        <div className="editorial-input-group">
          <input
            type="text"
            className="editorial-input"
            placeholder={`Conjugate for ${personDisplay}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            aria-label="Conjugated form"
          />
        </div>

        <div className="editorial-actions">
          <span className="editorial-hint-text">
            {displayHint ? `Hint: ${displayHint}` : 'Press Enter to commit'}
          </span>
          <button type="submit" className="editorial-btn-primary">
            Submit
          </button>
        </div>
      </form>

      {feedback === 'correct' && (
        <div className="editorial-feedback-strip editorial-feedback-strip--correct">
          Correct: {expectedForm}
          {mentalModelAligned && (
            <span className="editorial-aligned-pill">Mental model aligned</span>
          )}
        </div>
      )}

      {feedback && feedback !== 'correct' && (
        <div className="editorial-feedback-strip editorial-feedback-strip--warning">
          {feedback}
        </div>
      )}
    </div>
  )
}
