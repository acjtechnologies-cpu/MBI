import { useState } from 'react'
import { Home, Radio, Calculator, Package, Timer } from 'lucide-react'
import DashboardPilote from './components/Pilote/DashboardPilote'
import DashboardPike2  from './components/Pilote/DashboardPike2'
import { useModelStore } from './stores/modelStore'
import SouteConfig    from './components/Config/SouteConfig'
import ModelManager   from './components/Config/ModelManager'
import Poly4Component from './components/Poly4/Poly4Page'
import StationPage    from './components/Station/StationPage'
import ChronoPage     from './components/Chrono/ChronoPage'
import WelcomePage    from './pages/WelcomePage'

function PilotePage() {
  const { getActiveModel } = useModelStore()
  const m = getActiveModel()
  if (m?.id === 'pike-precision-2') return <DashboardPike2 />
  return <DashboardPilote />
}

function SoutePage() {
  return (
    <div className="p-4 space-y-4">
      <ModelManager />
      <SouteConfig />
    </div>
  )
}

function Poly4Page() {
  return <Poly4Component />
}

function App() {
  const [activeTab, setActiveTab] = useState('pilote')
  const [gliderChosen, setGliderChosen] = useState(false)

  if (!gliderChosen) return <WelcomePage onSelect={() => setGliderChosen(true)} />

  const tabs = [
    { id: 'pilote',  label: 'Pilotage', icon: Home },
    { id: 'soute',   label: 'Soute',    icon: Package },
    { id: 'poly4',   label: 'Poly4',    icon: Calculator },
    { id: 'station', label: 'Station',  icon: Radio },
    { id: 'chrono',  label: 'Chrono',   icon: Timer },
  ]

  return (
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
        {activeTab === 'chrono'  && <ChronoPage />}
      </main>
    </div>
  )
}

export default App
