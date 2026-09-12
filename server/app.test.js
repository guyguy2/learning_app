import { once } from 'node:events'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Keep the real progress files untouched: capture writes instead of hitting the disk.
vi.mock('./progressStore.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, writeProgress: vi.fn(async (state) => state) }
})

import { PROGRESS_PATH, progressPathFor, writeProgress } from './progressStore.js'
import { buildResetProgress, buildSeed } from './seeds.js'
import { createApp } from './app.js'
import { SUBJECT_IDS } from '../src/subjects/index.js'

let server
let base

beforeAll(async () => {
  server = createApp().listen(0)
  await once(server, 'listening')
  base = `http://127.0.0.1:${server.address().port}`
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  writeProgress.mockClear()
})

function post(url, body) {
  return fetch(`${base}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

/** The file the one captured write would have gone to. */
function writtenFile() {
  expect(writeProgress).toHaveBeenCalledTimes(1)
  return progressPathFor(writeProgress.mock.calls[0][1])
}

describe('POST /api/progress/reset', () => {
  it.each(SUBJECT_IDS)('resets %s to its fresh progress in its own file', async (id) => {
    const res = await post(`/api/progress/reset?subject=${id}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(buildResetProgress(id))
    expect(writeProgress.mock.calls[0][0]).toEqual(buildResetProgress(id))
    expect(writtenFile()).toBe(progressPathFor(id))
  })

  it('writes programming progress to progress.programming.json', async () => {
    await post('/api/progress/reset?subject=programming')
    expect(path.basename(writtenFile())).toBe('progress.programming.json')
  })

  it('resets Spanish progress.json when no subject is given', async () => {
    const res = await post('/api/progress/reset')
    expect(await res.json()).toEqual(buildResetProgress('spanish'))
    expect(writtenFile()).toBe(PROGRESS_PATH)
  })

  it('rejects an invalid or unknown subject without writing', async () => {
    expect((await post('/api/progress/reset?subject=../secrets')).status).toBe(400)
    expect((await post('/api/progress/reset?subject=klingon')).status).toBe(400)
    expect(writeProgress).not.toHaveBeenCalled()
  })
})

describe('POST /api/progress/seed', () => {
  it.each(['fresh', 'mid', 'review-due'])('seeds Spanish %s into progress.json by default', async (scenario) => {
    const res = await post('/api/progress/seed', { scenario })
    expect(res.status).toBe(200)
    expect((await res.json()).chunks.map((c) => c.id)).toEqual(['ar', 'er', 'ir'])
    expect(writtenFile()).toBe(PROGRESS_PATH)
  })

  it.each(['fresh', 'review-due'])('seeds programming %s into progress.programming.json', async (scenario) => {
    const res = await post('/api/progress/seed?subject=programming', { scenario })
    expect(res.status).toBe(200)
    const seeded = await res.json()
    expect(seeded.chunks.map((c) => c.id)).toEqual(['closures', 'iteration', 'off-by-one'])
    expect(seeded.session_number).toBe(buildSeed(scenario, { subject: 'programming' }).session_number)
    expect(writtenFile()).toBe(progressPathFor('programming'))
  })

  it('rejects a scenario the subject does not define without writing', async () => {
    const res = await post('/api/progress/seed?subject=programming', { scenario: 'mid' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Unknown seed scenario: mid/)
    expect(writeProgress).not.toHaveBeenCalled()
  })

  it('rejects an invalid or unknown subject without writing', async () => {
    expect((await post('/api/progress/seed?subject=a/b', { scenario: 'fresh' })).status).toBe(400)
    expect((await post('/api/progress/seed?subject=klingon', { scenario: 'fresh' })).status).toBe(400)
    expect(writeProgress).not.toHaveBeenCalled()
  })
})
