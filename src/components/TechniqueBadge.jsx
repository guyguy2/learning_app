import React from 'react'
import './TechniqueBadge.css'

/**
 * TechniqueBadge - A reusable component for technique transparency (Variant A corner-badge).
 * Renders a small pill positioned top-right of its container. Collapsed by default.
 * Expands to show the one-line explanation when clicked/tapped, and collapses when clicked/tapped again.
 *
 * @param {Object} props
 * @param {string} props.techniqueName - The name of the technique (e.g., "Notional machine")
 * @param {string} props.explanation - The one-line explanation of the technique
 * @param {string} [props.className] - Optional extra CSS class(es)
 */
export default function TechniqueBadge({ techniqueName, explanation, className = '' }) {
  if (!techniqueName) return null

  return (
    <details className={`technique-badge ${className}`}>
      <summary>{techniqueName}</summary>
      {explanation && <p>{explanation}</p>}
    </details>
  )
}
