import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import machineVariant, {
  normalize,
  acceptedMeanings,
  stemOf,
  displayPerson,
  repairLabel,
  techniqueKeyFor,
} from './index.jsx'
import StemEndingBlock from './StemEndingBlock.jsx'
import SummaryLadder, { LADDER_DAYS } from './SummaryLadder.jsx'
import RoleTaggingDrill from './RoleTaggingDrill.jsx'

describe('Machine Variant metadata', () => {
  it('exports required metadata and Component', () => {
    expect(machineVariant.id).toBe('machine')
    expect(machineVariant.name).toBe('Machine')
    expect(machineVariant.description).toContain('notional machine')
    expect(typeof machineVariant.Component).toBe('function')
  })

  it('normalizes strings correctly', () => {
    expect(normalize('  HablO ')).toBe('hablo')
    expect(normalize('')).toBe('')
  })

  it('splits and normalizes accepted meanings', () => {
    expect(acceptedMeanings('to speak; to talk')).toEqual(['to speak', 'to talk'])
    expect(acceptedMeanings('folder, binder')).toEqual(['folder', 'binder'])
  })

  it('computes stemOf correctly', () => {
    expect(stemOf('hablar', 'ar')).toBe('habl')
    expect(stemOf('comer', 'er')).toBe('com')
    expect(stemOf('vivir', 'ir')).toBe('viv')
  })

  it('formats person display', () => {
    expect(displayPerson('yo')).toContain('yo')
    expect(displayPerson('tu')).toContain('tú')
  })
})

describe('StemEndingBlock', () => {
  it('renders stem and ending blocks', () => {
    const html = renderToStaticMarkup(
      <StemEndingBlock stem="habl" ending="o" family="ar" />,
    )
    expect(html).toContain('habl')
    expect(html).toContain('-o')
    expect(html).toContain('machine-tile-block--family-ar')
  })

  it('renders guided input in ending tile', () => {
    const html = renderToStaticMarkup(
      <StemEndingBlock stem="com" family="er" isGuided={true} guidedValue="es" />,
    )
    expect(html).toContain('com')
    expect(html).toContain('machine-tile-input')
  })

  it('renders repair visual with struck ending and correct ending', () => {
    const html = renderToStaticMarkup(
      <StemEndingBlock
        stem="com"
        family="er"
        isRepair={true}
        struckEnding="as"
        correctEnding="es"
      />,
    )
    expect(html).toContain('com')
    expect(html).toContain('machine-tile__struck')
    expect(html).toContain('-as')
    expect(html).toContain('-es')
  })
})

describe('SummaryLadder', () => {
  it('renders 5 ladder stops and reviewed count', () => {
    const sampleChunks = [
      { id: 'ar', mastered: true, ladder_step: 1, next_due_date: '2026-09-15' },
    ]
    const html = renderToStaticMarkup(
      <SummaryLadder
        chunks={sampleChunks}
        reviewedCount={3}
        masteredChunkId="ar"
        onStartNext={() => {}}
        today="2026-09-11"
      />,
    )
    expect(html).toContain('Reviewed items:')
    expect(html).toContain('3')
    expect(html).toContain('2026-09-15')
    expect(LADDER_DAYS).toEqual([1, 3, 7, 14, 30])
  })
})

describe('RoleTaggingDrill', () => {
  it('renders sentence tokens and role buttons', () => {
    const stimulus = {
      chunkId: 'ar',
      sentence: 'yo hablo el libro',
      parts: { subject: 'yo', stem: 'habl', ending: 'o', object: 'el libro' },
      verb: { id: 'hablar', word: 'hablar' },
      person: 'yo',
    }
    const html = renderToStaticMarkup(
      <RoleTaggingDrill stimulus={stimulus} onAttempt={() => {}} feedback={null} />,
    )
    expect(html).toContain('yo')
    expect(html).toContain('el libro')
    expect(html).toContain('machine-verb-token')
  })
})

describe('Machine repair labelling', () => {
  const named = { misconception: { id: 'overgen_er_on_ar', name: 'x', explanation: 'y' } }
  const generic = { misconception: null, correctForm: 'hablo' }

  it('labels only diagnosed misconceptions as misconception repair', () => {
    expect(repairLabel(named)).toBe('Misconception Repair')
    expect(repairLabel(generic)).toBe('Correction')
  })

  it('shows the repair technique only for diagnosed misconceptions', () => {
    expect(techniqueKeyFor(named, 'new', 'production', null)).toBe('repair')
    expect(techniqueKeyFor(generic, 'new', 'production', null)).toBe('production')
    expect(techniqueKeyFor(generic, 'review', 'production', null)).toBe('review')
  })
})
