import { useState } from 'react'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'

function normalize(text) {
  return text.trim().toLowerCase()
}

function feedbackClass(feedback) {
  if (!feedback) return ''
  return feedback === 'correct' ? 'feedback--success' : 'feedback--error'
}

function WorkedExample({ workedExample, onContinue }) {
  return (
    <div className="drill">
      <h1 className="drill__title">Worked example — I do</h1>
      <p className="notional-machine">{workedExample.notional_machine}</p>
      <table className="paradigm-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Form</th>
          </tr>
        </thead>
        <tbody>
          {workedExample.paradigm.map((row) => (
            <tr key={row.person}>
              <td>{row.person}</td>
              <td>{row.swap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="drill__actions">
        <button type="button" className="btn" onClick={onContinue}>
          Continue to guided practice
        </button>
      </div>
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
    <div className="drill">
      <h1 className="drill__title">{heading}</h1>
      <p className="drill__prompt">
        Conjugate <strong>{stimulus.verb.word}</strong> ({stimulus.verb.meaning}) for{' '}
        <strong>{stimulus.person}</strong>:
      </p>
      {stimulus.hint && <p className="drill__hint">Hint: {stimulus.hint}</p>}
      <form className="drill__form" onSubmit={submit}>
        <input
          className="input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter conjugated form"
          autoFocus
        />
        <div className="drill__actions">
          <button type="submit" className="btn">
            Submit
          </button>
        </div>
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
      {feedback && <p className={`feedback ${feedbackClass(feedback)}`}>{feedback}</p>}
    </div>
  )
}

export default ProductionScreen