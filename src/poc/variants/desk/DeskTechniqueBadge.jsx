import React from 'react'

/**
 * DeskTechniqueBadge
 * A collapsed pill anchored top-right on the card.
 * Expands to show the cognitive-science rationale when clicked.
 */
export default function DeskTechniqueBadge({ technique }) {
  if (!technique || !technique.techniqueName) return null

  return (
    <div className="desk-badge">
      <details>
        <summary>{technique.techniqueName}</summary>
        {technique.explanation && <p>{technique.explanation}</p>}
      </details>
    </div>
  )
}
