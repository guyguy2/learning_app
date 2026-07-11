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

/**
 * Look up a misconception catalog entry for repair UI.
 * returns: { id, name, explanation } | null
 */
export function getMisconception(misconceptionId, misconceptions) {
  if (!misconceptionId || !Array.isArray(misconceptions)) return null
  const entry = misconceptions.find((m) => m.id === misconceptionId)
  if (!entry) return null
  return { id: entry.id, name: entry.name, explanation: entry.explanation }
}
