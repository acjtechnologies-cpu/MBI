import { useState } from 'react'
import { Home, Settings, Calculator, Package } from 'lucide-react'

// Dashboard Pilote
import DashboardPilote from './components/Pilote/DashboardPilote'
import Poly4Component from './components/Poly4/Poly4Page'
// Components Config
import ParamEditor from './components/Config/ParamEditor'
import ChronoEditor from './components/Config/ChronoEditor'

// Components Soute
import SouteConfig from './components/Config/SouteConfig'
import ProfileManager from './components/Soute/ProfileManager'
import ModelManager from './components/Config/ModelManager'  // ← LIGNE AJOUTÉE

// Components Poly4


function App() {
  const [activeTab, setActiveTab] = useState('pilote')

  const tabs = [
    { id: 'pilote', label: 'Pilotage', icon: Home },
    { id: 'soute', label: 'Soute', icon: Package },
    { id: 'poly4', label: 'Poly4', icon: Calculator },
    { id: 'config', label: 'Config', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navigation Tabs */}
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'pilote' && <DashboardPilote />}
        {activeTab === 'soute' && <SoutePage />}
        {activeTab === 'poly4' && <Poly4Page />}
        {activeTab === 'config' && <ConfigPage />}
      </main>
    </div>
  )
}

// ========================================
// PAGE SOUTE - NOUVELLE VERSION V3
// ========================================
function SoutePage() {
  // ← MODIFIÉ : Remplace tout par ModelManager
  return (
    <div className="h-full">
      <ModelManager />
    </div>
  )
}

// ========================================
// PAGE POLY4
// ========================================
function Poly4Page() {
  return <Poly4Component />
}


// ========================================
// PAGE CONFIGURATION - SANS SOUTE
// ========================================
function ConfigPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4">
      {/* Paramètres généraux */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Paramètres</h2>
        <ParamEditor />
      </div>

      {/* Chronométrage */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Chronométrage</h2>
        <ChronoEditor />
      </div>
    </div>
  )
}

export default App
