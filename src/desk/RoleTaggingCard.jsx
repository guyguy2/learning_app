import { useEffect, useRef, useState } from 'react'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'

function normalize(text) {
  return (text || '').trim().toLowerCase()
}

/**
 * RoleTaggingCard
 * Grammatical roles drill.
 * Rule: The verb is ONE token. The learner splits it by clicking a letter boundary
 * into stem + ending, and tags subject and object by selecting a role pill then a token.
 * Keyboard: 1-4 selects role, Enter submits.
 */
export default function RoleTaggingCard({ stimulus, onSubmit, technique }) {
  const { parts } = stimulus
  const verbFull = `${parts.stem}${parts.ending}`

  const [selectedRole, setSelectedRole] = useState('subject')
  const [taggedSubject, setTaggedSubject] = useState('')
  const [taggedObject, setTaggedObject] = useState('')
  const [splitIndex, setSplitIndex] = useState(null)
  const [missDiff, setMissDiff] = useState(null)

  const splitStem = splitIndex !== null ? verbFull.slice(0, splitIndex) : ''
  const splitEnding = splitIndex !== null ? verbFull.slice(splitIndex) : ''

  const submitRef = useRef()

  // Keyboard navigation: 1-4 selects role, Enter submits
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === '1') {
        setSelectedRole('subject')
      } else if (e.key === '2') {
        setSelectedRole('stem')
      } else if (e.key === '3') {
        setSelectedRole('ending')
      } else if (e.key === '4') {
        setSelectedRole('object')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        submitRef.current?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleTokenClick(tokenText, defaultRole) {
    const roleToApply = selectedRole || defaultRole
    if (roleToApply === 'subject') {
      setTaggedSubject(tokenText)
    } else if (roleToApply === 'object') {
      setTaggedObject(tokenText)
    }
  }

  function handleSplitClick(boundaryIdx) {
    setSplitIndex(boundaryIdx)
  }

  function handleSubmit() {
    const given = {
      subject: taggedSubject,
      stem: splitStem,
      ending: splitEnding,
      object: taggedObject,
    }

    const isSubjectCorrect = normalize(given.subject) === normalize(parts.subject)
    const isStemCorrect = normalize(given.stem) === normalize(parts.stem)
    const isEndingCorrect = normalize(given.ending) === normalize(parts.ending)
    const isObjectCorrect = normalize(given.object) === normalize(parts.object)

    const correct = isSubjectCorrect && isStemCorrect && isEndingCorrect && isObjectCorrect

    if (!correct) {
      setMissDiff({
        subject: { given: given.subject, expected: parts.subject, match: isSubjectCorrect },
        stem: { given: given.stem, expected: parts.stem, match: isStemCorrect },
        ending: { given: given.ending, expected: parts.ending, match: isEndingCorrect },
        object: { given: given.object, expected: parts.object, match: isObjectCorrect },
      })
    } else {
      setMissDiff(null)
    }

    onSubmit({
      type: 'role-tagging',
      chunkId: stimulus.chunkId,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
      given,
    })
  }
  submitRef.current = handleSubmit

  const letters = verbFull.split('')

  return (
    <div className="desk-card desk-card--slide">
      <DeskTechniqueBadge technique={technique} />
      <div className="desk-label">Role Tagging (Chunking)</div>
      <p className="desk-prompt">
        Identify the grammatical units in the sentence. Click between verb letters to separate the stem and ending.
      </p>

      {/* Role Pill Palette with Keyboard Shortcuts */}
      <div className="desk-role-palette" role="radiogroup" aria-label="Role selector">
        <button
          type="button"
          className={`desk-role-pill desk-role-pill--subject ${
            selectedRole === 'subject' ? 'desk-role-pill--selected' : ''
          }`}
          onClick={() => setSelectedRole('subject')}
        >
          <span className="desk-role-key-cue">1</span> Subject
        </button>

        <button
          type="button"
          className={`desk-role-pill desk-role-pill--stem ${
            selectedRole === 'stem' ? 'desk-role-pill--selected' : ''
          }`}
          onClick={() => setSelectedRole('stem')}
        >
          <span className="desk-role-key-cue">2</span> Stem
        </button>

        <button
          type="button"
          className={`desk-role-pill desk-role-pill--ending ${
            selectedRole === 'ending' ? 'desk-role-pill--selected' : ''
          }`}
          onClick={() => setSelectedRole('ending')}
        >
          <span className="desk-role-key-cue">3</span> Ending
        </button>

        <button
          type="button"
          className={`desk-role-pill desk-role-pill--object ${
            selectedRole === 'object' ? 'desk-role-pill--selected' : ''
          }`}
          onClick={() => setSelectedRole('object')}
        >
          <span className="desk-role-key-cue">4</span> Object
        </button>
      </div>

      {/* Interactive Sentence Flow */}
      <div className="desk-sentence-flow">
        {/* Subject Token */}
        <div
          role="button"
          tabIndex={0}
          className={`desk-token-card ${
            taggedSubject ? 'desk-token-card--tagged-subject' : ''
          }`}
          onClick={() => handleTokenClick(parts.subject, 'subject')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleTokenClick(parts.subject, 'subject')
            }
          }}
          title="Click to tag as Subject"
        >
          <span className="desk-token-role-tag">
            {taggedSubject ? 'Subject' : 'Tap to tag'}
          </span>
          <span className="desk-token-text">{parts.subject}</span>
        </div>

        {/* Verb Token (ONE TOKEN with clickable gaps to split) */}
        {splitIndex === null ? (
          <div className="desk-verb-token">
            {letters.map((char, i) => (
              <div key={i} className="desk-letter-gap-wrap">
                <span className="desk-letter-char">{char}</span>
                {i < letters.length - 1 && (
                  <button
                    type="button"
                    className="desk-letter-boundary-btn"
                    title={`Click to split here (${verbFull.slice(0, i + 1)} | ${verbFull.slice(i + 1)})`}
                    onClick={() => handleSplitClick(i + 1)}
                  >
                    <span className="desk-letter-boundary-line" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="desk-verb-token desk-verb-token--split">
            {/* Split Stem Slip */}
            <div className="desk-token-card desk-token-card--tagged-stem">
              <span className="desk-token-role-tag">Stem</span>
              <span className="desk-token-text">{splitStem}</span>
            </div>

            {/* Split Ending Slip */}
            <div className="desk-token-card desk-token-card--tagged-ending">
              <span className="desk-token-role-tag">Ending</span>
              <span className="desk-token-text">{splitEnding}</span>
            </div>

            {/* Reset Split Button */}
            <button
              type="button"
              className="desk-btn desk-btn--secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => setSplitIndex(null)}
              title="Change split point"
            >
              Adjust Split
            </button>
          </div>
        )}

        {/* Object Token */}
        <div
          role="button"
          tabIndex={0}
          className={`desk-token-card ${
            taggedObject ? 'desk-token-card--tagged-object' : ''
          }`}
          onClick={() => handleTokenClick(parts.object, 'object')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleTokenClick(parts.object, 'object')
            }
          }}
          title="Click to tag as Object"
        >
          <span className="desk-token-role-tag">
            {taggedObject ? 'Object' : 'Tap to tag'}
          </span>
          <span className="desk-token-text">{parts.object}</span>
        </div>
      </div>

      <div className="desk-boundary-hint">
        {splitIndex === null
          ? 'Notice: The verb is currently one whole token. Click a boundary line between letters to split into stem and ending.'
          : 'Verb split into stem and ending. Tag Subject and Object, then press Enter to submit.'}
      </div>

      {/* Diagnostic diff on miss */}
      {missDiff && (
        <div className="desk-role-diff-panel">
          <div className="desk-role-diff-title">Role Confusion Diagnostic:</div>
          <div className="desk-role-diff-row">
            <span>Subject:</span>
            <span className={missDiff.subject.match ? '' : 'desk-role-diff-mismatch'}>
              Tagged: "{missDiff.subject.given || '(empty)'}"
              {!missDiff.subject.match && ` -> Expected: "${missDiff.subject.expected}"`}
            </span>
          </div>
          <div className="desk-role-diff-row">
            <span>Stem:</span>
            <span className={missDiff.stem.match ? '' : 'desk-role-diff-mismatch'}>
              Tagged: "{missDiff.stem.given || '(empty)'}"
              {!missDiff.stem.match && ` -> Expected: "${missDiff.stem.expected}"`}
            </span>
          </div>
          <div className="desk-role-diff-row">
            <span>Ending:</span>
            <span className={missDiff.ending.match ? '' : 'desk-role-diff-mismatch'}>
              Tagged: "{missDiff.ending.given || '(empty)'}"
              {!missDiff.ending.match && ` -> Expected: "${missDiff.ending.expected}"`}
            </span>
          </div>
          <div className="desk-role-diff-row">
            <span>Object:</span>
            <span className={missDiff.object.match ? '' : 'desk-role-diff-mismatch'}>
              Tagged: "{missDiff.object.given || '(empty)'}"
              {!missDiff.object.match && ` -> Expected: "${missDiff.object.expected}"`}
            </span>
          </div>
        </div>
      )}

      <div className="desk-btn-group">
        <button
          type="button"
          className="desk-btn desk-btn--primary"
          onClick={handleSubmit}
        >
          Submit Role Tags <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}
