import React, { useState } from 'react'
import { Home, Settings, Calculator, Package, Radio } from 'lucide-react'
// Dashboard Pilote
import DashboardPilote from './components/Pilote/DashboardPilote'
import DashboardMamba  from './components/Pilote/DashboardMamba'
import DashboardPike2  from './components/Pilote/DashboardPike2'
import { useModelStore } from './stores/modelStore'
// Config
import ParamEditor    from './components/Config/ParamEditor'
import ChronoEditor   from './components/Config/ChronoEditor'
import ModelManager   from './components/Config/ModelManager'
import Poly4Component from './components/Poly4/Poly4Page'
import StationPage    from './components/Station/StationPage'
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(e) { return { err: e.message } }
  render() {
    if (this.state.err) return (
      <div style={{ color: 'red', padding: 20, fontSize: 14, background: '#111', minHeight: '100vh' }}>
        <b>ERREUR REACT :</b><br />{this.state.err}
      </div>
    )
    return this.props.children
  }
}
function PilotePage() {
  const { getActiveModel } = useModelStore()
  const m = getActiveModel()
  // Pike2 : id exact OU type/nom contenant 'pike'
  const isPike2 = m?.id === 'pike-precision-2'
    || m?.id?.toLowerCase().includes('pike')
    || m?.nom?.toLowerCase().includes('pike')
  // Mamba : id exact OU type/nom contenant 'mamba'
  const isMamba = m?.id === 'mamba-s'
    || m?.id?.toLowerCase().includes('mamba')
    || m?.nom?.toLowerCase().includes('mamba')
  if (isPike2) return <DashboardPike2 />
  if (isMamba) return <DashboardMamba />
  // Fallback : modèle inconnu → affiche message plutôt que crash
  return (
    <div style={{ padding: 24, color: '#8b949e', textAlign: 'center', marginTop: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🛩️</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        {m ? m.nom : 'Aucun modèle actif'}
      </div>
      <div style={{ fontSize: 12 }}>
        Dashboard non disponible pour ce planeur.<br />
        Sélectionne Mamba S ou Pike Precision 2 dans Soute.
      </div>
    </div>
  )
}
function SoutePage() {
  return <ModelManager />
}
function Poly4Page() {
  return <Poly4Component />
}
function ConfigPage() {
  return (
    <div className="p-4 space-y-4">
      <ParamEditor />
      <ChronoEditor />
    </div>
  )
}
function App() {
  const [activeTab, setActiveTab] = useState('pilote')
  const tabs = [
    { id: 'pilote',  label: 'Pilotage', icon: Home },
    { id: 'soute',   label: 'Soute',    icon: Package },
    { id: 'poly4',   label: 'Poly4',    icon: Calculator },
    { id: 'station', label: 'Station',  icon: Radio },
    { id: 'config',  label: 'Config',   icon: Settings },
  ]
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <nav className="bg-gray-800 border-b border-gray-700 px-2">
          <div className="flex space-x-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 font-medium transition-colors text-xs
                    ${activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-200'
                    }
                  `}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
        <main className="flex-1 overflow-auto">
          {activeTab === 'pilote'  && <PilotePage />}
          {activeTab === 'soute'   && <SoutePage />}
          {activeTab === 'poly4'   && <Poly4Page />}
          {activeTab === 'station' && <StationPage />}
          {activeTab === 'config'  && <ConfigPage />}
        </main>
      </div>
    </ErrorBoundary>
  )
}
export default App
