import { useState } from 'react'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'

function normalize(text) {
  return text.trim().toLowerCase()
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

function ProductionScreen({ stimulus, onAttempt, feedback }) {
  function handleAck() {
    onAttempt({ type: 'production', chunkId: stimulus.chunkId, action: 'worked_example_ack' })
  }

  function handleDrillSubmit(answer) {
    const correct = normalize(answer) === normalize(stimulus.expectedForm)
    onAttempt({
      type: 'production',
      chunkId: stimulus.chunkId,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
      given: answer,
    })
  }

  return (
    <div>
      <TechniqueBadge {...techniqueFor('production')} />
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
