import express from 'express'
import { isValidSubjectId, readProgress, writeProgress } from './progressStore.js'
import { buildResetProgress, buildSeed } from './seeds.js'

/** The Express app without a listener, so tests can serve it on an ephemeral port. */
export function createApp() {
  const app = express()

  app.use(express.json())

  // Optional ?subject=<id> selects that subject's progress file (default: Spanish progress.json).
  app.get('/api/progress', async (req, res) => {
    const { subject } = req.query
    if (!isValidSubjectId(subject)) return res.status(400).json({ error: 'invalid subject' })
    res.json(await readProgress(subject))
  })

  app.post('/api/progress', async (req, res) => {
    const { subject } = req.query
    if (!isValidSubjectId(subject)) return res.status(400).json({ error: 'invalid subject' })
    res.json(await writeProgress(req.body, subject))
  })

  app.post('/api/progress/reset', async (req, res) => {
    const { subject } = req.query
    if (!isValidSubjectId(subject)) return res.status(400).json({ error: 'invalid subject' })
    let resetState
    try {
      resetState = buildResetProgress(subject)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
    res.json(await writeProgress(resetState, subject))
  })

  app.post('/api/progress/seed', async (req, res) => {
    const { subject } = req.query
    if (!isValidSubjectId(subject)) return res.status(400).json({ error: 'invalid subject' })
    const { scenario } = req.body || {}
    let seedState
    try {
      seedState = buildSeed(scenario, { subject })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
    res.json(await writeProgress(seedState, subject))
  })

  return app
}
