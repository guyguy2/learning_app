import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SessionSummary from './SessionSummary'
import { techniqueFor } from '../screenTechniques'

describe('techniqueFor', () => {
  it('returns an object with techniqueName and explanation for production', () => {
    const entry = techniqueFor('production')
    expect(entry).toEqual(
      expect.objectContaining({
        techniqueName: expect.any(String),
        explanation: expect.any(String),
      }),
    )
    expect(entry.techniqueName).toBe('Notional machine')
  })

  it('returns null for nonexistent keys without throwing', () => {
    expect(() => techniqueFor('nonexistent')).not.toThrow()
    expect(techniqueFor('nonexistent')).toBeNull()
  })
})

describe('SessionSummary', () => {
  it('is a function (React component)', () => {
    expect(typeof SessionSummary).toBe('function')
  })

  it('renders Session complete and the reviewedCount', () => {
    const html = renderToStaticMarkup(
      <SessionSummary
        reviewedCount={7}
        masteredChunkId={null}
        onStartNext={() => {}}
      />,
    )
    expect(html).toContain('Session complete')
    expect(html).toContain('7')
  })

  it('shows the mastered chunk line only when masteredChunkId is set', () => {
    const withoutMastery = renderToStaticMarkup(
      <SessionSummary
        reviewedCount={2}
        masteredChunkId={null}
        onStartNext={() => {}}
      />,
    )
    const withMastery = renderToStaticMarkup(
      <SessionSummary
        reviewedCount={2}
        masteredChunkId="ar"
        onStartNext={() => {}}
      />,
    )

    expect(withoutMastery).not.toContain('mastered')
    expect(withMastery).toContain('mastered')
    expect(withMastery).toContain('ar')
  })

  it('calls onStartNext when Start next session is clicked', () => {
    let called = false
    const element = SessionSummary({
      reviewedCount: 0,
      masteredChunkId: null,
      onStartNext: () => {
        called = true
      },
    })
    const button = React.Children.toArray(element.props.children).find(
      (child) => child?.type === 'button',
    )
    expect(button).toBeTruthy()
    expect(button.props.children).toBe('Start next session')
    button.props.onClick()
    expect(called).toBe(true)
  })
})
