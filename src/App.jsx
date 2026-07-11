import { useState } from 'react'
import RecognitionScreen from './RecognitionScreen.jsx'
import ProductionScreen from './ProductionScreen.jsx'
import RoleTaggingScreen from './RoleTaggingScreen.jsx'

const SCREENS = {
  recognition: RecognitionScreen,
  production: ProductionScreen,
  'role-tagging': RoleTaggingScreen,
}

function App() {
  const [screen, setScreen] = useState('recognition')
  const ActiveScreen = SCREENS[screen]

  return (
    <div>
      <nav>
        <button onClick={() => setScreen('recognition')} disabled={screen === 'recognition'}>
          Recognition
        </button>
        <button onClick={() => setScreen('production')} disabled={screen === 'production'}>
          Production (-ar)
        </button>
        <button onClick={() => setScreen('role-tagging')} disabled={screen === 'role-tagging'}>
          Role tagging (-ar)
        </button>
      </nav>
      <ActiveScreen />
    </div>
  )
}

export default App
