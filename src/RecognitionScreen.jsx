import { useState } from 'react'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'

export function normalize(text) {
  return text.trim().toLowerCase()
}

export function acceptedMeanings(meaning) {
  return meaning.split(/[;,]/).map(normalize).filter(Boolean)
}

function feedbackClass(feedback) {
  if (!feedback) return ''
  return feedback === 'correct' ? 'feedback--success' : 'feedback--error'
}

function RecognitionScreen({ stimulus, onAttempt, feedback }) {
  const [answer, setAnswer] = useState('')

  function submitAnswer(event) {
    event.preventDefault()
    const correct = acceptedMeanings(stimulus.word.meaning).includes(normalize(answer))
    onAttempt({ type: 'recognition', wordId: stimulus.word.id, correct, given: answer })
    setAnswer('')
  }

  return (
    <div>
      <TechniqueBadge {...techniqueFor('recognition')} />
      <div className="drill">
        <h1 className="drill__title">Recognition</h1>
        <p className="drill__prompt">What does this word mean?</p>
        <p className="drill__prompt-word">{stimulus.word.word}</p>
        <form className="drill__form" onSubmit={submitAnswer}>
          <input
            className="input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter meaning"
            autoFocus
          />
          <div className="drill__actions">
            <button type="submit" className="btn">
              Submit
            </button>
          </div>
        </form>
        {feedback && <p className={`feedback ${feedbackClass(feedback)}`}>{feedback}</p>}
      </div>
    </div>
  )
}

export default RecognitionScreen