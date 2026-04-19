import { useState } from 'react'
import { Home, Radio, Calculator, Package, Timer } from 'lucide-react'
import { useModelStore } from './stores/modelStore'
import DashboardPilote from './components/Pilote/DashboardPilote'
import DashboardPike2  from './components/Pilote/DashboardPike2'
import ModelManager    from './components/Config/ModelManager'
import Poly4Component  from './components/Poly4/Poly4Page'
import StationPage     from './components/Station/StationPage'
import ChronoPage      from './components/Chrono/ChronoPage'
import WelcomePage     from './pages/WelcomePage'

// ── Onglets ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'pilote',  label: 'Pilotage', Icon: Home },
  { id: 'soute',   label: 'Soute',    Icon: Package },
  { id: 'poly4',   label: 'Poly4',    Icon: Calculator },
  { id: 'station', label: 'Station',  Icon: Radio },
  { id: 'chrono',  label: 'Chrono',   Icon: Timer },
]

// ── Styles nav ────────────────────────────────────────────────────────────────
const NAV_H = 48

const navStyle = {
  display: 'flex',
  flexShrink: 0,
  height: NAV_H,
  background: '#161b22',
  borderBottom: '1px solid #21262d',
  zIndex: 10,
}

const tabStyle = (active) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  border: 'none',
  background: 'none',
  color: active ? '#58a6ff' : '#4a5568',
  borderBottom: active ? '2px solid #58a6ff' : '2px solid transparent',
  fontSize: 9,
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'color 0.15s',
})

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,    setActiveTab]    = useState('pilote')
  const [gliderChosen, setGliderChosen] = useState(false)

  // Selectors stables — pas de re-render inutile
  const activeModelId = useModelStore(s => s.activeModelId)
  const models        = useModelStore(s => s.models)
  const activeModel   = models?.[activeModelId] ?? null

  // ── Gate WelcomePage ────────────────────────────────────────────────────────
  if (!gliderChosen) {
    return (
      <WelcomePage onSelect={() => setGliderChosen(true)} />
    )
  }

  // ── Page active ─────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (activeTab) {
      case 'pilote':
        return activeModel?.id === 'pike-precision-2'
          ? <DashboardPike2 />
          : <DashboardPilote />
      case 'soute':   return <ModelManager />
      case 'poly4':   return <Poly4Component />
      case 'station': return <StationPage />
      case 'chrono':  return <ChronoPage />
      default:        return <DashboardPilote />
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: '#0b0e12',
    }}>
      {/* Navigation */}
      <nav style={navStyle}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={tabStyle(activeTab === id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Contenu — height:100% pour que les pages s'adaptent */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {renderPage()}
      </div>
    </div>
  )
}
