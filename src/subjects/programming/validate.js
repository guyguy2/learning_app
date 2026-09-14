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

/** Output compared loosely: ignoring whitespace, commas, quotes, brackets, and case. */
export function looseOutput(text) {
  return String(text ?? '')
    .replace(/[\s,'"`[\]]/g, '')
    .toLowerCase()
}

/**
 * Sentences in a repair explanation: text ending in . ! or ? followed by a space or the end.
 * Runs of operator characters (??, ..., ===, ||) are code, not sentence ends, so they are
 * dropped first.
 */
export function sentenceCount(text) {
  return (text.replace(/[.!?|=&]{2,}/g, ' ').match(/[.!?](?=\s|$)/g) ?? []).length
}

/**
 * Throw on malformed programming content. Beyond shape:
 * - every chunk needs at least one item of each exercise type (otherwise the rotation has
 *   nothing to serve and the gate's two-type rule can never be met);
 * - a recognition item states what it logs (`answer`), or the error it throws (`throws`,
 *   equal to `answer`); a recognition synonym may differ from the answer only in formatting;
 * - a completion item has exactly one blank, a guided-phase `hint`, and the `output` the
 *   completed program logs;
 * - a worked example states its `output` (snippets.test.js runs every snippet to check it);
 * - a distractor is a wrong answer tied to a catalogued misconception, and every
 *   misconception is reachable through at least one distractor;
 * - a misconception explanation is two or three sentences.
 */
export function validateProgrammingContent(content) {
  for (const key of ['items', 'workedExamples', 'distractors', 'misconceptions']) {
    if (!Array.isArray(content?.[key])) fail(`"${key}" must be an array`)
  }

  content.workedExamples.forEach((we, i) => {
    const where = `workedExamples[${i}]`
    for (const field of ['chunk', 'title', 'notional_machine', 'code', 'output']) requireString(we, field, where)
    if (!Array.isArray(we.steps) || we.steps.length === 0) fail(`${where} needs a non-empty steps list`)
  })
  requireUniqueIds(content.workedExamples, 'chunk', 'workedExamples')
  const chunkIds = new Set(content.workedExamples.map((we) => we.chunk))

  content.items.forEach((item, i) => {
    const where = `items[${i}]`
    for (const field of ['id', 'chunk', 'type', 'prompt', 'code', 'answer']) requireString(item, field, where)
    const named = `${where} ("${item.id}")`
    if (!chunkIds.has(item.chunk)) fail(`${named} has unknown chunk "${item.chunk}"`)
    if (!ITEM_TYPES.includes(item.type)) fail(`${named} has unknown type "${item.type}"`)
    if (item.accepted != null && !(Array.isArray(item.accepted) && item.accepted.every((a) => typeof a === 'string'))) {
      fail(`${named} has a non-string accepted answer`)
    }
    if (item.type === 'recognition') {
      if (item.throws != null && item.throws !== item.answer) {
        fail(`${named} throws "${item.throws}" but answers "${item.answer}"`)
      }
      for (const a of item.accepted ?? []) {
        if (looseOutput(a) !== looseOutput(item.answer)) {
          fail(`${named} accepts "${a}", which is not a formatting variant of "${item.answer}"`)
        }
      }
    }
    if (item.type === 'completion') {
      if (item.code.split(BLANK).length !== 2) fail(`${named} is a completion item without exactly one ${BLANK} blank`)
      requireString(item, 'output', named)
      requireString(item, 'hint', named)
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
    const where = `misconceptions[${i}]`
    for (const field of ['id', 'name', 'explanation']) requireString(m, field, where)
    const sentences = sentenceCount(m.explanation)
    if (sentences < 2 || sentences > 3) {
      fail(`${where} ("${m.id}") explanation has ${sentences} sentences; use two or three`)
    }
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

  const reached = new Set(content.distractors.map((d) => d.misconception_id))
  for (const m of content.misconceptions) {
    if (!reached.has(m.id)) fail(`misconception "${m.id}" has no distractor, so repair can never name it`)
  }
}
