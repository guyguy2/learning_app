import React, { useEffect } from 'react'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'
import { DEFAULT_COPY } from './copy.js'
import spanishUi from '../subjects/spanish/ui.jsx'

/**
 * RepairPanel
 * Dedicated repair card for diagnosing mental model errors.
 * Renders the misconception name, pedagogical explanation, the subject's repair detail
 * for the missed exercise type (for example notional machine tiles with the mistaken form
 * struck through), and a single retest button.
 *
 * `detail` is the subject's `ui.repairDetails[pendingType]`; when omitted it falls back to
 * the Spanish detail for the pending type.
 */
export default function RepairPanel({
  repair,
  lastAttempt,
  onRetry,
  family,
  technique,
  detail,
  copy = DEFAULT_COPY,
}) {
  const misconception = repair?.misconception
  const isNamedMisconception = Boolean(misconception)
  const RepairDetail =
    detail === undefined ? spanishUi.repairDetails[repair?.pendingType] : detail

  // Enter key dismisses repair panel and advances to retest
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onRetry()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRetry])

  return (
    <div className="desk-card desk-card--slide desk-repair-panel">
      {isNamedMisconception && <DeskTechniqueBadge technique={technique} />}
      <div className="desk-label" style={{ color: '#9a4704' }}>
        {isNamedMisconception ? 'Misconception Repair' : 'Correction'}
      </div>

      <h1 className="desk-repair-title">
        {isNamedMisconception ? misconception.name : 'Let us review the expected form'}
      </h1>

      <div className="desk-repair-explanation">
        {isNamedMisconception
          ? misconception.explanation
          : copy.missExplanation}
      </div>

      {/* Subject-specific correction for the missed exercise type */}
      {isNamedMisconception && RepairDetail && (
        <RepairDetail repair={repair} lastAttempt={lastAttempt} family={family} />
      )}

      {/* Generic Miss Display */}
      {!isNamedMisconception && (
        <div className="desk-notional-machine-box">
          <div className="desk-notional-machine-title">Expected Answer:</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--feedback-green)' }}>
            {repair?.correctForm || copy.missFallbackAnswer}
          </div>
        </div>
      )}

      <div className="desk-btn-group">
        <button
          type="button"
          className="desk-btn desk-btn--primary"
          onClick={onRetry}
          autoFocus
        >
          {isNamedMisconception ? 'Try a similar one' : 'Try again'} <span className="desk-keycap">Enter</span>
        </button>
      </div>
    </div>
  )
}
