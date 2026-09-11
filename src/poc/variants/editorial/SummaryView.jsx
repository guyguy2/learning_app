import TechniquePill from './TechniquePill.jsx'

const LADDER_DAYS = [1, 3, 7, 14, 30]

export default function SummaryView({
  reviewedCount,
  masteredChunkId,
  progress,
  today,
  onStartNext,
}) {
  const masteredChunks = (progress?.chunks ?? []).filter((c) => c.mastered)
  const activeFamily = masteredChunkId || (masteredChunks[0]?.id) || 'ar'

  return (
    <div className={`editorial-card family-${activeFamily} editorial-drill-enter`}>
      <TechniquePill techniqueKey="review" />

      <header className="editorial-card__header">
        <div className="editorial-card__kicker">Printed Dispatch</div>
        <h1 className="editorial-card__title">Session Report</h1>
        <p className="editorial-card__subtitle">
          Summary of cognitive practice and spaced review schedule.
        </p>
      </header>

      <div className="editorial-summary-report">
        <div className="editorial-report-meta">
          <span>Date: {today}</span>
          <span>Session #{progress?.session_number ?? 1}</span>
          <span>Items Reviewed: {reviewedCount}</span>
        </div>

        {masteredChunkId && (
          <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--editorial-hairline)' }}>
            <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-correct)' }}>
              Mastery Milestone
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--editorial-ink)' }}>
              Successfully mastered the -{masteredChunkId} verb family.
            </div>
          </div>
        )}

        <div className="editorial-ladder-section">
          <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)', marginBottom: '1rem' }}>
            Retention Ladders & Spaced Intervals
          </div>

          {masteredChunks.length > 0 ? (
            masteredChunks.map((chunk) => {
              const currentStep = chunk.ladder_step ?? 0
              return (
                <div key={chunk.id} className="editorial-ladder-card">
                  <div className="editorial-ladder-title">
                    -{chunk.id} Verb Family
                  </div>
                  <div className="editorial-ladder-strip">
                    {LADDER_DAYS.map((days, idx) => {
                      const isActive = idx === currentStep
                      const isPassed = idx < currentStep
                      return (
                        <div
                          key={days}
                          className={`editorial-ladder-rung ${isActive ? 'editorial-ladder-rung--active' : ''}`}
                          style={{
                            borderColor: isPassed ? 'var(--editorial-hairline-dark)' : undefined,
                          }}
                        >
                          <div>{days}d</div>
                          <div style={{ fontSize: '0.65rem', marginTop: '0.15rem' }}>
                            {isActive ? 'Current' : isPassed ? 'Done' : 'Pending'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="editorial-due-date-text">
                    Next due date: {chunk.next_due_date || 'None scheduled'}
                  </div>
                </div>
              )
            })
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--editorial-ink-muted)' }}>
              No verb families mastered yet. Complete production drills to enter the spaced repetition ladder.
            </p>
          )}
        </div>

        {/* Mini calendar strip of upcoming due dates */}
        {masteredChunks.length > 0 && (
          <div style={{ margin: '2rem 0', padding: '1rem 0', borderTop: '1px solid var(--editorial-hairline)' }}>
            <div style={{ fontSize: '0.75rem', fontVariant: 'all-small-caps', letterSpacing: '0.08em', color: 'var(--editorial-ink-muted)', marginBottom: '0.75rem' }}>
              Upcoming Review Calendar
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {masteredChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  style={{
                    border: '1px solid var(--editorial-hairline)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '2px',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>-{chunk.id}:</span>{' '}
                  <span style={{ color: 'var(--editorial-ink-muted)' }}>
                    {chunk.next_due_date || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="editorial-actions" style={{ marginTop: '2rem' }}>
          <span className="editorial-hint-text">Ready for next session</span>
          <button
            type="button"
            className="editorial-btn-primary"
            onClick={onStartNext}
          >
            Start Next Session
          </button>
        </div>
      </div>
    </div>
  )
}
