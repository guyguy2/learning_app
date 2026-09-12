const ITEM_TYPES = ['recognition', 'completion']
const BLANK = '____'

function fail(message) {
  throw new Error(`programming content: ${message}`)
}

function requireString(entry, field, where) {
  if (typeof entry?.[field] !== 'string' || entry[field] === '') {
    fail(`${where} is missing string field "${field}"`)
  }
}

function requireUniqueIds(entries, key, where) {
  const seen = new Set()
  for (const e of entries) {
    if (seen.has(e[key])) fail(`${where} has duplicate ${key} "${e[key]}"`)
    seen.add(e[key])
  }
}

function normalizeCode(text) {
  return String(text ?? '')
    .replace(/\s+/g, '')
    .replace(/;+$/, '')
}

/**
 * Throw on malformed programming content. Beyond shape, every chunk needs at least one
 * item of each exercise type (otherwise the rotation has nothing to serve and the gate's
 * two-type rule can never be met), and a distractor must be a wrong answer.
 */
export function validateProgrammingContent(content) {
  for (const key of ['items', 'workedExamples', 'distractors', 'misconceptions']) {
    if (!Array.isArray(content?.[key])) fail(`"${key}" must be an array`)
  }

  content.workedExamples.forEach((we, i) => {
    const where = `workedExamples[${i}]`
    for (const field of ['chunk', 'title', 'notional_machine', 'code']) requireString(we, field, where)
    if (!Array.isArray(we.steps) || we.steps.length === 0) fail(`${where} needs a non-empty steps list`)
  })
  requireUniqueIds(content.workedExamples, 'chunk', 'workedExamples')
  const chunkIds = new Set(content.workedExamples.map((we) => we.chunk))

  content.items.forEach((item, i) => {
    const where = `items[${i}]`
    for (const field of ['id', 'chunk', 'type', 'prompt', 'code', 'answer']) requireString(item, field, where)
    if (!chunkIds.has(item.chunk)) fail(`${where} ("${item.id}") has unknown chunk "${item.chunk}"`)
    if (!ITEM_TYPES.includes(item.type)) fail(`${where} ("${item.id}") has unknown type "${item.type}"`)
    if (item.type === 'completion' && !item.code.includes(BLANK)) {
      fail(`${where} ("${item.id}") is a completion item without a ${BLANK} blank`)
    }
    if (item.accepted != null && !(Array.isArray(item.accepted) && item.accepted.every((a) => typeof a === 'string'))) {
      fail(`${where} ("${item.id}") has a non-string accepted answer`)
    }
  })
  requireUniqueIds(content.items, 'id', 'items')

  for (const chunk of chunkIds) {
    for (const type of ITEM_TYPES) {
      if (!content.items.some((item) => item.chunk === chunk && item.type === type)) {
        fail(`chunk "${chunk}" has no ${type} item`)
      }
    }
  }

  content.misconceptions.forEach((m, i) => {
    for (const field of ['id', 'name', 'explanation']) requireString(m, field, `misconceptions[${i}]`)
  })
  requireUniqueIds(content.misconceptions, 'id', 'misconceptions')

  const itemsById = new Map(content.items.map((item) => [item.id, item]))
  const misconceptionIds = new Set(content.misconceptions.map((m) => m.id))
  content.distractors.forEach((d, i) => {
    const where = `distractors[${i}]`
    for (const field of ['id', 'item_id', 'given', 'misconception_id']) requireString(d, field, where)
    const item = itemsById.get(d.item_id)
    if (!item) fail(`${where} references unknown item "${d.item_id}"`)
    if (!misconceptionIds.has(d.misconception_id)) {
      fail(`${where} references unknown misconception "${d.misconception_id}"`)
    }
    const correct = [item.answer, ...(item.accepted ?? [])].map(normalizeCode)
    if (correct.includes(normalizeCode(d.given))) fail(`${where} ("${d.id}") is a correct answer`)
  })
  requireUniqueIds(content.distractors, 'id', 'distractors')
}
