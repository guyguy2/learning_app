import { useEffect, useState } from 'react'
import App from '../App.jsx'
import variants from './registry.js'
import './PocShell.css'

const STORAGE_KEY = 'poc_active_tab'

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
      const res = await fetch('/api/progress/reset', { method: 'POST' })
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
      const res = await fetch('/api/progress/seed', {
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
            <span className="poc-shell__progress-label">Progress:</span>
            <button
              type="button"
              className="poc-shell__btn poc-shell__btn--reset"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset
            </button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <button
              type="button"
              className="poc-shell__btn"
              onClick={() => handleSeed('fresh')}
              disabled={isPending}
            >
              Seed: fresh
            </button>
            <button
              type="button"
              className="poc-shell__btn"
              onClick={() => handleSeed('mid')}
              disabled={isPending}
            >
              Seed: mid
            </button>
            <button
              type="button"
              className="poc-shell__btn"
              onClick={() => handleSeed('review-due')}
              disabled={isPending}
            >
              Seed: review-due
            </button>
            {statusMessage && <span className="poc-shell__status-msg">{statusMessage}</span>}
          </div>
        </div>
      </header>

      <main className="poc-shell__content">
        {activeTab === 'current' && <App key={`current-${progressVersion}`} />}
        {variants.map((variant) =>
          activeTab === variant.id ? (
            <variant.Component key={`${variant.id}-${progressVersion}`} />
          ) : null,
        )}
      </main>
    </div>
  )
}
