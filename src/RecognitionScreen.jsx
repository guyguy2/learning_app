import { useState } from 'react'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'

function normalize(text) {
  return text.trim().toLowerCase()
}

function RecognitionScreen({ stimulus, onAttempt, feedback }) {
  const [answer, setAnswer] = useState('')

  function submitAnswer(event) {
    event.preventDefault()
    const correct = normalize(answer) === normalize(stimulus.word.meaning)
    onAttempt({ type: 'recognition', wordId: stimulus.word.id, correct, given: answer })
    setAnswer('')
  }

  return (
    <div>
      <TechniqueBadge {...techniqueFor('recognition')} />
      <h1>Recognition</h1>
      <p>What does this word mean?</p>
      <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{stimulus.word.word}</p>
      <form onSubmit={submitAnswer}>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter meaning"
          autoFocus
        />
        <button type="submit">Submit</button>
      </form>
      {feedback && <p>{feedback}</p>}
    </div>
  )
}

export default RecognitionScreen
