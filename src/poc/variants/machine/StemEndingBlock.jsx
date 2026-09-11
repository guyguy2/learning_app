import React from 'react'

/**
 * StemEndingBlock - Hero Notional Machine Tiles
 * Sharp geometric blocks with 2px borders demonstrating stem + ending combinations.
 * Reused across Worked Example (animated swap), Guided Practice (empty ending input),
 * and Misconception Repair (struck-through wrong ending -> correct ending).
 */
export default function StemEndingBlock({
  stem,
  ending,
  family = 'ar',
  isGuided = false,
  guidedValue = '',
  onGuidedChange,
  onGuidedKeyDown,
  inputRef,
  isAnimating = false,
  oldEnding = null,
  isRepair = false,
  struckEnding = null,
  correctEnding = null,
}) {
  const familyClass = `machine-tile-block--family-${family}`

  return (
    <div className="machine-tile-stage">
      <div className="machine-tile-group">
        {/* Stem Tile */}
        <div className={`machine-tile-block machine-tile-block--stem ${familyClass}`}>
          {stem || '...'}
        </div>

        {/* Guided Practice: Ending Tile is an input */}
        {isGuided && (
          <div className={`machine-tile-block machine-tile-block--ending ${familyClass}`}>
            <input
              ref={inputRef}
              type="text"
              className="machine-tile-input"
              value={guidedValue}
              onChange={(e) => onGuidedChange && onGuidedChange(e.target.value)}
              onKeyDown={onGuidedKeyDown}
              placeholder="..."
              autoFocus
              aria-label="Ending"
            />
          </div>
        )}

        {/* Misconception Repair: Struck wrong ending -> correct ending */}
        {isRepair && (
          <div className={`machine-tile-block machine-tile-block--ending ${familyClass}`}>
            {struckEnding && <span className="machine-tile__struck">-{struckEnding}</span>}
            <span className="machine-tile__correct">-{correctEnding || ending}</span>
          </div>
        )}

        {/* Animated Swap in Worked Example */}
        {!isGuided && !isRepair && isAnimating && oldEnding && (
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div
              className={`machine-tile-block machine-tile-block--ending ${familyClass} machine-ending--detaching`}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              -{oldEnding}
            </div>
            <div className={`machine-tile-block machine-tile-block--ending ${familyClass} machine-ending--sliding`}>
              -{ending}
            </div>
          </div>
        )}

        {/* Standard Static Display */}
        {!isGuided && !isRepair && (!isAnimating || !oldEnding) && (
          <div className={`machine-tile-block machine-tile-block--ending ${familyClass}`}>
            -{ending || ''}
          </div>
        )}
      </div>
    </div>
  )
}
