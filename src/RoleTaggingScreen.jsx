import { useState } from 'react'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'

const EMPTY_TAGS = { subject: '', stem: '', ending: '', object: '' }

function normalize(text) {
  return text.trim().toLowerCase()
}

function feedbackClass(feedback) {
  if (!feedback) return ''
  return feedback === 'correct' ? 'feedback--success' : 'feedback--error'
}

function RoleTaggingScreen({ stimulus, onAttempt, feedback }) {
  const [tags, setTags] = useState(EMPTY_TAGS)

  function submitTags(event) {
    event.preventDefault()
    const correct = ['subject', 'stem', 'ending', 'object'].every(
      (role) => normalize(tags[role]) === normalize(stimulus.parts[role]),
    )

    onAttempt({
      type: 'role-tagging',
      chunkId: stimulus.chunkId,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
      given: { ...tags },
    })
    setTags(EMPTY_TAGS)
  }

  return (
    <div>
      <TechniqueBadge {...techniqueFor('role-tagging')} />
      <div className="drill">
        <h1 className="drill__title">Role tagging</h1>
        <p className="drill__prompt">
          Tag the subject, stem, ending, and object in: <strong>{stimulus.sentence}</strong>
        </p>
        <form className="drill__form" onSubmit={submitTags}>
          {['subject', 'stem', 'ending', 'object'].map((role) => (
            <div key={role} className="drill__form-row">
              <label className="drill__label" htmlFor={`role-${role}`}>
                {role}
              </label>
              <input
                id={`role-${role}`}
                className="input"
                value={tags[role]}
                onChange={(e) => setTags({ ...tags, [role]: e.target.value })}
              />
            </div>
          ))}
          <div className="drill__actions">
            <button type="submit" className="btn">
              Submit
            </button>
          </div>
        </form>
        {feedback && <p className={`feedback ${feedbackClass(feedback)}`}>{feedback}</p>}
      </div>
    </div>
  )
}

export default RoleTaggingScreen