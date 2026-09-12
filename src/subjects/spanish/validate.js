import { PERSONS } from './conjugation.js'

const DISTRACTOR_TYPES = ['false_cognate', 'overgeneralization']

function fail(message) {
  throw new Error(`spanish content: ${message}`)
}

function requireString(entry, field, where) {
  if (typeof entry?.[field] !== 'string' || entry[field] === '') {
    fail(`${where} is missing string field "${field}"`)
  }
}

function requireArray(content, key) {
  if (!Array.isArray(content?.[key])) fail(`"${key}" must be an array`)
}

function requireUniqueIds(entries, where) {
  const seen = new Set()
  for (const e of entries) {
    if (seen.has(e.id)) fail(`${where} has duplicate id "${e.id}"`)
    seen.add(e.id)
  }
}

/**
 * Throw on malformed Spanish content. Checks shape plus cross-references: verb families
 * need a worked example, distractors must point at real vocab and catalog entries.
 */
export function validateSpanishContent(content) {
  for (const key of ['vocab', 'workedExamples', 'distractors', 'misconceptions']) {
    requireArray(content, key)
  }

  const families = new Set()
  content.workedExamples.forEach((we, i) => {
    const where = `workedExamples[${i}]`
    for (const field of ['family', 'stem', 'notional_machine']) requireString(we, field, where)
    for (const person of PERSONS) {
      if (typeof we.endings?.[person] !== 'string') fail(`${where} is missing the ending for "${person}"`)
    }
    if (!Array.isArray(we.paradigm) || we.paradigm.length === 0) fail(`${where} needs a non-empty paradigm`)
    families.add(we.family)
  })

  content.vocab.forEach((v, i) => {
    const where = `vocab[${i}]`
    for (const field of ['id', 'word', 'meaning', 'pos']) requireString(v, field, where)
    if (v.pos === 'verb') {
      if (!families.has(v.family)) fail(`${where} ("${v.id}") has no worked example for family "${v.family}"`)
      if (!v.word.endsWith(v.family)) fail(`${where} ("${v.id}") does not end in "-${v.family}"`)
    }
  })
  requireUniqueIds(content.vocab, 'vocab')

  content.misconceptions.forEach((m, i) => {
    for (const field of ['id', 'name', 'explanation']) requireString(m, field, `misconceptions[${i}]`)
  })
  requireUniqueIds(content.misconceptions, 'misconceptions')

  const vocabIds = new Set(content.vocab.map((v) => v.id))
  const misconceptionIds = new Set(content.misconceptions.map((m) => m.id))
  content.distractors.forEach((d, i) => {
    const where = `distractors[${i}]`
    requireString(d, 'id', where)
    if (!DISTRACTOR_TYPES.includes(d.type)) fail(`${where} has unknown type "${d.type}"`)
    if (!misconceptionIds.has(d.misconception_id)) {
      fail(`${where} references unknown misconception "${d.misconception_id}"`)
    }
    if (d.type === 'false_cognate') {
      requireString(d, 'distractor', where)
      if (!vocabIds.has(d.word_id)) fail(`${where} references unknown word "${d.word_id}"`)
    } else {
      requireString(d, 'distractor_form', where)
      requireString(d, 'person', where)
      if (d.verb_id != null && !vocabIds.has(d.verb_id)) fail(`${where} references unknown verb "${d.verb_id}"`)
    }
  })
  requireUniqueIds(content.distractors, 'distractors')
}
