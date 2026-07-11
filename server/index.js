import express from 'express'
import { readProgress, writeProgress } from './progressStore.js'

const app = express()
const PORT = 3001

app.use(express.json())

app.get('/api/progress', async (_req, res) => {
  res.json(await readProgress())
})

app.post('/api/progress', async (req, res) => {
  res.json(await writeProgress(req.body))
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
