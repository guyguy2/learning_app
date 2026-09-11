import React from 'react'

/**
 * FeedbackStrip
 * Docked stamp-like result strip beneath input.
 * Calm green for correct answers, warm amber for repair/misses.
 */
export default function FeedbackStrip({ feedback }) {
  if (!feedback) return null

  const isCorrect = feedback.type === 'correct' || feedback === 'correct'
  const text = feedback.message || (isCorrect ? 'Correct' : feedback)

  return (
    <div
      className={`desk-feedback-strip ${
        isCorrect ? 'desk-feedback-strip--correct' : 'desk-feedback-strip--miss'
      }`}
      role="status"
      aria-live="polite"
    >
      <span>{text}</span>
    </div>
  )
}
