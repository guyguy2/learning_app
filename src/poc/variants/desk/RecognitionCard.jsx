import { useState } from 'react'

export function normalize(text) {
  return (text || '').trim().toLowerCase()
}

export function acceptedMeanings(meaning) {
  return (meaning || '').split(/[;,]/).map(normalize).filter(Boolean)
}

/**
 * RecognitionCard
 * Vocabulary retrieval drill with large display serif word.
 * Tolerant grading across synonym delimiters (; or ,).
 */
export default function RecognitionCard({ stimulus, onSubmit }) {
  const [answer, setAnswer] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed) return

    const correct = acceptedMeanings(stimulus.word.meaning).includes(normalize(trimmed))
    onSubmit({
      type: 'recognition',
      wordId: stimulus.word.id,
      correct,
      given: trimmed,
      expectedMeaning: stimulus.word.meaning,
    })
    setAnswer('')
  }

  return (
    <div className="desk-card desk-card--slide">
      <div className="desk-label">Vocabulary Recognition</div>
      <p className="desk-prompt">What does this Spanish word mean in English?</p>

      <div className="desk-target-word">{stimulus.word.word}</div>
      <div className="desk-subtext">
        Part of speech: {stimulus.word.pos}
        {stimulus.word.family ? ` (${stimulus.word.family} family)` : ''}
      </div>

      <form className="desk-form" onSubmit={handleSubmit}>
        <input
          className="desk-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type English meaning and press Enter..."
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="desk-btn-group">
          <button type="submit" className="desk-btn desk-btn--primary">
            Submit Answer
          </button>
        </div>
      </form>
    </div>
  )
}
