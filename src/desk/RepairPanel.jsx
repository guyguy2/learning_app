import React, { useEffect } from 'react'
import StemEndingTile from './StemEndingTile.jsx'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'

/**
 * RepairPanel
 * Dedicated repair card for diagnosing mental model errors.
 * Renders the misconception name, pedagogical explanation, notional machine tiles
 * with mistaken form struck through, and a single retest button.
 */
export default function RepairPanel({ repair, lastAttempt, onRetry, family, technique }) {
  const misconception = repair?.misconception
  const isNamedMisconception = Boolean(misconception)

  // Enter key dismisses repair panel and advances to retest
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onRetry()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRetry])

  // Derive stem and endings if this was a production drill
  let stem = ''
  let wrongEnding = ''
  let correctEnding = ''

  if (repair?.pendingType === 'production' && repair?.correctForm && lastAttempt?.given) {
    const correctFull = repair.correctForm
    const givenFull = lastAttempt.given

    // Approximate stem by matching prefix of correct form
    for (let i = Math.min(correctFull.length, givenFull.length); i > 0; i--) {
      if (correctFull.slice(0, i) === givenFull.slice(0, i)) {
        stem = correctFull.slice(0, i)
        wrongEnding = givenFull.slice(i)
        correctEnding = correctFull.slice(i)
        break
      }
    }
    if (!stem) {
      stem = correctFull.slice(0, -2)
      wrongEnding = givenFull
      correctEnding = correctFull.slice(-2)
    }
  }

  return (
    <div className="desk-card desk-card--slide desk-repair-panel">
      {isNamedMisconception && <DeskTechniqueBadge technique={technique} />}
      <div className="desk-label" style={{ color: '#9a4704' }}>
        {isNamedMisconception ? 'Misconception Repair' : 'Correction'}
      </div>

      <h1 className="desk-repair-title">
        {isNamedMisconception ? misconception.name : 'Let us review the expected form'}
      </h1>

      <div className="desk-repair-explanation">
        {isNamedMisconception
          ? misconception.explanation
          : 'Carefully observe the correct grammatical form before trying the next drill.'}
      </div>

      {/* Production Notional Machine with Struck Ending */}
      {isNamedMisconception && repair?.pendingType === 'production' && (
        <div className="desk-notional-machine-box">
          <div className="desk-notional-machine-title">Notional Machine Correction:</div>
          {typeof repair.notionalMachine === 'string' && (
            <p className="desk-notional-machine-text" style={{ marginBottom: '1rem' }}>
              {repair.notionalMachine}
            </p>
          )}

          <StemEndingTile
            stem={stem}
            ending={wrongEnding || lastAttempt?.given}
            correctEnding={correctEnding || repair.correctForm}
            family={family || 'ar'}
            isStruck={true}
          />
        </div>
      )}

      {/* Recognition False Friend Struck Through */}
      {isNamedMisconception && repair?.pendingType === 'recognition' && (
        <div className="desk-notional-machine-box">
          <div className="desk-notional-machine-title">Cognate Contrast:</div>
          <div style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>
            <del style={{ color: '#b91c1c', marginRight: '0.75rem' }}>
              {lastAttempt?.given || 'false cognate'}
            </del>
            <span style={{ color: 'var(--feedback-green)', fontWeight: 700 }}>
              {repair.correctForm}
            </span>
          </div>
        </div>
      )}

      {/* Generic Miss Display */}
      {!isNamedMisconception && (
        <div className="desk-notional-machine-box">
          <div className="desk-notional-machine-title">Expected Answer:</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--feedback-green)' }}>
            {repair?.correctForm || 'Review sentence role boundaries'}
          </div>
        </div>
      )}

      <div className="desk-btn-group">
        <button
          type="button"
          className="desk-btn desk-btn--primary"
          onClick={onRetry}
          autoFocus
        >
          {isNamedMisconception ? 'Try a similar one' : 'Try again'} <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}
