/** Spanish answer grading, shared by the subject contract and the Desk cards. */

export function normalize(text) {
  return (text || '').trim().toLowerCase()
}

/** Accepted meanings for a vocab entry: synonyms split on ; or , */
export function acceptedMeanings(meaning) {
  return (meaning || '').split(/[;,]/).map(normalize).filter(Boolean)
}

export function gradeRecognition(attempt, stimulus) {
  return acceptedMeanings(stimulus?.word?.meaning).includes(normalize(attempt?.given))
}

export function gradeProduction(attempt, stimulus) {
  if (!stimulus?.expectedForm) return false
  return normalize(attempt?.given) === normalize(stimulus.expectedForm)
}

export function gradeRoleTagging(attempt, stimulus) {
  const parts = stimulus?.parts
  const given = attempt?.given
  if (!parts || !given) return false
  return ['subject', 'stem', 'ending', 'object'].every(
    (role) => normalize(given[role]) === normalize(parts[role]),
  )
}
