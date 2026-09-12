import DeskApp from './DeskApp.jsx'
import { useSubjectChoice } from './subjectChoice.js'

/**
 * DeskRoot
 * Production entry: the Desk for the chosen subject. DeskApp is keyed by subject id, so
 * switching subjects remounts it and its session runner loads that subject's progress.
 * `env` ({ location, history, storage }) defaults to the browser's.
 */
export default function DeskRoot({ env } = {}) {
  const [subject, chooseSubject] = useSubjectChoice(env)
  return <DeskApp key={subject.id} subject={subject} onSubjectChange={chooseSubject} />
}
