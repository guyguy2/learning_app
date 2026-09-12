/**
 * Programming Desk UI: minimal cards for the two exercise types, built from the shared
 * Desk card styles. Components are module-level so React keeps their identity.
 */
import { useState } from 'react'
import DeskTechniqueBadge from '../../desk/DeskTechniqueBadge.jsx'
import programming from './index.js'

function CodeBlock({ code }) {
  return (
    <pre className="desk-code">
      <code>{code}</code>
    </pre>
  )
}

/** Shared answer form: grades with the subject's grade() before submitting. */
function AnswerForm({ stimulus, type, placeholder, buttonLabel, onSubmit }) {
  const [answer, setAnswer] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed) return
    const attempt = {
      type,
      chunkId: stimulus.chunkId,
      itemId: stimulus.item.id,
      given: trimmed,
    }
    onSubmit({ ...attempt, correct: programming.exercises[type].grade(attempt, stimulus) })
    setAnswer('')
  }

  return (
    <form className="desk-form" onSubmit={handleSubmit}>
      <input
        className="desk-input"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={placeholder}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
      <div className="desk-btn-group">
        <button type="submit" className="desk-btn desk-btn--primary">
          {buttonLabel} <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </form>
  )
}

function RecognitionDrill({ stimulus, onSubmit, technique }) {
  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">Trace the Code</div>
      <p className="desk-prompt">{stimulus.item.prompt}</p>
      <CodeBlock code={stimulus.item.code} />
      <AnswerForm
        stimulus={stimulus}
        type="recognition"
        placeholder="Type what it logs and press Enter..."
        buttonLabel="Submit Answer"
        onSubmit={onSubmit}
      />
    </div>
  )
}

function ProgrammingRecognitionCard(props) {
  return <RecognitionDrill key={props.stimulus.item.id} {...props} />
}

function WorkedExampleView({ stimulus, onSubmit, technique }) {
  const { workedExample, chunkId } = stimulus
  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">Worked Example (I-Do)</div>
      <h1 className="desk-title">{workedExample.title}</h1>
      <p className="desk-prompt">{workedExample.notional_machine}</p>
      <CodeBlock code={workedExample.code} />
      <ol className="desk-worked-steps">
        {workedExample.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="desk-btn-group">
        <button
          type="button"
          className="desk-btn desk-btn--primary"
          onClick={() => onSubmit({ type: 'completion', chunkId, action: 'worked_example_ack' })}
          autoFocus
        >
          Continue to Guided Practice <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}

function CompletionDrill({ stimulus, onSubmit, technique }) {
  const guided = stimulus.phase === 'guided'
  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">{guided ? 'Guided Practice (We-Do)' : 'Independent Recall (You-Do)'}</div>
      <p className="desk-prompt">{stimulus.item.prompt}</p>
      <CodeBlock code={stimulus.item.code} />
      {guided && stimulus.hint && (
        <div className="desk-hint-box">
          <span className="desk-hint-box__label">Hint:</span>
          <span>{stimulus.hint}</span>
        </div>
      )}
      <AnswerForm
        stimulus={stimulus}
        type="completion"
        placeholder="Type the code for the blank and press Enter..."
        buttonLabel="Submit Code"
        onSubmit={onSubmit}
      />
    </div>
  )
}

/** Completion fades worked example (I-do) -> guided (We-do) -> independent (You-do). */
function ProgrammingCompletionCard(props) {
  const { stimulus } = props
  if (stimulus.phase === 'worked_example') {
    return <WorkedExampleView key={`we-${stimulus.chunkId}`} {...props} />
  }
  return <CompletionDrill key={`${stimulus.phase}-${stimulus.item.id}`} {...props} />
}

/** Named misconception: re-show the mental model, strike the wrong answer, show the right one. */
function CodeContrastDetail({ repair, lastAttempt }) {
  return (
    <div className="desk-notional-machine-box">
      <div className="desk-notional-machine-title">Notional Machine Correction:</div>
      {typeof repair.notionalMachine === 'string' && (
        <p className="desk-notional-machine-text" style={{ marginBottom: '1rem' }}>
          {repair.notionalMachine}
        </p>
      )}
      <div style={{ fontSize: '1.125rem', margin: '0.5rem 0', fontFamily: 'ui-monospace, monospace' }}>
        <del style={{ color: '#b91c1c', marginRight: '0.75rem' }}>{lastAttempt?.given}</del>
        <span style={{ color: 'var(--feedback-green)', fontWeight: 700 }}>{repair.correctForm}</span>
      </div>
    </div>
  )
}

const CHUNK_COLORS = {
  closures: 'var(--family-ar)',
  iteration: 'var(--family-er)',
  'off-by-one': 'var(--family-ir)',
}

/** @type {import('../contract.js').SubjectUi} */
const programmingUi = {
  cards: {
    recognition: ProgrammingRecognitionCard,
    completion: ProgrammingCompletionCard,
  },
  repairDetails: {
    recognition: CodeContrastDetail,
    completion: CodeContrastDetail,
  },
  chunkColor: (chunkId) => CHUNK_COLORS[chunkId],
  copy: {
    startIntro:
      'Review consolidated concepts, then trace and complete short JavaScript programs through retrieval practice.',
    reviewUnit: 'concept',
    activeChunkHeading: 'Active Concept',
    workingChunk: 'Working concept',
    allChunksIntroduced: 'All concepts introduced.',
    summaryIntro: 'Your spaced repetitions and code mental models are saved.',
    reviewedLabel: 'Concepts Reviewed',
    ladderSuffix: 'Ladder',
    missExplanation: 'Compare your answer with the expected one before trying the next drill.',
    missFallbackAnswer: 'Review the expected answer',
  },
}

export default programmingUi
