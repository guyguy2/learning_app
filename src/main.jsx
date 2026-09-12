import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import PocShell from './poc/PocShell.jsx'
import DeskRoot from './desk/DeskRoot.jsx'

const isPoc = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('poc') === '1'

// The Desk picks its subject from ?subject=, then the last picked subject, then Spanish (see DeskRoot).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPoc ? <PocShell /> : <DeskRoot />}
  </StrictMode>,
)
