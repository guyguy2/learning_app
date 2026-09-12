/**
 * Spanish Desk UI: exercise type -> card component, plus the repair-panel details.
 * Components are module-level so React keeps their identity (and input state) across renders.
 */
import RecognitionCard from '../../desk/RecognitionCard.jsx'
import WorkedExampleCard from '../../desk/WorkedExampleCard.jsx'
import GuidedCard from '../../desk/GuidedCard.jsx'
import IndependentCard from '../../desk/IndependentCard.jsx'
import RoleTaggingCard from '../../desk/RoleTaggingCard.jsx'
import StemEndingTile from '../../desk/StemEndingTile.jsx'

function SpanishRecognitionCard({ stimulus, onSubmit, technique }) {
  return (
    <RecognitionCard
      key={stimulus.word.id}
      stimulus={stimulus}
      onSubmit={onSubmit}
      technique={technique}
    />
  )
}

/** Production fades worked example (I-do) -> guided (We-do) -> independent (You-do). */
function SpanishProductionCard({ stimulus, attemptCount, onSubmit, technique }) {
  if (stimulus.phase === 'worked_example') {
    return (
      <WorkedExampleCard
        key={`we-${stimulus.chunkId}`}
        stimulus={stimulus}
        onAcknowledge={onSubmit}
        technique={technique}
      />
    )
  }
  if (stimulus.phase === 'guided') {
    return (
      <GuidedCard
        key={`guided-${stimulus.verb.id}-${stimulus.person}`}
        stimulus={stimulus}
        attemptCount={attemptCount}
        onSubmit={onSubmit}
        technique={technique}
      />
    )
  }
  if (stimulus.phase === 'independent') {
    return (
      <IndependentCard
        key={`ind-${stimulus.verb.id}-${stimulus.person}`}
        stimulus={stimulus}
        onSubmit={onSubmit}
        technique={technique}
      />
    )
  }
  return null
}

function SpanishRoleTaggingCard({ stimulus, onSubmit, technique }) {
  return (
    <RoleTaggingCard
      key={`role-${stimulus.verb.id}-${stimulus.person}`}
      stimulus={stimulus}
      onSubmit={onSubmit}
      technique={technique}
    />
  )
}

/** Named overgeneralization: re-show the notional machine with the wrong ending struck. */
function ProductionRepairDetail({ repair, lastAttempt, family }) {
  let stem = ''
  let wrongEnding = ''
  let correctEnding = ''

  if (repair?.correctForm && lastAttempt?.given) {
    const correctFull = repair.correctForm
    const givenFull = lastAttempt.given

    // Approximate stem by matching prefix of correct form
    for (let i = Math.min(correctFull.length, givenFull.length); i > 0; i--) {
      if (correctFull.slice(0, i) === givenFull.slice(0, i)) {
        stem = correctFull.slice(0, i)
        wrongEnding = givenFull.slice(i)
        correctEnding = correctFull.slice(i)
        break
      }
    }
    if (!stem) {
      stem = correctFull.slice(0, -2)
      wrongEnding = givenFull
      correctEnding = correctFull.slice(-2)
    }
  }

  return (
    <div className="desk-notional-machine-box">
      <div className="desk-notional-machine-title">Notional Machine Correction:</div>
      {typeof repair.notionalMachine === 'string' && (
        <p className="desk-notional-machine-text" style={{ marginBottom: '1rem' }}>
          {repair.notionalMachine}
        </p>
      )}

      <StemEndingTile
        stem={stem}
        ending={wrongEnding || lastAttempt?.given}
        correctEnding={correctEnding || repair.correctForm}
        family={family || 'ar'}
        isStruck={true}
      />
    </div>
  )
}

/** Named false cognate: strike the English look-alike, show the real meaning. */
function RecognitionRepairDetail({ repair, lastAttempt }) {
  return (
    <div className="desk-notional-machine-box">
      <div className="desk-notional-machine-title">Cognate Contrast:</div>
      <div style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>
        <del style={{ color: '#b91c1c', marginRight: '0.75rem' }}>
          {lastAttempt?.given || 'false cognate'}
        </del>
        <span style={{ color: 'var(--feedback-green)', fontWeight: 700 }}>
          {repair.correctForm}
        </span>
      </div>
    </div>
  )
}

function chunkColor(chunkId) {
  if (chunkId === 'er') return 'var(--family-er)'
  if (chunkId === 'ir') return 'var(--family-ir)'
  return 'var(--family-ar)'
}

/** @type {import('../contract.js').SubjectUi} */
const spanishUi = {
  cards: {
    recognition: SpanishRecognitionCard,
    production: SpanishProductionCard,
    'role-tagging': SpanishRoleTaggingCard,
  },
  repairDetails: {
    recognition: RecognitionRepairDetail,
    production: ProductionRepairDetail,
  },
  chunkColor,
  // Vocabulary stimuli carry the word, not a chunkId; verbs name their family.
  chunkOf: (stimulus) => stimulus?.word?.family,
}

export default spanishUi
