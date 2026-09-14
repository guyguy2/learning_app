/**
 * Runs every registered subject's validate() over its default content and exits non-zero
 * on the first failure. Usage: npm run validate-content
 *
 * Plain Node cannot import the subject registry (src/subjects/index.js): subjects import
 * JSON without import attributes and each registers a ui.jsx. Vite's SSR loader handles
 * both, so the registry stays the single list of subjects.
 */
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

/**
 * Validates each subject's content in order and stops at the first failure.
 * `getSubject(id)` returns a subject with `validate` and `content`.
 * @returns {string | null} a readable message for the first failure, or null when all pass
 */
export function findFirstFailure(ids, getSubject) {
  for (const id of ids) {
    try {
      const subject = getSubject(id)
      subject.validate(subject.content)
    } catch (err) {
      return `Content validation failed for subject "${id}": ${err.message}`
    }
  }
  return null
}

async function loadRegistry() {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, watch: null },
  })
  try {
    return await server.ssrLoadModule('/src/subjects/index.js')
  } finally {
    await server.close()
  }
}

async function main() {
  let registry
  try {
    registry = await loadRegistry()
  } catch (err) {
    console.error(`Could not load the subject registry: ${err.message}`)
    process.exitCode = 1
    return
  }
  const failure = findFirstFailure(registry.SUBJECT_IDS, registry.getSubject)
  if (failure) {
    console.error(failure)
    process.exitCode = 1
    return
  }
  console.log(`Content valid for: ${registry.SUBJECT_IDS.join(', ')}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
