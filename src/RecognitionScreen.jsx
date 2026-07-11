import { useEffect, useState } from 'react'
import vocab from '../content/spanish/vocab.json'
import { applyAttempt, getNextStimulus } from './engine/wordMastery.js'

function normalize(text) {
  return text.trim().toLowerCase()
}

function RecognitionScreen() {
  const [progress, setProgress] = useState(null)
  const [stimulus, setStimulus] = useState(undefined)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then((loaded) => {
        setProgress(loaded)
        setStimulus(getNextStimulus(loaded, vocab))
      })
      .catch((err) => setError(err.message))
  }, [])

  async function submitAnswer(event) {
    event.preventDefault()
    const correct = normalize(answer) === normalize(stimulus.word.meaning)

    const attempt = { type: 'recognition', wordId: stimulus.word.id, correct }
    const { progress: newProgress, next } = applyAttempt(progress, attempt, vocab)

    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProgress),
    })
    setProgress(await res.json())
    setStimulus(next)
    setAnswer('')
    setFeedback(correct ? 'correct' : `incorrect — "${stimulus.word.word}" means "${stimulus.word.meaning}"`)
  }

  if (error) return <p>Error: {error}</p>
  if (stimulus === undefined) return <p>Loading...</p>
  if (stimulus === null) return <p>All words mastered.</p>

  return (
    <div>
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
