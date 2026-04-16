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

function App() {
  const [activeTab, setActiveTab] = useState('pilote')
  const activeModelId = useModelStore(s => s.activeModelId)
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
