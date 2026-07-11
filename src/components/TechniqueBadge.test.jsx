import { describe, expect, it } from 'vitest'
import React from 'react'
import TechniqueBadge from './TechniqueBadge'

describe('TechniqueBadge', () => {
  it('is a function (React component)', () => {
    expect(typeof TechniqueBadge).toBe('function')
  })

  it('correctly returns a React element structure when called', () => {
    const badge = <TechniqueBadge techniqueName="Notional machine" explanation="A mental model" />
    expect(badge.type).toBe(TechniqueBadge)
    expect(badge.props.techniqueName).toBe('Notional machine')
    expect(badge.props.explanation).toBe('A mental model')
  })
})
