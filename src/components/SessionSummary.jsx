import React from 'react'

/**
 * SessionSummary - Presentational session-end screen.
 * Props-driven only: no fetch, no engine calls, no clock reads.
 *
 * @param {Object} props
 * @param {number} props.reviewedCount - How many review items were completed
 * @param {string | null} props.masteredChunkId - Chunk mastered this session, if any (e.g. 'ar')
 * @param {() => void} props.onStartNext - Handler for "Start next session"
 */
export default function SessionSummary({
  reviewedCount,
  masteredChunkId,
  onStartNext,
}) {
  return (
    <div>
      <h1>Session complete</h1>
      <p>Reviewed {reviewedCount} items</p>
      {masteredChunkId != null && masteredChunkId !== '' && (
        <p>Congratulations — you mastered the {masteredChunkId} chunk!</p>
      )}
      <button type="button" onClick={onStartNext}>
        Start next session
      </button>
    </div>
  )
}
