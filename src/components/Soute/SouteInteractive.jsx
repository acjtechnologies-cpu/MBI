import { Package, Plus, Minus } from 'lucide-react'
import { useState } from 'react'

export default function SouteInteractive() {
  const [compartments, setCompartments] = useState([
    { id: 'AV', label: 'Avant', weight: 250, max: 500, x: 50 },
    { id: 'C1', label: 'Centre 1', weight: 180, max: 400, x: 200 },
    { id: 'C2', label: 'Centre 2', weight: 320, max: 400, x: 350 },
    { id: 'AR', label: 'Arrière', weight: 150, max: 500, x: 500 },
  ])

  const adjustWeight = (id, delta) => {
    setCompartments(prev => prev.map(comp => {
      if (comp.id === id) {
        const newWeight = Math.max(0, Math.min(comp.max, comp.weight + delta))
        return { ...comp, weight: newWeight }
      }
      return comp
    }))
  }

  const totalWeight = compartments.reduce((sum, comp) => sum + comp.weight, 0)
  const totalMax = compartments.reduce((sum, comp) => sum + comp.max, 0)

  return (
    <div className="space-y-4">
      {/* Vue schématique interactive */}
      <div className="bg-gray-900 rounded-lg p-8">
        <svg viewBox="0 0 600 200" className="w-full">
          {/* Fuselage */}
          <ellipse cx="300" cy="100" rx="280" ry="40" fill="#374151" stroke="#6B7280" strokeWidth="2" />
          
          {/* Compartiments */}
          {compartments.map((comp, index) => {
            const percentage = (comp.weight / comp.max) * 100
            const color = percentage > 80 ? '#EF4444' : percentage > 60 ? '#F59E0B' : '#10B981'
            
            return (
              <g key={comp.id}>
                {/* Compartiment */}
                <rect
                  x={comp.x}
                  y={80 - (percentage / 100) * 30}
                  width={80}
                  height={(percentage / 100) * 40}
                  fill={color}
                  opacity="0.7"
                  rx="4"
                />
                {/* Label */}
                <text x={comp.x + 40} y={70} textAnchor="middle" fill="#E5E7EB" fontSize="12" fontWeight="bold">
                  {comp.label}
                </text>
                <text x={comp.x + 40} y={140} textAnchor="middle" fill="#9CA3AF" fontSize="10">
                  {comp.weight}kg
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Contrôles par compartiment */}
      <div className="space-y-2">
        {compartments.map(comp => {
          const percentage = (comp.weight / comp.max) * 100
          return (
            <div key={comp.id} className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-blue-400" />
                  <span className="font-semibold">{comp.label}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {comp.weight} / {comp.max} kg ({percentage.toFixed(0)}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustWeight(comp.id, -10)}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded transition-colors"
                >
                  <Minus size={16} />
                </button>
                
                <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <button
                  onClick={() => adjustWeight(comp.id, 10)}
                  className="bg-green-600 hover:bg-green-700 p-2 rounded transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Statistiques totales */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-purple-200">Total Chargé</div>
            <div className="text-3xl font-bold">{totalWeight} kg</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-200">Capacité Max</div>
            <div className="text-3xl font-bold">{totalMax} kg</div>
          </div>
        </div>
        <div className="mt-3 bg-purple-950 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all"
            style={{ width: `${(totalWeight / totalMax) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
