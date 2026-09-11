const PERSON_LABELS = {
  yo: 'yo',
  tu: 'tú',
  el_ella_usted: 'él/ella/usted',
  nosotros: 'nosotros/nosotras',
  vosotros: 'vosotros/vosotras',
  ellos_ellas_ustedes: 'ellos/ellas/ustedes',
}

/** Display label for an engine person key (e.g. 'el_ella_usted' -> 'él/ella/usted'). */
export function personLabel(person) {
  return PERSON_LABELS[person] || person
}
