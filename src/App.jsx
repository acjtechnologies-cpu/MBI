import { useState } from 'react'
import { Home, Radio, Calculator, Package, Timer } from 'lucide-react'
import DashboardPilote from './components/Pilote/DashboardPilote'
import DashboardPike2  from './components/Pilote/DashboardPike2'
import { useModelStore } from './stores/modelStore'
import ModelManager   from './components/Config/ModelManager'
import Poly4Component from './components/Poly4/Poly4Page'
import StationPage    from './components/Station/StationPage'
import ChronoPage     from './components/Chrono/ChronoPage'
import WelcomePage    from './pages/WelcomePage'

const tabs = [
  { id: 'pilote',  label: 'Pilotage', icon: Home },
  { id: 'soute',   label: 'Soute',    icon: Package },
  { id: 'poly4',   label: 'Poly4',    icon: Calculator },
  { id: 'station', label: 'Station',  icon: Radio },
  { id: 'chrono',  label: 'Chrono',   icon: Timer },
]

const NAV_H = 42 // hauteur barre onglets en px

function App() {
  const [activeTab, setActiveTab] = useState('pilote')
  const activeModelId  = useModelStore(s => s.activeModelId)
  const getActiveModel = useModelStore(s => s.getActiveModel)

  const [gliderChosen, setGliderChosen] = useState(() =>
    localStorage.getItem('mbi_glider_chosen') === '1'
  )

  const shouldShowApp = gliderChosen || !!activeModelId

  if (!shouldShowApp) return (
    <WelcomePage onSelect={() => {
      localStorage.setItem('mbi_glider_chosen', '1')
      setGliderChosen(true)
    }} />
  )

  const m = getActiveModel()
  const PiloteComponent = m?.id === 'pike-precision-2' ? DashboardPike2 : DashboardPilote

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0b0e12' }}>

      {/* Barre onglets — toujours AU-DESSUS, zIndex 50 */}
      <nav style={{
        height: NAV_H,
        flexShrink: 0,
        display: 'flex',
        background: '#161b22',
        borderBottom: '1px solid #21262d',
        zIndex: 50,
        position: 'relative',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: active ? '#58a6ff' : '#8b949e',
                borderBottom: active ? '2px solid #58a6ff' : '2px solid transparent',
                fontSize: 9,
                fontWeight: 700,
                padding: '4px 0',
                WebkitTapHighlightColor: 'transparent',
                transition: 'color 0.15s',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Contenu — hauteur restante, pas d'overflow qui déborde */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'pilote'  && <PiloteComponent />}
        {activeTab === 'soute'   && <ModelManager />}
        {activeTab === 'poly4'   && <Poly4Component />}
        {activeTab === 'station' && <StationPage />}
        {activeTab === 'chrono'  && <ChronoPage />}
      </main>

    </div>
  )
}

export default App
