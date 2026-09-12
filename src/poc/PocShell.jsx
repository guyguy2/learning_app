import { useEffect, useState } from 'react'
import App from '../App.jsx'
import variants from './registry.js'
import { getSubject } from '../subjects/index.js'
import './PocShell.css'

const STORAGE_KEY = 'poc_active_tab'

// The progress buttons act on the ?subject= subject (default Spanish). The URL alone decides,
// not the Desk picker's remembered choice, because the variant tabs render Spanish.
function currentSubject() {
  const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('subject') : null
  return getSubject(id)
}

export default function PocShell() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'current' || variants.some((v) => v.id === saved)) {
        return saved
      }
    } catch {
      // localStorage may fail in restricted environments
    }
    return 'current'
  })

  const [subject] = useState(currentSubject)
  const subjectQuery = `?subject=${encodeURIComponent(subject.id)}`
  const [progressVersion, setProgressVersion] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [isPending, setIsPending] = useState(false)

  function handleTabChange(tabId) {
    setActiveTab(tabId)
    try {
      localStorage.setItem(STORAGE_KEY, tabId)
    } catch {
      // ignore storage error
    }
  }

  async function handleReset() {
    setIsPending(true)
    setStatusMessage('Resetting...')
    try {
      const res = await fetch(`/api/progress/reset${subjectQuery}`, { method: 'POST' })
      if (!res.ok) throw new Error('Reset failed')
      setProgressVersion((v) => v + 1)
      setStatusMessage('Reset to default progress')
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setIsPending(false)
      setTimeout(() => setStatusMessage(''), 3000)
    }
  }

  async function handleSeed(scenario) {
    setIsPending(true)
    setStatusMessage(`Seeding ${scenario}...`)
    try {
      const res = await fetch(`/api/progress/seed${subjectQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      if (!res.ok) throw new Error(`Seed ${scenario} failed`)
      setProgressVersion((v) => v + 1)
      setStatusMessage(`Seeded: ${scenario}`)
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setIsPending(false)
      setTimeout(() => setStatusMessage(''), 3000)
    }
  }

  return (
    <div className="poc-shell">
      <header className="poc-shell__header">
        <div className="poc-shell__toolbar">
          <nav className="poc-shell__tabs" aria-label="POC Variants">
            <button
              type="button"
              className={`poc-shell__tab ${activeTab === 'current' ? 'poc-shell__tab--active' : ''}`}
              onClick={() => handleTabChange('current')}
            >
              Current
            </button>
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`poc-shell__tab ${activeTab === v.id ? 'poc-shell__tab--active' : ''}`}
                onClick={() => handleTabChange(v.id)}
                title={v.description}
              >
                {v.name}
              </button>
            ))}
          </nav>

          <div className="poc-shell__progress-control">
            <span className="poc-shell__progress-label">Progress ({subject.displayName}):</span>
            <button
              type="button"
              className="poc-shell__btn poc-shell__btn--reset"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset
            </button>
            <span style={{ color: 'var(--border)' }}>|</span>
            {Object.keys(subject.seeds).map((scenario) => (
              <button
                key={scenario}
                type="button"
                className="poc-shell__btn"
                onClick={() => handleSeed(scenario)}
                disabled={isPending}
              >
                Seed: {scenario}
              </button>
            ))}
            {statusMessage && <span className="poc-shell__status-msg">{statusMessage}</span>}
          </div>
        </div>
      </header>

      <main className="poc-shell__content">
        {activeTab === 'current' && <App key={`current-${progressVersion}`} />}
        {variants.map((variant) => {
          const Comp = variant.Component
          return activeTab === variant.id ? (
            <Comp key={`${variant.id}-${progressVersion}`} />
          ) : null
        })}
      </main>
    </div>
  )
}
