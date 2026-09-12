/**
 * Look up a misconception catalog entry for repair UI.
 * Subject-free: every subject's misconceptions.json uses the { id, name, explanation } shape.
 * Distractor matching is subject-specific and lives with each subject (see src/subjects/).
 * returns: { id, name, explanation } | null
 */
export function getMisconception(misconceptionId, misconceptions) {
  if (!misconceptionId || !Array.isArray(misconceptions)) return null
  const entry = misconceptions.find((m) => m.id === misconceptionId)
  if (!entry) return null
  return { id: entry.id, name: entry.name, explanation: entry.explanation }
}
