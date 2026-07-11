import { describe, expect, it } from 'vitest'
import React from 'react'
import MisconceptionRepair from './MisconceptionRepair'

// Helper to recursively extract text content from standard React JSX element structure
function getTextContent(element) {
  if (element === null || element === undefined) return ''
  if (typeof element === 'string' || typeof element === 'number') return String(element)
  if (Array.isArray(element)) return element.map(getTextContent).join('')
  if (element.props && element.props.children) {
    return getTextContent(element.props.children)
  }
  return ''
}

// Helper to recursively find a React element by its tag name or component type
function findElement(tree, type) {
  if (!tree) return null
  if (tree.type === type) return tree
  if (tree.props && tree.props.children) {
    if (Array.isArray(tree.props.children)) {
      for (const child of tree.props.children) {
        const found = findElement(child, type)
        if (found) return found
      }
    } else {
      return findElement(tree.props.children, type)
    }
  }
  return null
}

describe('MisconceptionRepair', () => {
  it('renders the misconception name and explanation', () => {
    const tree = MisconceptionRepair({
      misconception: { name: 'False cognate: embarazada', explanation: 'Embarazada means pregnant, not embarrassed.' },
      correctForm: 'pregnant',
      onRetry: () => {}
    })
    
    const text = getTextContent(tree)
    expect(text).toContain('Misconception: False cognate: embarazada')
    expect(text).toContain('Embarazada means pregnant, not embarrassed.')
  })

  it('renders the correctForm and optional notionalMachine when provided', () => {
    const tree = MisconceptionRepair({
      misconception: { name: 'False cognate: embarazada', explanation: 'Embarazada means pregnant.' },
      correctForm: 'pregnant',
      notionalMachine: 'Think of: embarrassed -> avergonzado/a.',
      onRetry: () => {}
    })
    
    const text = getTextContent(tree)
    expect(text).toContain('Correct: pregnant')
    expect(text).toContain('Think of: embarrassed -> avergonzado/a.')
  })

  it('clicking "Try a similar one" invokes onRetry', () => {
    let clicked = false
    const onRetry = () => { clicked = true }
    
    const tree = MisconceptionRepair({
      misconception: { name: 'False cognate: embarazada', explanation: 'Embarazada means pregnant.' },
      correctForm: 'pregnant',
      onRetry
    })
    
    const button = findElement(tree, 'button')
    expect(button).toBeDefined()
    expect(button.props.children).toBe('Try a similar one')
    
    // Call the click handler to simulate a user click
    button.props.onClick()
    expect(clicked).toBe(true)
  })

  it('renders nothing when misconception prop is absent', () => {
    const tree = MisconceptionRepair({
      correctForm: 'pregnant',
      onRetry: () => {}
    })
    expect(tree).toBeNull()
  })
})
