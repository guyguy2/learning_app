import { useEffect, useState } from 'react'
import vocab from '../content/spanish/vocab.json'
import workedExamples from '../content/spanish/worked_examples.json'
import { applyProductionAttempt, getNextProductionStimulus } from './engine/conjugation.js'

const CHUNK_ID = 'ar'
const CONTENT = { vocab, workedExamples }

function normalize(text) {
  return text.trim().toLowerCase()
}

async function persist(progress) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
  return res.json()
}

function WorkedExample({ workedExample, onContinue }) {
  return (
    <div>
      <h1>Worked example — I do</h1>
      <p>{workedExample.notional_machine}</p>
      <table>
        <tbody>
          {workedExample.paradigm.map((row) => (
            <tr key={row.person}>
              <td>{row.person}</td>
              <td>{row.swap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onContinue}>Continue to guided practice</button>
    </div>
  )
}

function ProductionDrill({ stimulus, onSubmit }) {
  const [answer, setAnswer] = useState('')
  const heading = stimulus.phase === 'guided' ? 'Guided practice — we do' : 'Independent recall — you do'

  function submit(event) {
    event.preventDefault()
    onSubmit(answer)
    setAnswer('')
  }

  return (
    <div>
      <h1>{heading}</h1>
      <p>
        Conjugate <strong>{stimulus.verb.word}</strong> ({stimulus.verb.meaning}) for{' '}
        <strong>{stimulus.person}</strong>:
      </p>
      {stimulus.hint && <p>Hint: {stimulus.hint}</p>}
      <form onSubmit={submit}>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter conjugated form"
          autoFocus
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

function ProductionScreen() {
  const [progress, setProgress] = useState(null)
  const [stimulus, setStimulus] = useState(undefined)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then((loaded) => {
        setProgress(loaded)
        setStimulus(getNextProductionStimulus(loaded, CHUNK_ID, CONTENT))
      })
      .catch((err) => setError(err.message))
  }, [])

  async function handleAck() {
    const attempt = { type: 'production', chunkId: CHUNK_ID, action: 'worked_example_ack' }
    const { progress: newProgress, next } = applyProductionAttempt(progress, attempt, CONTENT)
    setProgress(await persist(newProgress))
    setStimulus(next)
  }

  async function handleDrillSubmit(answer) {
    const correct = normalize(answer) === normalize(stimulus.expectedForm)
    const attempt = {
      type: 'production',
      chunkId: CHUNK_ID,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
    }
    const { progress: newProgress, next } = applyProductionAttempt(progress, attempt, CONTENT)
    setProgress(await persist(newProgress))
    setStimulus(next)
    setFeedback(correct ? 'correct' : `incorrect — expected "${stimulus.expectedForm}"`)
  }

  if (error) return <p>Error: {error}</p>
  if (stimulus === undefined) return <p>Loading...</p>
  if (stimulus === null) return <p>No mastered -ar vocab yet — master some words via recognition first.</p>

  return (
    <div>
      {stimulus.phase === 'worked_example' ? (
        <WorkedExample workedExample={stimulus.workedExample} onContinue={handleAck} />
      ) : (
        <ProductionDrill stimulus={stimulus} onSubmit={handleDrillSubmit} />
      )}
      {feedback && <p>{feedback}</p>}
    </div>
  )
}

export default ProductionScreen
