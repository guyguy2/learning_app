import { useState, useRef } from 'react'
import StemEndingTile from './StemEndingTile.jsx'
import { personLabel } from './personLabel.js'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'

export function normalize(text) {
  return (text || '').trim().toLowerCase()
}

/**
 * Grade guided input.
 * Accepts either the ending directly (e.g. "o") or the full form (e.g. "hablo").
 * Reconstructs given form if ending-only, then grades against expectedForm via normalized equality.
 */
export function evaluateGuidedInput(typed, stem, expectedForm) {
  const normalizedTyped = normalize(typed).replace(/^-/, '')
  const normalizedStem = normalize(stem)
  const given = normalizedTyped.startsWith(normalizedStem)
    ? normalizedTyped
    : normalizedStem + normalizedTyped
  const isCorrect = normalize(given) === normalize(expectedForm)
  return { given, isCorrect }
}

/**
 * GuidedCard (We-Do)
 * Guided practice with stem slip and interactive blank ending tile.
 * Learner types ending directly into the ending tile (full form also accepted).
 * Primary action button displays keyboard shortcut keycap.
 */
export default function GuidedCard({ stimulus, attemptCount, onSubmit, technique }) {
  const [answer, setAnswer] = useState('')
  const inputRef = useRef(null)

  const stem = stimulus.verb.word.slice(0, -stimulus.chunkId.length)
  const person = personLabel(stimulus.person)

  // Derive hint based purely on attemptCount (UI-only fading)
  const hintText =
    attemptCount === 0
      ? `Person cue: target subject is "${person}"`
      : stimulus.hint || `Stem: "${stem}-", ending for ${person}`

  function handleSubmit(e) {
    if (e) e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed) return

    const { given, isCorrect } = evaluateGuidedInput(trimmed, stem, stimulus.expectedForm)

    onSubmit({
      type: 'production',
      chunkId: stimulus.chunkId,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct: isCorrect,
      given,
      expectedForm: stimulus.expectedForm,
    })
    setAnswer('')
  }

  function handleGuidedKeyDown(e) {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">Guided Practice (We-Do)</div>
      <p className="desk-prompt">
        Conjugate <strong>{stimulus.verb.word}</strong> ({stimulus.verb.meaning}) for{' '}
        <strong>{person}</strong>:
      </p>

      {/* Hero Tactile Slips: Learner types the ending directly into the blank ending tile */}
      <StemEndingTile
        stem={stem}
        family={stimulus.chunkId}
        isGuided={true}
        guidedValue={answer}
        onGuidedChange={setAnswer}
        onGuidedKeyDown={handleGuidedKeyDown}
        inputRef={inputRef}
      />

      {/* Faded Hint Callout */}
      <div className="desk-hint-box">
        <span className="desk-hint-box__label">
          {attemptCount === 0 ? 'Scaffold' : 'Detailed Rule'}:
        </span>
        <span>{hintText}</span>
      </div>

      <form className="desk-form" onSubmit={handleSubmit}>
        <div className="desk-btn-group">
          <button type="submit" className="desk-btn desk-btn--primary">
            Submit Conjugation <span className="desk-keycap">Enter</span>
          </button>
        </div>
      </form>
    </div>
  )
}
