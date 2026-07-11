import { useEffect, useState } from 'react'

function App() {
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/progress')
      .then((res) => res.json())
      .then(setProgress)
      .catch((err) => setError(err.message))
  }, [])

  async function pingWrite() {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    })
    setProgress(await res.json())
  }

  if (error) return <p>Error: {error}</p>
  if (!progress) return <p>Loading...</p>

  return (
    <div>
      <h1>Learning App (scaffold)</h1>
      <pre>{JSON.stringify(progress, null, 2)}</pre>
      <button onClick={pingWrite}>Round-trip write</button>
    </div>
  )
}

export default App
