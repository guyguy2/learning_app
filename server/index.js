import express from 'express'
import { defaultProgress, readProgress, writeProgress } from './progressStore.js'
import { buildSeed } from './seeds.js'

const app = express()
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001

app.use(express.json())

app.get('/api/progress', async (_req, res) => {
  res.json(await readProgress())
})

app.post('/api/progress', async (req, res) => {
  res.json(await writeProgress(req.body))
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
