import { useState } from 'react'
import DashboardPilote from './components/Pilote/DashboardPilote'

import { useModelStore } from './stores/modelStore'
import ModelManager   from './components/Config/ModelManager'
import Poly4Component from './components/Poly4/Poly4Page'
import StationPage    from './components/Station/StationPage'
import ChronoPage     from './components/Chrono/ChronoPage'
import WelcomePage    from './pages/WelcomePage'

const TABS = [
  { id: 'pilote',  label: 'Pilotage', icon: '🎯' },
  { id: 'soute',   label: 'Soute',    icon: '📦' },
  { id: 'poly4',   label: 'Poly4',    icon: '📈' },
  { id: 'station', label: 'Station',  icon: '📡' },
  { id: 'chrono',  label: 'Chrono',   icon: '⏱' },
]

function App() {
  const [activeTab, setActiveTab] = useState('pilote')
  const [gliderChosen, setGliderChosen] = useState(false)
  const [editOnOpen, setEditOnOpen] = useState(false)
  const m = useModelStore(s => s.models[s.activeModelId])
  if (!gliderChosen) return <WelcomePage onSelect={(tab, edit) => { setGliderChosen(true); if (tab) setActiveTab(tab); setEditOnOpen(!!edit) }} />

  const renderPage = () => {
    switch (activeTab) {
 case 'pilote':  return <DashboardPilote onChangePlaneur={() => setGliderChosen(false)} />
      case 'soute':   return <ModelManager initialEdit={editOnOpen} onEditDone={() => setEditOnOpen(false)} onChangePlaneur={() => setGliderChosen(false)} />
      case 'poly4':   return <Poly4Component onNavigate={setActiveTab} />
      case 'station': return <StationPage />
      case 'chrono':  return <ChronoPage onNavigate={setActiveTab} />
      default:        return <DashboardPilote />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#0b0e12' }}>

      <nav style={{ display: 'flex', flexShrink: 0, height: 48, background: '#161b22', borderBottom: '1px solid #21262d', zIndex: 999 }}>
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1, border: 'none', background: 'none',
              color: activeTab === id ? '#58a6ff' : '#4a5568',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              borderBottom: activeTab === id ? '2px solid #58a6ff' : '2px solid transparent',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {renderPage()}
      </div>

    </div>
  )
}

export default App
