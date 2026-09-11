import { useState } from 'react'
import { personLabel } from './personLabel.js'

function normalize(text) {
  return text.trim().toLowerCase()
}

/**
 * IndependentCard (You-Do)
 * Free recall drill with no hints.
 */
export default function IndependentCard({ stimulus, onSubmit }) {
  const [answer, setAnswer] = useState('')

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
      <div className="desk-label">Independent Recall (You-Do)</div>
      <p className="desk-prompt">
        Conjugate the verb for the requested person without assistance:
      </p>

      <div className="desk-target-word">{stimulus.verb.word}</div>
      <div className="desk-subtext">
        Meaning: {stimulus.verb.meaning} | Person: <strong>{personLabel(stimulus.person)}</strong>
      </div>

      <form className="desk-form" onSubmit={handleSubmit}>
        <input
          className="desk-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={`Enter conjugated form for ${personLabel(stimulus.person)}...`}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="desk-btn-group">
          <button type="submit" className="desk-btn desk-btn--primary">
            Submit Recall
          </button>
        </div>
      </form>
    </div>
  )
}
