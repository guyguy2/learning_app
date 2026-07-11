import { useEffect, useState } from 'react'
import vocab from '../content/spanish/vocab.json'
import workedExamples from '../content/spanish/worked_examples.json'
import { applyRoleTaggingAttempt, getNextRoleTaggingStimulus } from './engine/roleTagging.js'

const CHUNK_ID = 'ar'
const CONTENT = { vocab, workedExamples }
const EMPTY_TAGS = { subject: '', stem: '', ending: '', object: '' }

function normalize(text) {
  return text.trim().toLowerCase()
}

async function persist(progress) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
  return res.json()
}

function RoleTaggingScreen() {
  const [progress, setProgress] = useState(null)
  const [stimulus, setStimulus] = useState(undefined)
  const [tags, setTags] = useState(EMPTY_TAGS)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then((loaded) => {
        setProgress(loaded)
        setStimulus(getNextRoleTaggingStimulus(loaded, CHUNK_ID, CONTENT))
      })
      .catch((err) => setError(err.message))
  }, [])

  async function submitTags(event) {
    event.preventDefault()
    const correct = ['subject', 'stem', 'ending', 'object'].every(
      (role) => normalize(tags[role]) === normalize(stimulus.parts[role]),
    )

    const attempt = {
      type: 'role-tagging',
      chunkId: CHUNK_ID,
      wordId: stimulus.verb.id,
      person: stimulus.person,
      correct,
    }
    const { progress: newProgress, next } = applyRoleTaggingAttempt(progress, attempt, CONTENT)
    setProgress(await persist(newProgress))
    setStimulus(next)
    setTags(EMPTY_TAGS)
    setFeedback(
      correct
        ? 'correct'
        : `incorrect — subject: "${stimulus.parts.subject}", stem: "${stimulus.parts.stem}", ending: "${stimulus.parts.ending}", object: "${stimulus.parts.object}"`,
    )
  }

  if (error) return <p>Error: {error}</p>
  if (stimulus === undefined) return <p>Loading...</p>
  if (stimulus === null) return <p>No mastered -ar vocab yet — master some words via recognition first.</p>

  return (
    <div>
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
