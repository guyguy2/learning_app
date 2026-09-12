/**
 * Subject registry: joins each subject's framework-free module with its Desk UI into one
 * Subject object (see ./contract.js). UI code imports subjects from here; the engine
 * imports only the framework-free modules.
 */
import spanish from './spanish/index.js'
import spanishUi from './spanish/ui.jsx'
import programming from './programming/index.js'
import programmingUi from './programming/ui.jsx'

export const DEFAULT_SUBJECT_ID = 'spanish'

const SUBJECTS = {
  spanish: { ...spanish, ui: spanishUi },
  programming: { ...programming, ui: programmingUi },
}

export const SUBJECT_IDS = Object.keys(SUBJECTS)

const validated = new Set()

/**
 * The registered subject for `id`, or the default subject when `id` is missing or unknown.
 * Validates the subject's default content on first lookup, so malformed content fails loudly.
 */
export function getSubject(id) {
  const subject = SUBJECTS[id] ?? SUBJECTS[DEFAULT_SUBJECT_ID]
  if (!validated.has(subject.id)) {
    subject.validate(subject.content)
    validated.add(subject.id)
  }
  return subject
}
