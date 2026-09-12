import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as spanishSeeds from '../src/subjects/spanish/seeds.js'
import * as programmingSeeds from '../src/subjects/programming/seeds.js'

export { getYesterdayIso } from '../src/subjects/seedHelpers.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(dirname, '..', 'content')

/**
 * Seed builders per subject. Node cannot load the subject modules themselves (they import
 * JSON without import attributes), so each subject keeps its builders in a Node-safe
 * seeds.js and names the content files they read. The subject module exposes the same
 * builders as `seeds`.
 */
const SUBJECT_SEEDS = {
  spanish: spanishSeeds,
  programming: programmingSeeds,
}

export const DEFAULT_SEED_SUBJECT = 'spanish'
export const SEEDED_SUBJECT_IDS = Object.keys(SUBJECT_SEEDS)

const contentCache = new Map()

function loadContent(subject) {
  if (!contentCache.has(subject)) {
    const files = SUBJECT_SEEDS[subject].contentFiles
    const content = Object.fromEntries(
      Object.entries(files).map(([key, file]) => [
        key,
        JSON.parse(readFileSync(path.join(CONTENT_DIR, file), 'utf-8')),
      ]),
    )
    contentCache.set(subject, content)
  }
  return contentCache.get(subject)
}

function seedsFor(subject) {
  const seeds = SUBJECT_SEEDS[subject]
  if (!seeds) throw new Error(`Unknown subject: ${subject}`)
  return seeds
}

/** Scenario names the subject can seed, for example ['fresh', 'mid', 'review-due']. */
export function seedScenarios(subject = DEFAULT_SEED_SUBJECT) {
  return Object.keys(seedsFor(subject).scenarios)
}

export function getFamilyVerbs(family) {
  return spanishSeeds.getFamilyVerbs(loadContent('spanish'), family)
}

/** Progress for a seed scenario of a subject (default Spanish). Throws on an unknown subject or scenario. */
export function buildSeed(scenario, { referenceDate, subject = DEFAULT_SEED_SUBJECT } = {}) {
  const builder = seedsFor(subject).scenarios[scenario]
  if (!builder) throw new Error(`Unknown seed scenario: ${scenario} (subject ${subject})`)
  return builder(loadContent(subject), { referenceDate })
}

// Spanish scenario shorthands, kept for existing callers.
export const buildFreshSeed = () => buildSeed('fresh')
export const buildMidSeed = () => buildSeed('mid')
export const buildReviewDueSeed = (referenceDate) => buildSeed('review-due', { referenceDate })

/** Fresh progress for a subject: what POST /api/progress/reset writes. */
export function buildResetProgress(subject = DEFAULT_SEED_SUBJECT) {
  return buildSeed('fresh', { subject })
}
