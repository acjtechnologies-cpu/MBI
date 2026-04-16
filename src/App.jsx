import { useState } from 'react'
import { Home, Radio, Calculator, Package, Timer } from 'lucide-react'
import DashboardPilote from './components/Pilote/DashboardPilote'
import DashboardPike2  from './components/Pilote/DashboardPike2'
import { useModelStore } from './stores/modelStore'
import ModelManager   from './components/Config/ModelManager'
import Poly4Component from './components/Poly4/Poly4Page'
import StationPage    from './components/Station/StationPage'
import ChronoPage     from './components/Chrono/ChronoPage'

const TABS = [
  { id: 'pilote',  label: 'Pilotage', Icon: Home },
  { id: 'soute',   label: 'Soute',    Icon: Package },
  { id: 'poly4',   label: 'Poly4',    Icon: Calculator },
  { id: 'station', label: 'Station',  Icon: Radio },
  { id: 'chrono',  label: 'Chrono',   Icon: Timer },
]

function App() {
  const [activeTab, setActiveTab] = useState('pilote')
  const getActiveModel = useModelStore(s => s.getActiveModel)
  const m = getActiveModel()

  const renderPage = () => {
    switch(activeTab) {
      case 'pilote':  return m?.id === 'pike-precision-2' ? <DashboardPike2 /> : <DashboardPilote />
      case 'soute':   return <ModelManager />
      case 'poly4':   return <Poly4Component />
      case 'station': return <StationPage />
      case 'chrono':  return <ChronoPage />
      default:        return <DashboardPilote />
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#0b0e12', overflow: 'hidden',
    }}>
      {/* NAV — position absolue EN BAS, toujours cliquable */}
      <nav style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 52, zIndex: 100,
        display: 'flex',
        background: '#161b22',
        borderTop: '1px solid #21262d',
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              border: 'none', background: 'none', cursor: 'pointer',
              color: active ? '#58a6ff' : '#4a5568',
              borderTop: active ? '2px solid #58a6ff' : '2px solid transparent',
              fontSize: 9, fontWeight: 700, padding: 0,
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.15s',
            }}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* CONTENU — prend tout sauf les 52px du bas */}
      <main style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        bottom: 52, overflow: 'hidden',
      }}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
