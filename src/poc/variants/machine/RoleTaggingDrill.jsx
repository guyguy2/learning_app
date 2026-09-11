import React, { useState, useEffect } from 'react'

const ROLES = [
  { id: 'subject', label: 'Subject', keyNum: '1' },
  { id: 'stem', label: 'Stem', keyNum: '2' },
  { id: 'ending', label: 'Ending', keyNum: '3' },
  { id: 'object', label: 'Object', keyNum: '4' },
]

/**
 * RoleTaggingDrill
 * - The VERB IS ONE TOKEN. Learner must split it by clicking a letter boundary.
 * - Learner tags subject and object by selecting a role pill (keys 1-4) then clicking token.
 * - Submit sends given: { subject, stem, ending, object } and evaluates match against stimulus.parts.
 * - On a miss, displays a UI-only diff of given vs parts showing which roles were confused.
 */
export default function RoleTaggingDrill({ stimulus, onAttempt, feedback }) {
  const parts = stimulus.parts || {}
  const verbText = (parts.stem || '') + (parts.ending || '')

  const [selectedRole, setSelectedRole] = useState('subject')
  const [taggedSubject, setTaggedSubject] = useState(null)
  const [taggedObject, setTaggedObject] = useState(null)
  const [splitIndex, setSplitIndex] = useState(null) // index in verbText where ending starts
  const [missDiff, setMissDiff] = useState(null)

  // Reset drill state when stimulus changes
  useEffect(() => {
    setSelectedRole('subject')
    setTaggedSubject(null)
    setTaggedObject(null)
    setSplitIndex(null)
    setMissDiff(null)
  }, [stimulus])

  const currentStem = splitIndex != null ? verbText.slice(0, splitIndex) : ''
  const currentEnding = splitIndex != null ? verbText.slice(splitIndex) : ''

  function handleTokenClick(tokenRole) {
    if (tokenRole === 'subject') {
      if (taggedSubject === parts.subject) {
        setTaggedSubject(null)
      } else {
        setTaggedSubject(parts.subject)
      }
    } else if (tokenRole === 'object') {
      if (taggedObject === parts.object) {
        setTaggedObject(null)
      } else {
        setTaggedObject(parts.object)
      }
    }
  }

  function handleSplitClick(index) {
    // index is where the split happens (1 to verbText.length - 1)
    setSplitIndex(index)
  }

  function handleSubmit(e) {
    if (e) e.preventDefault()

    const given = {
      subject: taggedSubject || '',
      stem: currentStem || '',
      ending: currentEnding || '',
      object: taggedObject || '',
    }

    const isMatch =
      given.subject.trim().toLowerCase() === parts.subject.trim().toLowerCase() &&
      given.stem.trim().toLowerCase() === parts.stem.trim().toLowerCase() &&
      given.ending.trim().toLowerCase() === parts.ending.trim().toLowerCase() &&
      given.object.trim().toLowerCase() === parts.object.trim().toLowerCase()

    if (!isMatch) {
      setMissDiff({
        given,
        expected: parts,
        confused: {
          subject: given.subject.trim().toLowerCase() !== parts.subject.trim().toLowerCase(),
          stem: given.stem.trim().toLowerCase() !== parts.stem.trim().toLowerCase(),
          ending: given.ending.trim().toLowerCase() !== parts.ending.trim().toLowerCase(),
          object: given.object.trim().toLowerCase() !== parts.object.trim().toLowerCase(),
        },
      })
    } else {
      setMissDiff(null)
    }

    onAttempt({
      type: 'role-tagging',
      chunkId: stimulus.chunkId,
      wordId: stimulus.verb?.id,
      person: stimulus.person,
      correct: isMatch,
      given,
    })
  }

  // Keyboard navigation: 1-4 selects role, S/O tags, arrows move split, Enter submits
  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === '1') {
        setSelectedRole('subject')
        setTaggedSubject(parts.subject)
      } else if (e.key === '2') {
        setSelectedRole('stem')
      } else if (e.key === '3') {
        setSelectedRole('ending')
      } else if (e.key === '4') {
        setSelectedRole('object')
        setTaggedObject(parts.object)
      } else if (e.key === 's' || e.key === 'S') {
        setTaggedSubject(parts.subject)
      } else if (e.key === 'o' || e.key === 'O') {
        setTaggedObject(parts.object)
      } else if (e.key === 'ArrowLeft') {
        setSplitIndex((prev) => {
          const current = prev != null ? prev : Math.floor(verbText.length / 2)
          return Math.max(1, current - 1)
        })
      } else if (e.key === 'ArrowRight') {
        setSplitIndex((prev) => {
          const current = prev != null ? prev : Math.floor(verbText.length / 2)
          return Math.min(verbText.length - 1, current + 1)
        })
      } else if (e.key === 'Enter') {
        handleSubmit()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [parts, taggedSubject, taggedObject, splitIndex, currentStem, currentEnding, verbText])

  return (
    <div>
      <div className="machine-card__meta">
        <span className="machine-badge machine-badge--neutral">Role Tagging Lab</span>
        <span className="machine-badge machine-badge--neutral">Chunk: {stimulus.chunkId}</span>
      </div>

      <h2 className="machine-title">Segment and Tag Sentence Roles</h2>
      <p className="machine-prompt">
        Tag the subject and object, and click a letter boundary in the verb to split stem and ending.
      </p>

      {/* Role Selection Palette */}
      <div className="machine-role-palette">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            className={`machine-role-btn machine-role-btn--${role.id} ${
              selectedRole === role.id ? 'machine-role-btn--active' : ''
            }`}
            onClick={() => {
              setSelectedRole(role.id)
              if (role.id === 'subject') setTaggedSubject(parts.subject)
              if (role.id === 'object') setTaggedObject(parts.object)
            }}
          >
            <span>{role.label}</span>
            <span className="machine-keycap">{role.keyNum}</span>
          </button>
        ))}
      </div>

      {/* Interactive Sentence Tokens */}
      <div className="machine-sentence-stage">
        {/* Subject Token */}
        <div
          className={`machine-token ${taggedSubject ? 'machine-token--tagged-subject' : ''}`}
          onClick={() => handleTokenClick('subject')}
          title="Click to tag as Subject (or press 1 / S)"
        >
          <span>{parts.subject}</span>
          <span className="machine-token-tag">
            {taggedSubject ? 'Subject' : 'Tag Subject'}
          </span>
        </div>

        {/* Unified Verb Token with Letter Boundary Gaps */}
        <div className="machine-verb-token" title="Click between letters to split stem and ending (or use Left/Right arrows)">
          {verbText.split('').map((letter, idx) => {
            const isStem = splitIndex != null && idx < splitIndex
            const isEnding = splitIndex != null && idx >= splitIndex
            const letterClass = isStem
              ? 'machine-verb-letter--stem'
              : isEnding
              ? 'machine-verb-letter--ending'
              : ''

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <button
                    type="button"
                    className={`machine-letter-gap ${splitIndex === idx ? 'machine-letter-gap--active' : ''}`}
                    onClick={() => handleSplitClick(idx)}
                    title={`Split boundary at position ${idx}`}
                    aria-label={`Split between ${verbText[idx - 1]} and ${letter}`}
                  />
                )}
                <span className={`machine-verb-letter ${letterClass}`}>{letter}</span>
              </React.Fragment>
            )
          })}
        </div>

        {/* Object Token */}
        <div
          className={`machine-token ${taggedObject ? 'machine-token--tagged-object' : ''}`}
          onClick={() => handleTokenClick('object')}
          title="Click to tag as Object (or press 4 / O)"
        >
          <span>{parts.object}</span>
          <span className="machine-token-tag">
            {taggedObject ? 'Object' : 'Tag Object'}
          </span>
        </div>
      </div>

      {/* Active Role Configuration Status */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
        <span style={{ color: taggedSubject ? 'var(--role-subject)' : 'var(--lab-text-muted)' }}>
          Subject: <strong>{taggedSubject || '(pending)'}</strong>
        </span>
        <span>|</span>
        <span style={{ color: currentStem ? 'var(--role-stem)' : 'var(--lab-text-muted)' }}>
          Stem: <strong>{currentStem || '(click verb gap)'}</strong>
        </span>
        <span>|</span>
        <span style={{ color: currentEnding ? 'var(--role-ending)' : 'var(--lab-text-muted)' }}>
          Ending: <strong>{currentEnding || '(click verb gap)'}</strong>
        </span>
        <span>|</span>
        <span style={{ color: taggedObject ? 'var(--role-object)' : 'var(--lab-text-muted)' }}>
          Object: <strong>{taggedObject || '(pending)'}</strong>
        </span>
      </div>

      {/* Submit Action */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          className="machine-btn machine-btn--primary"
          onClick={handleSubmit}
        >
          Submit Role Tags
          <span className="machine-keycap">Enter</span>
        </button>
      </div>

      {/* Confused Role Diagnostic Diff on Miss */}
      {missDiff && (
        <div className="machine-diff-box">
          <div style={{ fontWeight: 700, color: 'var(--feedback-amber)', marginBottom: '0.5rem' }}>
            Diagnostic: Role Mismatch Detected
          </div>
          <div className="machine-diff-row">
            <span>Subject</span>
            <span>
              Given: "{missDiff.given.subject || '(none)'}"
              {missDiff.confused.subject ? (
                <strong style={{ color: 'var(--feedback-error)', marginLeft: '0.5rem' }}>
                  [CONFUSED: expected "{missDiff.expected.subject}"]
                </strong>
              ) : (
                <span style={{ color: 'var(--feedback-correct)', marginLeft: '0.5rem' }}>[OK]</span>
              )}
            </span>
          </div>
          <div className="machine-diff-row">
            <span>Stem</span>
            <span>
              Given: "{missDiff.given.stem || '(none)'}"
              {missDiff.confused.stem ? (
                <strong style={{ color: 'var(--feedback-error)', marginLeft: '0.5rem' }}>
                  [CONFUSED: expected "{missDiff.expected.stem}"]
                </strong>
              ) : (
                <span style={{ color: 'var(--feedback-correct)', marginLeft: '0.5rem' }}>[OK]</span>
              )}
            </span>
          </div>
          <div className="machine-diff-row">
            <span>Ending</span>
            <span>
              Given: "{missDiff.given.ending || '(none)'}"
              {missDiff.confused.ending ? (
                <strong style={{ color: 'var(--feedback-error)', marginLeft: '0.5rem' }}>
                  [CONFUSED: expected "{missDiff.expected.ending}"]
                </strong>
              ) : (
                <span style={{ color: 'var(--feedback-correct)', marginLeft: '0.5rem' }}>[OK]</span>
              )}
            </span>
          </div>
          <div className="machine-diff-row">
            <span>Object</span>
            <span>
              Given: "{missDiff.given.object || '(none)'}"
              {missDiff.confused.object ? (
                <strong style={{ color: 'var(--feedback-error)', marginLeft: '0.5rem' }}>
                  [CONFUSED: expected "{missDiff.expected.object}"]
                </strong>
              ) : (
                <span style={{ color: 'var(--feedback-correct)', marginLeft: '0.5rem' }}>[OK]</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
