import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getSubject } from '../index.js'
import { correctMessage } from '../../desk/DeskApp.jsx'
import RepairPanel from '../../desk/RepairPanel.jsx'
import SessionStartCard from '../../desk/SessionStartCard.jsx'
import { deskCopy } from '../../desk/copy.js'

const subject = getSubject('programming')
const { cards, repairDetails } = subject.ui
const firstOfType = (type) => subject.content.items.find((i) => i.type === type)
const [firstChunk, secondChunk] = subject.chunks(subject.content)

describe('programming Desk cards', () => {
  it('renders a recognition card with the snippet and its badge', () => {
    const Card = cards.recognition
    const item = firstOfType('recognition')
    const html = renderToStaticMarkup(
      <Card
        stimulus={{ type: 'recognition', chunkId: item.chunk, item }}
        onSubmit={() => {}}
        technique={subject.techniques.recognition}
      />,
    )
    expect(html).toContain('Trace the Code')
    expect(html).toContain('desk-code')
    expect(html).toContain('console.log')
    expect(html).toContain('Retrieval practice')
  })

  it('renders the completion scaffold: worked example, then guided with a hint, then independent without', () => {
    const Card = cards.completion
    const workedExample = subject.content.workedExamples[0]
    const weHtml = renderToStaticMarkup(
      <Card
        stimulus={{ type: 'completion', phase: 'worked_example', chunkId: workedExample.chunk, workedExample }}
        onSubmit={() => {}}
        technique={subject.techniques.completion}
      />,
    )
    expect(weHtml).toContain('Worked Example (I-Do)')
    expect(weHtml).toContain(workedExample.title)
    expect(weHtml).toContain('desk-worked-steps')
    expect(weHtml).toContain('Faded worked example')

    const item = firstOfType('completion')
    const stimulus = { type: 'completion', chunkId: item.chunk, item }
    const guided = renderToStaticMarkup(
      <Card stimulus={{ ...stimulus, phase: 'guided', hint: 'Remember x.' }} onSubmit={() => {}} />,
    )
    expect(guided).toContain('Guided Practice (We-Do)')
    expect(guided).toContain('Remember x.')

    const independent = renderToStaticMarkup(
      <Card stimulus={{ ...stimulus, phase: 'independent', hint: null }} onSubmit={() => {}} />,
    )
    expect(independent).toContain('Independent Recall (You-Do)')
    expect(independent).not.toContain('Hint:')
  })

  it('renders a named repair with the programming detail instead of Spanish tiles', () => {
    const repair = {
      misconception: { id: 'var_block_scoped', name: 'Expecting var to be block scoped', explanation: 'var is function scoped.' },
      correctForm: '3',
      notionalMachine: 'A function keeps a live reference.',
      pendingType: 'recognition',
    }
    const html = renderToStaticMarkup(
      <RepairPanel
        repair={repair}
        lastAttempt={{ given: '0' }}
        onRetry={() => {}}
        family="closures"
        technique={subject.techniques.repair}
        detail={repairDetails.recognition}
        copy={deskCopy(subject)}
      />,
    )
    expect(html).toContain('Expecting var to be block scoped')
    expect(html).toContain('A function keeps a live reference.')
    expect(html).toContain('<del')
    expect(html).not.toContain('Cognate Contrast')
    expect(html).not.toContain('desk-tiles')
  })

  it('uses subject labels and wording on the start card', () => {
    const html = renderToStaticMarkup(
      <SessionStartCard
        plan={{ reviewChunkIds: [secondChunk.id], newChunkId: firstChunk.id, phase: 'review' }}
        begin={() => {}}
        chunkLabel={(id) => subject.chunks(subject.content).find((c) => c.id === id).label}
        copy={deskCopy(subject)}
      />,
    )
    expect(html).toContain(`Due today: ${secondChunk.label} (1 concept)`)
    expect(html).toContain(`Working concept: ${firstChunk.label}`)
    expect(html).not.toContain(`-${firstChunk.id}`)
  })

  it('formats the correct-answer strip through the subject', () => {
    const item = firstOfType('recognition')
    const stimulus = { type: 'recognition', item }
    expect(correctMessage({ type: 'recognition', given: item.answer }, stimulus, subject)).toBe(
      `Correct: it logs ${item.answer}`,
    )
  })
})
