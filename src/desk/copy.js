/**
 * Desk wording that names the subject's chunks. The defaults are the original Desk text,
 * written for Spanish verb families; a subject overrides any key through `ui.copy`.
 */
export const DEFAULT_COPY = {
  startIntro:
    'Review consolidated verbs and construct new grammatical schemas through retrieval practice.',
  reviewUnit: 'verb family',
  activeChunkHeading: 'Active Verb Family',
  workingChunk: 'Working family',
  allChunksIntroduced: 'All core families introduced.',
  summaryIntro: 'Your daily spaced repetitions and grammatical schema formations are saved.',
  reviewedLabel: 'Families Reviewed',
  ladderSuffix: 'Family Ladder',
  missExplanation: 'Carefully observe the correct grammatical form before trying the next drill.',
  missFallbackAnswer: 'Review sentence role boundaries',
}

/** Default chunk label: Spanish family ids render as "-ar". */
export function defaultChunkLabel(chunkId) {
  return `-${chunkId}`
}

/** Merge a subject's `ui.copy` overrides onto the defaults. */
export function deskCopy(subject) {
  return { ...DEFAULT_COPY, ...(subject?.ui?.copy ?? {}) }
}
