import { describe, expect, it } from 'vitest'
import editorialVariant from './index.jsx'
import SessionStartCard from './SessionStartCard.jsx'
import RepairPanel from './RepairPanel.jsx'
import SummaryView from './SummaryView.jsx'

function getTextContent(element) {
  if (element === null || element === undefined) return ''
  if (typeof element === 'string' || typeof element === 'number') return String(element)
  if (Array.isArray(element)) return element.map(getTextContent).join('')
  if (element.props && element.props.children) {
    return getTextContent(element.props.children)
  }
  return ''
}

describe('Editorial Variant', () => {
  it('exports valid variant descriptor', () => {
    expect(editorialVariant.id).toBe('editorial')
    expect(editorialVariant.name).toBe('Editorial')
    expect(editorialVariant.description).toContain('Near-monochrome')
    expect(typeof editorialVariant.Component).toBe('function')
  })

  it('renders SessionStartCard with plan review info and focus family', () => {
    const plan = {
      reviewChunkIds: ['ar'],
      newChunkId: 'er',
      phase: 'new',
    }
    const tree = SessionStartCard({ plan, begin: () => {} })
    const text = getTextContent(tree)
    expect(text).toContain('Ready to Study')
    expect(text).toContain('-ar verb family')
    expect(text).toContain('-er verb family')
    expect(text).toContain('Begin Session')
  })

  it('renders RepairPanel with diagnosed misconception', () => {
    const repair = {
      misconception: {
        id: 'overgen_ar_on_er',
        name: 'Overgeneralization: -ar on -er',
        explanation: 'Regular -er verbs use -e endings.',
      },
      correctForm: 'comes',
      notionalMachine: 'Drop -er, attach -es.',
      pendingStimulus: {},
      pendingType: 'production',
    }
    const lastAttempt = {
      chunkId: 'er',
      given: 'comas',
    }
    const tree = RepairPanel({
      repair,
      lastAttempt,
      onRetry: () => {},
      isReview: false,
    })
    const text = getTextContent(tree)
    expect(text).toContain('Overgeneralization: -ar on -er')
    expect(text).toContain('Regular -er verbs use -e endings.')
    expect(text).toContain('Try a similar one')
  })

  it('renders SummaryView with retention ladder rungs', () => {
    const progress = {
      session_number: 2,
      chunks: [
        {
          id: 'ar',
          mastered: true,
          ladder_step: 1,
          next_due_date: '2026-09-14',
        },
      ],
    }
    const tree = SummaryView({
      reviewedCount: 3,
      masteredChunkId: 'ar',
      progress,
      today: '2026-09-11',
      onStartNext: () => {},
    })
    const text = getTextContent(tree)
    expect(text).toContain('Session Report')
    expect(text).toContain('Items Reviewed: 3')
    expect(text).toContain('-ar Verb Family')
    expect(text).toContain('1d')
    expect(text).toContain('3d')
    expect(text).toContain('7d')
    expect(text).toContain('Next due date: 2026-09-14')
  })
})
