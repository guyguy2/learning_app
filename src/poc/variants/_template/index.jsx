import { useState } from 'react'
import { useSessionRunner } from '../../useSessionRunner.js'
import './template.css'

function normalize(text) {
  return text.trim().toLowerCase()
}

function acceptedMeanings(meaning) {
  return meaning.split(/[;,]/).map(normalize).filter(Boolean)
}

function TemplateVariant() {
  const runner = useSessionRunner({ autoStart: true })
  const {
    status,
    error,
    today,
    progress,
    plan,
    begin,
    mode,
    exerciseType,
    stimulus,
    feedback,
    repair,
    reviewQueue,
    reviewedCount,
    masteredChunkId,
    attemptCount,
    onAttempt,
    onRetry,
    onStartNext,
  } = runner

  const [customInput, setCustomInput] = useState('')
  const [tagInputs, setTagInputs] = useState({ subject: '', stem: '', ending: '', object: '' })

  return (
    <div className="variant-_template">
      <div className="template-header">
        <h2>Template (raw)</h2>
        <p>Raw state inspector and attempt trigger scaffold for variant developers</p>
      </div>

      <div className="template-panel">
        <h3>Status & Session Controls</h3>
        <p>
          <strong>Status:</strong> {status} | <strong>Mode:</strong> {mode || 'none'} |{' '}
          <strong>Exercise:</strong> {exerciseType || 'none'} | <strong>Attempts on current:</strong>{' '}
          {attemptCount}
        </p>

        {status === 'ready' && (
          <div className="btn-group">
            <button type="button" className="btn-action btn-action--primary" onClick={begin}>
              Begin Session (autoStart=false)
            </button>
          </div>
        )}

        {status === 'summary' && (
          <div>
            <p>
              Session Complete! Reviewed: {reviewedCount}. Mastered chunk:{' '}
              {masteredChunkId || 'none'}.
            </p>
            <div className="btn-group">
              <button type="button" className="btn-action btn-action--primary" onClick={onStartNext}>
                Start Next Session
              </button>
            </div>
          </div>
        )}

        {status === 'error' && <p style={{ color: 'var(--error)' }}>Error: {error}</p>}
      </div>

      {repair && (
        <div className="template-panel" style={{ borderColor: 'var(--error, #dc2626)' }}>
          <h3 style={{ color: 'var(--error, #dc2626)' }}>
            Repair Active:{' '}
            {repair.misconception ? repair.misconception.name : 'Incorrect Answer'}
          </h3>
          {repair.misconception && <p>{repair.misconception.explanation}</p>}
          {repair.correctForm && (
            <p>
              <strong>Correct form:</strong> {repair.correctForm}
            </p>
          )}
          {repair.notionalMachine && (
            <p>
              <strong>Notional machine:</strong> {repair.notionalMachine}
            </p>
          )}
          <div className="btn-group">
            <button type="button" className="btn-action btn-action--primary" onClick={onRetry}>
              Retry (onRetry)
            </button>
          </div>
        </div>
      )}

      {status === 'running' && stimulus && !repair && (
        <div className="template-panel">
          <h3>Interactive Exercise: {exerciseType}</h3>
          {feedback && <p><strong>Feedback:</strong> {feedback}</p>}

          {exerciseType === 'recognition' && (
            <div>
              <p>
                Translate: <strong>{stimulus.word.word}</strong> (expected: {stimulus.word.meaning})
              </p>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  onClick={() =>
                    onAttempt({
                      type: 'recognition',
                      wordId: stimulus.word.id,
                      correct: true,
                      given: stimulus.word.meaning,
                    })
                  }
                >
                  Quick: Submit Correct
                </button>
                <button
                  type="button"
                  className="btn-action btn-action--danger"
                  onClick={() =>
                    onAttempt({
                      type: 'recognition',
                      wordId: stimulus.word.id,
                      correct: false,
                      given: 'wrong-guess',
                    })
                  }
                >
                  Quick: Submit Incorrect
                </button>
                {stimulus.word.id === 'embarazada' && (
                  <button
                    type="button"
                    className="btn-action btn-action--danger"
                    onClick={() =>
                      onAttempt({
                        type: 'recognition',
                        wordId: stimulus.word.id,
                        correct: false,
                        given: 'embarrassed',
                      })
                    }
                  >
                    Quick: Submit False Cognate Misconception
                  </button>
                )}
              </div>

              <form
                className="template-form-row"
                onSubmit={(e) => {
                  e.preventDefault()
                  const correct = acceptedMeanings(stimulus.word.meaning).includes(normalize(customInput))
                  onAttempt({
                    type: 'recognition',
                    wordId: stimulus.word.id,
                    correct,
                    given: customInput,
                  })
                  setCustomInput('')
                }}
              >
                <input
                  className="template-input"
                  placeholder="Type meaning..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
                <button type="submit" className="btn-action">
                  Submit Typed Answer
                </button>
              </form>
            </div>
          )}

          {exerciseType === 'production' && (
            <div>
              {stimulus.phase === 'worked_example' ? (
                <div>
                  <p>
                    <strong>Worked Example:</strong> {stimulus.workedExample.family}
                  </p>
                  <p>{stimulus.workedExample.notional_machine}</p>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn-action btn-action--primary"
                      onClick={() =>
                        onAttempt({
                          type: 'production',
                          chunkId: stimulus.chunkId,
                          action: 'worked_example_ack',
                        })
                      }
                    >
                      Acknowledge Worked Example
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p>
                    Phase: <strong>{stimulus.phase}</strong> | Verb:{' '}
                    <strong>{stimulus.verb.word}</strong> for person:{' '}
                    <strong>{stimulus.person}</strong> (Expected:{' '}
                    <strong>{stimulus.expectedForm}</strong>)
                  </p>
                  {stimulus.hint && <p><em>Hint: {stimulus.hint}</em></p>}
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn-action btn-action--primary"
                      onClick={() =>
                        onAttempt({
                          type: 'production',
                          chunkId: stimulus.chunkId,
                          wordId: stimulus.verb.id,
                          person: stimulus.person,
                          correct: true,
                          given: stimulus.expectedForm,
                        })
                      }
                    >
                      Quick: Submit Correct ({stimulus.expectedForm})
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-action--danger"
                      onClick={() =>
                        onAttempt({
                          type: 'production',
                          chunkId: stimulus.chunkId,
                          wordId: stimulus.verb.id,
                          person: stimulus.person,
                          correct: false,
                          given: 'wrong-conjugation',
                        })
                      }
                    >
                      Quick: Submit Incorrect
                    </button>
                  </div>

                  <form
                    className="template-form-row"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const correct = normalize(customInput) === normalize(stimulus.expectedForm)
                      onAttempt({
                        type: 'production',
                        chunkId: stimulus.chunkId,
                        wordId: stimulus.verb.id,
                        person: stimulus.person,
                        correct,
                        given: customInput,
                      })
                      setCustomInput('')
                    }}
                  >
                    <input
                      className="template-input"
                      placeholder="Conjugate..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                    />
                    <button type="submit" className="btn-action">
                      Submit Typed Conjugation
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {exerciseType === 'role-tagging' && (
            <div>
              <p>
                Sentence: <strong>{stimulus.sentence}</strong>
              </p>
              <p>
                Expected: subject="{stimulus.parts.subject}", stem="{stimulus.parts.stem}", ending="
                {stimulus.parts.ending}", object="{stimulus.parts.object}"
              </p>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  onClick={() =>
                    onAttempt({
                      type: 'role-tagging',
                      chunkId: stimulus.chunkId,
                      wordId: stimulus.verb.id,
                      person: stimulus.person,
                      correct: true,
                      given: { ...stimulus.parts },
                    })
                  }
                >
                  Quick: Submit Correct Tags
                </button>
                <button
                  type="button"
                  className="btn-action btn-action--danger"
                  onClick={() =>
                    onAttempt({
                      type: 'role-tagging',
                      chunkId: stimulus.chunkId,
                      wordId: stimulus.verb.id,
                      person: stimulus.person,
                      correct: false,
                      given: { subject: '', stem: '', ending: '', object: '' },
                    })
                  }
                >
                  Quick: Submit Incorrect Tags
                </button>
              </div>

              <form
                style={{ marginTop: '0.75rem' }}
                onSubmit={(e) => {
                  e.preventDefault()
                  const correct = ['subject', 'stem', 'ending', 'object'].every(
                    (r) => normalize(tagInputs[r]) === normalize(stimulus.parts[r]),
                  )
                  onAttempt({
                    type: 'role-tagging',
                    chunkId: stimulus.chunkId,
                    wordId: stimulus.verb.id,
                    person: stimulus.person,
                    correct,
                    given: { ...tagInputs },
                  })
                  setTagInputs({ subject: '', stem: '', ending: '', object: '' })
                }}
              >
                {['subject', 'stem', 'ending', 'object'].map((role) => (
                  <div key={role} className="template-form-row">
                    <label style={{ width: '5rem' }}>{role}:</label>
                    <input
                      className="template-input"
                      value={tagInputs[role]}
                      onChange={(e) => setTagInputs({ ...tagInputs, [role]: e.target.value })}
                    />
                  </div>
                ))}
                <div style={{ marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-action">
                    Submit Role Tags
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="template-panel">
        <h3>Raw Runner State (JSON)</h3>
        <pre className="template-json-viewer">
          {JSON.stringify(
            {
              status,
              mode,
              exerciseType,
              attemptCount,
              feedback,
              repair,
              stimulus,
              plan,
              reviewQueue,
              reviewedCount,
              masteredChunkId,
              today,
              progress,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  )
}

export default {
  id: '_template',
  name: 'Template (raw)',
  description: 'Raw runner state inspector with test controls for all exercise types',
  Component: TemplateVariant,
}
