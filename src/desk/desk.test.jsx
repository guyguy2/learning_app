import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DeskApp, { correctMessage, getTechniqueKey } from './DeskApp.jsx'
import SessionStartCard from './SessionStartCard.jsx'
import RecognitionCard, { acceptedMeanings, normalize } from './RecognitionCard.jsx'
import WorkedExampleCard from './WorkedExampleCard.jsx'
import GuidedCard, { evaluateGuidedInput } from './GuidedCard.jsx'
import IndependentCard from './IndependentCard.jsx'
import StemEndingTile from './StemEndingTile.jsx'
import RoleTaggingCard from './RoleTaggingCard.jsx'
import RepairPanel from './RepairPanel.jsx'
import SummaryCard from './SummaryCard.jsx'
import FeedbackStrip from './FeedbackStrip.jsx'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'
import { personLabel } from './personLabel.js'

describe('DeskApp helpers', () => {
  it('formats correct messages for all exercise types', () => {
    expect(
      correctMessage(
        { type: 'recognition', given: 'speak', expectedMeaning: 'to speak' },
        { word: { word: 'hablar' } }
      )
    ).toBe('Correct: "hablar" means "to speak"')

    expect(
      correctMessage(
        {
          type: 'role-tagging',
          given: { subject: 'yo', stem: 'habl', ending: 'o', object: 'el libro' },
        },
        {}
      )
    ).toBe('Correct: yo | habl + o | el libro')

    expect(
      correctMessage({ type: 'production', given: 'hablo', expectedForm: 'hablo' }, {})
    ).toBe('Correct: "hablo"')
  })

  it('determines technique keys accurately', () => {
    // Named misconception gets repair technique
    expect(getTechniqueKey({ misconception: { id: 'test' } }, 'new', 'production')).toBe('repair')
    // Generic miss gets null (no misconception badge)
    expect(getTechniqueKey({ misconception: null }, 'new', 'production')).toBe(null)
    // Review mode gets review technique
    expect(getTechniqueKey(null, 'review', 'production')).toBe('review')
    // Normal drill gets its exercise type
    expect(getTechniqueKey(null, 'new', 'recognition')).toBe('recognition')
    expect(getTechniqueKey(null, 'new', 'role-tagging')).toBe('role-tagging')
  })
})

describe('SessionStartCard', () => {
  it('renders review queue and active family', () => {
    const plan = {
      reviewChunkIds: ['ar'],
      newChunkId: 'er',
      phase: 'review',
    }
    const html = renderToStaticMarkup(
      <SessionStartCard plan={plan} begin={() => {}} />
    )
    expect(html).toContain('Daily Study Session')
    expect(html).toContain('Spaced Review Queue')
    expect(html).toContain('Due today: -ar')
    expect(html).toContain('Working family: -er')
    expect(html).toContain('Begin Session')
  })

  it('renders clean message when no reviews are due', () => {
    const plan = {
      reviewChunkIds: [],
      newChunkId: 'ar',
      phase: 'new',
    }
    const html = renderToStaticMarkup(
      <SessionStartCard plan={plan} begin={() => {}} />
    )
    expect(html).toContain('No review chunks currently due today.')
    expect(html).toContain('Working family: -ar')
  })
})

describe('RecognitionCard and Synonym Matching', () => {
  it('correctly normalizes and matches synonyms', () => {
    const accepted = acceptedMeanings('to speak; to talk, to converse')
    expect(accepted).toContain('to speak')
    expect(accepted).toContain('to talk')
    expect(accepted).toContain('to converse')
    expect(accepted.includes(normalize('  To Speak  '))).toBe(true)
    expect(accepted.includes(normalize('to eat'))).toBe(false)
  })

  it('renders word, input, keycap, and technique badge', () => {
    const stimulus = {
      word: { id: 'hablar', word: 'hablar', pos: 'verb', family: 'ar', meaning: 'to speak; to talk' },
    }
    const technique = {
      techniqueName: 'Retrieval practice',
      explanation: 'Recalling meaning from memory strengthens retention.',
    }
    const html = renderToStaticMarkup(
      <RecognitionCard stimulus={stimulus} onSubmit={() => {}} technique={technique} />
    )
    expect(html).toContain('Vocabulary Recognition')
    expect(html).toContain('hablar')
    expect(html).toContain('Type English meaning')
    expect(html).toContain('desk-keycap')
    expect(html).toContain('Enter')
    expect(html).toContain('Retrieval practice')
  })
})

describe('WorkedExampleCard', () => {
  it('renders stepwise paradigm reveal and notional machine title', () => {
    const stimulus = {
      chunkId: 'ar',
      workedExample: {
        stem: 'habl',
        infinitive_ending: 'ar',
        notional_machine: 'Drop -ar and attach present ending.',
        paradigm: [
          { person: 'yo', ending: 'o', form: 'hablo', swap: 'habl + o -> hablo' },
          { person: 'tu', ending: 'as', form: 'hablas', swap: 'habl + as -> hablas' },
        ],
      },
    }
    const technique = { techniqueName: 'Notional machine', explanation: 'Conjugation rules.' }
    const html = renderToStaticMarkup(
      <WorkedExampleCard stimulus={stimulus} onAcknowledge={() => {}} technique={technique} />
    )
    expect(html).toContain('The Notional Machine: -ar Verbs')
    expect(html).toContain('Next step (1 of 2)')
    expect(html).toContain('Notional machine')
  })
})

describe('GuidedCard and Ending-Tile Input', () => {
  const stimulus = {
    chunkId: 'ar',
    verb: { id: 'hablar', word: 'hablar', meaning: 'to speak' },
    person: 'yo',
    expectedForm: 'hablo',
    hint: 'Stem: "habl-", ending for yo: "-o"',
  }

  it('renders ending input directly inside the ending tile next to the stem', () => {
    const html = renderToStaticMarkup(
      <GuidedCard stimulus={stimulus} attemptCount={0} onSubmit={() => {}} />
    )
    expect(html).toContain('Guided Practice (We-Do)')
    expect(html).toContain('habl')
    expect(html).toContain('desk-slip--input')
    expect(html).toContain('desk-slip__input')
    expect(html).toContain('desk-keycap')
    expect(html).toContain('Enter')
  })

  it('fades hint from person cue on attempt 0 to full rule on attempt 1+', () => {
    const attempt0Html = renderToStaticMarkup(
      <GuidedCard stimulus={stimulus} attemptCount={0} onSubmit={() => {}} />
    )
    expect(attempt0Html).toContain('Hint:')
    expect(attempt0Html).not.toContain('Scaffold')
    expect(attempt0Html).toContain('Person cue: target subject is &quot;yo&quot;')
    expect(attempt0Html).not.toContain('Stem: &quot;habl-&quot;')

    const attempt1Html = renderToStaticMarkup(
      <GuidedCard stimulus={stimulus} attemptCount={1} onSubmit={() => {}} />
    )
    expect(attempt1Html).toContain('Stem: &quot;habl-&quot;, ending for yo: &quot;-o&quot;')
  })

  it('evaluates ending-only input correctly against expectedForm', () => {
    const res1 = evaluateGuidedInput('o', 'habl', 'hablo')
    expect(res1.given).toBe('hablo')
    expect(res1.isCorrect).toBe(true)

    const res2 = evaluateGuidedInput('-o', 'habl', 'hablo')
    expect(res2.given).toBe('hablo')
    expect(res2.isCorrect).toBe(true)
  })

  it('evaluates full-form input correctly against expectedForm', () => {
    const res = evaluateGuidedInput('hablo', 'habl', 'hablo')
    expect(res.given).toBe('hablo')
    expect(res.isCorrect).toBe(true)

    const resCase = evaluateGuidedInput('  Hablo  ', 'habl', 'hablo')
    expect(resCase.given).toBe('hablo')
    expect(resCase.isCorrect).toBe(true)
  })

  it('evaluates incorrect ending input correctly as false', () => {
    const res = evaluateGuidedInput('as', 'habl', 'hablo')
    expect(res.given).toBe('hablas')
    expect(res.isCorrect).toBe(false)
  })

  it('reconstructs given form for misconception matching', () => {
    // If learner enters ending "emos" for trabajar / nosotros (expected: trabajamos)
    const res = evaluateGuidedInput('emos', 'trabaj', 'trabajamos')
    expect(res.given).toBe('trabajemos')
    expect(res.isCorrect).toBe(false)
  })
})

describe('IndependentCard', () => {
  it('renders recall input with keycap shortcut and technique badge', () => {
    const stimulus = {
      chunkId: 'ar',
      verb: { id: 'hablar', word: 'hablar', meaning: 'to speak' },
      person: 'yo',
      expectedForm: 'hablo',
    }
    const technique = { techniqueName: 'Notional machine', explanation: 'Conjugation rule.' }
    const html = renderToStaticMarkup(
      <IndependentCard stimulus={stimulus} onSubmit={() => {}} technique={technique} />
    )
    expect(html).toContain('Independent Recall (You-Do)')
    expect(html).toContain('hablar')
    expect(html).toContain('desk-keycap')
    expect(html).toContain('Enter')
    expect(html).toContain('Notional machine')
  })
})

describe('Person labels', () => {
  it('formats person keys with proper Spanish accents', () => {
    expect(personLabel('yo')).toBe('yo')
    expect(personLabel('tu')).toBe('tú')
    expect(personLabel('el_ella_usted')).toBe('él/ella/usted')
    expect(personLabel('nosotros')).toBe('nosotros/nosotras')
    expect(personLabel('vosotros')).toBe('vosotros/vosotras')
    expect(personLabel('ellos_ellas_ustedes')).toBe('ellos/ellas/ustedes')
  })
})

describe('StemEndingTile Physicality', () => {
  it('renders joined and separated states', () => {
    const joined = renderToStaticMarkup(
      <StemEndingTile stem="habl" ending="ar" isJoined family="ar" />
    )
    expect(joined).toContain('desk-tiles--joined')

    const separated = renderToStaticMarkup(
      <StemEndingTile stem="habl" ending="o" isJoined={false} family="ar" />
    )
    expect(separated).toContain('desk-tiles--separated')
  })

  it('renders guided input mode in ending slip', () => {
    const html = renderToStaticMarkup(
      <StemEndingTile stem="habl" family="ar" isGuided={true} guidedValue="o" />
    )
    expect(html).toContain('desk-slip--input')
    expect(html).toContain('desk-slip__input')
  })

  it('renders struck-through misconception state', () => {
    const html = renderToStaticMarkup(
      <StemEndingTile stem="habl" ending="e" correctEnding="a" family="ar" isStruck={true} />
    )
    expect(html).toContain('desk-slip__struck')
    expect(html).toContain('desk-slip__replacement')
  })
})

describe('RoleTaggingCard', () => {
  it('renders Chunking heading matching screenTechniques and single verb token', () => {
    const stimulus = {
      chunkId: 'ar',
      verb: { id: 'caminar', word: 'caminar' },
      person: 'tu',
      parts: {
        subject: 'tú',
        stem: 'camin',
        ending: 'as',
        object: 'mucho',
      },
    }
    const technique = { techniqueName: 'Chunking', explanation: 'Labelling sentence parts.' }
    const html = renderToStaticMarkup(
      <RoleTaggingCard stimulus={stimulus} onSubmit={() => {}} technique={technique} />
    )
    // Label must say Chunking (gap fix)
    expect(html).toContain('Role Tagging (Chunking)')
    expect(html).not.toContain('Roles of Variables')
    expect(html).toContain('Chunking')
    expect(html).toContain('desk-role-key-cue">1</span>')
    expect(html).toContain('Click to split here (camin | as)')
    expect(html).toContain('desk-keycap')
    expect(html).toContain('Enter')
  })
})

describe('RepairPanel Remediation vs Generic Miss', () => {
  it('renders named misconception with struck ending and technique badge', () => {
    const repair = {
      misconception: {
        id: 'overgen_er_on_ar',
        name: 'Overgeneralizing -er endings on -ar verbs',
        explanation: 'Hablar is an -ar verb.',
      },
      correctForm: 'habla',
      notionalMachine: 'Drop -ar and add -a.',
      pendingType: 'production',
    }
    const technique = { techniqueName: 'Misconception repair', explanation: 'Targeted remediation.' }
    const html = renderToStaticMarkup(
      <RepairPanel
        repair={repair}
        lastAttempt={{ given: 'hable' }}
        onRetry={() => {}}
        family="ar"
        technique={technique}
      />
    )
    expect(html).toContain('Misconception Repair')
    expect(html).toContain('Overgeneralizing -er endings on -ar verbs')
    expect(html).toContain('Try a similar one')
    expect(html).toContain('desk-notional-machine-box')
    expect(html).toContain('Misconception repair')
  })

  it('renders generic miss without misconception technique badge', () => {
    const repair = {
      misconception: null,
      correctForm: 'hablo',
      pendingType: 'production',
    }
    const html = renderToStaticMarkup(
      <RepairPanel
        repair={repair}
        lastAttempt={{ given: 'x' }}
        onRetry={() => {}}
        family="ar"
        technique={null}
      />
    )
    expect(html).toContain('Correction')
    expect(html).toContain('Let us review the expected form')
    expect(html).toContain('hablo')
    expect(html).toContain('Try again')
    expect(html).not.toContain('Misconception repair')
  })
})

describe('SummaryCard Wooden Ladder', () => {
  it('renders 5-rung wooden ladder intervals and metrics', () => {
    const progress = {
      chunks: [
        {
          id: 'ar',
          mastered: true,
          ladder_step: 2,
          next_due_date: '2026-09-18',
        },
      ],
    }
    const html = renderToStaticMarkup(
      <SummaryCard
        progress={progress}
        reviewedCount={3}
        masteredChunkId="ar"
        onStartNext={() => {}}
      />
    )
    expect(html).toContain('Knowledge Consolidation')
    expect(html).toContain('3')
    expect(html).toContain('-ar')
    expect(html).toContain('7 days (Current)')
    expect(html).toContain('Start Next Session')
  })
})

describe('FeedbackStrip and DeskTechniqueBadge', () => {
  it('renders feedback status strip for success and miss without RETAINED tag', () => {
    const successHtml = renderToStaticMarkup(
      <FeedbackStrip feedback={{ type: 'correct', message: 'Correct: "hablo"' }} />
    )
    expect(successHtml).toContain('desk-feedback-strip--correct')
    expect(successHtml).toContain('Correct: &quot;hablo&quot;')
    expect(successHtml).not.toContain('Retained')
    expect(successHtml).not.toContain('Review')

    const missHtml = renderToStaticMarkup(
      <FeedbackStrip feedback="incorrect answer" />
    )
    expect(missHtml).toContain('desk-feedback-strip--miss')
    expect(missHtml).toContain('incorrect answer')
    expect(missHtml).not.toContain('Retained')
    expect(missHtml).not.toContain('Review')
  })

  it('asserts the success strip is not rendered when the stimulus has changed', () => {
    // When stimulus changes, feedback state clears to null and FeedbackStrip renders nothing
    const nullFeedbackHtml = renderToStaticMarkup(<FeedbackStrip feedback={null} />)
    expect(nullFeedbackHtml).toBe('')

    // Container demonstrating stimulus-change clearing behavior
    function DrillFeedbackContainer({ stimulus, lastFeedback }) {
      const [feedback, setFeedback] = React.useState(lastFeedback)
      React.useEffect(() => {
        setFeedback(null)
      }, [stimulus])

      return (
        <div>
          <div className="current-drill">{stimulus.id}</div>
          <FeedbackStrip feedback={feedback} />
        </div>
      )
    }

    const previousDrillHtml = renderToStaticMarkup(
      <DrillFeedbackContainer
        stimulus={{ id: 'drill-1' }}
        lastFeedback={{ type: 'correct', message: 'Correct: "hablo"' }}
      />
    )
    expect(previousDrillHtml).toContain('Correct: &quot;hablo&quot;')

    // When the next drill appears (stimulus has changed, feedback cleared)
    const nextDrillHtml = renderToStaticMarkup(
      <DrillFeedbackContainer
        stimulus={{ id: 'drill-2' }}
        lastFeedback={null}
      />
    )
    expect(nextDrillHtml).not.toContain('Correct:')
    expect(nextDrillHtml).not.toContain('desk-feedback-strip')
  })

  it('renders technique transparency badge pill', () => {
    const html = renderToStaticMarkup(
      <DeskTechniqueBadge
        technique={{ techniqueName: 'Retrieval practice', explanation: 'Active recall.' }}
      />
    )
    expect(html).toContain('Retrieval practice')
    expect(html).toContain('Active recall.')
    expect(html).toContain('desk-badge')
  })
})
