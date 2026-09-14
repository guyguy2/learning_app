import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import DeskRoot from './desk/DeskRoot.jsx'

// The Desk picks its subject from ?subject=, then the last picked subject, then Spanish (see DeskRoot).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DeskRoot />
  </StrictMode>,
)
