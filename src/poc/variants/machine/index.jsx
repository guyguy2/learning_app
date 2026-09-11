import React, { useState, useEffect, useRef } from 'react'
import { useSessionRunner } from '../../useSessionRunner.js'
import { techniqueFor } from '../../../screenTechniques.js'
import StemEndingBlock from './StemEndingBlock.jsx'
import RoleTaggingDrill from './RoleTaggingDrill.jsx'
import SummaryLadder from './SummaryLadder.jsx'
import './machine.css'

export function normalize(text) {
  return (text || '').trim().toLowerCase()
}

export function acceptedMeanings(meaning) {
  if (!meaning) return []
  return meaning.split(/[;,]/).map(normalize).filter(Boolean)
}

export function displayPerson(person) {
  const map = {
    yo: 'yo (I)',
    tu: 'tú (you)',
    el_ella_usted: 'él / ella / usted (he / she / you-formal)',
    nosotros: 'nosotros / nosotras (we)',
    vosotros: 'vosotros / vosotras (you-all)',
    ellos_ellas_ustedes: 'ellos / ellas / ustedes (they / you-all)',
  }
  return map[person] || person
}

export function getFamily(chunkId) {
  if (!chunkId) return 'ar'
  if (chunkId.includes('ar')) return 'ar'
  if (chunkId.includes('er')) return 'er'
  if (chunkId.includes('ir')) return 'ir'
  return 'ar'
}

export function stemOf(verbWord, family) {
  if (!verbWord) return ''
  return verbWord.slice(0, -family.length)
}

function formatGiven(given) {
  if (given == null) return ''
  if (typeof given === 'string') return given
  if (typeof given === 'object') {
    if (given.subject || given.stem || given.ending || given.object) {
      return [given.subject, `${given.stem || ''}${given.ending || ''}`, given.object].filter(Boolean).join(' ')
    }
    return JSON.stringify(given)
  }
  return String(given)
}

function MachineVariant() {
  const runner = useSessionRunner({ autoStart: false })
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

  // Font injection - idempotent Google Fonts link for IBM Plex Sans & Mono
  useEffect(() => {
    const fontId = 'font-ibm-plex-machine'
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link')
      link.id = fontId
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  // Input states for various screens
  const [recognitionInput, setRecognitionInput] = useState('')
  const [guidedInput, setGuidedInput] = useState('')
  const [independentInput, setIndependentInput] = useState('')
  const guidedInputRef = useRef(null)

  // Worked example stepwise reveal state
  const [weStep, setWeStep] = useState(0) // 0 to 5 for rows, 6 for self-explanation
  const [weReflection, setWeReflection] = useState('')
  const [animatingSwap, setAnimatingSwap] = useState(false)
  const [animatingOldEnding, setAnimatingOldEnding] = useState(null)

  // Repair tracking and confirmation badge
  const [lastAttempt, setLastAttempt] = useState(null)
  const [inRetest, setInRetest] = useState(false)
  const [showModelAligned, setShowModelAligned] = useState(false)

  // Reset local inputs when stimulus changes
  useEffect(() => {
    setRecognitionInput('')
    setGuidedInput('')
    setIndependentInput('')
    setWeStep(0)
    setWeReflection('')
    setAnimatingSwap(false)
    setAnimatingOldEnding(null)
  }, [stimulus])

  // Track retest success: if inRetest was true and feedback is correct
  useEffect(() => {
    if (feedback === 'correct' && inRetest) {
      setShowModelAligned(true)
      setInRetest(false)
    }
  }, [feedback, inRetest])

  // Handle wrapped attempts to track lastAttempt and retest state
  function handleAttempt(payload) {
    setLastAttempt(payload)
    if (inRetest && payload.correct) {
      setShowModelAligned(true)
      setInRetest(false)
    } else if (!inRetest) {
      setShowModelAligned(false)
    }
    return onAttempt(payload)
  }

  function handleRetryClick() {
    setInRetest(true)
    setShowModelAligned(false)
    onRetry()
  }

  // Technique lookup
  const techniqueKey = repair
    ? 'repair'
    : mode === 'review'
    ? 'review'
    : exerciseType || (plan?.phase === 'review' ? 'review' : 'production')
  const activeTechnique = techniqueFor(techniqueKey)

  // Determine active family for colors
  const activeFamily = getFamily(stimulus?.chunkId || plan?.newChunkId || 'ar')

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      // If focus is in a textarea or input, let standard typing happen
      const tagName = e.target.tagName
      if (tagName === 'TEXTAREA') return

      if (status === 'ready' && e.key === 'Enter') {
        begin()
      } else if (repair && (e.key === 'Enter' || e.key === 't' || e.key === 'T')) {
        handleRetryClick()
      } else if (
        status === 'running' &&
        exerciseType === 'production' &&
        stimulus?.phase === 'worked_example'
      ) {
        if ((e.key === 'n' || e.key === 'N') && weStep < 6) {
          handleNextWeStep()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // Worked Example Next Step handler
  function handleNextWeStep() {
    const paradigm = stimulus?.workedExample?.paradigm || []
    if (weStep < paradigm.length - 1) {
      const currentEnding = paradigm[weStep]?.ending || 'ar'
      setAnimatingOldEnding(currentEnding)
      setAnimatingSwap(true)
      setWeStep((prev) => prev + 1)
      setTimeout(() => {
        setAnimatingSwap(false)
      }, 300)
    } else if (weStep === paradigm.length - 1) {
      setWeStep(paradigm.length) // advance to self-explanation reflection
    }
  }

  // Render Session Start Card
  if (status === 'ready') {
    const reviewChunkIds = plan?.reviewChunkIds || []
    const newChunkId = plan?.newChunkId

    return (
      <div className="variant-machine">
        <div className="machine-layout">
          <div className="machine-card">
            {activeTechnique && (
              <details className="machine-technique">
                <summary>
                  {activeTechnique.techniqueName}
                  <span className="machine-keycap">Info</span>
                </summary>
                <div className="machine-technique__body">{activeTechnique.explanation}</div>
              </details>
            )}

            <div className="machine-card__meta">
              <span className="machine-badge machine-badge--neutral">Laboratory Terminal</span>
              <span className="machine-badge machine-badge--ar">Session Ready</span>
            </div>

            <h2 className="machine-title">Session Initialization</h2>
            <p className="machine-prompt">Review session plan and launch laboratory practice.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ padding: '1rem', border: '2px solid var(--lab-border)', borderRadius: '4px', background: 'var(--lab-surface-alt)' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--lab-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Scheduled For Review
                </div>
                {reviewChunkIds.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {reviewChunkIds.map((cid) => (
                      <span key={cid} className={`machine-badge machine-badge--${getFamily(cid)}`}>
                        -{cid} family
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem', color: 'var(--lab-text-muted)' }}>
                    No chunks due for review.
                  </p>
                )}
              </div>

              <div style={{ padding: '1rem', border: '2px solid var(--lab-border)', borderRadius: '4px', background: 'var(--lab-surface-alt)' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--lab-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Target Family Up Next
                </div>
                {newChunkId ? (
                  <span className={`machine-badge machine-badge--${getFamily(newChunkId)}`}>
                    Regular -{newChunkId} verbs
                  </span>
                ) : (
                  <p style={{ margin: 0, fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.875rem', color: 'var(--lab-text-muted)' }}>
                    Review focus session.
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="machine-btn machine-btn--primary"
                onClick={begin}
                autoFocus
              >
                Begin Session
                <span className="machine-keycap">Enter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Summary Screen
  if (status === 'summary') {
    return (
      <div className="variant-machine">
        <div className="machine-layout">
          <div className="machine-card">
            {activeTechnique && (
              <details className="machine-technique">
                <summary>
                  {activeTechnique.techniqueName}
                  <span className="machine-keycap">Info</span>
                </summary>
                <div className="machine-technique__body">{activeTechnique.explanation}</div>
              </details>
            )}

            <SummaryLadder
              chunks={progress?.chunks || []}
              reviewedCount={reviewedCount}
              masteredChunkId={masteredChunkId}
              onStartNext={onStartNext}
              today={today}
            />
          </div>
        </div>
      </div>
    )
  }

  // Render Loading & Error screens
  if (status === 'loading') {
    return (
      <div className="variant-machine">
        <div className="machine-layout">
          <div className="machine-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '1.1rem', fontWeight: 600 }}>
              Loading Session Data...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="variant-machine">
        <div className="machine-layout">
          <div className="machine-card" style={{ borderColor: 'var(--feedback-error)' }}>
            <h2 className="machine-title" style={{ color: 'var(--feedback-error)' }}>
              Terminal Error
            </h2>
            <p style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Active Session Running
  return (
    <div className="variant-machine">
      <div className="machine-layout">
        {/* Quiet Spaced Review Indicator Banner */}
        {mode === 'review' && (
          <div className="machine-review-banner">
            <span>Spaced Review Mode: Strengthening Long-Term Retention</span>
            <span className="machine-badge machine-badge--neutral">Review Active</span>
          </div>
        )}

        {/* Misconception Repair Panel (Distinct Panel) */}
        {repair ? (
          <div className="machine-repair-panel">
            {activeTechnique && (
              <details className="machine-technique">
                <summary>
                  {activeTechnique.techniqueName}
                  <span className="machine-keycap">Info</span>
                </summary>
                <div className="machine-technique__body">{activeTechnique.explanation}</div>
              </details>
            )}

            <div className="machine-repair__header">
              <span className="machine-badge" style={{ color: 'var(--feedback-amber)', borderColor: 'var(--feedback-amber)', background: 'var(--feedback-amber-bg)' }}>
                Misconception Repair
              </span>
            </div>

            <h2 className="machine-repair__title">
              {repair.misconception ? repair.misconception.name : 'Incorrect Response'}
            </h2>

            <p className="machine-repair__explanation">
              {repair.misconception
                ? repair.misconception.explanation
                : repair.correctForm
                ? `Expected correct answer: "${repair.correctForm}". Review the model and try again.`
                : `Sentence parts mismatch. Expected: subject "${stimulus?.parts?.subject}", stem "${stimulus?.parts?.stem}", ending "${stimulus?.parts?.ending}", object "${stimulus?.parts?.object}".`}
            </p>

            {/* Visual Re-demonstration of the Notional Machine */}
            <div className="machine-repair__visual">
              {/* If production drill: show stem tile with wrong ending struck and correct ending sliding */}
              {repair.pendingType === 'production' && (
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', color: 'var(--lab-text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Notional Machine Correction:
                  </div>
                  <StemEndingBlock
                    stem={
                      stimulus?.verb?.word
                        ? stemOf(stimulus.verb.word, getFamily(stimulus.chunkId))
                        : (repair.correctForm || '').slice(0, -2)
                    }
                    ending={repair.correctForm}
                    family={activeFamily}
                    isRepair={true}
                    struckEnding={
                      typeof lastAttempt?.given === 'string' && lastAttempt.given
                        ? (lastAttempt.given.length > 2
                            ? lastAttempt.given.slice(
                                stemOf(stimulus?.verb?.word || '', getFamily(stimulus?.chunkId || 'ar')).length,
                              )
                            : lastAttempt.given)
                        : 'wrong'
                    }
                    correctEnding={
                      repair.correctForm
                        ? repair.correctForm.slice(
                            stemOf(stimulus?.verb?.word || '', getFamily(stimulus?.chunkId || 'ar')).length,
                          )
                        : ''
                    }
                  />
                </div>
              )}

              {/* If recognition drill: show target word with false-friend struck through */}
              {repair.pendingType === 'recognition' && (
                <div style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {stimulus?.word?.word || lastAttempt?.wordId}
                  </div>
                  <div style={{ fontSize: '1.1rem' }}>
                    {lastAttempt?.given && (
                      <span className="machine-tile__struck" style={{ marginRight: '1rem' }}>
                        "{formatGiven(lastAttempt.given)}"
                      </span>
                    )}
                    <span className="machine-tile__correct">"{repair.correctForm}"</span>
                  </div>
                </div>
              )}

              {/* If role-tagging generic miss: show correct form */}
              {repair.pendingType === 'role-tagging' && (
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.95rem' }}>
                  Expected sentence structure: "{stimulus?.sentence}"
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                className="machine-btn machine-btn--primary"
                onClick={handleRetryClick}
                autoFocus
              >
                {repair.misconception ? 'Try a similar one' : 'Try again'}
                <span className="machine-keycap">Enter</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Interactive Exercise Screen */
          <div className="machine-card">
            {activeTechnique && (
              <details className="machine-technique">
                <summary>
                  {activeTechnique.techniqueName}
                  <span className="machine-keycap">Info</span>
                </summary>
                <div className="machine-technique__body">{activeTechnique.explanation}</div>
              </details>
            )}

            {showModelAligned && (
              <div
                className="machine-result-strip machine-result-strip--correct"
                style={{ margin: '1rem 0' }}
              >
                <span className="machine-aligned-badge">Mental model aligned</span>
                <span>Retest confirmed: your mental model is aligned with the notional machine.</span>
              </div>
            )}

            {/* Recognition Drill */}
            {exerciseType === 'recognition' && stimulus?.word && (
              <div>
                <div className="machine-card__meta">
                  <span className="machine-badge machine-badge--neutral">Vocabulary Recognition</span>
                  <span className={`machine-badge machine-badge--${getFamily(stimulus.word.family)}`}>
                    {stimulus.word.pos}
                  </span>
                </div>

                <h2 className="machine-title">Translate Target Word</h2>
                <p className="machine-prompt">Provide the English meaning from memory.</p>

                {/* Target Word Large */}
                <div style={{ margin: '1.75rem 0', textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'var(--lab-text)',
                    }}
                  >
                    {stimulus.word.word}
                  </div>
                </div>

                <form
                  className="machine-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const isCorrect = acceptedMeanings(stimulus.word.meaning).includes(
                      normalize(recognitionInput),
                    )
                    handleAttempt({
                      type: 'recognition',
                      wordId: stimulus.word.id,
                      correct: isCorrect,
                      given: recognitionInput,
                    })
                    setRecognitionInput('')
                  }}
                >
                  <div>
                    <input
                      className="machine-input"
                      value={recognitionInput}
                      onChange={(e) => setRecognitionInput(e.target.value)}
                      placeholder="Type English meaning..."
                      autoFocus
                      aria-label="English meaning"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button type="submit" className="machine-btn machine-btn--primary">
                      Submit Answer
                      <span className="machine-keycap">Enter</span>
                    </button>
                  </div>
                </form>

                {/* Result Strip Directly Under Input */}
                {feedback === 'correct' && (
                  <div className="machine-result-strip machine-result-strip--correct">
                    <span>Confirmed Correct: "{formatGiven(lastAttempt?.given)}"</span>
                    {showModelAligned && (
                      <span className="machine-aligned-badge">Mental model aligned</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Production Drill */}
            {exerciseType === 'production' && (
              <div>
                {/* 1. Worked Example (I-do) */}
                {stimulus.phase === 'worked_example' && stimulus.workedExample && (
                  <div>
                    <div className="machine-card__meta">
                      <span className="machine-badge machine-badge--neutral">Worked Example (I-do)</span>
                      <span className={`machine-badge machine-badge--${activeFamily}`}>
                        -{activeFamily} family
                      </span>
                    </div>

                    <h2 className="machine-title">The Notional Machine: Regular -{activeFamily}</h2>
                    <p className="machine-prompt">{stimulus.workedExample.notional_machine}</p>

                    {/* Stepping through Paradigm Rows */}
                    {weStep < (stimulus.workedExample.paradigm?.length || 6) ? (
                      <div>
                        {/* Hero Stem-Ending Block Swap */}
                        <StemEndingBlock
                          stem={stimulus.workedExample.stem || stemOf(stimulus.workedExample.infinitive, activeFamily)}
                          ending={stimulus.workedExample.paradigm[weStep]?.ending || 'ar'}
                          family={activeFamily}
                          isAnimating={animatingSwap}
                          oldEnding={animatingOldEnding}
                        />

                        <div style={{ textAlign: 'center', marginBottom: '1rem', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.95rem' }}>
                          Person: <strong>{stimulus.workedExample.paradigm[weStep]?.person}</strong>
                          <span style={{ margin: '0 0.5rem', color: 'var(--lab-text-muted)' }}>|</span>
                          Swap rule: <strong>{stimulus.workedExample.paradigm[weStep]?.swap}</strong>
                        </div>

                        {/* Stepwise Revealed Table */}
                        <table className="machine-paradigm-table">
                          <thead>
                            <tr>
                              <th>Person</th>
                              <th>Ending</th>
                              <th>Form</th>
                              <th>Swap</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stimulus.workedExample.paradigm.map((row, idx) => {
                              const isRevealed = idx <= weStep
                              const isActive = idx === weStep
                              return (
                                <tr
                                  key={row.person}
                                  className={isActive ? 'machine-row--active' : !isRevealed ? 'machine-row--hidden' : ''}
                                >
                                  <td><strong>{row.person}</strong></td>
                                  <td>{isRevealed ? `-${row.ending}` : '...'}</td>
                                  <td>{isRevealed ? row.form : '...'}</td>
                                  <td>{isRevealed ? row.swap : '...'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
                          <button
                            type="button"
                            className="machine-btn machine-btn--primary"
                            onClick={handleNextWeStep}
                            autoFocus
                          >
                            Next Step ({weStep + 1} of {stimulus.workedExample.paradigm.length})
                            <span className="machine-keycap">N</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Self-Explanation Reflection Stage */
                      <div>
                        <div style={{ padding: '1rem', background: 'var(--lab-surface-alt)', border: '2px solid var(--lab-border)', borderRadius: '4px', marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem', fontWeight: 600 }}>
                            Self-Explanation Reflection (Ungraded)
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--lab-text-muted)' }}>
                            Why does yo take -o? In your own words, summarize how the stem and person endings combine.
                          </p>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                          <textarea
                            className="machine-textarea"
                            value={weReflection}
                            onChange={(e) => setWeReflection(e.target.value)}
                            placeholder="Type your explanation here..."
                            autoFocus
                          />
                        </div>

                        <div>
                          <button
                            type="button"
                            className="machine-btn machine-btn--primary"
                            onClick={() =>
                              handleAttempt({
                                type: 'production',
                                chunkId: stimulus.chunkId,
                                action: 'worked_example_ack',
                              })
                            }
                          >
                            Continue to Practice
                            <span className="machine-keycap">Enter</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Guided Practice (We-do) */}
                {stimulus.phase === 'guided' && stimulus.verb && (
                  <div>
                    <div className="machine-card__meta">
                      <span className="machine-badge machine-badge--neutral">Guided Practice (We-do)</span>
                      <span className={`machine-badge machine-badge--${activeFamily}`}>
                        -{activeFamily} family
                      </span>
                    </div>

                    <h2 className="machine-title">Conjugate in Context</h2>
                    <p className="machine-prompt">
                      Verb: <strong>{stimulus.verb.word}</strong> ("{stimulus.verb.meaning}") for person:{' '}
                      <strong>{displayPerson(stimulus.person)}</strong>
                    </p>

                    {/* Hint Fading (UI-only): Attempt 0: Person cue only; Attempt 1+: Full hint */}
                    <div style={{ marginBottom: '1rem' }}>
                      <span className="machine-badge machine-badge--neutral">
                        Hint:{' '}
                        {attemptCount === 0
                          ? `Person cue: ${displayPerson(stimulus.person)}`
                          : stimulus.hint}
                      </span>
                    </div>

                    {/* Hero Tile: Stem tile + Blank Ending tile with input */}
                    <StemEndingBlock
                      stem={stemOf(stimulus.verb.word, activeFamily)}
                      ending=""
                      family={activeFamily}
                      isGuided={true}
                      guidedValue={guidedInput}
                      onGuidedChange={setGuidedInput}
                      inputRef={guidedInputRef}
                      onGuidedKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const stem = stemOf(stimulus.verb.word, activeFamily)
                          const trimmed = normalize(guidedInput)
                          // Accept either typed ending ("o") or full word ("hablo")
                          const given = trimmed.startsWith(stem) ? trimmed : stem + trimmed
                          const isCorrect = normalize(given) === normalize(stimulus.expectedForm)

                          handleAttempt({
                            type: 'production',
                            chunkId: stimulus.chunkId,
                            wordId: stimulus.verb.id,
                            person: stimulus.person,
                            correct: isCorrect,
                            given,
                          })
                        }
                      }}
                    />

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="machine-btn machine-btn--primary"
                        onClick={() => {
                          const stem = stemOf(stimulus.verb.word, activeFamily)
                          const trimmed = normalize(guidedInput)
                          const given = trimmed.startsWith(stem) ? trimmed : stem + trimmed
                          const isCorrect = normalize(given) === normalize(stimulus.expectedForm)

                          handleAttempt({
                            type: 'production',
                            chunkId: stimulus.chunkId,
                            wordId: stimulus.verb.id,
                            person: stimulus.person,
                            correct: isCorrect,
                            given,
                          })
                        }}
                      >
                        Submit Conjugation
                        <span className="machine-keycap">Enter</span>
                      </button>
                    </div>

                    {/* Result Strip Directly Under Input */}
                    {feedback === 'correct' && (
                      <div className="machine-result-strip machine-result-strip--correct">
                        <span>Confirmed Form: "{formatGiven(lastAttempt?.given)}"</span>
                        {showModelAligned && (
                          <span className="machine-aligned-badge">Mental model aligned</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Independent Practice (You-do) */}
                {stimulus.phase === 'independent' && stimulus.verb && (
                  <div>
                    <div className="machine-card__meta">
                      <span className="machine-badge machine-badge--neutral">Independent Recall (You-do)</span>
                      <span className={`machine-badge machine-badge--${activeFamily}`}>
                        -{activeFamily} family
                      </span>
                    </div>

                    <h2 className="machine-title">Conjugate Without Hints</h2>
                    <p className="machine-prompt">
                      Verb: <strong>{stimulus.verb.word}</strong> ("{stimulus.verb.meaning}") for person:{' '}
                      <strong>{displayPerson(stimulus.person)}</strong>
                    </p>

                    <form
                      className="machine-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const isCorrect = normalize(independentInput) === normalize(stimulus.expectedForm)
                        handleAttempt({
                          type: 'production',
                          chunkId: stimulus.chunkId,
                          wordId: stimulus.verb.id,
                          person: stimulus.person,
                          correct: isCorrect,
                          given: independentInput,
                        })
                        setIndependentInput('')
                      }}
                    >
                      <div>
                        <input
                          className="machine-input"
                          value={independentInput}
                          onChange={(e) => setIndependentInput(e.target.value)}
                          placeholder="Type full conjugated form..."
                          autoFocus
                          aria-label="Conjugated form"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button type="submit" className="machine-btn machine-btn--primary">
                          Submit Answer
                          <span className="machine-keycap">Enter</span>
                        </button>
                      </div>
                    </form>

                    {/* Result Strip Directly Under Input */}
                    {feedback === 'correct' && (
                      <div className="machine-result-strip machine-result-strip--correct">
                        <span>Confirmed Correct: "{formatGiven(lastAttempt?.given)}"</span>
                        {showModelAligned && (
                          <span className="machine-aligned-badge">Mental model aligned</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Role Tagging Drill */}
            {exerciseType === 'role-tagging' && stimulus?.sentence && (
              <div>
                <RoleTaggingDrill
                  stimulus={stimulus}
                  onAttempt={handleAttempt}
                  feedback={feedback}
                />
                {feedback === 'correct' && (
                  <div className="machine-result-strip machine-result-strip--correct">
                    <span>Role tags confirmed correct!</span>
                    {showModelAligned && (
                      <span className="machine-aligned-badge">Mental model aligned</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default {
  id: 'machine',
  name: 'Machine',
  description: 'Cool geometric tiles; the notional machine animated front and center; keyboard-first.',
  Component: MachineVariant,
}
