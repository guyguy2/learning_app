import React from 'react'
import './MisconceptionRepair.css'

/**
 * MisconceptionRepair - A presentational React component to render a named-misconception repair panel.
 *
 * @param {Object} props
 * @param {Object} props.misconception - The matched misconception (required)
 * @param {string} props.misconception.name - The name of the misconception
 * @param {string} props.misconception.explanation - The explanation of the misconception
 * @param {string} props.correctForm - The correct conjugation / meaning to re-show
 * @param {string} [props.notionalMachine] - Optional rule text/mental model to re-show
 * @param {Function} props.onRetry - "Try a similar one" button click handler
 */
export default function MisconceptionRepair({
  misconception,
  correctForm,
  notionalMachine,
  onRetry,
}) {
  if (!misconception || !misconception.name) {
    return null
  }

  return (
    <div className="misconception-repair-panel">
      <h3 className="misconception-title">
        Misconception: {misconception.name}
      </h3>
      <p className="misconception-explanation">{misconception.explanation}</p>
      
      <div className="misconception-correct-container">
        <div className="correct-form-row">
          <span className="correct-label">Correct: </span>
          <strong className="correct-value">{correctForm}</strong>
        </div>
        {notionalMachine && (
          <div className="notional-machine-container">
            <span className="notional-label">Rule / Mental Model:</span>
            <p className="notional-text">{notionalMachine}</p>
          </div>
        )}
      </div>

      <button className="retry-button" onClick={onRetry}>
        Try a similar one
      </button>
    </div>
  )
}
