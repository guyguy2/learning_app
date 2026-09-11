import { techniqueFor } from '../../../screenTechniques.js'

export default function TechniquePill({ techniqueKey, isReview = false }) {
  const technique = techniqueFor(techniqueKey)

  return (
    <div className="editorial-technique-bar">
      {isReview ? (
        <span className="editorial-review-pill">Spaced review</span>
      ) : (
        <span />
      )}
      {technique && (
        <details className="editorial-technique">
          <summary>{technique.techniqueName}</summary>
          <div className="editorial-technique__body">
            {technique.explanation}
          </div>
        </details>
      )}
    </div>
  )
}
