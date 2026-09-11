import RecognitionScreen from './RecognitionScreen.jsx'
import ProductionScreen from './ProductionScreen.jsx'
import RoleTaggingScreen from './RoleTaggingScreen.jsx'
import MisconceptionRepair from './components/MisconceptionRepair.jsx'
import SessionSummary from './components/SessionSummary.jsx'
import TechniqueBadge from './components/TechniqueBadge.jsx'
import { techniqueFor } from './screenTechniques.js'
import { useSessionRunner } from './poc/useSessionRunner.js'

function App() {
  const {
    status,
    error,
    progress,
    mode,
    exerciseType,
    stimulus,
    feedback,
    repair,
    reviewedCount,
    masteredChunkId,
    onAttempt,
    onRetry,
    onStartNext,
  } = useSessionRunner({ autoStart: true })

  if (error || status === 'error') {
    return (
      <div className="app">
        <p className="app-status app-status--error">Error: {error}</p>
      </div>
    )
  }
  if (status === 'loading' || progress === null) {
    return (
      <div className="app">
        <p className="app-status">Loading…</p>
      </div>
    )
  }

  if (status === 'summary') {
    return (
      <SessionSummary
        reviewedCount={reviewedCount}
        masteredChunkId={masteredChunkId}
        onStartNext={onStartNext}
      />
    )
  }

  const ExerciseScreen = {
    recognition: RecognitionScreen,
    production: ProductionScreen,
    'role-tagging': RoleTaggingScreen,
  }[exerciseType]

  return (
    <div className="app">
      {mode === 'review' && <TechniqueBadge {...techniqueFor('review')} />}
      {repair ? (
        repair.misconception ? (
          <>
            <TechniqueBadge {...techniqueFor('repair')} />
            <MisconceptionRepair
              misconception={repair.misconception}
              correctForm={repair.correctForm}
              notionalMachine={repair.notionalMachine}
              onRetry={onRetry}
            />
          </>
        ) : (
          <div className="retry-panel">
            <p className="retry-panel__message">{feedback}</p>
            <button type="button" className="btn" onClick={onRetry}>
              Try again
            </button>
          </div>
        )
      ) : (
        stimulus && ExerciseScreen && (
          <ExerciseScreen stimulus={stimulus} onAttempt={onAttempt} feedback={feedback} />
        )
      )}
    </div>
  )
}

export default App
