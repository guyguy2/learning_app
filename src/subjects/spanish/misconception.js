/**
 * Spanish distractor matching. The distractor schema (false_cognate, overgeneralization)
 * is Spanish content, so the matcher lives with the subject. The catalog lookup
 * (getMisconception) is subject-free and stays in the engine; it is re-exported here so
 * Spanish callers have one import.
 */
export { getMisconception } from '../../engine/misconception.js'

/**
 * Match a wrong-answer attempt against seeded distractors.
 *
 * attempt shape:
 *   {
 *     type: 'false_cognate' | 'overgeneralization',
 *     wordId?: string,   // false_cognate
 *     verbId?: string | null,  // overgeneralization (null for irregular seeds)
 *     person?: string,   // overgeneralization
 *     given: string      // the learner's wrong response
 *   }
 *
 * returns: { misconceptionId, distractorId } | null
 *   null = wrong answer with no seeded distractor (no false attribution)
 */
export function matchMisconception(attempt, distractors) {
  if (!attempt || attempt.given == null || attempt.given === '') return null
  if (!Array.isArray(distractors)) return null

  for (const d of distractors) {
    if (d.type === 'false_cognate' && attempt.type === 'false_cognate') {
      if (attempt.wordId === d.word_id && attempt.given === d.distractor) {
        return { misconceptionId: d.misconception_id, distractorId: d.id }
      }
    }

    if (d.type === 'overgeneralization' && attempt.type === 'overgeneralization') {
      if (
        attempt.verbId === d.verb_id &&
        attempt.person === d.person &&
        attempt.given === d.distractor_form
      ) {
        return { misconceptionId: d.misconception_id, distractorId: d.id }
      }
    }
  }

  return null
}
