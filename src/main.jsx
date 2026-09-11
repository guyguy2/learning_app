import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import PocShell from './poc/PocShell.jsx'
import DeskApp from './desk/DeskApp.jsx'

const isPoc = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('poc') === '1'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPoc ? <PocShell /> : <DeskApp />}
  </StrictMode>,
)
