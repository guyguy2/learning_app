import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultProgress } from './progressStore.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const VOCAB_PATH = path.join(dirname, '..', 'content', 'spanish', 'vocab.json')
const vocab = JSON.parse(readFileSync(VOCAB_PATH, 'utf-8'))

export function getFamilyVerbs(family) {
  return vocab.filter((v) => v.pos === 'verb' && v.family === family)
}

export function getYesterdayIso(referenceDate = new Date()) {
  const d = new Date(referenceDate)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function buildFreshSeed() {
  return defaultProgress()
}

export function buildMidSeed() {
  const base = defaultProgress()
  const arVerbs = getFamilyVerbs('ar')
  const words = arVerbs.map((v) => ({
    id: v.id,
    status: 'mastered',
    streak_count: 2,
  }))

  const chunks = base.chunks.map((c) => {
    if (c.id === 'ar') {
      return {
        ...c,
        mastered: false,
        mastered_date: null,
        streak_count: 0,
        types_in_streak: [],
        ladder_step: null,
        last_reviewed_date: null,
        next_due_date: null,
        production_phase: 'guided',
      }
    }
    return c
  })

  return {
    session_number: 2,
    words,
    chunks,
  }
}

export function buildReviewDueSeed(referenceDate = new Date()) {
  const base = defaultProgress()
  const yesterday = getYesterdayIso(referenceDate)
  const arVerbs = getFamilyVerbs('ar')
  const erVerbs = getFamilyVerbs('er')

  const words = [...arVerbs, ...erVerbs].map((v) => ({
    id: v.id,
    status: 'mastered',
    streak_count: 2,
  }))

  const chunks = base.chunks.map((c) => {
    if (c.id === 'ar') {
      return {
        ...c,
        mastered: true,
        mastered_date: yesterday,
        streak_count: 0,
        types_in_streak: [],
        ladder_step: 0,
        last_reviewed_date: yesterday,
        next_due_date: yesterday,
        production_phase: 'guided',
      }
    }
    if (c.id === 'er') {
      return {
        ...c,
        mastered: false,
        mastered_date: null,
        streak_count: 0,
        types_in_streak: [],
        ladder_step: null,
        last_reviewed_date: null,
        next_due_date: null,
        production_phase: 'guided',
      }
    }
    return c
  })

  return {
    session_number: 3,
    words,
    chunks,
  }
}

export function buildSeed(scenario, { referenceDate } = {}) {
  switch (scenario) {
    case 'fresh':
      return buildFreshSeed()
    case 'mid':
      return buildMidSeed()
    case 'review-due':
      return buildReviewDueSeed(referenceDate)
    default:
      throw new Error(`Unknown seed scenario: ${scenario}`)
  }
}
