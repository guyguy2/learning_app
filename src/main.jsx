import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import PocShell from './poc/PocShell.jsx'
import DeskApp from './desk/DeskApp.jsx'
import { getSubject } from './subjects/index.js'

const isPoc = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('poc') === '1'
// ?subject=programming picks a registered subject; missing or unknown ids fall back to Spanish.
const subjectId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('subject') : null
const subject = getSubject(subjectId)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPoc ? <PocShell /> : <DeskApp subject={subject} />}
  </StrictMode>,
)
