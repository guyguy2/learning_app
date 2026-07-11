const CHUNK_ORDER = ['ar', 'er', 'ir']

function byId(chunks, id) {
  return chunks.find((c) => c.id === id)
}

function isIntroduced(chunk) {
  return chunk.mastered || (chunk.production_phase != null && chunk.production_phase !== 'worked_example')
}

/**
 * Session chunk ordering — a selection layer, not a mastery gate (no chunk is ever locked).
 * Session one presents chunks blocked (one family fully before the next, in CHUNK_ORDER).
 * Session two onward interleaves across already-introduced, not-yet-mastered chunks,
 * favoring whichever has made the least progress (lowest streak_count) so attention
 * naturally rotates as chunks advance or reset on a miss.
 *
 * @returns {string|null} the chunkId to present next, or null once every chunk is mastered
 */
export function selectChunkForSession(progressState, sessionNumber) {
  const { chunks } = progressState

  if (sessionNumber <= 1) {
    const nextId = CHUNK_ORDER.find((id) => !byId(chunks, id)?.mastered)
    return nextId ?? null
  }

  const introducedUnmastered = CHUNK_ORDER.filter((id) => {
    const c = byId(chunks, id)
    return c && isIntroduced(c) && !c.mastered
  })

  if (introducedUnmastered.length === 0) {
    const bootstrapId = CHUNK_ORDER.find((id) => !byId(chunks, id)?.mastered)
    return bootstrapId ?? null
  }

  return introducedUnmastered
    .slice()
    .sort((a, b) => (byId(chunks, a).streak_count ?? 0) - (byId(chunks, b).streak_count ?? 0))[0]
}
