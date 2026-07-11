import { useState } from 'react'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'

const EMPTY_TAGS = { subject: '', stem: '', ending: '', object: '' }

function normalize(text) {
  return text.trim().toLowerCase()
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
      <h1>Role tagging</h1>
      <p>
        Tag the subject, stem, ending, and object in: <strong>{stimulus.sentence}</strong>
      </p>
      <form onSubmit={submitTags}>
        {['subject', 'stem', 'ending', 'object'].map((role) => (
          <div key={role}>
            <label>
              {role}:{' '}
              <input
                value={tags[role]}
                onChange={(e) => setTags({ ...tags, [role]: e.target.value })}
              />
            </label>
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
      {feedback && <p>{feedback}</p>}
    </div>
  )
}

export default RoleTaggingScreen
