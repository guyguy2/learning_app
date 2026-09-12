import express from 'express'
import { defaultProgress, isValidSubjectId, readProgress, writeProgress } from './progressStore.js'
import { buildSeed } from './seeds.js'

const app = express()
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001


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

app.post('/api/progress/reset', async (_req, res) => {
  const resetState = defaultProgress()
  res.json(await writeProgress(resetState))
})

app.post('/api/progress/seed', async (req, res) => {
  const { scenario } = req.body || {}
  try {
    const seedState = buildSeed(scenario)
    res.json(await writeProgress(seedState))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
