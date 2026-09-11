import { useState } from 'react'
import TechniquePill from './TechniquePill.jsx'

function normalize(text) {
  return text.trim().toLowerCase()
}

function acceptedMeanings(meaning) {
  return meaning.split(/[;,]/).map(normalize).filter(Boolean)
}

export default function RecognitionDrill({
  stimulus,
  onAttempt,
  feedback,
  isReview,
  mentalModelAligned,
}) {
  const [input, setInput] = useState('')
  const family = stimulus.word.family || 'ar'

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return

    const correct = acceptedMeanings(stimulus.word.meaning).includes(normalize(input))
    onAttempt({
      type: 'recognition',
      wordId: stimulus.word.id,
      correct,
      given: input,
    })
    setInput('')
  }

  return (
    <div className={`editorial-card family-${family} editorial-drill-enter`}>
      <TechniquePill techniqueKey={isReview ? 'review' : 'recognition'} isReview={isReview} />

      <header className="editorial-card__header">
        <div className="editorial-card__kicker">Vocabulary Retrieval</div>
        <h1 className="editorial-card__title">Translate to English</h1>
        <p className="editorial-card__subtitle">
          Retrieve the meaning from memory without looking at notes.
        </p>
      </header>

      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <div className="editorial-target-word">
          {stimulus.word.word}
        </div>
      </div>

      <form className="editorial-form" onSubmit={handleSubmit}>
        <div className="editorial-input-group">
          <input
            type="text"
            className="editorial-input"
            placeholder="Type English translation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            aria-label="English meaning"
          />
        </div>

        <div className="editorial-actions">
          <span className="editorial-hint-text">Press Enter to commit</span>
          <button type="submit" className="editorial-btn-primary">
            Submit
          </button>
        </div>
      </form>

      {feedback === 'correct' && (
        <div className="editorial-feedback-strip editorial-feedback-strip--correct">
          Correct: {stimulus.word.meaning}
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
