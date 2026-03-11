import { Scale, TrendingUp, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSouteStore } from '../../stores/souteStore'

export default function MassCard() {
  const { mv, offset } = useAppStore()
  const { getTotalMass } = useSouteStore()
  
  const souteMass = getTotalMass() / 1000 // Convertir g en kg
  const offsetKg = offset / 1000 // Convertir g en kg
  const totalMass = mv + souteMass + offsetKg
  
  // Limites typiques pour un planeur F3F
  const massMin = 2.0
  const massMax = 5.0
  const massOptimal = 3.5
  
  // Calculer le pourcentage par rapport aux limites
  const percentage = ((totalMass - massMin) / (massMax - massMin)) * 100
  
  // Déterminer la couleur selon la masse
  const getColor = () => {
    if (totalMass < massMin) return { bg: 'bg-red-900', text: 'text-red-300', bar: 'bg-red-500' }
    if (totalMass > massMax) return { bg: 'bg-red-900', text: 'text-red-300', bar: 'bg-red-500' }
    if (totalMass >= massOptimal - 0.2 && totalMass <= massOptimal + 0.2) {
      return { bg: 'bg-green-900', text: 'text-green-300', bar: 'bg-green-500' }
    }
    return { bg: 'bg-blue-900', text: 'text-blue-300', bar: 'bg-blue-500' }
  }
  
  const colors = getColor()
  const isWarning = totalMass < massMin || totalMass > massMax

  return (
    <div className={`${colors.bg} rounded-lg p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className={colors.text} size={24} />
          <span className="font-semibold text-white">Masse Totale</span>
        </div>
        {isWarning && <AlertCircle className="text-red-400" size={20} />}
      </div>

      {/* Masse principale */}
      <div className="text-center">
        <div className="text-5xl font-bold text-white">
          {totalMass.toFixed(3)}
        </div>
        <div className="text-lg text-gray-300">kg</div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.bar} transition-all duration-300`}
            style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{massMin} kg</span>
          <span className="text-green-400">{massOptimal} kg</span>
          <span>{massMax} kg</span>
        </div>
      </div>

      {/* Détail des masses */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center bg-black bg-opacity-30 rounded px-3 py-2">
          <span className="text-gray-300">Masse à vide (mv)</span>
          <span className="font-semibold text-white">{mv.toFixed(3)} kg</span>
        </div>
        
        <div className="flex justify-between items-center bg-black bg-opacity-30 rounded px-3 py-2">
          <span className="text-gray-300">Soute</span>
          <span className="font-semibold text-blue-300">{souteMass.toFixed(3)} kg</span>
        </div>
        
        <div className="flex justify-between items-center bg-black bg-opacity-30 rounded px-3 py-2">
          <span className="text-gray-300">Offset</span>
          <span className={`font-semibold ${offset >= 0 ? 'text-green-300' : 'text-orange-300'}`}>
            {offset > 0 && '+'}{offsetKg.toFixed(3)} kg
          </span>
        </div>
      </div>

      {/* Message d'état */}
      {isWarning ? (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-2 text-center">
          <div className="text-red-300 text-xs font-semibold">
            {totalMass < massMin ? '⚠️ Masse trop faible' : '⚠️ Masse trop élevée'}
          </div>
        </div>
      ) : Math.abs(totalMass - massOptimal) <= 0.2 ? (
        <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-2 text-center">
          <div className="text-green-300 text-xs font-semibold flex items-center justify-center gap-1">
            <TrendingUp size={14} />
            Masse optimale
          </div>
        </div>
      ) : (
        <div className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-2 text-center">
          <div className="text-blue-300 text-xs">
            {totalMass < massOptimal ? 'Ajouter ballast' : 'Retirer ballast'}
          </div>
        </div>
      )}
    </div>
  )
}
