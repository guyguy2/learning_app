import React from 'react'
import './SessionSummary.css'

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
    <div className="session-summary-card">
      <h1 className="summary-title">Session complete</h1>
      <p className="summary-text">Reviewed {reviewedCount} items</p>
      {masteredChunkId != null && masteredChunkId !== '' && (
        <p className="summary-success-text">
          Congratulations — you mastered the {masteredChunkId} chunk!
        </p>
      )}
      <button type="button" className="summary-button" onClick={onStartNext}>
        Start next session
      </button>
    </div>
  )
}
