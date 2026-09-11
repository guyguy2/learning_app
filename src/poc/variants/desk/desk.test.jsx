import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import deskVariant, { correctMessage, getTechniqueKey } from './index.jsx'
import SessionStartCard from './SessionStartCard.jsx'
import RecognitionCard, { acceptedMeanings, normalize } from './RecognitionCard.jsx'
import WorkedExampleCard from './WorkedExampleCard.jsx'
import GuidedCard from './GuidedCard.jsx'
import IndependentCard from './IndependentCard.jsx'
import StemEndingTile from './StemEndingTile.jsx'
import RoleTaggingCard from './RoleTaggingCard.jsx'
import RepairPanel from './RepairPanel.jsx'
import SummaryCard from './SummaryCard.jsx'
import FeedbackStrip from './FeedbackStrip.jsx'
import DeskTechniqueBadge from './DeskTechniqueBadge.jsx'

describe('Desk Variant Metadata', () => {
  it('exports valid variant metadata and Component', () => {
    expect(deskVariant.id).toBe('desk')
    expect(deskVariant.name).toBe('Desk')
    expect(typeof deskVariant.description).toBe('string')
    expect(deskVariant.description).toContain('paper index cards')
    expect(typeof deskVariant.Component).toBe('function')
  })
})

describe('SessionStartCard', () => {
  it('renders review queue summary and upcoming family', () => {
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

  it('renders clean message when no review chunks are due', () => {
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
  it('correctly normalizes and matches semicolon and comma separated synonyms', () => {
    const meaning = 'to speak; to talk, to converse'
    const accepted = acceptedMeanings(meaning)

    expect(accepted).toContain('to speak')
    expect(accepted).toContain('to talk')
    expect(accepted).toContain('to converse')
    expect(accepted.includes(normalize('  To Speak  '))).toBe(true)
    expect(accepted.includes(normalize('to run'))).toBe(false)
  })

  it('renders large display target word and input', () => {
    const stimulus = {
      word: { id: 'hablar', word: 'hablar', pos: 'verb', family: 'ar', meaning: 'to speak; to talk' },
    }
    const html = renderToStaticMarkup(
      <RecognitionCard stimulus={stimulus} onSubmit={() => {}} />
    )
    expect(html).toContain('Vocabulary Recognition')
    expect(html).toContain('hablar')
    expect(html).toContain('Type English meaning')
    expect(html).toContain('Submit Answer')
  })
})

describe('WorkedExampleCard', () => {
  it('renders stepwise paradigm reveal rows', () => {
    const stimulus = {
      chunkId: 'ar',
      workedExample: {
        stem: 'habl',
        infinitive_ending: 'ar',
        paradigm: [
          { person: 'yo', ending: 'o', form: 'hablo', swap: 'habl + o -> hablo' },
          { person: 'tu', ending: 'as', form: 'hablas', swap: 'habl + as -> hablas' },
          { person: 'el/ella/usted', ending: 'a', form: 'habla', swap: 'habl + a -> habla' },
          { person: 'nosotros', ending: 'amos', form: 'hablamos', swap: 'habl + amos -> hablamos' },
          { person: 'vosotros', ending: 'ais', form: 'hablais', swap: 'habl + ais -> hablais' },
          { person: 'ellos/ellas/ustedes', ending: 'an', form: 'hablan', swap: 'habl + an -> hablan' },
        ],
      },
    }
    const html = renderToStaticMarkup(
      <WorkedExampleCard stimulus={stimulus} onAcknowledge={() => {}} />
    )
    expect(html).toContain('The Notional Machine: -ar Verbs')
    expect(html).toContain('Next step (1 of 6)')
  })
})

describe('GuidedCard Hint Fading', () => {
  const stimulus = {
    chunkId: 'ar',
    verb: { id: 'hablar', word: 'hablar', meaning: 'to speak' },
    person: 'yo',
    stem: 'habl',
    ending: 'o',
    hint: 'Stem: "habl-", ending for yo: "-o"',
  }

  it('shows person cue only on attempt 0', () => {
    const html = renderToStaticMarkup(
      <GuidedCard stimulus={stimulus} attemptCount={0} onSubmit={() => {}} />
    )
    expect(html).toContain('Person cue: target subject is &quot;yo&quot;')
    expect(html).not.toContain('Stem: &quot;habl-&quot;')
  })

  it('shows full hint on attempt 1 or greater', () => {
    const html = renderToStaticMarkup(
      <GuidedCard stimulus={stimulus} attemptCount={1} onSubmit={() => {}} />
    )
    expect(html).toContain('Stem: &quot;habl-&quot;, ending for yo: &quot;-o&quot;')
  })
})

describe('IndependentCard', () => {
  it('renders verb, person cue, and recall input without hint', () => {
    const stimulus = {
      chunkId: 'ar',
      verb: { id: 'hablar', word: 'hablar', meaning: 'to speak' },
      person: 'yo',
    }
    const html = renderToStaticMarkup(
      <IndependentCard stimulus={stimulus} onSubmit={() => {}} />
    )
    expect(html).toContain('Independent Recall (You-Do)')
    expect(html).toContain('hablar')
    expect(html).toContain('Enter conjugated form for yo...')
    expect(html).toContain('Submit Recall')
  })
})

describe('Person labels', () => {
  it('shows accented person labels instead of engine keys', () => {
    const stimulus = {
      chunkId: 'ar',
      verb: { id: 'estudiar', word: 'estudiar', meaning: 'to study' },
      person: 'el_ella_usted',
      expectedForm: 'estudia',
    }
    const independent = renderToStaticMarkup(<IndependentCard stimulus={stimulus} onSubmit={() => {}} />)
    const guided = renderToStaticMarkup(<GuidedCard stimulus={stimulus} attemptCount={0} onSubmit={() => {}} />)
    for (const html of [independent, guided]) {
      expect(html).toContain('él/ella/usted')
      expect(html).not.toContain('el_ella_usted')
    }
  })
})

describe('getTechniqueKey', () => {
  it('uses the misconception repair badge only for named misconceptions', () => {
    expect(getTechniqueKey({ misconception: { id: 'overgen_er_on_ar' } }, 'new', 'production')).toBe('repair')
    expect(getTechniqueKey({ misconception: null }, 'new', 'production')).toBe('production')
    expect(getTechniqueKey({ misconception: null }, 'review', 'production')).toBe('review')
  })
})

describe('correctMessage', () => {
  it('formats role-tagging answers instead of printing an object', () => {
    const msg = correctMessage(
      {
        type: 'role-tagging',
        correct: true,
        given: { subject: 'tú', stem: 'camin', ending: 'as', object: 'libro' },
      },
      {}
    )
    expect(msg).toBe('Correct: tú | camin + as | libro')
    expect(msg).not.toContain('[object Object]')
  })

  it('keeps the expected form for production answers', () => {
    expect(correctMessage({ type: 'production', given: 'hablo', expectedForm: 'hablo' }, {})).toBe(
      'Correct: "hablo"'
    )
  })
})

describe('StemEndingTile Physicality', () => {
  it('renders joined tiles with proper morphology', () => {
    const html = renderToStaticMarkup(
      <StemEndingTile stem="habl" ending="ar" isJoined family="ar" />
    )
    expect(html).toContain('habl')
    expect(html).toContain('ar')
    expect(html).toContain('desk-tiles--joined')
  })

  it('renders blank ending tile for guided practice', () => {
    const html = renderToStaticMarkup(
      <StemEndingTile stem="habl" ending="ar" isBlank family="ar" />
    )
    expect(html).toContain('habl')
    expect(html).toContain('...')
    expect(html).toContain('desk-slip--blank')
  })

  it('renders struck-through error ending with correction', () => {
    const html = renderToStaticMarkup(
      <StemEndingTile stem="habl" ending="as" isStruck correctEnding="o" family="ar" />
    )
    expect(html).toContain('habl')
    expect(html).toContain('as')
    expect(html).toContain('o')
    expect(html).toContain('desk-slip__struck')
    expect(html).toContain('desk-slip__replacement')
  })
})

describe('RoleTaggingCard', () => {
  it('renders single verb token with clickable boundaries and role selector', () => {
    const stimulus = {
      chunkId: 'ar',
      verb: { id: 'caminar', word: 'caminar' },
      person: 'tu',
      parts: {
        subject: 'tu',
        stem: 'camin',
        ending: 'as',
        object: 'mucho',
      },
    }
    const html = renderToStaticMarkup(
      <RoleTaggingCard stimulus={stimulus} onSubmit={() => {}} />
    )
    expect(html).toContain('Role Tagging (Roles of Variables)')
    expect(html).toContain('Subject')
    expect(html).toContain('Stem')
    expect(html).toContain('Ending')
    expect(html).toContain('Object')
    expect(html).toContain('desk-role-key-cue">1</span>')
    expect(html).toContain('Click to split here (camin | as)')
    expect(html).toContain('The verb is currently one whole token')
  })
})

describe('RepairPanel Misconception Remediation', () => {
  it('renders named misconception with struck-through machine', () => {
    const repair = {
      misconception: {
        id: 'overgen_er_on_ar',
        name: 'Overgeneralizing -er endings on -ar verbs',
        explanation: 'The verb hablar belongs to the -ar family, which takes -a, not -e.',
      },
      correctForm: 'habla',
      notionalMachine: 'Drop the infinitive ending (-ar) to get the stem, then attach the person ending.',
      pendingType: 'production',
      pendingStimulus: {},
    }
    const html = renderToStaticMarkup(
      <RepairPanel
        repair={repair}
        lastAttempt={{ given: 'hable' }}
        onRetry={() => {}}
        family="ar"
      />
    )
    expect(html).toContain('Misconception Repair')
    expect(html).toContain('Overgeneralizing -er endings on -ar verbs')
    expect(html).toContain('The verb hablar belongs to the -ar family')
    expect(html).toContain('desk-notional-machine-box')
    expect(html).toContain('Try a similar one')
  })

  it('renders generic miss panel with correct form', () => {
    const repair = {
      misconception: null,
      correctForm: 'hablo',
      notionalMachine: null,
      pendingType: 'production',
      pendingStimulus: {},
    }
    const html = renderToStaticMarkup(
      <RepairPanel repair={repair} onRetry={() => {}} family="ar" />
    )
    expect(html).toContain('Let us review the expected form')
    expect(html).toContain('hablo')
    expect(html).toContain('Try again')
  })
})

describe('SummaryCard Wooden Ladder', () => {
  it('renders 5-rung ladder intervals [1, 3, 7, 14, 30] and next due dates', () => {
    const progress = {
      session_number: 3,
      words: [],
      chunks: [
        {
          id: 'ar',
          mastered: true,
          ladder_step: 1, // 3-day interval
          next_due_date: '2026-09-14',
        },
      ],
    }
    const html = renderToStaticMarkup(
      <SummaryCard
        progress={progress}
        reviewedCount={4}
        masteredChunkId="ar"
        onStartNext={() => {}}
      />
    )
    expect(html).toContain('Knowledge Consolidation')
    expect(html).toContain('Newly Mastered')
    expect(html).toContain('-ar')
    expect(html).toContain('Next due: <strong>2026-09-14</strong>')
    expect(html).toContain('1 day')
    expect(html).toContain('3 days')
    expect(html).toContain('7 days')
    expect(html).toContain('14 days')
    expect(html).toContain('30 days')
    expect(html).toContain('Start Next Session')
  })
})

describe('FeedbackStrip and DeskTechniqueBadge', () => {
  it('renders docked feedback strip for correct and miss', () => {
    const correctHtml = renderToStaticMarkup(
      <FeedbackStrip feedback={{ type: 'correct', message: 'Correct: "hablo"' }} />
    )
    expect(correctHtml).toContain('Correct: &quot;hablo&quot;')
    expect(correctHtml).toContain('desk-feedback-strip--correct')

    const missHtml = renderToStaticMarkup(
      <FeedbackStrip feedback="incorrect - expected hablo" />
    )
    expect(missHtml).toContain('incorrect - expected hablo')
    expect(missHtml).toContain('desk-feedback-strip--miss')
  })

  it('renders collapsible technique pill', () => {
    const technique = {
      techniqueName: 'Notional machine',
      explanation: 'Making internal rules visible.',
    }
    const html = renderToStaticMarkup(
      <DeskTechniqueBadge technique={technique} />
    )
    expect(html).toContain('Notional machine')
    expect(html).toContain('Making internal rules visible.')
  })
})
