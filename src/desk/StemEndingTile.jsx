import React from 'react'

/**
 * StemEndingTile
 * Visualizes verb morphology as physical paper slips (stem and ending).
 * Supports joined, separated, blank, guided input, and struck-through error states.
 */
export default function StemEndingTile({
  stem,
  ending,
  family,
  isJoined = false,
  isAnimated = false,
  isBlank = false,
  isStruck = false,
  correctEnding = '',
  isGuided = false,
  guidedValue = '',
  onGuidedChange,
  onGuidedKeyDown,
  inputRef,
}) {
  return (
    <div className="desk-tiles-container">
      <div className={`desk-tiles ${isJoined ? 'desk-tiles--joined' : 'desk-tiles--separated'}`}>
        {/* Stem Slip */}
        <div className="desk-slip desk-slip--stem">
          <span className="desk-slip__tag">Stem</span>
          <span className="desk-slip__content">{stem}</span>
        </div>

        {/* Ending Slip: input mode for guided practice, or display slip */}
        {isGuided ? (
          <div className="desk-slip desk-slip--ending desk-slip--input">
            <span className="desk-slip__tag">Ending ({family})</span>
            <input
              ref={inputRef}
              type="text"
              className="desk-slip__input"
              value={guidedValue}
              onChange={(e) => onGuidedChange && onGuidedChange(e.target.value)}
              onKeyDown={onGuidedKeyDown}
              placeholder="..."
              autoFocus
              aria-label={`Ending for -${family}`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        ) : (
          <div
            key={ending || 'ending'}
            className={`desk-slip desk-slip--ending ${
              isAnimated ? 'desk-slip--ending-animated' : ''
            } ${isBlank ? 'desk-slip--blank' : ''}`}
          >
            <span className="desk-slip__tag">Ending ({family})</span>
            {isStruck ? (
              <div className="desk-slip__struck-group">
                <del className="desk-slip__struck">{ending}</del>
                <span className="desk-slip__replacement">{correctEnding}</span>
              </div>
            ) : isBlank ? (
              <span className="desk-slip__content" style={{ opacity: 0.3 }}>
                ...
              </span>
            ) : (
              <span className="desk-slip__content">{ending}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
