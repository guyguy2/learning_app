/**
 * Map of screen/phase keys to technique-transparency metadata for the technique badges.
 * Keys cover exercise types (recognition, production, role-tagging) and session phases
 * (review, repair).
 */
export const screenTechniques = {
  recognition: {
    techniqueName: 'Retrieval practice',
    explanation:
      'Recalling meaning from memory strengthens it more than review.',
  },
  production: {
    techniqueName: 'Notional machine',
    explanation:
      'The conjugation rule is an explicit mental model of how forms are built.',
  },
  'role-tagging': {
    techniqueName: 'Chunking',
    explanation: 'Labelling sentence parts groups them into meaningful units.',
  },
  review: {
    techniqueName: 'Spaced repetition',
    explanation:
      'Revisiting on a widening schedule tracks the forgetting curve.',
  },
  repair: {
    techniqueName: 'Misconception repair',
    explanation:
      'Naming and correcting a specific wrong mental model, not just marking it wrong.',
  },
}
