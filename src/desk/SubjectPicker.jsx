import { listSubjects } from '../subjects/index.js'

/**
 * SubjectPicker
 * Segmented control listing every registered subject by display name. Built on native radios,
 * so arrow keys move between subjects while Enter stays with the card's primary action.
 */
export default function SubjectPicker({ subjectId, onChange, subjects = listSubjects() }) {
  return (
    <fieldset className="desk-subject-picker">
      <legend className="desk-label">Subject</legend>
      <div className="desk-segmented">
        {subjects.map((s) => {
          const selected = s.id === subjectId
          return (
            <label key={s.id} className={`desk-segment${selected ? ' desk-segment--active' : ''}`}>
              <input
                type="radio"
                name="desk-subject"
                value={s.id}
                checked={selected}
                onChange={() => onChange(s.id)}
              />
              {s.displayName}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
