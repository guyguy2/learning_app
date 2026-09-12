/**
 * Map an engine person key to the string distractors.json uses for `person`.
 * Distractor/matcher comparisons are exact-string, so this mapping must stay in sync
 * with content/spanish/distractors.json's `person` values.
 */
const PERSON_TO_DISTRACTOR_KEY = {
  yo: 'yo',
  tu: 'tú',
  el_ella_usted: 'él/ella/usted',
  nosotros: 'nosotros/nosotras',
  vosotros: 'vosotros/vosotras',
  ellos_ellas_ustedes: 'ellos/ellas/ustedes',
}

export function mapPersonForMisconception(person) {
  return PERSON_TO_DISTRACTOR_KEY[person] ?? person
}
