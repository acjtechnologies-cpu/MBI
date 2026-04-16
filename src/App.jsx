import { useState } from 'react'
import DashboardPilote from './components/Pilote/DashboardPilote'
import DashboardPike2  from './components/Pilote/DashboardPike2'
import { useModelStore } from './stores/modelStore'
import ModelManager   from './components/Config/ModelManager'
import Poly4Component from './components/Poly4/Poly4Page'
import StationPage    from './components/Station/StationPage'
import ChronoPage     from './components/Chrono/ChronoPage'

const TABS = [
  { id: 'pilote',  label: 'Pilotage' },
  { id: 'soute',   label: 'Soute' },
  { id: 'poly4',   label: 'Poly4' },
  { id: 'station', label: 'Station' },
  { id: 'chrono',  label: 'Chrono' },
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
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'#0b0e12' }}>

      <nav style={{ display:'flex', flexShrink:0, height:44, background:'#161b22', borderBottom:'1px solid #21262d', zIndex:999 }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex:1, border:'none', background:'none',
              color: activeTab===id ? '#58a6ff' : '#4a5568',
              fontSize:10, fontWeight:700, cursor:'pointer',
              borderBottom: activeTab===id ? '2px solid #58a6ff' : '2px solid transparent',
              WebkitTapHighlightColor:'transparent',
              touchAction:'manipulation',
              padding:0,
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <div style={{ flex:1, overflow:'hidden' }}>
        {renderPage()}
      </div>

    </div>
  )
}

export default App
