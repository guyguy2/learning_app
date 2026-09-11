import { useState, useEffect } from 'react'
import TechniquePill from './TechniquePill.jsx'

export default function RoleTaggingDrill({
  stimulus,
  onAttempt,
  feedback,
  lastAttempt,
  isReview,
  mentalModelAligned,
}) {
  const { parts, chunkId } = stimulus
  const verbWord = `${parts.stem}${parts.ending}`

  const [activeRole, setActiveRole] = useState('subject')
  const [splitIndex, setSplitIndex] = useState(null)
  const [taggedSubject, setTaggedSubject] = useState('')
  const [taggedObject, setTaggedObject] = useState('')
  const [diffErrors, setDiffErrors] = useState([])

  // Reset local state when stimulus changes
  useEffect(() => {
    setActiveRole('subject')
    setSplitIndex(null)
    setTaggedSubject('')
    setTaggedObject('')
    setDiffErrors([])
  }, [stimulus])

  const stemCandidate = splitIndex != null ? verbWord.slice(0, splitIndex) : ''
  const endingCandidate = splitIndex != null ? verbWord.slice(splitIndex) : ''

  function handleSplitClick(index) {
    setSplitIndex(index)
    setDiffErrors([])
  }

  function handleSubjectClick() {
    if (activeRole === 'subject') {
      setTaggedSubject(parts.subject)
    } else if (taggedSubject === parts.subject) {
      setTaggedSubject('')
    } else {
      setTaggedSubject(parts.subject)
    }
    setDiffErrors([])
  }

  function handleObjectClick() {
    if (activeRole === 'object') {
      setTaggedObject(parts.object)
    } else if (taggedObject === parts.object) {
      setTaggedObject('')
    } else {
      setTaggedObject(parts.object)
    }
    setDiffErrors([])
  }

  function handleSubmit() {
    const given = {
      subject: taggedSubject,
      stem: stemCandidate,
      ending: endingCandidate,
      object: taggedObject,
    }

    const correct =
      given.subject === parts.subject &&
      given.stem === parts.stem &&
      given.ending === parts.ending &&
      given.object === parts.object

    if (!correct) {
      const errs = []
      if (given.subject !== parts.subject) {
        errs.push(`Subject: expected "${parts.subject}", tagged "${given.subject || 'none'}"`)
      }
      if (given.stem !== parts.stem) {
        errs.push(`Stem: expected "${parts.stem}", split as "${given.stem || 'unsplit'}"`)
      }
      if (given.ending !== parts.ending) {
        errs.push(`Ending: expected "${parts.ending}", split as "${given.ending || 'unsplit'}"`)
      }
      if (given.object !== parts.object) {
        errs.push(`Object: expected "${parts.object}", tagged "${given.object || 'none'}"`)
      }
      setDiffErrors(errs)
    } else {
      setDiffErrors([])
    }

    onAttempt({
      type: 'role-tagging',
      chunkId,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
      given,
    })
  }

  // Keyboard shortcut handler: 1-4 for roles, Enter to submit
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore if typing in a text input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      if (e.key === '1') {
        setActiveRole('subject')
      } else if (e.key === '2') {
        setActiveRole('stem')
      } else if (e.key === '3') {
        setActiveRole('ending')
      } else if (e.key === '4') {
        setActiveRole('object')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className={`editorial-card family-${chunkId} editorial-drill-enter`}>
      <TechniquePill techniqueKey={isReview ? 'review' : 'role-tagging'} isReview={isReview} />

      <header className="editorial-card__header">
        <div className="editorial-card__kicker">Structural Analysis</div>
        <h1 className="editorial-card__title">Split & Tag Roles</h1>
        <p className="editorial-card__subtitle">
          Click between letters to split the verb into stem and ending. Tag the subject and object using the role palette.
        </p>
      </header>

      <div className="editorial-role-palette">
        <button
          type="button"
          className={`editorial-role-pill editorial-role-pill--subject ${activeRole === 'subject' ? 'editorial-role-pill--active' : ''}`}
          onClick={() => setActiveRole('subject')}
        >
          1: Subject
        </button>
        <button
          type="button"
          className={`editorial-role-pill editorial-role-pill--stem ${activeRole === 'stem' ? 'editorial-role-pill--active' : ''}`}
          onClick={() => setActiveRole('stem')}
        >
          2: Stem
        </button>
        <button
          type="button"
          className={`editorial-role-pill editorial-role-pill--ending ${activeRole === 'ending' ? 'editorial-role-pill--active' : ''}`}
          onClick={() => setActiveRole('ending')}
        >
          3: Ending
        </button>
        <button
          type="button"
          className={`editorial-role-pill editorial-role-pill--object ${activeRole === 'object' ? 'editorial-role-pill--active' : ''}`}
          onClick={() => setActiveRole('object')}
        >
          4: Object
        </button>
      </div>

      <div className="editorial-sentence-container">
        {/* Subject Token */}
        <div className="editorial-token-box">
          <button
            type="button"
            className="editorial-token-btn"
            onClick={handleSubjectClick}
            style={{
              borderColor: taggedSubject ? 'var(--role-subject)' : 'var(--editorial-hairline)',
              color: taggedSubject ? 'var(--role-subject)' : 'var(--editorial-ink)',
            }}
          >
            {parts.subject}
          </button>
          <span
            className="editorial-token-label"
            style={{ color: taggedSubject ? 'var(--role-subject)' : 'var(--editorial-ink-muted)' }}
          >
            {taggedSubject ? 'SUBJECT' : 'tap to tag'}
          </span>
        </div>

        {/* Verb Token (unsliced with clickable gaps) */}
        <div className="editorial-token-box">
          <div className="editorial-verb-split-container">
            {verbWord.split('').map((char, index) => {
              const showGap = index > 0
              return (
                <span key={`char-${index}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {showGap && (
                    <button
                      type="button"
                      className={`editorial-split-gap ${splitIndex === index ? 'editorial-split-gap--active' : ''}`}
                      onClick={() => handleSplitClick(index)}
                      title={`Split between ${verbWord[index - 1]} and ${char}`}
                      aria-label={`Split between ${verbWord[index - 1]} and ${char}`}
                    />
                  )}
                  <span
                    className="editorial-char"
                    style={{
                      color:
                        splitIndex != null
                          ? index < splitIndex
                            ? 'var(--role-stem)'
                            : 'var(--role-ending)'
                          : 'var(--editorial-ink)',
                    }}
                  >
                    {char}
                  </span>
                </span>
              )
            })}
          </div>
          <span className="editorial-token-label">
            {splitIndex != null ? (
              <span>
                <span style={{ color: 'var(--role-stem)' }}>STEM ({stemCandidate})</span>
                <span style={{ margin: '0 0.35rem', color: 'var(--editorial-hairline-dark)' }}>|</span>
                <span style={{ color: 'var(--role-ending)' }}>ENDING ({endingCandidate})</span>
              </span>
            ) : (
              <span style={{ color: 'var(--editorial-ink-muted)' }}>click gap to split verb</span>
            )}
          </span>
        </div>

        {/* Object Token */}
        <div className="editorial-token-box">
          <button
            type="button"
            className="editorial-token-btn"
            onClick={handleObjectClick}
            style={{
              borderColor: taggedObject ? 'var(--role-object)' : 'var(--editorial-hairline)',
              color: taggedObject ? 'var(--role-object)' : 'var(--editorial-ink)',
            }}
          >
            {parts.object}
          </button>
          <span
            className="editorial-token-label"
            style={{ color: taggedObject ? 'var(--role-object)' : 'var(--editorial-ink-muted)' }}
          >
            {taggedObject ? 'OBJECT' : 'tap to tag'}
          </span>
        </div>
      </div>

      <div className="editorial-actions">
        <span className="editorial-hint-text">
          Keyboard: 1-4 selects role, Enter submits
        </span>
        <button
          type="button"
          className="editorial-btn-primary"
          onClick={handleSubmit}
        >
          Submit Analysis
        </button>
      </div>

      {diffErrors.length > 0 && (
        <div className="editorial-diff-panel">
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Role Analysis Confused:</div>
          {diffErrors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      {feedback === 'correct' && (
        <div className="editorial-feedback-strip editorial-feedback-strip--correct">
          {lastAttempt?.type === 'role-tagging'
            ? 'Correct: All grammatical roles identified accurately.'
            : 'Previous answer correct.'}
          {mentalModelAligned && (
            <span className="editorial-aligned-pill">Mental model aligned</span>
          )}
        </div>
      )}
    </div>
  )
}
