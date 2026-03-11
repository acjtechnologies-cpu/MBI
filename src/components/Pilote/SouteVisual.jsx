import { Package } from 'lucide-react'
import { useSouteStore } from '../../stores/souteStore'

export default function SouteVisual() {
  const { state, config, getTotalMass, getCG, getCompartmentCounts } = useSouteStore()
  
  const totalMass = getTotalMass()
  const cg = getCG()
  const counts = getCompartmentCounts()
  
  // Calculer les pourcentages de remplissage
  const getPercentage = (count, capacity) => {
    return capacity > 0 ? (count / capacity) * 100 : 0
  }
  
  const compartments = [
    { 
      id: 'gauche_av', 
      label: 'G-AV', 
      count: counts.gauche_av, 
      max: config.cap_av,
      color: 'bg-blue-500' 
    },
    { 
      id: 'gauche_ar', 
      label: 'G-AR', 
      count: counts.gauche_ar, 
      max: config.cap_ar,
      color: 'bg-green-500' 
    },
    { 
      id: 'central', 
      label: 'CENTRAL', 
      count: counts.central, 
      max: config.cap_c,
      color: 'bg-purple-500' 
    },
    { 
      id: 'droite_ar', 
      label: 'D-AR', 
      count: counts.droite_ar, 
      max: config.cap_ar,
      color: 'bg-yellow-500' 
    },
    { 
      id: 'droite_av', 
      label: 'D-AV', 
      count: counts.droite_av, 
      max: config.cap_av,
      color: 'bg-red-500' 
    },
  ]

  return (
    <div className="space-y-4">
      {/* Schéma de la soute */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex gap-2 items-end justify-center h-40">
          {compartments.map((comp) => {
            const percentage = getPercentage(comp.count, comp.max)
            
            return (
              <div key={comp.id} className="flex-1 flex flex-col items-center">
                {/* Nombre de blocs */}
                <div className="text-xs text-gray-400 mb-2">
                  {comp.count}/{comp.max}
                </div>
                
                {/* Barre de progression */}
                <div className="w-full bg-gray-700 rounded-t-lg relative" style={{ height: '100%' }}>
                  <div 
                    className={`${comp.color} rounded-t-lg absolute bottom-0 w-full transition-all duration-300`}
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                
                {/* Label */}
                <div className="mt-2 text-xs font-semibold text-white">{comp.label}</div>
                <div className="text-xs text-gray-500">{comp.max} max</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-gray-900 rounded p-3">
          <div className="text-gray-400 text-xs">Masse Soute</div>
          <div className="text-xl font-bold text-blue-400">{totalMass} g</div>
        </div>
        
        <div className="bg-gray-900 rounded p-3">
          <div className="text-gray-400 text-xs">CG Soute</div>
          <div className="text-xl font-bold text-green-400">{cg.toFixed(1)} mm</div>
        </div>
        
        <div className="bg-gray-900 rounded p-3">
          <div className="text-gray-400 text-xs">Blocs Totaux</div>
          <div className="text-xl font-bold text-purple-400">
            {Object.values(counts).reduce((sum, c) => sum + c, 0)}
          </div>
        </div>
      </div>

      {/* Info axes */}
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3 text-xs">
        <div className="font-semibold text-blue-300 mb-1">Configuration axes :</div>
        <div className="text-blue-200 space-y-0.5">
          <div>• Avant : {config.x_av}mm</div>
          <div>• Arrière : {config.x_ar}mm</div>
          <div>• Central : {config.x_c}mm</div>
        </div>
      </div>
    </div>
  )
}
