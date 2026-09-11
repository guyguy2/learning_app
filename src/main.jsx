import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import PocShell from './poc/PocShell.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PocShell />
  </StrictMode>,
)
