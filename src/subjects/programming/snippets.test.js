/**
 * Runs every programming snippet with node so the content cannot rot: worked examples log
 * their stated output, recognition items log their answer (or throw the named error),
 * completion items log their output for the answer and every accepted variant, and each
 * seeded completion distractor really does produce something else.
 *
 * Snippets run as ES modules (strict mode, top-level await allowed) in a child process, so
 * timers, promises, and the event loop behave exactly as they do in node.
 */
import { execFile } from 'node:child_process'
import { beforeAll, describe, expect, it } from 'vitest'
import programming, { BLANK, normalizeCode } from './index.js'

const { items, workedExamples, distractors } = programming.content
const CONCURRENCY = 8

function runSnippet(code) {
  return new Promise((resolve) => {
    execFile(process.execPath, ['--input-type=module', '-e', code], { timeout: 10_000 }, (err, stdout, stderr) => {
      const error = err ? (stderr.match(/^(\w*Error)\b/m)?.[1] ?? `exit ${err.code ?? err.signal}`) : null
      resolve({ stdout, error })
    })
  })
}

async function runAll(checks) {
  const results = new Map()
  let next = 0
  async function worker() {
    while (next < checks.length) {
      const check = checks[next++]
      results.set(check.name, await runSnippet(check.code))
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

const fill = (item, text) => item.code.replace(BLANK, text)

/** Every snippet to run, with what its run must show. */
const checks = [
  ...workedExamples.map((we) => ({ name: `worked example ${we.chunk}`, code: we.code, logs: we.output })),
  ...items
    .filter((item) => item.type === 'recognition')
    .map((item) =>
      item.throws
        ? { name: `recognition ${item.id}`, code: item.code, throws: item.throws }
        : { name: `recognition ${item.id}`, code: item.code, logs: item.answer },
    ),
  ...items
    .filter((item) => item.type === 'completion')
    .flatMap((item) =>
      [item.answer, ...(item.accepted ?? [])].map((variant, i) => ({
        name: `completion ${item.id} ${i === 0 ? 'answer' : `accepted[${i - 1}]`}`,
        code: fill(item, variant),
        logs: item.output,
      })),
    ),
  ...distractors
    .map((d) => ({ d, item: items.find((item) => item.id === d.item_id) }))
    .filter(({ item }) => item?.type === 'completion')
    .map(({ d, item }) => ({ name: `distractor ${d.id}`, code: fill(item, d.given), notLogs: item.output })),
]

let results
beforeAll(async () => {
  results = await runAll(checks)
}, 120_000)

describe('programming snippets run and produce their stated answers', () => {
  it.each(checks.map((check) => [check.name, check]))('%s', (_name, check) => {
    const { stdout, error } = results.get(check.name)
    if (check.throws) {
      expect(error).toBe(check.throws)
    } else if (check.logs != null) {
      expect(error).toBeNull()
      expect(normalizeCode(stdout)).toBe(normalizeCode(check.logs))
    } else {
      // A distractor is wrong if it throws or logs something other than the stated output.
      if (error === null) expect(normalizeCode(stdout)).not.toBe(normalizeCode(check.notLogs))
    }
  })
})
